# Pakasir Integration Testing Guide

This document provides steps to test the Pakasir payment gateway integration.

## Prerequisites

1. Pakasir account with sandbox access
2. Project slug and API key from Pakasir dashboard
3. PostgreSQL database configured

## Configuration

Add to `backend/.env`:

```env
PAYMENT_GATEWAY=pakasir
PAKASIR_MODE=sandbox
PAKASIR_API_KEY=your_sandbox_api_key_here
PAKASIR_SLUG=your_project_slug_here
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=shiroine_db
DOMAIN=localhost:3000
```

## Test Cases

### Test 1: Payment Channels API

**Objective**: Verify that all payment methods are returned

**Steps**:
1. Start backend: `cd backend && go run .`
2. Call API:
```bash
curl http://localhost:3001/api/payment-channels
```

**Expected Result**:
- QRIS method
- 10 Virtual Account methods (BNI, BRI, CIMB Niaga, Permata, etc.)
- PayPal method

### Test 2: QRIS Payment Creation

**Objective**: Create a QRIS payment and verify QR code display

**Steps**:
1. Create transaction:
```bash
curl -X POST http://localhost:3001/api/create-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "method": "QRIS",
    "amount": 10000,
    "customerPhone": "628123456789",
    "customerName": "Test User",
    "orderItems": [{"name": "Premium 5 Days", "price": 10000, "quantity": 1}]
  }'
```

2. Note the `merchant_order_id` from response
3. Open browser to: `http://localhost:3000/pay/{merchant_order_id}`
4. Verify QR code is displayed directly on the page
5. No redirect button should be shown

**Expected Result**:
- Transaction created successfully
- Response includes `payment_number` with QR string
- Payment page shows QR code directly
- No external redirect

### Test 3: Virtual Account Payment Creation

**Objective**: Create a VA payment and verify account number display

**Steps**:
1. Create transaction:
```bash
curl -X POST http://localhost:3001/api/create-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "method": "BNI_VA",
    "amount": 15000,
    "customerPhone": "628123456789",
    "customerName": "Test User",
    "orderItems": [{"name": "Premium 7 Days", "price": 15000, "quantity": 1}]
  }'
```

2. Note the `merchant_order_id` from response
3. Open browser to: `http://localhost:3000/pay/{merchant_order_id}`
4. Verify Virtual Account number is displayed
5. Copy button should be present

**Expected Result**:
- Transaction created successfully
- Response includes `payment_number` with VA number
- Payment page shows VA number with copy button
- Instructions for payment are shown
- No external redirect

### Test 4: PayPal Payment Creation

**Objective**: Create a PayPal payment and verify redirect URL

**Steps**:
1. Create transaction:
```bash
curl -X POST http://localhost:3001/api/create-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "method": "PAYPAL",
    "amount": 50000,
    "customerPhone": "628123456789",
    "customerName": "Test User",
    "orderItems": [{"name": "Premium 30 Days", "price": 50000, "quantity": 1}]
  }'
```

2. Note the `merchant_order_id` from response
3. Open browser to: `http://localhost:3000/pay/{merchant_order_id}`
4. Click the "Pay Now" button
5. Verify it opens Pakasir PayPal checkout in new tab

**Expected Result**:
- Transaction created successfully
- Response includes `checkout_url` pointing to Pakasir PayPal endpoint
- Payment page shows "Pay Now" button
- Button opens PayPal checkout in new window

### Test 5: Sandbox Payment Simulation

**Objective**: Simulate successful payment in sandbox mode

**Steps**:
1. Create a QRIS transaction (as in Test 2)
2. Simulate payment:
```bash
curl -L 'https://app.pakasir.com/api/paymentsimulation' \
  -H 'Content-Type: application/json' \
  -d '{
    "project": "your_slug",
    "order_id": "{merchant_order_id}",
    "amount": 10000,
    "api_key": "your_api_key"
  }'
```

3. Check payment status:
```bash
curl http://localhost:3001/api/transaction-status/{merchant_order_id}
```

4. Verify webhook was received (check backend logs)

**Expected Result**:
- Payment simulation succeeds
- Webhook callback received
- Database status updated to PAID
- Premium activated for user/group

### Test 6: Transaction Status Polling

**Objective**: Verify payment page polls for status updates

**Steps**:
1. Create a QRIS transaction
2. Open payment page in browser
3. Wait and observe the status updates (every 10 seconds)
4. Simulate payment (as in Test 5)
5. Verify status changes to "Paid" automatically

**Expected Result**:
- Status updates every 10 seconds
- "Status updates automatically every 10 seconds" message shown
- When payment is completed, status changes to "Paid"
- Success message and premium activation details shown

### Test 7: Frontend Integration

**Objective**: Test full payment flow from pricing page

**Steps**:
1. Start frontend: `npm start`
2. Navigate to pricing page
3. Select a plan and click "Choose Plan"
4. Enter WhatsApp number and verify
5. Select QRIS payment method
6. Click "Proceed to Payment"
7. Verify redirected to `/pay/{invoiceId}`
8. Verify QR code displayed directly

**Expected Result**:
- Smooth flow from pricing to payment
- No external redirect for QRIS
- QR code displayed on internal payment page
- Auto-polling for payment status

## Webhook Testing

### Local Webhook Testing (using ngrok)

1. Install ngrok: `https://ngrok.com/download`
2. Start ngrok tunnel:
```bash
ngrok http 3001
```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update Pakasir project webhook URL to: `https://abc123.ngrok.io/callback`
5. Create a transaction and make payment
6. Verify webhook received in backend logs

## Troubleshooting

### Issue: "Payment gateway not configured properly"
- Check PAKASIR_API_KEY is set
- Check PAKASIR_SLUG is set
- Verify credentials are correct

### Issue: "Transaction not found in database"
- Verify database is running
- Check database connection parameters
- Check payment_history table exists

### Issue: QR code not displayed
- Check response includes `payment_number` or `qr_code`
- Verify payment method is QRIS
- Check browser console for errors

### Issue: Webhook not received
- Verify webhook URL is publicly accessible
- Check ngrok tunnel is running
- Verify webhook URL in Pakasir dashboard
- Check backend logs for errors

## Success Criteria

- ✅ All payment methods are available
- ✅ QRIS shows QR code directly (no redirect)
- ✅ VA shows account number with copy button
- ✅ PayPal shows redirect button
- ✅ Payment status updates automatically
- ✅ Webhooks are processed correctly
- ✅ Premium is activated on successful payment
- ✅ Sandbox mode works for testing
