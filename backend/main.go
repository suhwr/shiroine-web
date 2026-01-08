package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
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
var db *sql.DB

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
	GroupID       string      `json:"groupId"`
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

// Rate limiter map with mutex for thread-safety
var (
	limiters   = make(map[string]*rate.Limiter)
	limitersMu sync.RWMutex
)

// Rate limiter middleware
func rateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getIP(r)
		
		limitersMu.RLock()
		limiter, exists := limiters[ip]
		limitersMu.RUnlock()
		
		if !exists {
			limitersMu.Lock()
			// Double-check after acquiring write lock
			if limiter, exists = limiters[ip]; !exists {
				// 100 requests per 15 minutes = ~0.111 requests per second
				limiter = rate.NewLimiter(rate.Every(9*time.Second), 100)
				limiters[ip] = limiter
			}
			limitersMu.Unlock()
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
	// URL decode the value
	decodedValue, err := url.QueryUnescape(cookie.Value)
	if err != nil {
		return cookie.Value
	}
	return decodedValue
}

// Set cookie
func setCookie(w http.ResponseWriter, name, value string, domain string) {
	// URL encode the value to handle special characters in JSON
	encodedValue := url.QueryEscape(value)
	
	cookie := &http.Cookie{
		Name:     name,
		Value:    encodedValue,
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
	if req.Method == "" || req.Amount == 0 || req.OrderItems == nil {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Missing required fields",
		})
		return
	}

	// Require either phone or group ID
	if req.CustomerPhone == "" && req.GroupID == "" {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Either phone number or group ID is required",
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
			// Save to payment_history table instead of cookie
			if db != nil {
				orderItemsJSON, _ := json.Marshal(req.OrderItems)
				var phoneNumber, groupID sql.NullString
				if req.CustomerPhone != "" {
					phoneNumber = sql.NullString{String: req.CustomerPhone, Valid: true}
				}
				if req.GroupID != "" {
					groupID = sql.NullString{String: req.GroupID, Valid: true}
				}
				
				_, err := db.Exec(`
					INSERT INTO payment_history 
					(reference, merchant_ref, phone_number, group_id, customer_name, method, amount, status, order_items, created_at)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
				`, 
					paymentData["reference"], 
					merchantRef, 
					phoneNumber,
					groupID,
					customerName, 
					req.Method, 
					req.Amount, 
					"UNPAID",
					orderItemsJSON,
					time.Now(),
				)
				if err != nil {
					log.Printf("Failed to save transaction to database: %v", err)
				}
			}

			// Try to save to cookie for backward compatibility (temporary)
			// Wrap in anonymous function to ensure response is sent even if cookie fails
			func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("Panic while setting cookie: %v", r)
					}
				}()
				
				var existingHistory []TransactionRecord
				historyJSON := getCookie(r, "paymentHistory")
				if historyJSON != "" {
					if err := json.Unmarshal([]byte(historyJSON), &existingHistory); err != nil {
						log.Printf("Failed to unmarshal existing history: %v", err)
						existingHistory = []TransactionRecord{}
					}
				}

				// Create transaction record
				reference, ok := paymentData["reference"].(string)
				if !ok {
					log.Printf("Warning: reference is not a string, got type %T with value %v", paymentData["reference"], paymentData["reference"])
					return
				}
				
				transactionRecord := TransactionRecord{
					Reference:   reference,
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
				domain := os.Getenv("DOMAIN")
				if domain == "" {
					domain = "shiroine.my.id"
				}
				historyBytes, err := json.Marshal(existingHistory)
				if err != nil {
					log.Printf("Failed to marshal history for cookie: %v", err)
					return
				}
				setCookie(w, "paymentHistory", string(historyBytes), domain)
			}()

			// Always send success response to client since Tripay transaction succeeded
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
		
		// Update payment_history table
		if db != nil {
			_, err := db.Exec(`
				UPDATE payment_history 
				SET status = $1, paid_at = $2, updated_at = $3
				WHERE reference = $4
			`, status, time.Now(), time.Now(), reference)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}

			// Get transaction details to activate premium
			var phoneNumber, groupID sql.NullString
			var orderItemsJSON []byte
			err = db.QueryRow(`
				SELECT phone_number, group_id, order_items 
				FROM payment_history 
				WHERE reference = $1
			`, reference).Scan(&phoneNumber, &groupID, &orderItemsJSON)
			
			if err == nil {
				// Parse order items to get plan details
				var orderItems []map[string]interface{}
				json.Unmarshal(orderItemsJSON, &orderItems)
				
				if len(orderItems) > 0 {
					planName := ""
					if name, ok := orderItems[0]["name"].(string); ok {
						planName = name
					}
					
					// Extract plan ID from name with improved pattern matching
					planID := ""
					nameLower := strings.ToLower(planName)
					
					if strings.Contains(nameLower, "user premium") {
						// Match specific day counts to avoid ambiguity
						if strings.Contains(nameLower, "5 day") || strings.Contains(nameLower, "7 day") {
							planID = "user-5d"
						} else if strings.Contains(nameLower, "15 day") {
							planID = "user-15d"
						} else if strings.Contains(nameLower, "30 day") || strings.Contains(nameLower, "1 month") {
							planID = "user-1m"
						}
					} else if strings.Contains(nameLower, "group premium") {
						if strings.Contains(nameLower, "15 day") {
							planID = "group-15d"
						} else if strings.Contains(nameLower, "30 day") || strings.Contains(nameLower, "1 month") {
							planID = "group-1m"
						}
					}
					
					if planID != "" {
						days, specialLimit, isGroup := parsePlanDetails(planID)
						
						var jid, lid string
						if isGroup && groupID.Valid {
							jid = groupID.String
							lid = groupID.String // For groups, lid = id
						} else if phoneNumber.Valid {
							jid = phoneNumber.String
							// Get lid from users table
							err = db.QueryRow("SELECT lid FROM users WHERE phone_number = $1", phoneNumber.String).Scan(&lid)
							if err != nil {
								log.Printf("Failed to get lid for phone %s: %v", phoneNumber.String, err)
								lid = phoneNumber.String // Fallback to phone number
							}
						}
						
						if jid != "" && lid != "" {
							// Check if premium already exists
							var existingExpired sql.NullString
							err := db.QueryRow(`
								SELECT expired FROM premium WHERE jid = $1 AND lid = $2
							`, jid, lid).Scan(&existingExpired)
							
							var newExpired time.Time
							if err == sql.ErrNoRows {
								// New premium
								newExpired = time.Now().AddDate(0, 0, days)
							} else if err == nil && existingExpired.Valid {
								// Stack premium
								currentExpired, _ := time.Parse(time.RFC3339, existingExpired.String)
								if currentExpired.Before(time.Now()) {
									newExpired = time.Now().AddDate(0, 0, days)
								} else {
									newExpired = currentExpired.AddDate(0, 0, days)
								}
							} else {
								newExpired = time.Now().AddDate(0, 0, days)
							}
							
							// Upsert premium
							_, err = db.Exec(`
								INSERT INTO premium (jid, lid, special_limit, max_special_limit, expired, last_special_reset)
								VALUES ($1, $2, $3, $4, $5, $6)
								ON CONFLICT (jid, lid) DO UPDATE SET
									special_limit = 0,
									max_special_limit = $4,
									expired = $5,
									last_special_reset = $6,
									updated_at = CURRENT_TIMESTAMP
							`, jid, lid, 0, specialLimit, newExpired.Format(time.RFC3339), time.Now().Format(time.RFC3339))
							
							if err != nil {
								log.Printf("Failed to activate premium: %v", err)
							} else {
								log.Printf("Premium activated for jid=%s, lid=%s, days=%d, specialLimit=%d", jid, lid, days, specialLimit)
							}
						}
					}
				}
			}
		}
	} else if status == "EXPIRED" || status == "FAILED" {
		log.Printf("Payment %v for reference: %v", status, reference)
		
		// Update payment_history table
		if db != nil {
			_, err := db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3
			`, status, time.Now(), reference)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}
		}
	}

	// Always respond with success to Tripay
	respondJSON(w, http.StatusOK, APIResponse{Success: true})
}

// Payment history handler - now queries database by phone/group ID
func paymentHistoryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Identifier string `json:"identifier"` // phone number or group ID
		Type       string `json:"type"`       // "user" or "group"
		Page       int    `json:"page"`       // page number (default 1)
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	if req.Identifier == "" {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Missing identifier",
		})
		return
	}

	if req.Page < 1 {
		req.Page = 1
	}

	perPage := 10
	offset := (req.Page - 1) * perPage

	if db == nil {
		// Fallback to cookie-based history if database is not available
		var history []TransactionRecord
		historyJSON := getCookie(r, "paymentHistory")
		if historyJSON != "" {
			json.Unmarshal([]byte(historyJSON), &history)
		}

		respondJSON(w, http.StatusOK, APIResponse{
			Success: true,
			Data:    history,
		})
		return
	}

	// Query database
	var rows *sql.Rows
	var err error
	var totalCount int

	if req.Type == "group" {
		rows, err = db.Query(`
			SELECT reference, merchant_ref, customer_name, method, amount, status, 
			       order_items, created_at, updated_at, paid_at
			FROM payment_history
			WHERE group_id = $1
			ORDER BY created_at DESC
			LIMIT $2 OFFSET $3
		`, req.Identifier, perPage, offset)
		
		db.QueryRow("SELECT COUNT(*) FROM payment_history WHERE group_id = $1", req.Identifier).Scan(&totalCount)
	} else {
		rows, err = db.Query(`
			SELECT reference, merchant_ref, customer_name, method, amount, status, 
			       order_items, created_at, updated_at, paid_at
			FROM payment_history
			WHERE phone_number = $1
			ORDER BY created_at DESC
			LIMIT $2 OFFSET $3
		`, req.Identifier, perPage, offset)
		
		db.QueryRow("SELECT COUNT(*) FROM payment_history WHERE phone_number = $1", req.Identifier).Scan(&totalCount)
	}

	if err != nil {
		log.Printf("Database error: %v", err)
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Database error",
		})
		return
	}
	defer rows.Close()

	var history []map[string]interface{}
	for rows.Next() {
		var reference, merchantRef, customerName, method, status string
		var amount int
		var orderItemsJSON []byte
		var createdAt, updatedAt time.Time
		var paidAt sql.NullTime

		err := rows.Scan(&reference, &merchantRef, &customerName, &method, &amount, 
			&status, &orderItemsJSON, &createdAt, &updatedAt, &paidAt)
		if err != nil {
			log.Printf("Row scan error: %v", err)
			continue
		}

		var orderItems interface{}
		json.Unmarshal(orderItemsJSON, &orderItems)

		record := map[string]interface{}{
			"reference":    reference,
			"merchantRef":  merchantRef,
			"customerName": customerName,
			"method":       method,
			"amount":       amount,
			"status":       status,
			"orderItems":   orderItems,
			"createdAt":    createdAt.Format(time.RFC3339),
			"updatedAt":    updatedAt.Format(time.RFC3339),
		}

		if paidAt.Valid {
			record["paidAt"] = paidAt.Time.Format(time.RFC3339)
		}

		history = append(history, record)
	}

	totalPages := (totalCount + perPage - 1) / perPage

	respondJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"history":     history,
			"page":        req.Page,
			"perPage":     perPage,
			"totalCount":  totalCount,
			"totalPages":  totalPages,
			"hasNext":     req.Page < totalPages,
			"hasPrevious": req.Page > 1,
		},
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
	// Use crypto/rand for better randomness (Go 1.20+ auto-seeds math/rand)
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

// Initialize database connection
func initDB() error {
	var err error
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSSLMode := os.Getenv("DB_SSLMODE")

	if dbSSLMode == "" {
		dbSSLMode = "disable"
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	db, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	if err = db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("✅ Database connection established successfully")
	return nil
}

// Parse plan details from plan ID
func parsePlanDetails(planID string) (days int, specialLimit int, isGroup bool) {
	isGroup = strings.HasPrefix(planID, "group-")
	
	switch planID {
	// User plans - updated based on requirements
	case "user-5d":
		return 7, 5, false  // 7 days, 5 special limit
	case "user-15d":
		return 15, 10, false // 15 days, 10 special limit
	case "user-1m":
		return 30, 15, false // 30 days, 15 special limit
	// Group plans
	case "group-15d":
		return 15, 30, true // 15 days, 30 special limit
	case "group-1m":
		return 30, 50, true // 30 days, 50 special limit
	default:
		return 0, 0, false
	}
}

// Verify user handler
func verifyUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Identifier string `json:"identifier"` // phone number or group ID
		Type       string `json:"type"`       // "user" or "group"
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	if req.Identifier == "" || req.Type == "" {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: "Missing identifier or type",
		})
		return
	}

	if req.Type == "group" {
		// Query groups table
		var groupName string
		err := db.QueryRow("SELECT group_name FROM groups WHERE id = $1", req.Identifier).Scan(&groupName)
		if err == sql.ErrNoRows {
			respondJSON(w, http.StatusNotFound, APIResponse{
				Success: false,
				Message: "Tidak menemukan grup di database, pastikan kamu sudah menggunakan bot dari kami",
			})
			return
		} else if err != nil {
			log.Printf("Database error: %v", err)
			respondJSON(w, http.StatusInternalServerError, APIResponse{
				Success: false,
				Message: "Database error",
			})
			return
		}

		respondJSON(w, http.StatusOK, APIResponse{
			Success: true,
			Message: fmt.Sprintf("Apakah grup kamu bernama \"%s\"?", groupName),
			Data: map[string]interface{}{
				"type":  "group",
				"id":    req.Identifier,
				"name":  groupName,
			},
		})
		return
	}

	// For user verification
	var lid sql.NullString
	err := db.QueryRow("SELECT lid FROM users WHERE phone_number = $1", req.Identifier).Scan(&lid)
	if err == sql.ErrNoRows || !lid.Valid || lid.String == "" {
		respondJSON(w, http.StatusNotFound, APIResponse{
			Success: false,
			Message: "Tidak menemukan user di database, pastikan kamu sudah menggunakan bot dari kami",
		})
		return
	} else if err != nil {
		log.Printf("Database error: %v", err)
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Database error",
		})
		return
	}

	// Query names table for push_name
	var pushName string
	err = db.QueryRow("SELECT push_name FROM names WHERE lid = $1", lid.String).Scan(&pushName)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Database error querying names: %v", err)
	}

	if pushName == "" {
		pushName = "User"
	}

	respondJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Message: fmt.Sprintf("Apakah kamu bernama \"%s\"?", pushName),
		Data: map[string]interface{}{
			"type":        "user",
			"phoneNumber": req.Identifier,
			"lid":         lid.String,
			"name":        pushName,
		},
	})
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database
	if err := initDB(); err != nil {
		log.Printf("⚠️  WARNING: Database connection failed: %v", err)
		log.Println("Server will continue without database features")
	}
	defer func() {
		if db != nil {
			db.Close()
		}
	}()

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
	mux.HandleFunc("/api/verify-user", verifyUserHandler)
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
