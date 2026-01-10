package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
	"golang.org/x/time/rate"
)

// Global variables
var db *sql.DB
var paymentGateway PaymentGateway

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

// Helper function to respond with JSON
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// Health check handler
func healthHandler(w http.ResponseWriter, r *http.Request) {
	gatewayName := "not configured"
	if paymentGateway != nil {
		gatewayName = paymentGateway.GetName()
	}
	
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":         "ok",
		"timestamp":      time.Now().Format(time.RFC3339),
		"paymentGateway": gatewayName,
	})
}

// Get payment channels handler
func getPaymentChannelsHandler(w http.ResponseWriter, r *http.Request) {
	if paymentGateway == nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Payment gateway not configured",
		})
		return
	}

	channels, err := paymentGateway.GetPaymentChannels()
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to fetch payment channels",
			Error:   err.Error(),
		})
		return
	}

	respondJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data:    channels,
	})
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

	if paymentGateway == nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Payment gateway not configured",
		})
		return
	}

	paymentData, err := paymentGateway.CreateTransaction(req)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	respondJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data:    paymentData,
		Message: "Transaction created successfully",
	})
}

// Transaction status handler
func transactionStatusHandler(w http.ResponseWriter, r *http.Request) {
	// Extract reference from URL path
	reference := strings.TrimPrefix(r.URL.Path, "/api/transaction-status/")

	if paymentGateway == nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Payment gateway not configured",
		})
		return
	}

	data, err := paymentGateway.GetTransactionStatus(reference)
	if err != nil {
		respondJSON(w, http.StatusNotFound, APIResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	respondJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	})
}

// Payment callback handler - handles callbacks from all payment gateways
func callbackHandler(w http.ResponseWriter, r *http.Request) {
	// Read body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Failed to read request body",
		})
		return
	}

	if paymentGateway == nil {
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Payment gateway not configured",
		})
		return
	}

	// Collect headers
	headers := make(map[string]string)
	for key, values := range r.Header {
		if len(values) > 0 {
			headers[strings.ToLower(key)] = values[0]
		}
	}

	// Handle callback using the configured gateway
	if err := paymentGateway.HandleCallback(body, headers); err != nil {
		log.Printf("Callback error: %v", err)
		respondJSON(w, http.StatusBadRequest, APIResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	// Always respond with success
	respondJSON(w, http.StatusOK, APIResponse{Success: true})
}

// Payment history handler - queries database by phone/group ID
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
		respondJSON(w, http.StatusInternalServerError, APIResponse{
			Success: false,
			Message: "Database not available",
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

// 404 handler
func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotFound, APIResponse{
		Success: false,
		Message: "Endpoint not found",
	})
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
				"type": "group",
				"id":   req.Identifier,
				"name": groupName,
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

	// Initialize payment gateway based on configuration
	gatewayType := os.Getenv("PAYMENT_GATEWAY")
	if gatewayType == "" {
		gatewayType = "tripay" // Default to Tripay for backward compatibility
	}

	paymentGateway = PaymentGatewayFactory(gatewayType)
	paymentGateway.Initialize(db)

	log.Printf("✅ Payment gateway initialized: %s", paymentGateway.GetName())

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
║  Gateway: ` + paymentGateway.GetName() + `                                           ║
║  Environment: ` + os.Getenv("NODE_ENV") + `                              ║
╚════════════════════════════════════════════════════════════╝
	`)

	// Start server
	log.Printf("Server listening on port %s\n", port)
	if err := http.ListenAndServe(":"+port, securityHandler); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
