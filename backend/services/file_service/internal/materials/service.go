package materials

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"edufy/file_service/internal/config"
)

type Service interface {
	GetManifest() (*Manifest, error)
	Reindex() error
	ResolveToken(category, token string) (string, *ManifestItem, bool)
	ResolveTokenAny(token string) (string, *ManifestItem, bool)
	FindByID(id string) (*ManifestItem, bool)
}

type service struct {
	mu         sync.RWMutex
	manifest   *Manifest
	tokenIndex map[string]tokenTarget
	tokenAny   map[string]tokenTarget
	idIndex    map[string]ManifestItem
	cfg        config.Config
}

type tokenTarget struct {
	Rel  string
	Item ManifestItem
}

func NewServiceWithConfig(cfg config.Config) Service {
	s := &service{cfg: cfg, tokenIndex: map[string]tokenTarget{}, tokenAny: map[string]tokenTarget{}, idIndex: map[string]ManifestItem{}}
	// initial index (best-effort)
	_ = s.Reindex()
	return s
}

func (s *service) GetManifest() (*Manifest, error) {
	s.mu.RLock()
	if s.manifest != nil {
		defer s.mu.RUnlock()
		copy := *s.manifest
		return &copy, nil
	}
	s.mu.RUnlock()
	// Fallback: if no autoscan configured, try file-based repo via PublicDir manifest
	// For simplicity, build empty manifest
	empty := &Manifest{Version: time.Now().UTC().Format(time.RFC3339), Items: []ManifestItem{}}
	return empty, nil
}

func (s *service) Reindex() error {
	if s.cfg.MaterialsDir == "" || s.cfg.ResourcesBase == "" {
		// nothing to scan; keep current
		return nil
	}
	items := []ManifestItem{}
	root := s.cfg.MaterialsDir
	base := strings.TrimRight(s.cfg.ResourcesBase, "/")
	defaultPlan := func(cat string) string {
		switch strings.ToLower(cat) {
		case "reading":
			if s.cfg.PlanDefaultReading != "" {
				return s.cfg.PlanDefaultReading
			}
		case "listening":
			if s.cfg.PlanDefaultListening != "" {
				return s.cfg.PlanDefaultListening
			}
		case "speaking":
			if s.cfg.PlanDefaultSpeaking != "" {
				return s.cfg.PlanDefaultSpeaking
			}
		case "writing":
			if s.cfg.PlanDefaultWriting != "" {
				return s.cfg.PlanDefaultWriting
			}
		case "mock":
			if s.cfg.PlanDefaultMock != "" {
				return s.cfg.PlanDefaultMock
			}
		}
		return s.cfg.DefaultRequiredPlan
	}

	// Walk categories
	_ = filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			return nil
		}
		// Expect structure: <root>/<category>/<name>.<ext>
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return nil
		}
		parts := strings.Split(rel, string(filepath.Separator))
		if len(parts) < 2 {
			return nil
		}
		cat := parts[0]
		if !isKnownCategory(cat) {
			return nil
		}
		id := filepath.ToSlash(rel)
		token, ok := materialToken(s.cfg.MaterialTokenSecret, id)
		if !ok {
			return nil
		}
		url := fmt.Sprintf("%s/materials/t/%s", base, token)
		item := ManifestItem{
			ID:           id,
			Title:        defaultTitleFromID(id),
			Category:     strings.ToLower(cat),
			RequiredPlan: defaultPlan(cat),
			Active:       true,
			URL:          url,
		}
		items = append(items, item)
		return nil
	})

	// Apply overrides if provided
	if s.cfg.OverridesPath != "" {
		applyOverrides(&items, s.cfg.OverridesPath)
	}

	// Sort by id for stability
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })

	// Build indexes after overrides to ensure RequiredPlan/Active are authoritative
	tokenIndex := map[string]tokenTarget{}
	tokenAny := map[string]tokenTarget{}
	conflicts := map[string]bool{}
	idIndex := map[string]ManifestItem{}
	for i := range items {
		it := items[i]
		idIndex[it.ID] = it
		token, ok := materialToken(s.cfg.MaterialTokenSecret, it.ID)
		if !ok {
			continue
		}
		cat := strings.ToLower(strings.TrimSpace(it.Category))
		if cat == "" {
			parts := strings.Split(it.ID, "/")
			if len(parts) > 0 {
				cat = strings.ToLower(parts[0])
			}
		}
		if cat != "" {
			tokenIndex[tokenKey(cat, token)] = tokenTarget{Rel: it.ID, Item: it}
		}
		if conflicts[token] {
			continue
		}
		if prev, exists := tokenAny[token]; exists {
			if prev.Rel != it.ID {
				delete(tokenAny, token)
				conflicts[token] = true
			}
			continue
		}
		tokenAny[token] = tokenTarget{Rel: it.ID, Item: it}
	}

	s.mu.Lock()
	s.manifest = &Manifest{
		Version: time.Now().UTC().Format(time.RFC3339),
		Items:   items,
	}
	s.tokenIndex = tokenIndex
	s.tokenAny = tokenAny
	s.idIndex = idIndex
	s.mu.Unlock()
	return nil
}

func (s *service) ResolveToken(category, token string) (string, *ManifestItem, bool) {
	key := tokenKey(strings.ToLower(category), token)
	s.mu.RLock()
	defer s.mu.RUnlock()
	t, ok := s.tokenIndex[key]
	if !ok {
		return "", nil, false
	}
	copy := t.Item
	return t.Rel, &copy, true
}

func (s *service) ResolveTokenAny(token string) (string, *ManifestItem, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	t, ok := s.tokenAny[token]
	if !ok {
		return "", nil, false
	}
	copy := t.Item
	return t.Rel, &copy, true
}

func (s *service) FindByID(id string) (*ManifestItem, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	it, ok := s.idIndex[id]
	if !ok {
		return nil, false
	}
	copy := it
	return &copy, true
}

func isKnownCategory(s string) bool {
	switch strings.ToLower(s) {
	case "reading", "listening", "speaking", "writing", "mock":
		return true
	default:
		return false
	}
}

func defaultTitleFromID(id string) string {
	// Take last segment and replace dashes with spaces, capitalize first letter
	segs := strings.Split(id, "/")
	last := segs[len(segs)-1]
	if ext := filepath.Ext(last); ext != "" {
		last = strings.TrimSuffix(last, ext)
	}
	t := strings.ReplaceAll(last, "-", " ")
	if t == "" {
		return id
	}
	return strings.ToUpper(t[:1]) + t[1:]
}

func tokenKey(category, token string) string {
	return category + ":" + token
}

func materialToken(secret, rel string) (string, bool) {
	sec := strings.TrimSpace(secret)
	if sec == "" {
		return "", false
	}
	mac := hmac.New(sha256.New, []byte(sec))
	_, _ = mac.Write([]byte(rel))
	sum := mac.Sum(nil)
	n := binary.BigEndian.Uint64(sum[:8])
	const mod uint64 = 10000000000000000
	v := n % mod
	return fmt.Sprintf("%016d", v), true
}

func applyOverrides(items *[]ManifestItem, path string) {
	b, err := os.ReadFile(path)
	if err != nil {
		return
	}
	// map[id]partial
	var m map[string]struct {
		Title        *string `json:"title"`
		RequiredPlan *string `json:"requiredPlan"`
		Active       *bool   `json:"active"`
		URL          *string `json:"url"`
	}
	if err := json.Unmarshal(b, &m); err != nil {
		return
	}
	for i := range *items {
		id := (*items)[i].ID
		if ov, ok := m[id]; ok {
			if ov.Title != nil {
				(*items)[i].Title = *ov.Title
			}
			if ov.RequiredPlan != nil {
				(*items)[i].RequiredPlan = *ov.RequiredPlan
			}
			if ov.Active != nil {
				(*items)[i].Active = *ov.Active
			}
			if ov.URL != nil {
				(*items)[i].URL = *ov.URL
			}
		}
	}
}
