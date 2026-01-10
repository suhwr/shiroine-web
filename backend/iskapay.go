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

// IskapayGateway implements the PaymentGateway interface for Iskapay
type IskapayGateway struct {
	APIKey string
	APIURL string
	db     *sql.DB
}

// NewIskapayGateway creates a new Iskapay gateway instance
func NewIskapayGateway() *IskapayGateway {
	gateway := &IskapayGateway{
		APIKey: os.Getenv("ISKAPAY_API_KEY"),
		APIURL: "https://wallet.iskapay.com/api/gateway",
	}

	return gateway
}

// GetName returns the name of the payment gateway
func (g *IskapayGateway) GetName() string {
	return "iskapay"
}

// Initialize sets up the gateway with database connection
func (g *IskapayGateway) Initialize(db *sql.DB) {
	g.db = db
}

// GetPaymentChannels returns empty for Iskapay as it only supports QRIS
// No need to list payment methods since it's QRIS-only
func (g *IskapayGateway) GetPaymentChannels() (interface{}, error) {
	// Iskapay only supports QRIS, so we return a fixed structure
	return []map[string]interface{}{
		{
			"code":   "QRIS",
			"name":   "QRIS",
			"type":   "qris",
			"active": true,
			"icon":   "qris.png",
		},
	}, nil
}

// CreateTransaction creates a new QRIS payment transaction with Iskapay
func (g *IskapayGateway) CreateTransaction(req CreateTransactionRequest) (interface{}, error) {
	// Validate required fields
	if req.Amount == 0 || req.OrderItems == nil {
		return nil, fmt.Errorf("missing required fields")
	}

	// Require either phone or group ID
	if req.CustomerPhone == "" && req.GroupID == "" {
		return nil, fmt.Errorf("either phone number or group ID is required")
	}

	if g.APIKey == "" {
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

	// Prepare callback URL
	callbackURL := "https://" + os.Getenv("DOMAIN")
	if callbackURL == "" {
		callbackURL = "https://pay.shiroine.web.id"
	}
	callbackURL += "/callback"

	// Prepare transaction data for Iskapay
	// Based on the problem statement API structure
	transactionData := map[string]interface{}{
		"amount":         2000, //req.Amount,
		"customer_name":  customerName,
		"customer_email": fmt.Sprintf("%s@shiroine.web.id", customerPhone), // Generate email from phone
		"customer_phone": customerPhone,
		"description":    description,
		"callback_url":   callbackURL,
	}

	jsonData, err := json.Marshal(transactionData)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction data: %v", err)
	}

	// Create transaction with Iskapay
	client := &http.Client{Timeout: 30 * time.Second}
	httpReq, err := http.NewRequest("POST", g.APIURL+"/payments", strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	httpReq.Header.Set("X-API-Key", g.APIKey)
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

	// Check if the response is successful
	success, _ := result["success"].(bool)
	if !success {
		message := "Failed to create transaction"
		if msg, ok := result["message"].(string); ok {
			message = msg
		}
		return nil, fmt.Errorf(message)
	}

	if data, ok := result["data"].(map[string]interface{}); ok {
		// Extract merchant_order_id from response
		merchantOrderID := ""
		if id, ok := data["merchant_order_id"].(string); ok {
			merchantOrderID = id
		}

		// Save to payment_history table
		if g.db != nil && merchantOrderID != "" {
			orderItemsJSON, _ := json.Marshal(req.OrderItems)
			var phoneNumber, groupID sql.NullString
			if req.CustomerPhone != "" {
				phoneNumber = sql.NullString{String: req.CustomerPhone, Valid: true}
			}
			if req.GroupID != "" {
				groupID = sql.NullString{String: req.GroupID, Valid: true}
			}

			_, err := g.db.Exec(`
				INSERT INTO payment_history 
				(reference, merchant_ref, phone_number, group_id, customer_name, method, amount, status, order_items, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			`,
				merchantOrderID,
				merchantOrderID,
				phoneNumber,
				groupID,
				customerName,
				"QRIS",
				req.Amount,
				"UNPAID",
				orderItemsJSON,
				time.Now(),
			)
			if err != nil {
				log.Printf("Failed to save transaction to database: %v", err)
			}
		}

		// Transform response to match expected format
		// Add payment_url (checkout_url) for frontend redirect
		if paymentURL, ok := data["payment_url"].(string); ok {
			// Append return URL with merchant_order_id parameter
			if merchantOrderID != "" && req.ReturnURL != "" {
				separator := "?"
				if strings.Contains(req.ReturnURL, "?") {
					separator = "&"
				}
				returnURLParam := separator + "merchant_order_id=" + merchantOrderID
				// Note: payment_url already has the redirect URL, we just need to track the order
				data["checkout_url"] = paymentURL
				data["return_url_with_order"] = req.ReturnURL + returnURLParam
			} else {
				data["checkout_url"] = paymentURL
			}
		}

		return data, nil
	}

	message := "Failed to create transaction"
	if msg, ok := result["message"].(string); ok {
		message = msg
	}
	return nil, fmt.Errorf(message)
}

// GetTransactionStatus retrieves the status of a transaction
// Based on the problem statement: GET /payments/{merchant_order_id}
func (g *IskapayGateway) GetTransactionStatus(orderId string) (interface{}, error) {
	if g.APIKey == "" {
		return nil, fmt.Errorf("payment gateway not configured")
	}

	client := &http.Client{Timeout: 30 * time.Second}
	url := fmt.Sprintf("%s/payments/%s", g.APIURL, orderId)
	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	httpReq.Header.Set("X-API-Key", g.APIKey)

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

	success, _ := result["success"].(bool)
	if !success {
		return nil, fmt.Errorf("transaction not found")
	}

	if data, ok := result["data"].(map[string]interface{}); ok {
		// Update transaction status in database
		if g.db != nil && data["status"] != nil {
			status := data["status"].(string)
			
			// Map Iskapay status to our internal status
			dbStatus := "UNPAID"
			switch status {
			case "pending":
				dbStatus = "UNPAID"
			case "paid", "completed":
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
				// Payment record doesn't exist in DB yet - this shouldn't happen
				// but we'll log it and skip the update
				log.Printf("Warning: Payment record not found in database for merchant_order_id=%s", orderId)
			} else if err != nil {
				// Database error - log it
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
					log.Printf("Iskapay status updated: merchant_order_id=%s, status=%s (was %s)", orderId, dbStatus, currentStatus)
				}

				// Trigger premium activation for PAID status (since Iskapay has no callback)
				if dbStatus == "PAID" {
					log.Printf("Payment completed for merchant_order_id: %s (detected via status check)", orderId)
					if err := activatePremium(g.db, orderId); err != nil {
						log.Printf("Failed to activate premium: %v", err)
					}
				}
			}
		}

		return data, nil
	}

	return nil, fmt.Errorf("transaction not found")
}

// HandleCallback processes payment callback from Iskapay
// Callback format:
// {
//   "event": "payment.completed|payment.failed|payment.expired|payment.cancelled",
//   "payment": {
//     "id": 12345,
//     "merchant_order_id": "INV-1-20250112-ABCD",
//     "amount": 50000,
//     "status": "completed",
//     "created_at": "2025-01-12T09:00:00Z",
//     "paid_at": "2025-01-12T09:30:00Z"
//   },
//   "customer": { "name": "...", "email": "..." },
//   "timestamp": "2025-01-12T09:30:05Z",
//   "signature": "abc123def456..."
// }
func (g *IskapayGateway) HandleCallback(payload []byte, headers map[string]string) error {
	var callbackPayload map[string]interface{}
	if err := json.Unmarshal(payload, &callbackPayload); err != nil {
		return fmt.Errorf("invalid JSON payload: %v", err)
	}

	// Extract event type and payment data
	event, _ := callbackPayload["event"].(string)
	paymentData, ok := callbackPayload["payment"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("payment data not found in callback")
	}

	// Extract payment details
	merchantOrderID, _ := paymentData["merchant_order_id"].(string)
	paymentStatus, _ := paymentData["status"].(string)
	amount, _ := paymentData["amount"].(float64)
	paidAtStr, _ := paymentData["paid_at"].(string)

	log.Printf("Iskapay Callback: event=%s, merchant_order_id=%s, status=%s, amount=%.0f, timestamp=%s",
		event, merchantOrderID, paymentStatus, amount, time.Now().Format(time.RFC3339))

	if merchantOrderID == "" {
		return fmt.Errorf("merchant_order_id not found in callback")
	}

	// Process based on event type or status
	if event == "payment.completed" || paymentStatus == "paid" || paymentStatus == "completed" {
		log.Printf("Payment completed for merchant_order_id: %s", merchantOrderID)

		// Parse paid_at timestamp if available
		var paidAt time.Time
		if paidAtStr != "" {
			parsedTime, err := time.Parse(time.RFC3339, paidAtStr)
			if err == nil {
				paidAt = parsedTime
			} else {
				paidAt = time.Now()
			}
		} else {
			paidAt = time.Now()
		}

		// Update payment_history table
		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, paid_at = $2, updated_at = $3
				WHERE reference = $4 OR merchant_ref = $4
			`, "PAID", paidAt, time.Now(), merchantOrderID)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}

			// Activate premium
			if err := activatePremium(g.db, merchantOrderID); err != nil {
				log.Printf("Failed to activate premium: %v", err)
			}
		}

	} else if event == "payment.failed" || paymentStatus == "failed" {
		log.Printf("Payment failed for merchant_order_id: %s", merchantOrderID)

		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3 OR merchant_ref = $3
			`, "FAILED", time.Now(), merchantOrderID)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}
		}

	} else if event == "payment.expired" || paymentStatus == "expired" {
		log.Printf("Payment expired for merchant_order_id: %s", merchantOrderID)

		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3 OR merchant_ref = $3
			`, "EXPIRED", time.Now(), merchantOrderID)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}
		}

	} else if event == "payment.cancelled" || paymentStatus == "cancelled" {
		log.Printf("Payment cancelled for merchant_order_id: %s", merchantOrderID)

		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3 OR merchant_ref = $3
			`, "CANCELLED", time.Now(), merchantOrderID)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}
		}

	} else {
		log.Printf("Unknown event type or status: event=%s, status=%s for merchant_order_id: %s", event, paymentStatus, merchantOrderID)
	}

	return nil
}
