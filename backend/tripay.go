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
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// TripayGateway implements the PaymentGateway interface for Tripay
type TripayGateway struct {
	APIKey       string
	PrivateKey   string
	MerchantCode string
	Mode         string
	APIURL       string
	db           *sql.DB
}

// NewTripayGateway creates a new Tripay gateway instance
func NewTripayGateway() *TripayGateway {
	gateway := &TripayGateway{
		APIKey:       os.Getenv("TRIPAY_API_KEY"),
		PrivateKey:   os.Getenv("TRIPAY_PRIVATE_KEY"),
		MerchantCode: os.Getenv("TRIPAY_MERCHANT_CODE"),
		Mode:         os.Getenv("TRIPAY_MODE"),
	}

	if gateway.Mode == "" {
		gateway.Mode = "sandbox"
	}

	if gateway.Mode == "production" {
		gateway.APIURL = "https://tripay.co.id/api"
	} else {
		gateway.APIURL = "https://tripay.co.id/api-sandbox"
	}

	return gateway
}

// GetName returns the name of the payment gateway
func (g *TripayGateway) GetName() string {
	return "tripay"
}

// Initialize sets up the gateway with database connection
func (g *TripayGateway) Initialize(db *sql.DB) {
	g.db = db
}

// GetPaymentChannels fetches available payment channels from Tripay
func (g *TripayGateway) GetPaymentChannels() (interface{}, error) {
	if g.APIKey == "" {
		return nil, fmt.Errorf("payment gateway not configured")
	}

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", g.APIURL+"/merchant/payment-channel", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+g.APIKey)

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch payment channels: %v", err)
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
		return activeChannels, nil
	}

	return result, nil
}

// generateSignature generates Tripay signature for transaction creation
func (g *TripayGateway) generateSignature(merchantRef string, amount int) string {
	data := g.MerchantCode + merchantRef + strconv.Itoa(amount)
	h := hmac.New(sha256.New, []byte(g.PrivateKey))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

// verifyCallbackSignature verifies the callback signature from Tripay
func (g *TripayGateway) verifyCallbackSignature(callbackSignature string, payload []byte) bool {
	h := hmac.New(sha256.New, []byte(g.PrivateKey))
	h.Write(payload)
	generatedSignature := hex.EncodeToString(h.Sum(nil))
	return callbackSignature == generatedSignature
}

// CreateTransaction creates a new payment transaction with Tripay
func (g *TripayGateway) CreateTransaction(req CreateTransactionRequest) (interface{}, error) {
	// Validate required fields
	if req.Method == "" || req.Amount == 0 || req.OrderItems == nil {
		return nil, fmt.Errorf("missing required fields")
	}

	// Require either phone or group ID
	if req.CustomerPhone == "" && req.GroupID == "" {
		return nil, fmt.Errorf("either phone number or group ID is required")
	}

	if g.APIKey == "" || g.PrivateKey == "" || g.MerchantCode == "" {
		return nil, fmt.Errorf("payment gateway not configured properly")
	}

	// Generate unique merchant reference
	merchantRef := fmt.Sprintf("PREMIUM-%d-%s", time.Now().UnixMilli(), randomString(7))

	// Generate signature
	signature := g.generateSignature(merchantRef, req.Amount)

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
		"method":         req.Method,
		"merchant_ref":   merchantRef,
		"amount":         req.Amount,
		"customer_name":  customerName,
		"customer_email": fmt.Sprintf("noreply@%s", domain),
		"customer_phone": req.CustomerPhone,
		"order_items":    req.OrderItems,
		"return_url":     returnURL,
		"expired_time":   time.Now().Unix() + (24 * 60 * 60), // 24 hours
		"signature":      signature,
	}

	jsonData, err := json.Marshal(transactionData)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction data: %v", err)
	}

	// Create transaction with Tripay
	client := &http.Client{Timeout: 30 * time.Second}
	httpReq, err := http.NewRequest("POST", g.APIURL+"/transaction/create", strings.NewReader(string(jsonData)))
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

	if success, ok := result["success"].(bool); ok && success {
		if paymentData, ok := result["data"].(map[string]interface{}); ok {
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

				_, err := g.db.Exec(`
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

			// Add merchant_order_id for consistency with Iskapay
			// For Tripay, use the reference as merchant_order_id
			if reference, ok := paymentData["reference"].(string); ok {
				paymentData["merchant_order_id"] = reference
			}

			return paymentData, nil
		}
	}

	message := "Failed to create transaction"
	if msg, ok := result["message"].(string); ok {
		message = msg
	}
	return nil, fmt.Errorf(message)
}

// GetTransactionStatus retrieves the status of a transaction
func (g *TripayGateway) GetTransactionStatus(reference string) (interface{}, error) {
	if g.APIKey == "" {
		return nil, fmt.Errorf("payment gateway not configured")
	}

	client := &http.Client{Timeout: 30 * time.Second}
	url := fmt.Sprintf("%s/transaction/detail?reference=%s", g.APIURL, reference)
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

	if success, ok := result["success"].(bool); ok && success {
		if data, ok := result["data"].(map[string]interface{}); ok {
			// Update transaction status in database
			if g.db != nil && data["status"] != nil {
				status := data["status"].(string)
				_, err := g.db.Exec(`
					UPDATE payment_history 
					SET status = $1, updated_at = $2
					WHERE reference = $3
				`, status, time.Now(), reference)
				if err != nil {
					log.Printf("Failed to update transaction status: %v", err)
				}
			}

			// Add merchant_order_id for consistency with Iskapay
			// For Tripay, use the reference as merchant_order_id
			if ref, ok := data["reference"].(string); ok {
				data["merchant_order_id"] = ref
			}

			return data, nil
		}
	}

	return nil, fmt.Errorf("transaction not found")
}

// HandleCallback processes payment callback from Tripay
func (g *TripayGateway) HandleCallback(payload []byte, headers map[string]string) error {
	callbackSignature := headers["x-callback-signature"]

	// Verify signature
	if !g.verifyCallbackSignature(callbackSignature, payload) {
		return fmt.Errorf("invalid signature")
	}

	var callbackPayload map[string]interface{}
	if err := json.Unmarshal(payload, &callbackPayload); err != nil {
		return fmt.Errorf("invalid JSON payload: %v", err)
	}

	// Process callback based on payment status
	reference := callbackPayload["reference"]
	status := callbackPayload["status"]
	merchantRef := callbackPayload["merchant_ref"]
	amount := callbackPayload["amount"]

	log.Printf("Tripay Callback: reference=%v, status=%v, merchant_ref=%v, amount=%v, timestamp=%s",
		reference, status, merchantRef, amount, time.Now().Format(time.RFC3339))

	if status == "PAID" {
		log.Printf("Payment successful for reference: %v", reference)

		// Update payment_history table
		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, paid_at = $2, updated_at = $3
				WHERE reference = $4
			`, status, time.Now(), time.Now(), reference)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}

			// Activate premium
			if refStr, ok := reference.(string); ok {
				if err := activatePremium(g.db, refStr); err != nil {
					log.Printf("Failed to activate premium: %v", err)
				}
			}
		}
	} else if status == "EXPIRED" || status == "FAILED" {
		log.Printf("Payment %v for reference: %v", status, reference)

		// Update payment_history table
		if g.db != nil {
			_, err := g.db.Exec(`
				UPDATE payment_history 
				SET status = $1, updated_at = $2
				WHERE reference = $3
			`, status, time.Now(), reference)
			if err != nil {
				log.Printf("Failed to update payment history: %v", err)
			}
		}
	}

	return nil
}
