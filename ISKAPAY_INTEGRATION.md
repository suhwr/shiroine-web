# Iskapay Integration Guide

## Overview

Iskapay is a QRIS-only payment gateway that has been integrated into the Shiroine payment backend. Unlike Tripay which supports multiple payment methods, Iskapay focuses solely on QRIS payments.

## Configuration

Add the following to your `.env` file:

```env
# Choose payment gateway: "tripay" or "iskapay"
PAYMENT_GATEWAY=iskapay

# Iskapay API Configuration
ISKAPAY_API_KEY=your_iskapay_api_key_here
```

## API Implementation

Based on the JavaScript example provided:

```javascript
const client = new Iskapay('isk_your_api_key_here');

// Create payment
const payment = await client.createPayment({
  amount: 50000,
  paymentMethod: 'qris',
  customerName: 'John Doe'
});
```

The Go implementation mirrors this structure:

```go
transactionData := map[string]interface{}{
    "amount":        req.Amount,
    "paymentMethod": "qris",
    "customerName":  customerName,
}
```

## API Endpoints

### Create Payment
- **Method**: POST
- **Endpoint**: `/api/payments`
- **Headers**:
  - `Authorization: Bearer {API_KEY}`
  - `Content-Type: application/json`
- **Request Body**:
```json
{
  "amount": 10000,
  "paymentMethod": "qris",
  "customerName": "Customer Name"
}
```

### Get Payment Status
- **Method**: GET
- **Endpoint**: `/api/payments/{merchant_order_id}`
- **Headers**:
  - `Authorization: Bearer {API_KEY}`

## Testing

### Test API Key
For testing purposes, use the provided API key:
```
isk_i2hv3oQRdUmF38qM3rBl52I02b9DUeFQ
```

### Testing Notes

**Important**: During testing, the Iskapay API domain `wallet.iskapay.com` could not be resolved. This may indicate:

1. The API endpoint URL needs verification
2. The service requires VPN or specific network access
3. The domain structure is different (e.g., `api.iskapay.com`)

**Action Required**: Please verify the correct API endpoint URL for Iskapay.

## Differences from Tripay

| Feature | Tripay | Iskapay |
|---------|--------|---------|
| Payment Methods | Multiple (VA, E-Wallet, Retail) | QRIS only |
| Payment Channels API | Required (`GET /merchant/payment-channel`) | Not needed |
| Signature Verification | HMAC-SHA256 with private key | TBD (not in basic example) |
| Transaction Creation | Complex with signature | Simplified API |

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

### Iskapay Specifics

- `GetPaymentChannels()`: Returns a fixed QRIS channel (no API call needed)
- `CreateTransaction()`: Simple POST to `/payments`
- `GetTransactionStatus()`: GET to `/payments/{order_id}`
- `HandleCallback()`: Handles webhook callbacks with `merchant_order_id`

## Callback Handling

Iskapay callbacks are expected to include:
```json
{
  "merchant_order_id": "...",
  "order_id": "...",
  "status": "paid|pending|expired|failed"
}
```

Status mapping:
- `PAID`, `SUCCESS`, `paid`, `success` → Premium activated
- `EXPIRED`, `FAILED`, `expired`, `failed` → Transaction marked as failed

## Troubleshooting

### API Connection Issues

If you encounter connection issues:

1. Verify the API key is correct
2. Check the API endpoint URL
3. Ensure network access to Iskapay servers
4. Review Iskapay documentation for any IP whitelisting requirements

### Debugging

Enable detailed logging by checking server logs for:
```
Iskapay Callback: order_id=..., status=..., timestamp=...
```

## Next Steps

1. ✅ Implement PaymentGateway interface
2. ✅ Create Iskapay client
3. ✅ Handle callbacks and premium activation
4. ⚠️ **Verify API endpoint URL** (current: `https://wallet.iskapay.com/api`)
5. ⏳ Test with real API key
6. ⏳ Validate QRIS payment flow end-to-end

## Support

For Iskapay-specific issues:
- Iskapay Documentation: Check official docs
- API Support: Contact Iskapay support team
