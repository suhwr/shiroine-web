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
	"time"
)

// PakasirGateway implements the PaymentGateway interface for Pakasir
type PakasirGateway struct {
	APIKey  string
	APIURL  string
	Slug    string
	Mode    string // sandbox or production
	db      *sql.DB
}

// NewPakasirGateway creates a new Pakasir gateway instance
func NewPakasirGateway() *PakasirGateway {
	mode := os.Getenv("PAKASIR_MODE")
	if mode == "" {
		mode = "production"
	}

	gateway := &PakasirGateway{
		APIKey: os.Getenv("PAKASIR_API_KEY"),
		APIURL: "https://app.pakasir.com",
		Slug:   os.Getenv("PAKASIR_SLUG"),
		Mode:   mode,
	}

	return gateway
}

// GetName returns the name of the payment gateway
func (g *PakasirGateway) GetName() string {
	return "pakasir"
}

// Initialize sets up the gateway with database connection
func (g *PakasirGateway) Initialize(db *sql.DB) {
	g.db = db
}

// GetPaymentChannels returns available payment channels for Pakasir
// Pakasir supports QRIS, Virtual Account, and PayPal
func (g *PakasirGateway) GetPaymentChannels() (interface{}, error) {
	// Pakasir supports multiple payment methods
	channels := []map[string]interface{}{
		{
			"code":   "QRIS",
			"name":   "QRIS",
			"type":   "qris",
			"group":  "E-Wallet",
			"active": true,
			"icon":   "qris.png",
		},
		{
			"code":   "CIMB_NIAGA_VA",
			"name":   "CIMB Niaga Virtual Account",
			"type":   "virtual_account",
			"group":  "Virtual Account",
			"active": true,
			"icon":   "cimb.png",
		},
		{
			"code":   "BNI_VA",
			"name":   "BNI Virtual Account",
			"type":   "virtual_account",
			"group":  "Virtual Account",
			"active": true,
			"icon":   "bni.png",
		},
		{
			"code":   "BRI_VA",
			"name":   "BRI Virtual Account",
			"type":   "virtual_account",
			"group":  "Virtual Account",
			"active": true,
			"icon":   "bri.png",
		},
		{
			"code":   "PERMATA_VA",
			"name":   "Permata Virtual Account",
			"type":   "virtual_account",
			"group":  "Virtual Account",
			"active": true,
			"icon":   "permata.png",
		},
		{
			"code":   "SAMPOERNA_VA",
			"name":   "Sampoerna Virtual Account",
			"type":   "virtual_account",
			"group":  "Virtual Account",
			"active": true,
			"icon":   "sampoerna.png",
		},
		{
			"code":   "BNC_VA",
			"name":   "BNC Virtual Account",
			"type":   "virtual_account",
			"group":  "Virtual Account",
			"active": true,
			"icon":   "bnc.png",
		},
		{
			"code":   "MAYBANK_VA",
			"name":   "Maybank Virtual Account",
			"type":   "virtual_account",
			"group":  "Virtual Account",
			"active": true,
			"icon":   "maybank.png",
		},
		{
			"code":   "ATM_BERSAMA_VA",
			"name":   "ATM Bersama Virtual Account",
			"type":   "virtual_account",
			"group":  "Virtual Account",
			"active": true,
			"icon":   "atm_bersama.png",
		},
		{
			"code":   "ARTHA_GRAHA_VA",
			"name":   "Artha Graha Virtual Account",
			"type":   "virtual_account",
			"group":  "Virtual Account",
			"active": true,
			"icon":   "artha_graha.png",
		},
		{
			"code":   "PAYPAL",
			"name":   "PayPal",
			"type":   "paypal",
			"group":  "International",
			"active": true,
			"icon":   "paypal.png",
		},
	}

	return channels, nil
}

// CreateTransaction creates a new payment transaction with Pakasir
func (g *PakasirGateway) CreateTransaction(req CreateTransactionRequest) (interface{}, error) {
	// Validate required fields
	if req.Amount == 0 || req.OrderItems == nil {
		return nil, fmt.Errorf("missing required fields")
	}

	// Require either phone or group ID
	if req.CustomerPhone == "" && req.GroupID == "" {
		return nil, fmt.Errorf("either phone number or group ID is required")
	}

	if g.APIKey == "" || g.Slug == "" {
		return nil, fmt.Errorf("payment gateway not configured properly")
	}

	// Set default customer name if not provided
	customerName := req.CustomerName
	if customerName == "" {
		customerName = fmt.Sprintf("Customer-%s", req.CustomerPhone)
	}

	// Set customer phone (use group ID if it's a group purchase)
	customerPhone := req.CustomerPhone
	if customerPhone == "" && req.GroupID != "" {
		customerPhone = req.GroupID
	}

	// Generate description from order items
	description := "Premium subscription"
	if req.OrderItems != nil {
		// Try to extract item name from order items
		if itemsArray, ok := req.OrderItems.([]interface{}); ok && len(itemsArray) > 0 {
			if firstItem, ok := itemsArray[0].(map[string]interface{}); ok {
				if itemName, ok := firstItem["name"].(string); ok && itemName != "" {
					description = itemName
				}
			}
		}
	}

	// Generate order ID
	orderID := fmt.Sprintf("INV-%s-%d", time.Now().Format("20060102"), time.Now().UnixNano()%1000000)

	// Map payment method code to Pakasir method
	pakasirMethod := strings.ToLower(req.Method)
	pakasirMethod = strings.ReplaceAll(pakasirMethod, "_", "")
	
	// Map common codes to Pakasir format
	methodMap := map[string]string{
		"qris":          "qris",
		"cimbniagava":   "cimb_niaga_via",
		"bniva":         "bni_va",
		"briva":         "bri_va",
		"permatava":     "permata_va",
		"sampornava":    "sampoerna_va",
		"bncva":         "bnc_va",
		"maybankva":     "maybank_va",
		"atmbersama":    "atm_bersama_va",
		"arthagraha":    "artha_graha_va",
		"paypal":        "paypal",
	}
	
	if mapped, ok := methodMap[pakasirMethod]; ok {
		pakasirMethod = mapped
	}

	// For QRIS, VA, and PayPal methods, use API integration
	if pakasirMethod == "qris" || strings.Contains(pakasirMethod, "_va") || pakasirMethod == "paypal" {
		return g.createAPITransaction(req, orderID, pakasirMethod, description)
	}

	// For other methods, use URL-based integration
	return g.createURLTransaction(req, orderID, pakasirMethod, description)
}

// createAPITransaction creates transaction using Pakasir API
func (g *PakasirGateway) createAPITransaction(req CreateTransactionRequest, orderID, method, description string) (interface{}, error) {
	// Prepare transaction data for Pakasir API
	transactionData := map[string]interface{}{
		"project":  g.Slug,
		"order_id": orderID,
		"amount":   req.Amount,
		"api_key":  g.APIKey,
	}

	jsonData, err := json.Marshal(transactionData)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction data: %v", err)
	}

	// Create transaction with Pakasir API
	client := &http.Client{Timeout: 30 * time.Second}
	url := fmt.Sprintf("%s/api/transactioncreate/%s", g.APIURL, method)
	httpReq, err := http.NewRequest("POST", url, strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	// Check if payment data exists in response
	paymentData, ok := result["payment"].(map[string]interface{})
	if !ok {
		message := "Failed to create transaction"
		if msg, ok := result["message"].(string); ok {
			message = msg
		}
		return nil, fmt.Errorf(message)
	}

	// Extract payment details
	merchantOrderID := orderID
	if id, ok := paymentData["order_id"].(string); ok {
		merchantOrderID = id
	}

	paymentNumber := ""
	if num, ok := paymentData["payment_number"].(string); ok {
		paymentNumber = num
	}

	totalPayment := req.Amount
//	if total, ok := paymentData["total_payment"].(float64); ok {
//		totalPayment = int(total)
//	}

	expiredAt := ""
	var expiredAtTime *time.Time
	if exp, ok := paymentData["expired_at"].(string); ok {
		expiredAt = exp
		// Parse the time for database storage
		if parsedTime, err := time.Parse(time.RFC3339, exp); err == nil {
			expiredAtTime = &parsedTime
		}
	}

	// Save to payment_history table
	if g.db != nil {
		orderItemsJSON, _ := json.Marshal(req.OrderItems)
		var phoneNumber, groupID sql.NullString
		if req.CustomerPhone != "" {
			phoneNumber = sql.NullString{String: req.CustomerPhone, Valid: true}
		}
		if req.GroupID != "" {
			groupID = sql.NullString{String: req.GroupID, Valid: true}
		}

		customerName := req.CustomerName
		if customerName == "" {
			customerName = fmt.Sprintf("Customer-%s", req.CustomerPhone)
		}

		_, err := g.db.Exec(`
			INSERT INTO payment_history 
			(reference, merchant_ref, phone_number, group_id, customer_name, method, amount, status, order_items, payment_number, expired_at, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`,
			merchantOrderID,
			merchantOrderID,
			phoneNumber,
			groupID,
			customerName,
			strings.ToUpper(req.Method),
			totalPayment,
			"UNPAID",
			orderItemsJSON,
			paymentNumber,
			expiredAtTime,
			time.Now(),
		)
		if err != nil {
			log.Printf("Failed to save transaction to database: %v", err)
		}
	}

	// Transform response to match expected format
	responseData := map[string]interface{}{
		"merchant_order_id": merchantOrderID,
		"payment_method":    method,
		"payment_number":    paymentNumber,
		"qr_code":           paymentNumber, // For QRIS, payment_number is the QR string
		"amount":            req.Amount,
		"total_amount":      totalPayment,
		"expired_at":        expiredAt,
		"status":            "pending",
	}

	// Add fee if available
	if fee, ok := paymentData["fee"].(float64); ok {
		responseData["fee"] = int(fee)
	}

	return responseData, nil
}

// createURLTransaction creates transaction using Pakasir URL-based integration
func (g *PakasirGateway) createURLTransaction(req CreateTransactionRequest, orderID, method, description string) (interface{}, error) {
	// For URL-based integration, we create a checkout URL
	// Format: https://app.pakasir.com/pay/{slug}/{amount}?order_id={order_id}
	// Or for PayPal: https://app.pakasir.com/paypal/{slug}/{amount}?order_id={order_id}
	
	baseURL := g.APIURL
	pathPrefix := "/pay/"
	if method == "paypal" {
		pathPrefix = "/paypal/"
	}

	// Build checkout URL
	domain := os.Getenv("DOMAIN")
	if domain == "" {
		domain = "shiroine.my.id"
	}
	
	checkoutURL := fmt.Sprintf("%s%s%s/%d?order_id=%s&redirect=https://%s/pay/%s",
		baseURL, pathPrefix, g.Slug, req.Amount, orderID, domain, orderID)

	// Save to payment_history table
	if g.db != nil {
		orderItemsJSON, _ := json.Marshal(req.OrderItems)
		var phoneNumber, groupID sql.NullString
		if req.CustomerPhone != "" {
			phoneNumber = sql.NullString{String: req.CustomerPhone, Valid: true}
		}
		if req.GroupID != "" {
			groupID = sql.NullString{String: req.GroupID, Valid: true}
		}

		customerName := req.CustomerName
		if customerName == "" {
			customerName = fmt.Sprintf("Customer-%s", req.CustomerPhone)
		}

		_, err := g.db.Exec(`
			INSERT INTO payment_history 
			(reference, merchant_ref, phone_number, group_id, customer_name, method, amount, status, order_items, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`,
			orderID,
			orderID,
			phoneNumber,
			groupID,
			customerName,
			strings.ToUpper(req.Method),
			req.Amount,
			"UNPAID",
			orderItemsJSON,
			time.Now(),
		)
		if err != nil {
			log.Printf("Failed to save transaction to database: %v", err)
		}
	}

	// Return response with checkout URL
	responseData := map[string]interface{}{
		"merchant_order_id": orderID,
		"payment_method":    method,
		"checkout_url":      checkoutURL,
		"amount":            req.Amount,
		"total_amount":      req.Amount,
		"status":            "pending",
	}

	return responseData, nil
}

// GetTransactionStatus retrieves the status of a transaction
// For QRIS: Uses Pakasir API to check transaction status
// For PayPal and VA: Relies solely on callback, returns database status
func (g *PakasirGateway) GetTransactionStatus(orderId string) (interface{}, error) {
	if g.APIKey == "" || g.Slug == "" {
		return nil, fmt.Errorf("payment gateway not configured")
	}

	// First, check database for transaction details
	var amount int
	var method string
	var status string
	var paymentNumber sql.NullString
	var expiredAt sql.NullTime
	var paidAt sql.NullTime
	
	err := g.db.QueryRow(`
		SELECT amount, method, status, payment_number, expired_at, paid_at 
		FROM payment_history 
		WHERE reference = $1 OR merchant_ref = $1
	`, orderId).Scan(&amount, &method, &status, &paymentNumber, &expiredAt, &paidAt)

	if err != nil {
		return nil, fmt.Errorf("transaction not found in database")
	}

	// For PayPal and Virtual Account, rely solely on callback (database status)
	// Only use API check for QRIS
	methodLower := strings.ToLower(method)
	if methodLower == "paypal" || strings.Contains(methodLower, "_va") || strings.Contains(methodLower, "virtual") {
		// Return database status without API check
		responseData := map[string]interface{}{
			"merchant_order_id": orderId,
			"payment_method":    method,
			"amount":            amount,
			"status":            strings.ToLower(status),
		}
		
		if paymentNumber.Valid {
			responseData["payment_number"] = paymentNumber.String
		}
		
		if expiredAt.Valid {
			responseData["expired_at"] = expiredAt.Time.Format(time.RFC3339)
		}
		
		if paidAt.Valid {
			responseData["paid_at"] = paidAt.Time.Format(time.RFC3339)
		}
		
		return responseData, nil
	}

	// For QRIS, use Pakasir API to get transaction detail
	client := &http.Client{Timeout: 30 * time.Second}
	url := fmt.Sprintf("%s/api/transactiondetail?project=%s&amount=%d&order_id=%s&api_key=%s",
		g.APIURL, g.Slug, amount, orderId, g.APIKey)
	
	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transaction status: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	// Check if transaction data exists
	transactionData, ok := result["transaction"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("transaction not found")
	}

	// Update transaction status in database
	if g.db != nil && transactionData["status"] != nil {
		status := transactionData["status"].(string)

		// Map Pakasir status to our internal status
		dbStatus := "UNPAID"
		switch status {
		case "pending":
			dbStatus = "UNPAID"
		case "paid", "completed", "success":
			dbStatus = "PAID"
		case "failed":
			dbStatus = "FAILED"
		case "expired":
			dbStatus = "EXPIRED"
		case "cancelled":
			dbStatus = "CANCELLED"
		}

		// Check current status in database before updating
		var currentStatus string
		err := g.db.QueryRow(`
			SELECT status FROM payment_history 
			WHERE reference = $1 OR merchant_ref = $1
		`, orderId).Scan(&currentStatus)

		// Handle missing record or status change
		if err == sql.ErrNoRows {
			log.Printf("Warning: Payment record not found in database for order_id=%s", orderId)
		} else if err != nil {
			log.Printf("Failed to check current payment status: %v", err)
		} else if currentStatus != dbStatus {
			// Status has changed - update and trigger activation if needed
			now := time.Now()
			var paidAt interface{}
			if dbStatus == "PAID" {
				paidAt = now
			} else {
				paidAt = nil
			}

			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, paid_at = $2, updated_at = $3
				WHERE reference = $4 OR merchant_ref = $4
			`, dbStatus, paidAt, now, orderId)
			if err != nil {
				log.Printf("Failed to update transaction status: %v", err)
			} else {
				log.Printf("Pakasir status updated: order_id=%s, status=%s (was %s)", orderId, dbStatus, currentStatus)
			}

			// Trigger premium activation for PAID status
			if dbStatus == "PAID" {
				log.Printf("Payment completed for order_id: %s (detected via status check)", orderId)
				if err := activatePremium(g.db, orderId); err != nil {
					log.Printf("Failed to activate premium: %v", err)
				}
			}
		}
	}

	return transactionData, nil
}

// HandleCallback processes payment callback from Pakasir
// Callback format (from Pakasir documentation):
// {
//   "amount": 22000,
//   "order_id": "240910HDE7C9",
//   "project": "depodomain",
//   "status": "completed",
//   "payment_method": "qris",
//   "completed_at": "2024-09-10T08:07:02.819+07:00"
// }
func (g *PakasirGateway) HandleCallback(payload []byte, headers map[string]string) error {
	var callbackPayload map[string]interface{}
	if err := json.Unmarshal(payload, &callbackPayload); err != nil {
		return fmt.Errorf("invalid JSON payload: %v", err)
	}

	// Extract payment details from Pakasir webhook format
	orderID, _ := callbackPayload["order_id"].(string)
	status, _ := callbackPayload["status"].(string)
	amount, _ := callbackPayload["amount"].(float64)
	completedAtStr, _ := callbackPayload["completed_at"].(string)
	paymentMethod, _ := callbackPayload["payment_method"].(string)

	log.Printf("Pakasir Callback: order_id=%s, status=%s, amount=%.0f, payment_method=%s, timestamp=%s",
		orderID, status, amount, paymentMethod, time.Now().Format(time.RFC3339))

	if orderID == "" {
		return fmt.Errorf("order_id not found in callback")
	}

	// Process based on status
	if status == "completed" || status == "paid" || status == "success" {
		log.Printf("Payment completed for order_id: %s", orderID)

		// Parse completed_at timestamp if available
		var completedAt time.Time
		if completedAtStr != "" {
			parsedTime, err := time.Parse(time.RFC3339, completedAtStr)
			if err == nil {
				completedAt = parsedTime
			} else {
				completedAt = time.Now()
			}
		} else {
			completedAt = time.Now()
		}

		// Update payment_history table
		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, paid_at = $2, updated_at = $3
				WHERE reference = $4 OR merchant_ref = $4
			`, "PAID", completedAt, time.Now(), orderID)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}

			// Activate premium
			if err := activatePremium(g.db, orderID); err != nil {
				log.Printf("Failed to activate premium: %v", err)
			}
		}

	} else if status == "failed" {
		log.Printf("Payment failed for order_id: %s", orderID)

		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3 OR merchant_ref = $3
			`, "FAILED", time.Now(), orderID)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}
		}

	} else if status == "expired" {
		log.Printf("Payment expired for order_id: %s", orderID)

		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3 OR merchant_ref = $3
			`, "EXPIRED", time.Now(), orderID)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}
		}

	} else if status == "cancelled" {
		log.Printf("Payment cancelled for order_id: %s", orderID)

		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3 OR merchant_ref = $3
			`, "CANCELLED", time.Now(), orderID)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}
		}

	} else {
		log.Printf("Unknown status: %s for order_id: %s", status, orderID)
	}

	return nil
}
