package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"golang.org/x/time/rate"
)

// Configuration structure
type TripayConfig struct {
	APIKey       string
	PrivateKey   string
	MerchantCode string
	Mode         string
	APIURL       string
}

// Global configuration
var config TripayConfig

// Transaction record structure
type TransactionRecord struct {
	Reference   string      `json:"reference"`
	MerchantRef string      `json:"merchantRef"`
	Method      string      `json:"method"`
	Amount      int         `json:"amount"`
	Status      string      `json:"status"`
	CreatedAt   string      `json:"createdAt"`
	UpdatedAt   string      `json:"updatedAt,omitempty"`
	OrderItems  interface{} `json:"orderItems"`
}

// Request structures
type CreateTransactionRequest struct {
	Method        string      `json:"method"`
	Amount        int         `json:"amount"`
	CustomerName  string      `json:"customerName"`
	CustomerPhone string      `json:"customerPhone"`
	OrderItems    interface{} `json:"orderItems"`
	ReturnURL     string      `json:"returnUrl"`
}

type CartRequest struct {
	Items interface{} `json:"items"`
}

// Response structures
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Rate limiter map
var limiters = make(map[string]*rate.Limiter)

// Rate limiter middleware
func rateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getIP(r)
		limiter, exists := limiters[ip]
		if !exists {
			// 100 requests per 15 minutes = ~0.111 requests per second
			limiter = rate.NewLimiter(rate.Every(9*time.Second), 100)
			limiters[ip] = limiter
		}

		if !limiter.Allow() {
			respondJSON(w, http.StatusTooManyRequests, APIResponse{
				Success: false,
				Message: "Too many requests from this IP, please try again later.",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Get client IP address
func getIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return strings.Split(forwarded, ",")[0]
	}
	return strings.Split(r.RemoteAddr, ":")[0]
}

// Generate Tripay signature
func generateSignature(merchantCode, merchantRef string, amount int) string {
	data := merchantCode + merchantRef + strconv.Itoa(amount)
	h := hmac.New(sha256.New, []byte(config.PrivateKey))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

// Verify callback signature
func verifyCallbackSignature(callbackSignature string, payload []byte) bool {
	h := hmac.New(sha256.New, []byte(config.PrivateKey))
	h.Write(payload)
	generatedSignature := hex.EncodeToString(h.Sum(nil))
	return callbackSignature == generatedSignature
}

// Get cookie value
func getCookie(r *http.Request, name string) string {
	cookie, err := r.Cookie(name)
	if err != nil {
		return ""
	}
	return cookie.Value
}

// Set cookie
func setCookie(w http.ResponseWriter, name, value string, domain string) {
	cookie := &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		MaxAge:   365 * 24 * 60 * 60, // 1 year
		HttpOnly: false,
		Secure:   os.Getenv("NODE_ENV") == "production",
		SameSite: http.SameSiteLaxMode,
	}
	if domain != "" && os.Getenv("NODE_ENV") == "production" {
		cookie.Domain = "." + domain
	}
	http.SetCookie(w, cookie)
}

// Helper function to respond with JSON
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// Health check handler
func healthHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"mode":      config.Mode,
	})
}

// Get payment channels handler
func getPaymentChannelsHandler(w http.ResponseWriter, r *http.Request) {
	if config.APIKey == "" {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Payment gateway not configured",
		})
		return
	}

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", config.APIURL+"/merchant/payment-channel", nil)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to create request",
			Error:   err.Error(),
		})
		return
	}

	req.Header.Set("Authorization", "Bearer "+config.APIKey)

	resp, err := client.Do(req)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to fetch payment channels",
			Error:   err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to read response",
			Error:   err.Error(),
		})
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to parse response",
			Error:   err.Error(),
		})
		return
	}

	// Filter only active channels
	if data, ok := result["data"].([]interface{}); ok {
		var activeChannels []interface{}
		for _, channel := range data {
			if ch, ok := channel.(map[string]interface{}); ok {
				if active, ok := ch["active"].(bool); ok && active {
					activeChannels = append(activeChannels, channel)
				}
			}
		}
		respondJSON(w, http.StatusOK, APIResponse{
			Success: true,
			Data:    activeChannels,
		})
	} else {
		respondJSON(w, http.StatusOK, result)
	}
}

// Create transaction handler
func createTransactionHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	// Validate required fields
	if req.Method == "" || req.Amount == 0 || req.CustomerPhone == "" || req.OrderItems == nil {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Missing required fields",
		})
		return
	}

	if config.APIKey == "" || config.PrivateKey == "" || config.MerchantCode == "" {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Payment gateway not configured properly",
		})
		return
	}

	// Generate unique merchant reference
	merchantRef := fmt.Sprintf("PREMIUM-%d-%s", time.Now().UnixMilli(), randomString(7))

	// Generate signature
	signature := generateSignature(config.MerchantCode, merchantRef, req.Amount)

	// Set default customer name if not provided
	customerName := req.CustomerName
	if customerName == "" {
		customerName = fmt.Sprintf("Customer-%s", req.CustomerPhone)
	}

	// Set default domain
	domain := os.Getenv("DOMAIN")
	if domain == "" {
		domain = "shiroine.my.id"
	}

	// Set default return URL
	returnURL := req.ReturnURL
	if returnURL == "" {
		returnURL = fmt.Sprintf("https://%s/pricing", domain)
	}

	// Prepare transaction data
	transactionData := map[string]interface{}{
		"method":        req.Method,
		"merchant_ref":  merchantRef,
		"amount":        req.Amount,
		"customer_name": customerName,
		"customer_email": fmt.Sprintf("noreply@%s", domain),
		"customer_phone": req.CustomerPhone,
		"order_items":    req.OrderItems,
		"return_url":     returnURL,
		"expired_time":   time.Now().Unix() + (24 * 60 * 60), // 24 hours
		"signature":      signature,
	}

	jsonData, err := json.Marshal(transactionData)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to create transaction data",
			Error:   err.Error(),
		})
		return
	}

	// Create transaction with Tripay
	client := &http.Client{Timeout: 30 * time.Second}
	httpReq, err := http.NewRequest("POST", config.APIURL+"/transaction/create", strings.NewReader(string(jsonData)))
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to create request",
			Error:   err.Error(),
		})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+config.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to create transaction",
			Error:   err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to read response",
			Error:   err.Error(),
		})
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to parse response",
			Error:   err.Error(),
		})
		return
	}

	if success, ok := result["success"].(bool); ok && success {
		if paymentData, ok := result["data"].(map[string]interface{}); ok {
			// Get existing history from cookie
			var existingHistory []TransactionRecord
			historyJSON := getCookie(r, "paymentHistory")
			if historyJSON != "" {
				json.Unmarshal([]byte(historyJSON), &existingHistory)
			}

			// Create transaction record
			transactionRecord := TransactionRecord{
				Reference:   paymentData["reference"].(string),
				MerchantRef: merchantRef,
				Method:      req.Method,
				Amount:      req.Amount,
				Status:      "UNPAID",
				CreatedAt:   time.Now().Format(time.RFC3339),
				OrderItems:  req.OrderItems,
			}

			// Prepend new transaction
			existingHistory = append([]TransactionRecord{transactionRecord}, existingHistory...)

			// Keep only last 50 transactions
			if len(existingHistory) > 50 {
				existingHistory = existingHistory[:50]
			}

			// Set cookie
			historyBytes, _ := json.Marshal(existingHistory)
			setCookie(w, "paymentHistory", string(historyBytes), domain)

			respondJSON(w, http.StatusOK, APIResponse{
				Success: true,
				Data:    paymentData,
				Message: "Transaction created successfully",
			})
		}
	} else {
		message := "Failed to create transaction"
		if msg, ok := result["message"].(string); ok {
			message = msg
		}
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: message,
		})
	}
}

// Transaction status handler
func transactionStatusHandler(w http.ResponseWriter, r *http.Request) {
	// Extract reference from URL path
	reference := strings.TrimPrefix(r.URL.Path, "/api/transaction-status/")

	if config.APIKey == "" {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Payment gateway not configured",
		})
		return
	}

	client := &http.Client{Timeout: 30 * time.Second}
	url := fmt.Sprintf("%s/transaction/detail?reference=%s", config.APIURL, reference)
	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to create request",
			Error:   err.Error(),
		})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+config.APIKey)

	resp, err := client.Do(httpReq)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to fetch transaction status",
			Error:   err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to read response",
			Error:   err.Error(),
		})
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to parse response",
			Error:   err.Error(),
		})
		return
	}

	if success, ok := result["success"].(bool); ok && success {
		if data, ok := result["data"].(map[string]interface{}); ok {
			// Update transaction status in cookie
			var existingHistory []TransactionRecord
			historyJSON := getCookie(r, "paymentHistory")
			if historyJSON != "" {
				json.Unmarshal([]byte(historyJSON), &existingHistory)
			}

			// Update status
			for i, transaction := range existingHistory {
				if transaction.Reference == reference {
					if status, ok := data["status"].(string); ok {
						existingHistory[i].Status = status
						existingHistory[i].UpdatedAt = time.Now().Format(time.RFC3339)
					}
					break
				}
			}

			// Set cookie
			domain := os.Getenv("DOMAIN")
			if domain == "" {
				domain = "shiroine.my.id"
			}
			historyBytes, _ := json.Marshal(existingHistory)
			setCookie(w, "paymentHistory", string(historyBytes), domain)

			respondJSON(w, http.StatusOK, APIResponse{
				Success: true,
				Data:    data,
			})
		}
	} else {
		respondJSON(w, http.StatusNotFound, APIResponse{
			Success: false,
			Message: "Transaction not found",
		})
	}
}

// Tripay callback handler
func callbackHandler(w http.ResponseWriter, r *http.Request) {
	callbackSignature := r.Header.Get("x-callback-signature")

	// Read body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to read request body",
		})
		return
	}

	// Verify signature
	if !verifyCallbackSignature(callbackSignature, body) {
		respondJSON(w, http.StatusUnauthorized, APIResponse{
			Success: false,
			Message: "Invalid signature",
		})
		return
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid JSON payload",
		})
		return
	}

	// Process callback based on payment status
	reference := payload["reference"]
	status := payload["status"]
	merchantRef := payload["merchant_ref"]
	amount := payload["amount"]

	log.Printf("Tripay Callback: reference=%v, status=%v, merchant_ref=%v, amount=%v, timestamp=%s",
		reference, status, merchantRef, amount, time.Now().Format(time.RFC3339))

	if status == "PAID" {
		log.Printf("Payment successful for reference: %v", reference)
		// TODO: Activate premium service for user
	} else if status == "EXPIRED" || status == "FAILED" {
		log.Printf("Payment %v for reference: %v", status, reference)
	}

	// Always respond with success to Tripay
	respondJSON(w, http.StatusOK, APIResponse{Success: true})
}

// Payment history handler
func paymentHistoryHandler(w http.ResponseWriter, r *http.Request) {
	var history []TransactionRecord
	historyJSON := getCookie(r, "paymentHistory")
	if historyJSON != "" {
		json.Unmarshal([]byte(historyJSON), &history)
	}

	respondJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data:    history,
	})
}

// Get cart handler
func getCartHandler(w http.ResponseWriter, r *http.Request) {
	var cart interface{}
	cartJSON := getCookie(r, "cart")
	if cartJSON != "" {
		json.Unmarshal([]byte(cartJSON), &cart)
	} else {
		cart = []interface{}{}
	}

	respondJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data:    cart,
	})
}

// Update cart handler
func updateCartHandler(w http.ResponseWriter, r *http.Request) {
	var req CartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	cartBytes, _ := json.Marshal(req.Items)
	setCookie(w, "cart", string(cartBytes), "")

	respondJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Message: "Cart updated successfully",
	})
}

// 404 handler
func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotFound, APIResponse{
		Success: false,
		Message: "Endpoint not found",
	})
}

// Random string generator
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func main() {
	// Seed random number generator
	rand.Seed(time.Now().UnixNano())

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Configure Tripay
	config.APIKey = os.Getenv("TRIPAY_API_KEY")
	config.PrivateKey = os.Getenv("TRIPAY_PRIVATE_KEY")
	config.MerchantCode = os.Getenv("TRIPAY_MERCHANT_CODE")
	config.Mode = os.Getenv("TRIPAY_MODE")
	if config.Mode == "" {
		config.Mode = "sandbox"
	}

	if config.Mode == "production" {
		config.APIURL = "https://tripay.co.id/api"
	} else {
		config.APIURL = "https://tripay.co.id/api-sandbox"
	}

	// Get port
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	// Setup router
	mux := http.NewServeMux()

	// Register routes
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/payment-channels", getPaymentChannelsHandler)
	mux.HandleFunc("/api/create-transaction", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			createTransactionHandler(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/transaction-status/", transactionStatusHandler)
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			callbackHandler(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/payment-history", paymentHistoryHandler)
	mux.HandleFunc("/api/cart", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			getCartHandler(w, r)
		} else if r.Method == http.MethodPost {
			updateCartHandler(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/", notFoundHandler)

	// Setup CORS
	allowedOrigins := []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		allowedOrigins = []string{frontendURL}
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	// Apply middlewares
	handler := c.Handler(mux)
	handler = rateLimitMiddleware(handler)

	// Security headers middleware
	securityHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		handler.ServeHTTP(w, r)
	})

	// Print startup banner
	fmt.Println(`
╔════════════════════════════════════════════════════════════╗
║  Shiroine Payment Backend Server (Go)                     ║
╠════════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: ` + port + `                                                ║
║  Mode: ` + config.Mode + `                                              ║
║  Environment: ` + os.Getenv("NODE_ENV") + `                              ║
╚════════════════════════════════════════════════════════════╝
	`)

	if config.APIKey == "" || config.PrivateKey == "" || config.MerchantCode == "" {
		log.Println("⚠️  WARNING: Tripay credentials not configured!")
		log.Println("Please set TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, and TRIPAY_MERCHANT_CODE in .env file")
	}

	// Start server
	log.Printf("Server listening on port %s\n", port)
	if err := http.ListenAndServe(":"+port, securityHandler); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
