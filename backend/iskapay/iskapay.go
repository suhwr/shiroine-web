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
		APIURL: "https://wallet.iskapay.com/api",
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

	// Prepare transaction data for Iskapay
	// Based on the JavaScript example: createPayment({ amount, paymentMethod, customerName })
	transactionData := map[string]interface{}{
		"amount":        req.Amount,
		"paymentMethod": "qris", // Iskapay only supports QRIS
		"customerName":  customerName,
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

		return data, nil
	}

	message := "Failed to create transaction"
	if msg, ok := result["message"].(string); ok {
		message = msg
	}
	return nil, fmt.Errorf(message)
}

// GetTransactionStatus retrieves the status of a transaction
// Based on the JavaScript example: getPayment(orderId)
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

	if data, ok := result["data"].(map[string]interface{}); ok {
		// Update transaction status in database
		if g.db != nil && data["status"] != nil {
			status := data["status"].(string)
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3 OR merchant_ref = $3
			`, status, time.Now(), orderId)
			if err != nil {
				log.Printf("Failed to update transaction status: %v", err)
			}
		}

		return data, nil
	}

	return nil, fmt.Errorf("transaction not found")
}

// HandleCallback processes payment callback from Iskapay
func (g *IskapayGateway) HandleCallback(payload []byte, headers map[string]string) error {
	var callbackPayload map[string]interface{}
	if err := json.Unmarshal(payload, &callbackPayload); err != nil {
		return fmt.Errorf("invalid JSON payload: %v", err)
	}

	// Process callback based on payment status
	// Extract merchant_order_id from the callback
	orderId := callbackPayload["merchant_order_id"]
	if orderId == nil {
		orderId = callbackPayload["order_id"]
	}
	status := callbackPayload["status"]

	log.Printf("Iskapay Callback: order_id=%v, status=%v, timestamp=%s",
		orderId, status, time.Now().Format(time.RFC3339))

	// Map Iskapay status to our internal status
	// Common statuses: PAID, PENDING, EXPIRED, FAILED, SUCCESS
	if status == "PAID" || status == "SUCCESS" || status == "paid" || status == "success" {
		log.Printf("Payment successful for order_id: %v", orderId)

		// Update payment_history table
		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, paid_at = $2, updated_at = $3
				WHERE reference = $4 OR merchant_ref = $4
			`, "PAID", time.Now(), time.Now(), orderId)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}

			// Activate premium
			if err := activatePremium(g.db, fmt.Sprintf("%v", orderId)); err != nil {
				log.Printf("Failed to activate premium: %v", err)
			}
		}
	} else if status == "EXPIRED" || status == "FAILED" || status == "expired" || status == "failed" {
		log.Printf("Payment %v for order_id: %v", status, orderId)

		// Update payment_history table
		if g.db != nil {
			statusUpper := strings.ToUpper(fmt.Sprintf("%v", status))
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3 OR merchant_ref = $3
			`, statusUpper, time.Now(), orderId)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}
		}
	}

	return nil
}
