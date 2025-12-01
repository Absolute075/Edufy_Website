package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"

	"gateway_service/internal/proxy"

	"github.com/gin-gonic/gin"
)

type reportPayload struct {
	Title       string `json:"title"`
	Category    string `json:"category"`
	Description string `json:"description"`
}

func main() {
	router := gin.Default()

	// === CORS middleware (credentials-friendly) ===
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Vary", "Origin")
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// === Support: Report bug -> Telegram ===
	router.POST("/support/report", func(c *gin.Context) {
		botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
		chatID := os.Getenv("TELEGRAM_CHAT_ID")
		if botToken == "" || chatID == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "telegram not configured"})
			return
		}

		ip := c.ClientIP()
		ua := c.Request.UserAgent()

		var (
			title       string
			category    string
			description string
			files       []*multipart.FileHeader
		)

		ct := c.Request.Header.Get("Content-Type")
		if strings.HasPrefix(ct, "multipart/") {
			// multipart/form-data: поля формы + файлы
			title = strings.TrimSpace(c.PostForm("title"))
			category = c.PostForm("category")
			description = strings.TrimSpace(c.PostForm("description"))
			form, err := c.MultipartForm()
			if err == nil && form != nil {
				files = form.File["screenshots"]
			}
		} else {
			// JSON-запрос на всякий случай для обратной совместимости
			var p reportPayload
			if err := c.ShouldBindJSON(&p); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
				return
			}
			title = strings.TrimSpace(p.Title)
			category = p.Category
			description = strings.TrimSpace(p.Description)
		}

		if title == "" || description == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title and description are required"})
			return
		}

		text := fmt.Sprintf(
			"Edufy Dash Bug Report\n\nTitle: %s\nCategory: %s\n\nDescription:\n%s\n\nIP: %s\nUA: %s",
			title,
			category,
			description,
			ip,
			ua,
		)

		if err := sendTelegramMessage(botToken, chatID, text); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send to telegram", "details": err.Error()})
			return
		}

		// Отправляем до 5 скриншотов как отдельные фото
		for i, fh := range files {
			if i >= 5 {
				break
			}
			if err := sendTelegramPhoto(botToken, chatID, fh); err != nil {
				// логируем ошибку, но не рвём весь запрос
				fmt.Println("telegram photo error:", err.Error())
			}
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// === Auth service proxy ===
	authBase := os.Getenv("AUTH_SERVICE_URL")
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}
	router.Any("/auth/*path", proxy.ServiceProxy(authBase, "/auth"))

	// === Пример другого сервиса (по желанию) ===
	userBase := os.Getenv("USER_SERVICE_URL")
	if userBase == "" {
		userBase = "http://user_service:8080"
	}
	router.Any("/user/*path", proxy.ServiceProxy(userBase, "/user"))

	// === Materials proxy -> file_service with user headers ===
	fileBase := os.Getenv("FILE_SERVICE_URL")
	if fileBase == "" {
		fileBase = "http://file_service:8080"
	}
	router.Any("/materials/*path", proxy.ServiceProxyWithUserHeaders(fileBase, "/materials"))

	// === Health-check для gateway ===
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "gateway_service running"})
	})

	// === Запуск сервера на порту 8080 ===
	router.Run(":8080")
}

func sendTelegramMessage(botToken, chatID, text string) error {
	payload := map[string]string{
		"chat_id": chatID,
		"text":    text,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("encode: %w", err)
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("telegram error: status=%d body=%s", resp.StatusCode, string(b))
	}
	return nil
}

func sendTelegramPhoto(botToken, chatID string, fh *multipart.FileHeader) error {
	f, err := fh.Open()
	if err != nil {
		return fmt.Errorf("open file: %w", err)
	}
	defer f.Close()

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	if err := w.WriteField("chat_id", chatID); err != nil {
		w.Close()
		return fmt.Errorf("write chat_id: %w", err)
	}
	part, err := w.CreateFormFile("photo", fh.Filename)
	if err != nil {
		w.Close()
		return fmt.Errorf("create form file: %w", err)
	}
	if _, err := io.Copy(part, f); err != nil {
		w.Close()
		return fmt.Errorf("copy file: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("close writer: %w", err)
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendPhoto", botToken)
	req, err := http.NewRequest(http.MethodPost, url, &buf)
	if err != nil {
		return fmt.Errorf("build photo request: %w", err)
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("do photo request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("telegram photo error: status=%d body=%s", resp.StatusCode, string(b))
	}
	return nil
}
