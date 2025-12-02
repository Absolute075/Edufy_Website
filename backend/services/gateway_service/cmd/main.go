package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"gateway_service/internal/proxy"

	"github.com/gin-gonic/gin"
)

type reportPayload struct {
	Title       string `json:"title"`
	Category    string `json:"category"`
	Description string `json:"description"`
}

// Simple in-memory cache for USD -> UZS rate so we don't hit exchangerate.host on every request.
type usdToUzsCache struct {
	Rate      float64
	FetchedAt time.Time
}

var (
	usdToUzs usdToUzsCache
	usdMu    sync.Mutex
)

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

		// Single bot for all reports (bug + contact), configured via TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID
		botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
		chatID := os.Getenv("TELEGRAM_CHAT_ID")
		if botToken == "" || chatID == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "telegram not configured"})
			return
		}

		header := "Edufy Dash Bug Report"
		if strings.EqualFold(category, "contact") {
			header = "Edufy Website Contact Form"
		}

		text := fmt.Sprintf(
			"%s\n\nTitle: %s\nCategory: %s\n\nDescription:\n%s\n\nIP: %s\nUA: %s",
			header,
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

	// === Pricing rate: USD -> UZS ===
	router.GET("/pricing/rate", func(c *gin.Context) {
		rate, fetchedAt, err := getUsdToUzsRate()
		if err != nil {
			fmt.Println("pricing rate error:", err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_fetch_rate"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"usdToUzs":  rate,
			"updatedAt": fetchedAt.UTC().Format(time.RFC3339),
		})
	})

	// === OSON payments ===
	router.POST("/payments/oson/invoice", handleOsonCreateInvoice)
	router.POST("/payments/oson/notify", handleOsonNotify)

	startUsdRateRefresher()

	// === Запуск сервера на порту 8080 ===
	router.Run(":8080")
}

// getUsdToUzsRate fetches the USD->UZS rate from exchangerate.host with basic in-memory caching.
// In production it also has robust fallbacks so that pricing does not break if the external API
// is temporarily unavailable:
//  1. Use fresh cached value if within TTL.
//  2. Try to fetch a new rate from exchangerate.host.
//  3. If that fails, return any cached value even if older than TTL.
//  4. If there is no cached value, fall back to USD_TO_UZS_FALLBACK_RATE env var.
func getUsdToUzsRate() (float64, time.Time, error) {
	usdMu.Lock()
	defer usdMu.Unlock()

	now := time.Now().UTC()
	// If we have a fresh value in cache for the same calendar day in Asia/Tashkent, return it immediately.
	if usdToUzs.Rate > 0 && !usdToUzs.FetchedAt.IsZero() && isSameTashkentDay(usdToUzs.FetchedAt, now) {
		return usdToUzs.Rate, usdToUzs.FetchedAt, nil
	}

	var lastErr error

	// Try to fetch a fresh rate from exchangerate.host using the documented /live endpoint.
	func() {
		baseURL := "https://api.exchangerate.host/live?source=USD&currencies=UZS"
		if apiKey := os.Getenv("EXCHANGERATE_HOST_API_KEY"); apiKey != "" {
			baseURL = baseURL + "&access_key=" + apiKey
		}
		resp, err := http.Get(baseURL)
		if err != nil {
			lastErr = fmt.Errorf("fetch rate: %w", err)
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode >= 300 {
			b, _ := io.ReadAll(resp.Body)
			lastErr = fmt.Errorf("fetch rate: status=%d body=%s", resp.StatusCode, string(b))
			return
		}

		var payload struct {
			Success bool               `json:"success"`
			Source  string             `json:"source"`
			Quotes  map[string]float64 `json:"quotes"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
			lastErr = fmt.Errorf("decode rate: %w", err)
			return
		}

		rate, ok := payload.Quotes["USDUZS"]
		if !ok || rate <= 0 {
			lastErr = fmt.Errorf("invalid rate from exchangerate.host")
			return
		}

		usdToUzs = usdToUzsCache{
			Rate:      rate,
			FetchedAt: time.Now().UTC(),
		}
		lastErr = nil
	}()

	// If we managed to fetch and cache a fresh rate, return it.
	if lastErr == nil && usdToUzs.Rate > 0 {
		return usdToUzs.Rate, usdToUzs.FetchedAt, nil
	}

	// Log the problem but try fallbacks instead of immediately failing.
	if lastErr != nil {
		fmt.Println("pricing rate: falling back after error:", lastErr.Error())
	}

	// Fallback 1: use any cached value even if it's older than TTL.
	if usdToUzs.Rate > 0 && !usdToUzs.FetchedAt.IsZero() {
		return usdToUzs.Rate, usdToUzs.FetchedAt, nil
	}

	// Fallback 2: use a manually configured environment variable.
	if fallbackStr := os.Getenv("USD_TO_UZS_FALLBACK_RATE"); fallbackStr != "" {
		if fallback, err := strconv.ParseFloat(fallbackStr, 64); err == nil && fallback > 0 {
			now := time.Now().UTC()
			usdToUzs = usdToUzsCache{
				Rate:      fallback,
				FetchedAt: now,
			}
			return fallback, now, nil
		}
	}

	// No live rate and no viable fallback.
	if lastErr != nil {
		return 0, time.Time{}, lastErr
	}

	return 0, time.Time{}, fmt.Errorf("no usd->uzs rate available")
}

func isSameTashkentDay(a, b time.Time) bool {
	const tashkentOffset = 5 * time.Hour
	aAdj := a.Add(tashkentOffset)
	bAdj := b.Add(tashkentOffset)
	ay, am, ad := aAdj.Date()
	by, bm, bd := bAdj.Date()
	return ay == by && am == bm && ad == bd
}

func startUsdRateRefresher() {
	go func() {
		for {
			nowUTC := time.Now().UTC()
			const tashkentOffset = 5 * time.Hour
			nowT := nowUTC.Add(tashkentOffset)
			y, m, d := nowT.Date()
			// Next calendar day start in Asia/Tashkent, converted back to UTC.
			nextDayStartTashkent := time.Date(y, m, d+1, 0, 0, 0, 0, time.UTC)
			nextDayStartUTC := nextDayStartTashkent.Add(-tashkentOffset)
			sleepDur := nextDayStartUTC.Sub(nowUTC)
			if sleepDur <= 0 {
				sleepDur = time.Hour
			}
			time.Sleep(sleepDur)
			if _, _, err := getUsdToUzsRate(); err != nil {
				fmt.Println("daily usd->uzs refresher error:", err.Error())
			}
		}
	}()
}

type osonCreateInvoiceInput struct {
	Plan        string `json:"plan"`
	Period      string `json:"period"`
	AutoRenewal bool   `json:"autoRenewal"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
}

// getUsdPriceForPlan returns the base USD price from the public pricing table
// so that backend-created OSON invoices match what users see on the website.
func getUsdPriceForPlan(plan, period string) (float64, error) {
	plan = strings.ToLower(strings.TrimSpace(plan))
	period = strings.ToLower(strings.TrimSpace(period))
	switch plan {
	case "plus":
		switch period {
		case "monthly":
			return 3.99, nil
		case "sixmonths", "sixmonth", "6months", "6month":
			return 19.99, nil
		case "yearly", "annual", "year":
			return 29.99, nil
		}
	case "premium", "pro":
		switch period {
		case "monthly":
			return 7.99, nil
		case "sixmonths", "sixmonth", "6months", "6month":
			return 39.99, nil
		case "yearly", "annual", "year":
			return 59.99, nil
		}
	}
	return 0, fmt.Errorf("unsupported plan/period combination")
}

// handleOsonCreateInvoice accepts a minimal payload from the frontend and creates
// an invoice in OSON Kassa, returning pay_url to the client.
func handleOsonCreateInvoice(c *gin.Context) {
	var in osonCreateInvoiceInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	if strings.TrimSpace(in.Plan) == "" || strings.TrimSpace(in.Period) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "plan_and_period_required"})
		return
	}

	_, err := getUsdPriceForPlan(in.Plan, in.Period)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported_plan_or_period"})
		return
	}

	rate, _, err := getUsdToUzsRate()
	if err != nil || rate <= 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "usd_to_uzs_rate_unavailable"})
		return
	}

	amountUzs := 1000.0

	secret := os.Getenv("OSON_SECRET_TOKEN")
	merchantIDStr := os.Getenv("OSON_MERCHANT_ID")
	if secret == "" || merchantIDStr == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "oson_not_configured"})
		return
	}

	merchantID, err := strconv.ParseInt(merchantIDStr, 10, 64)
	if err != nil || merchantID <= 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid_oson_merchant_id"})
		return
	}

	returnURL := os.Getenv("OSON_RETURN_URL")
	transactionID := fmt.Sprintf("edufy-%d", time.Now().UnixNano())

	payload := map[string]interface{}{
		"merchant_id":    merchantID,
		"transaction_id": transactionID,
		"phone":          strings.TrimSpace(in.Phone),
		"user_account":   strings.TrimSpace(in.Email),
		"amount":         amountUzs,
		"currency":       "UZS",
		"comment":        fmt.Sprintf("Edufy %s %s subscription", in.Plan, in.Period),
		"lifetime":       30,
		"lang":           "ru",
	}
	if returnURL != "" {
		payload["return_url"] = returnURL
	}

	body, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "encode_oson_payload_failed"})
		return
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.oson.uz/api/invoice/create", bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "build_oson_request_failed"})
		return
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("token", secret)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "oson_unreachable"})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusBadGateway, gin.H{"error": "oson_error", "status": resp.StatusCode, "body": string(b)})
		return
	}

	var osonResp struct {
		Status        string `json:"status"`
		TransactionID string `json:"transaction_id"`
		BillID        int64  `json:"bill_id"`
		PayURL        string `json:"pay_url"`
		ErrorCode     int    `json:"error_code"`
		Message       string `json:"message"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&osonResp); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "decode_oson_response_failed"})
		return
	}

	if osonResp.ErrorCode != 0 || strings.TrimSpace(osonResp.PayURL) == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "oson_error", "code": osonResp.ErrorCode, "message": osonResp.Message})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payUrl":        osonResp.PayURL,
		"status":        osonResp.Status,
		"transactionId": osonResp.TransactionID,
		"billId":        osonResp.BillID,
		"amount":        amountUzs,
		"currency":      "UZS",
	})
}

type osonNotificationPayload struct {
	Status        string `json:"status"`
	TransactionID string `json:"transaction_id"`
	BillID        int64  `json:"bill_id"`
	Signature     string `json:"signature"`
}

// handleOsonNotify processes payment notifications from OSON and verifies the
// digital signature. Updating user_service/payment storage will be wired later.
func handleOsonNotify(c *gin.Context) {
	var n osonNotificationPayload
	if err := c.ShouldBindJSON(&n); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	secret := os.Getenv("OSON_SECRET_TOKEN")
	merchantID := os.Getenv("OSON_MERCHANT_ID")
	if secret == "" || merchantID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "oson_not_configured"})
		return
	}

	expected := computeOsonSignature(secret, merchantID, n.TransactionID, n.BillID, n.Status)
	if !strings.EqualFold(expected, n.Signature) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_signature"})
		return
	}

	fmt.Printf("OSON notify: status=%s transaction_id=%s bill_id=%d\n", n.Status, n.TransactionID, n.BillID)

	// TODO: call user_service internal API to update payment status and subscription.
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// computeOsonSignature implements the signature algorithm from OSON Kassa docs:
// parameters = {transaction_id}:{bill_id}:{status}
// inner = sha256( {secret_token}:{merchant_id} )
// signature = sha256( inner:{parameters} )
func computeOsonSignature(secretToken, merchantID, transactionID string, billID int64, status string) string {
	parameters := fmt.Sprintf("%s:%d:%s", transactionID, billID, status)
	innerInput := fmt.Sprintf("%s:%s", secretToken, merchantID)
	innerHash := sha256.Sum256([]byte(innerInput))
	innerHex := hex.EncodeToString(innerHash[:])
	outHash := sha256.Sum256([]byte(innerHex + ":" + parameters))
	return hex.EncodeToString(outHash[:])
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
