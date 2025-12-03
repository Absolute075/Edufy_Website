package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/gin-gonic/gin"
)

type userSearchDocument struct {
	Username    string      `json:"username"`
	Email       string      `json:"email"`
	Plan        string      `json:"plan"`
	GrantedAt   interface{} `json:"grantedAt,omitempty"`
	ActiveUntil interface{} `json:"activeUntil,omitempty"`
}

type searchService struct {
	es    *elasticsearch.Client
	index string
}

func newSearchService() *searchService {
	elasticURL := os.Getenv("ELASTICSEARCH_URL")
	if elasticURL == "" {
		elasticURL = "http://elasticsearch:9200"
	}

	cfg := elasticsearch.Config{
		Addresses: []string{elasticURL},
	}
	client, err := elasticsearch.NewClient(cfg)
	if err != nil {
		log.Fatalf("failed to init elasticsearch client: %v", err)
	}

	index := os.Getenv("SEARCH_USERS_INDEX")
	if index == "" {
		index = "users_v1"
	}

	return &searchService{es: client, index: index}
}

func (s *searchService) health(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	res, err := s.es.Ping(s.es.Ping.WithContext(ctx))
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "elasticsearch_unreachable", "error": err.Error()})
		return
	}
	defer res.Body.Close()

	c.JSON(http.StatusOK, gin.H{"status": "search_service running"})
}

func (s *searchService) searchUsers(c *gin.Context) {
	q := c.Query("q")
	q = string(bytes.TrimSpace([]byte(q)))
	if q == "" {
		c.JSON(http.StatusOK, []userSearchDocument{})
		return
	}

	var body bytes.Buffer
	query := map[string]any{
		"query": map[string]any{
			"multi_match": map[string]any{
				"query":  q,
				"fields": []string{"username^2", "email"},
			},
		},
		"size": 20,
	}
	if err := json.NewEncoder(&body).Encode(query); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "encode_query_failed"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	res, err := s.es.Search(
		s.es.Search.WithContext(ctx),
		s.es.Search.WithIndex(s.index),
		s.es.Search.WithBody(&body),
		s.es.Search.WithTrackTotalHits(false),
	)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "elasticsearch_search_failed", "details": err.Error()})
		return
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		c.JSON(http.StatusBadGateway, gin.H{"error": "elasticsearch_bad_status", "status": res.StatusCode})
		return
	}

	var parsed struct {
		Hits struct {
			Hits []struct {
				Source userSearchDocument `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&parsed); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "elasticsearch_decode_failed", "details": err.Error()})
		return
	}

	items := make([]userSearchDocument, 0, len(parsed.Hits.Hits))
	for _, h := range parsed.Hits.Hits {
		items = append(items, h.Source)
	}

	c.JSON(http.StatusOK, items)
}

func (s *searchService) reindexUsers(c *gin.Context) {
	authBase := os.Getenv("AUTH_SERVICE_URL")
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}
	userBase := os.Getenv("USER_SERVICE_URL")
	if userBase == "" {
		userBase = "http://user_service:8080"
	}

	authURL := authBase + "/auth/internal/admin/users/all"
	resp, err := http.Get(authURL)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_unreachable"})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_unexpected_status", "status": resp.StatusCode})
		return
	}

	var authUsers []struct {
		Username  string      `json:"username"`
		Email     string      `json:"email"`
		CreatedAt interface{} `json:"createdAt"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&authUsers); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_decode_failed"})
		return
	}

	indexed := 0
	for _, u := range authUsers {
		// Fetch subscription summary from user_service
		summaryURL := userBase + "/user/internal/admin/subscriptions/summary?username=" + url.QueryEscape(u.Username)
		sResp, err := http.Get(summaryURL)
		if err != nil {
			continue
		}
		func() {
			defer sResp.Body.Close()
			if sResp.StatusCode != http.StatusOK && sResp.StatusCode != http.StatusNotFound {
				return
			}

			var summary struct {
				Plan        string      `json:"plan"`
				GrantedAt   interface{} `json:"grantedAt"`
				ActiveUntil interface{} `json:"activeUntil"`
			}
			if sResp.StatusCode == http.StatusOK {
				if err := json.NewDecoder(sResp.Body).Decode(&summary); err != nil {
					return
				}
			}

			doc := userSearchDocument{
				Username:    u.Username,
				Email:       u.Email,
				Plan:        summary.Plan,
				GrantedAt:   summary.GrantedAt,
				ActiveUntil: summary.ActiveUntil,
			}

			body, err := json.Marshal(doc)
			if err != nil {
				return
			}

			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			res, err := s.es.Index(
				s.index,
				bytes.NewReader(body),
				s.es.Index.WithContext(ctx),
				s.es.Index.WithDocumentID(u.Username),
			)
			if err != nil {
				return
			}
			defer res.Body.Close()
			if res.StatusCode >= 200 && res.StatusCode < 300 {
				indexed++
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{"indexed": indexed})
}

func main() {
	port := os.Getenv("SEARCH_SERVICE_PORT")
	if port == "" {
		port = "8080"
	}

	svc := newSearchService()
	r := gin.Default()

	r.GET("/health", svc.health)
	r.GET("/search/users", svc.searchUsers)
	r.POST("/admin/reindex/users", svc.reindexUsers)

	addr := ":" + port
	log.Println("search_service listening on", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
