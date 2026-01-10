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
	APIKey string
	APIURL string
	db     *sql.DB
}

// NewPakasirGateway creates a new Pakasir gateway instance
func NewPakasirGateway() *PakasirGateway {
	gateway := &PakasirGateway{
		APIKey: os.Getenv("PAKASIR_API_KEY"),
		APIURL: "https://api.pakasir.com/v1",
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

// GetPaymentChannels returns empty for Pakasir as it only supports QRIS
// No need to list payment methods since it's QRIS-only
func (g *PakasirGateway) GetPaymentChannels() (interface{}, error) {
	// Pakasir only supports QRIS, so we return a fixed structure
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

// CreateTransaction creates a new QRIS payment transaction with Pakasir
func (g *PakasirGateway) CreateTransaction(req CreateTransactionRequest) (interface{}, error) {
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
	domain := os.Getenv("DOMAIN")
	if domain == "" {
		domain = "shiroine.my.id"
	}
	callbackURL := fmt.Sprintf("https://%s/callback", domain)

	// Prepare transaction data for Pakasir
	// Based on typical QRIS payment gateway API structure
	transactionData := map[string]interface{}{
		"amount":       req.Amount,
		"customer_name": customerName,
		"customer_email": fmt.Sprintf("noreply@%s", domain),
		"customer_phone": customerPhone,
		"description":   description,
		"callback_url":  callbackURL,
	}

	jsonData, err := json.Marshal(transactionData)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction data: %v", err)
	}

	// Create transaction with Pakasir
	client := &http.Client{Timeout: 30 * time.Second}
	httpReq, err := http.NewRequest("POST", g.APIURL+"/payments", strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+g.APIKey)
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
		} else if id, ok := data["order_id"].(string); ok {
			merchantOrderID = id
		} else if id, ok := data["reference"].(string); ok {
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
			data["checkout_url"] = paymentURL
		} else if qrURL, ok := data["qr_url"].(string); ok {
			data["checkout_url"] = qrURL
		}

		// Ensure merchant_order_id is set for consistency
		if merchantOrderID != "" {
			data["merchant_order_id"] = merchantOrderID
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
func (g *PakasirGateway) GetTransactionStatus(orderId string) (interface{}, error) {
	if g.APIKey == "" {
		return nil, fmt.Errorf("payment gateway not configured")
	}

	client := &http.Client{Timeout: 30 * time.Second}
	url := fmt.Sprintf("%s/payments/%s", g.APIURL, orderId)
	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+g.APIKey)

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
				// Payment record doesn't exist in DB yet - this shouldn't happen
				// but we'll log it and skip the update
				log.Printf("Warning: Payment record not found in database for order_id=%s", orderId)
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

		return data, nil
	}

	return nil, fmt.Errorf("transaction not found")
}

// HandleCallback processes payment callback from Pakasir
// Callback format (similar to Tripay and Iskapay):
// {
//   "event": "payment.paid|payment.failed|payment.expired",
//   "data": {
//     "merchant_order_id": "INV-xxx",
//     "amount": 50000,
//     "status": "paid",
//     "paid_at": "2025-01-10T09:00:00Z"
//   }
// }
func (g *PakasirGateway) HandleCallback(payload []byte, headers map[string]string) error {
	var callbackPayload map[string]interface{}
	if err := json.Unmarshal(payload, &callbackPayload); err != nil {
		return fmt.Errorf("invalid JSON payload: %v", err)
	}

	// Extract event type and payment data
	event, _ := callbackPayload["event"].(string)

	// Try to get payment data from different possible structures
	var paymentData map[string]interface{}
	var ok bool

	// Try "data" field first
	if paymentData, ok = callbackPayload["data"].(map[string]interface{}); !ok {
		// Try "payment" field (Iskapay style)
		if paymentData, ok = callbackPayload["payment"].(map[string]interface{}); !ok {
			// If no nested structure, use the root payload (Tripay style)
			paymentData = callbackPayload
		}
	}

	// Extract payment details
	merchantOrderID := ""
	if id, ok := paymentData["merchant_order_id"].(string); ok {
		merchantOrderID = id
	} else if id, ok := paymentData["order_id"].(string); ok {
		merchantOrderID = id
	} else if id, ok := paymentData["reference"].(string); ok {
		merchantOrderID = id
	}

	paymentStatus, _ := paymentData["status"].(string)
	amount, _ := paymentData["amount"].(float64)
	paidAtStr, _ := paymentData["paid_at"].(string)

	log.Printf("Pakasir Callback: event=%s, merchant_order_id=%s, status=%s, amount=%.0f, timestamp=%s",
		event, merchantOrderID, paymentStatus, amount, time.Now().Format(time.RFC3339))

	if merchantOrderID == "" {
		return fmt.Errorf("merchant_order_id not found in callback")
	}

	// Process based on event type or status
	if event == "payment.paid" || event == "payment.completed" || paymentStatus == "paid" || paymentStatus == "completed" || paymentStatus == "success" {
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
