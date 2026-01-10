# Pakasir Integration Guide

## Overview

Pakasir is a QRIS-only payment gateway that has been integrated into the Shiroine payment backend. Similar to Iskapay, it focuses solely on QRIS payments but includes callback support similar to Tripay.

## Configuration

Add the following to your `.env` file:

```env
# Choose payment gateway: "tripay", "iskapay", or "pakasir"
PAYMENT_GATEWAY=pakasir

# Pakasir API Configuration
PAKASIR_API_KEY=your_pakasir_api_key_here
```

## API Implementation

The Pakasir implementation follows the same PaymentGateway interface as Tripay and Iskapay, ensuring consistency across all payment providers.

### API Endpoints

Based on typical QRIS payment gateway patterns:

#### Create Payment
- **Method**: POST
- **Endpoint**: `/v1/payments`
- **Headers**:
  - `Authorization: Bearer {API_KEY}`
  - `Content-Type: application/json`
- **Request Body**:
```json
{
  "amount": 10000,
  "customer_name": "Customer Name",
  "customer_email": "customer@example.com",
  "customer_phone": "628123456789",
  "description": "Premium subscription",
  "callback_url": "https://yourdomain.com/callback"
}
```

#### Get Payment Status
- **Method**: GET
- **Endpoint**: `/v1/payments/{order_id}`
- **Headers**:
  - `Authorization: Bearer {API_KEY}`

## Features

### QRIS-Only Payment
Pakasir supports only QRIS payment method, making it simple and straightforward for Indonesian users.

### Callback Support
Unlike Iskapay which requires polling, Pakasir provides webhook callbacks similar to Tripay:

- Callback URL is configured during transaction creation
- Callbacks are sent to `/callback` endpoint
- Multiple event types are supported

## Callback Handling

Pakasir sends callbacks with the following structure:

```json
{
  "event": "payment.paid",
  "data": {
    "merchant_order_id": "INV-1-20260110-ABCD",
    "amount": 50000,
    "status": "paid",
    "paid_at": "2026-01-10T09:00:00Z"
  }
}
```

### Supported Event Types

The implementation handles the following event types:

- **`payment.paid` / `payment.completed`**: Payment successful → Premium activated, status set to `PAID`
- **`payment.failed`**: Payment failed → Status set to `FAILED`
- **`payment.expired`**: Payment expired → Status set to `EXPIRED`
- **`payment.cancelled`**: Payment cancelled → Status set to `CANCELLED`

### Callback Processing

1. Extract `event` type from callback payload
2. Extract `merchant_order_id` (or `order_id`, or `reference`) to identify the transaction
3. Process based on event type:
   - For successful payment: Update status, record `paid_at`, activate premium
   - For other events: Update status accordingly

### Callback Endpoint Configuration

Configure your Pakasir webhook to point to:
```
https://your-domain.com/callback
```

This is the same endpoint used by Tripay, allowing unified callback handling.

## Architecture

The implementation follows the PaymentGateway interface:

```go
type PaymentGateway interface {
    GetName() string
    GetPaymentChannels() (interface{}, error)
    CreateTransaction(req CreateTransactionRequest) (interface{}, error)
    GetTransactionStatus(reference string) (interface{}, error)
    HandleCallback(payload []byte, headers map[string]string) error
    Initialize(db *sql.DB)
}
```

### Pakasir Specifics

- **`GetPaymentChannels()`**: Returns a fixed QRIS channel (no API call needed)
- **`CreateTransaction()`**: POST to `/v1/payments` with callback URL
- **`GetTransactionStatus()`**: GET to `/v1/payments/{order_id}`
- **`HandleCallback()`**: Handles webhook callbacks with flexible payload structure

## Differences from Tripay and Iskapay

| Feature | Tripay | Iskapay | Pakasir |
|---------|--------|---------|---------|
| Payment Methods | Multiple (VA, E-Wallet, Retail) | QRIS only | QRIS only |
| Payment Channels API | Required | Not needed | Not needed |
| Callback Support | ✅ Yes | ❌ No | ✅ Yes |
| Signature Verification | HMAC-SHA256 | TBD | TBD |
| Callback Endpoint | `/callback` | N/A | `/callback` |

## Transaction Flow

### 1. Create Payment
```go
transactionData := map[string]interface{}{
    "amount":        10000,
    "customer_name": "John Doe",
    "customer_email": "noreply@example.com",
    "customer_phone": "628123456789",
    "description":   "Premium subscription",
    "callback_url":  "https://yourdomain.com/callback",
}
```

### 2. Display QRIS
The API returns payment details including:
- `merchant_order_id`: Transaction reference
- `payment_url` or `qr_url`: URL for QRIS payment
- `checkout_url`: Redirect URL for payment page

### 3. Receive Callback
When payment is completed, Pakasir sends a callback:
```json
{
  "event": "payment.paid",
  "data": {
    "merchant_order_id": "INV-xxx",
    "status": "paid",
    "paid_at": "2026-01-10T09:30:00Z"
  }
}
```

### 4. Activate Premium
The callback handler automatically:
1. Updates payment status in database
2. Records `paid_at` timestamp
3. Calls `activatePremium()` to grant user/group premium access

## Status Mapping

Pakasir statuses are mapped to internal statuses:

| Pakasir Status | Internal Status |
|----------------|-----------------|
| `pending` | `UNPAID` |
| `paid`, `completed`, `success` | `PAID` |
| `failed` | `FAILED` |
| `expired` | `EXPIRED` |
| `cancelled` | `CANCELLED` |

## Database Integration

Transactions are saved to the `payment_history` table:

```sql
INSERT INTO payment_history 
(reference, merchant_ref, phone_number, group_id, customer_name, 
 method, amount, status, order_items, created_at)
VALUES (?, ?, ?, ?, ?, 'QRIS', ?, 'UNPAID', ?, NOW())
```

Status updates are performed via callbacks:

```sql
UPDATE payment_history 
SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
WHERE reference = ? OR merchant_ref = ?
```

## Testing

### Development Setup

1. Add Pakasir API key to `.env`:
```env
PAYMENT_GATEWAY=pakasir
PAKASIR_API_KEY=your_pakasir_api_key_here
```

2. Start the backend server:
```bash
cd backend
go run .
```

3. Test payment creation:
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

### Callback Testing

Test the callback endpoint:

```bash
curl -X POST http://localhost:3001/callback \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.paid",
    "data": {
      "merchant_order_id": "TEST-123",
      "amount": 10000,
      "status": "paid",
      "paid_at": "2026-01-10T09:30:00Z"
    }
  }'
```

## Troubleshooting

### Common Issues

#### 1. API Connection Failed
- Verify API key is correct
- Check API endpoint URL (default: `https://api.pakasir.com/v1`)
- Ensure network connectivity to Pakasir servers

#### 2. Callback Not Received
- Verify callback URL is publicly accessible
- Check webhook configuration in Pakasir dashboard
- Review server logs for callback attempts

#### 3. Status Not Updating
- Check database connection
- Verify `merchant_order_id` matches database records
- Review callback payload structure in logs

### Debugging

Enable detailed logging by checking server logs:

```
Pakasir Callback: event=payment.paid, merchant_order_id=INV-123, 
status=paid, amount=10000, timestamp=2026-01-10T09:30:00Z
```

## Security Considerations

1. **API Key Protection**: Store API key in environment variables, never commit to code
2. **Callback Validation**: Verify callback source (implement signature validation if provided by Pakasir)
3. **HTTPS Only**: Use HTTPS for callback endpoints in production
4. **Database Security**: Use parameterized queries to prevent SQL injection

## Support

For Pakasir-specific issues:
- Pakasir Documentation: https://pakasir.com/p/docs
- API Support: Contact Pakasir support team

## Next Steps

1. ✅ Implement PaymentGateway interface
2. ✅ Create Pakasir client with callback support
3. ✅ Handle callbacks and premium activation
4. ⏳ Verify API endpoint URL with Pakasir documentation
5. ⏳ Test with real API key
6. ⏳ Validate QRIS payment flow end-to-end
7. ⏳ Implement signature verification if provided by Pakasir

## Migration from Other Gateways

### From Tripay
Change environment variable:
```env
# Before
PAYMENT_GATEWAY=tripay

# After
PAYMENT_GATEWAY=pakasir
PAKASIR_API_KEY=your_key_here
```

### From Iskapay
Change environment variable:
```env
# Before
PAYMENT_GATEWAY=iskapay

# After
PAYMENT_GATEWAY=pakasir
PAKASIR_API_KEY=your_key_here
```

All existing payment flows will continue to work seamlessly.
