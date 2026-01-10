package main

import (
	"database/sql"
)

// PaymentGateway defines the interface that all payment gateways must implement
type PaymentGateway interface {
	// GetName returns the name of the payment gateway
	GetName() string

	// GetPaymentChannels returns available payment channels (may be empty for QRIS-only gateways)
	GetPaymentChannels() (interface{}, error)

	// CreateTransaction creates a new payment transaction
	CreateTransaction(req CreateTransactionRequest) (interface{}, error)

	// GetTransactionStatus retrieves the status of a transaction by reference
	GetTransactionStatus(reference string) (interface{}, error)

	// HandleCallback processes payment callback/webhook
	HandleCallback(payload []byte, headers map[string]string) error

	// Initialize sets up the gateway with database connection
	Initialize(db *sql.DB)
}

// PaymentGatewayFactory creates the appropriate payment gateway based on configuration
func PaymentGatewayFactory(gatewayType string) PaymentGateway {
	switch gatewayType {
	case "iskapay":
		return NewIskapayGateway()
	case "tripay":
		return NewTripayGateway()
	case "pakasir":
		return NewPakasirGateway()
	default:
		// Default to Tripay for backward compatibility
		return NewTripayGateway()
	}
}
