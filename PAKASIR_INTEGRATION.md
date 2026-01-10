# Pakasir Integration Guide

## Overview

Pakasir is a payment gateway that supports QRIS, Virtual Account, and PayPal payments. It has been integrated into the Shiroine payment backend with full support for multiple payment methods.

## Configuration

Add the following to your `.env` file:

```env
# Choose payment gateway: "tripay", "iskapay", or "pakasir"
PAYMENT_GATEWAY=pakasir

# Pakasir API Configuration
PAKASIR_MODE=sandbox          # or "production"
PAKASIR_API_KEY=your_pakasir_api_key_here
PAKASIR_SLUG=your_project_slug_here
```

## Features

### Multiple Payment Methods
Pakasir supports various payment methods:
- **QRIS**: Scan QR code for payment via various e-wallets
- **Virtual Account**: Bank transfer via virtual account (BNI, BRI, CIMB Niaga, Permata, etc.)
- **PayPal**: International payment via PayPal

### Sandbox Mode
Set `PAKASIR_MODE=sandbox` for testing without real payments.

## API Implementation

The Pakasir implementation follows two integration methods based on the official documentation:

### 1. API Integration (for QRIS and Virtual Account)
Uses Pakasir API endpoint: `POST /api/transactioncreate/{method}`

Supported methods:
- `qris` - QRIS payment
- `bni_va` - BNI Virtual Account
- `bri_va` - BRI Virtual Account
- `cimb_niaga_va` - CIMB Niaga Virtual Account
- `permata_va` - Permata Virtual Account
- `sampoerna_va` - Sampoerna Virtual Account
- `bnc_va` - BNC Virtual Account
- `maybank_va` - Maybank Virtual Account
- `atm_bersama_va` - ATM Bersama Virtual Account
- `artha_graha_va` - Artha Graha Virtual Account

### 2. URL Integration (for PayPal and others)
Uses Pakasir URL format: `https://app.pakasir.com/pay/{slug}/{amount}?order_id={order_id}`

For PayPal: `https://app.pakasir.com/paypal/{slug}/{amount}?order_id={order_id}`

## Webhook Handling

Pakasir sends webhooks with the following structure:

```json
{
  "amount": 22000,
  "order_id": "240910HDE7C9",
  "project": "depodomain",
  "status": "completed",
  "payment_method": "qris",
  "completed_at": "2024-09-10T08:07:02.819+07:00"
}
```

### Webhook Configuration

Configure your Pakasir webhook to point to:
```
https://your-domain.com/callback
```

## Transaction Flow

### 1. Create Payment
```go
transactionData := map[string]interface{}{
    "project":  "your_slug",
    "order_id": "INV-xxx",
    "amount":   10000,
    "api_key":  "your_api_key",
}
```

### 2. Display QR Code or Payment Details
For QRIS: Display QR code directly on payment page
For VA: Display virtual account number
For PayPal: Redirect to PayPal checkout

### 3. Receive Webhook
When payment is completed, Pakasir sends a webhook automatically.

### 4. Activate Premium
The callback handler automatically activates premium for successful payments.

## Status Mapping

| Pakasir Status | Internal Status |
|----------------|-----------------|
| `pending` | `UNPAID` |
| `paid`, `completed`, `success` | `PAID` |
| `failed` | `FAILED` |
| `expired` | `EXPIRED` |
| `cancelled` | `CANCELLED` |

## Testing

### Development Setup

1. Get sandbox credentials from https://app.pakasir.com
2. Add to `.env`:
```env
PAYMENT_GATEWAY=pakasir
PAKASIR_MODE=sandbox
PAKASIR_API_KEY=your_sandbox_api_key
PAKASIR_SLUG=your_project_slug
```

3. Start the backend server:
```bash
cd backend
go run .
```

4. Test payment creation:
```bash
curl -X POST http://localhost:3001/api/create-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "method": "QRIS",
    "amount": 10000,
    "customerPhone": "628123456789",
    "orderItems": [{"name": "Test Premium", "price": 10000, "quantity": 1}]
  }'
```

### Payment Simulation (Sandbox Mode)

In sandbox mode, you can simulate payments:

```bash
curl -L 'https://app.pakasir.com/api/paymentsimulation' \
  -H 'Content-Type: application/json' \
  -d '{
    "project": "your_slug",
    "order_id": "INV-xxx",
    "amount": 10000,
    "api_key": "your_api_key"
  }'
```

## Migration from Other Gateways

### From Tripay
```env
# Before
PAYMENT_GATEWAY=tripay

# After
PAYMENT_GATEWAY=pakasir
PAKASIR_MODE=sandbox
PAKASIR_API_KEY=your_key
PAKASIR_SLUG=your_slug
```

### From Iskapay
```env
# Before
PAYMENT_GATEWAY=iskapay

# After
PAYMENT_GATEWAY=pakasir
PAKASIR_MODE=sandbox
PAKASIR_API_KEY=your_key
PAKASIR_SLUG=your_slug
```

All existing payment flows will continue to work seamlessly.

## References

- Pakasir Documentation: https://app.pakasir.com/p/docs
- Node.js SDK: https://github.com/zeative/pakasir-sdk
