# Testing Guide for Payment Flow Changes

## Overview

This document provides a comprehensive testing guide for the new payment flow implementation that supports both Iskapay and Tripay payment gateways.

## Prerequisites

### Backend Setup

1. Ensure backend environment variables are configured:
```bash
# For Iskapay
PAYMENT_GATEWAY=iskapay
ISKAPAY_API_KEY=your_api_key_here

# For Tripay
PAYMENT_GATEWAY=tripay
TRIPAY_API_KEY=your_api_key_here
TRIPAY_PRIVATE_KEY=your_private_key_here
TRIPAY_MERCHANT_CODE=your_merchant_code_here
TRIPAY_MODE=sandbox  # or production
```

2. Database connection configured:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=shiroine
DB_SSLMODE=disable
```

3. Start backend server:
```bash
cd backend
go run .
```

### Frontend Setup

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Start development server:
```bash
npm start
```

## Test Cases

### 1. Iskapay Payment Flow

#### Test 1.1: Create Iskapay Payment
**Steps**:
1. Navigate to `/pricing`
2. Select a premium plan
3. Click "Buy Now"
4. Verify WhatsApp number or Group ID
5. Select payment method (should show "QRIS" for Iskapay)
6. Click "Proceed Payment"

**Expected Result**:
- Redirected to `/pay/:invoiceId` (not external URL)
- Page loads successfully
- QR code image is displayed
- Timer shows remaining time
- Payment status shows "Menunggu Pembayaran" / "Waiting for Payment"

#### Test 1.2: QR Code Display
**Steps**:
1. Complete Test 1.1
2. Check that QR code image loads

**Expected Result**:
- QR code image displays correctly
- Image is 256x256 pixels
- Image is inside a white rounded container

#### Test 1.3: QR Code Fallback
**Steps**:
1. Complete Test 1.1
2. Open browser DevTools Network tab
3. Block the QR code image URL
4. Refresh the page

**Expected Result**:
- QR code SVG should render instead of image
- SVG QR code should be scannable
- No broken image icon

#### Test 1.4: Payment Status Polling
**Steps**:
1. Complete Test 1.1
2. Open browser DevTools Network tab
3. Watch for API calls to `/api/transaction-status/:invoiceId`

**Expected Result**:
- Initial call made immediately
- Subsequent calls made every 10 seconds
- Calls continue until payment status changes

#### Test 1.5: Payment Success (Simulated)
**Steps**:
1. Complete Test 1.1
2. In database, update payment status to 'PAID':
```sql
UPDATE payment_history 
SET status = 'PAID', paid_at = NOW() 
WHERE merchant_ref = 'your_invoice_id';
```
3. Wait for next polling cycle (max 10 seconds)

**Expected Result**:
- Status updates to "Pembayaran Berhasil!" / "Payment Successful!"
- Green checkmark icon appears
- Success message displays
- Polling stops automatically
- "Kembali ke Beranda" / "Back to Home" button appears

#### Test 1.6: Payment Expiration
**Steps**:
1. Complete Test 1.1
2. Wait for countdown timer to reach 00:00:00

**Expected Result**:
- Timer shows "Kadaluarsa" / "Expired"
- Polling stops automatically
- Status updates to failed/expired
- "Coba Lagi" / "Try Again" button appears

### 2. Tripay Payment Flow

#### Test 2.1: Create Tripay Payment
**Steps**:
1. Change backend to use Tripay (`PAYMENT_GATEWAY=tripay`)
2. Restart backend
3. Navigate to `/pricing`
4. Select a premium plan
5. Click "Buy Now"
6. Verify WhatsApp number or Group ID
7. Select a payment method (e.g., QRIS, BCA, etc.)
8. Click "Proceed Payment"

**Expected Result**:
- Redirected to `/pay/:invoiceId` (not external URL)
- Page loads successfully
- "Bayar Sekarang" / "Pay Now" button displays
- Timer shows remaining time
- Payment status shows "Menunggu Pembayaran" / "Waiting for Payment"

#### Test 2.2: Tripay Checkout Button
**Steps**:
1. Complete Test 2.1
2. Click "Bayar Sekarang" / "Pay Now" button

**Expected Result**:
- New tab/window opens
- Tripay checkout page loads
- Payment details are correct

#### Test 2.3: Tripay Payment Success (Simulated)
**Steps**:
1. Complete Test 2.1
2. In database, update payment status to 'PAID':
```sql
UPDATE payment_history 
SET status = 'PAID', paid_at = NOW() 
WHERE reference = 'your_tripay_reference';
```
3. Wait for next polling cycle (max 10 seconds)

**Expected Result**:
- Status updates to "Pembayaran Berhasil!" / "Payment Successful!"
- Green checkmark icon appears
- Success message displays
- Polling stops automatically

### 3. History Page Tests

#### Test 3.1: View Payment History (Iskapay)
**Steps**:
1. Navigate to `/history`
2. Enter WhatsApp number used for Iskapay payment
3. Select "Nomor WhatsApp" type
4. Click "Cari" / "Search"

**Expected Result**:
- List of Iskapay transactions displays
- Transaction details are correct
- For pending payments, "Lanjutkan Pembayaran" / "Continue Payment" button shows

#### Test 3.2: Continue Iskapay Payment from History
**Steps**:
1. Complete Test 3.1
2. Click "Lanjutkan Pembayaran" / "Continue Payment" on a pending transaction

**Expected Result**:
- Redirected to `/pay/:invoiceId` (NOT Tripay checkout)
- QR code displays for Iskapay payment
- All payment details are correct

#### Test 3.3: View Payment History (Tripay)
**Steps**:
1. Navigate to `/history`
2. Enter WhatsApp number used for Tripay payment
3. Select "Nomor WhatsApp" type
4. Click "Cari" / "Search"

**Expected Result**:
- List of Tripay transactions displays
- Transaction details are correct
- For pending payments, "Lanjutkan Pembayaran" / "Continue Payment" button shows

#### Test 3.4: Continue Tripay Payment from History
**Steps**:
1. Complete Test 3.3
2. Click "Lanjutkan Pembayaran" / "Continue Payment" on a pending transaction

**Expected Result**:
- Redirected to `/pay/:invoiceId` (NOT directly to Tripay)
- "Bayar Sekarang" / "Pay Now" button displays
- All payment details are correct

### 4. Edge Cases

#### Test 4.1: Invalid Invoice ID
**Steps**:
1. Navigate to `/pay/INVALID_ID_12345`

**Expected Result**:
- Error page displays
- Error message: "Data pembayaran tidak ditemukan" / "Payment data not found"
- "Kembali ke Pricing" / "Back to Pricing" button appears

#### Test 4.2: Network Failure During Polling
**Steps**:
1. Create a payment (Iskapay or Tripay)
2. Open browser DevTools Network tab
3. Enable network throttling (Offline)
4. Wait for next polling cycle

**Expected Result**:
- Error logged in console
- Page doesn't crash
- Polling continues after network is restored

#### Test 4.3: Language Toggle
**Steps**:
1. Create a payment
2. Toggle language from ID to EN

**Expected Result**:
- All text updates to English
- Timer continues counting
- Polling continues
- QR code/payment button remains visible

#### Test 4.4: Mobile Responsive
**Steps**:
1. Create a payment
2. Open browser DevTools
3. Toggle device toolbar (mobile view)
4. Test on various screen sizes (320px, 375px, 768px, 1024px)

**Expected Result**:
- Layout adapts to screen size
- QR code remains visible and scannable
- All buttons are accessible
- No horizontal scrolling
- Text remains readable

### 5. Performance Tests

#### Test 5.1: Initial Page Load
**Steps**:
1. Clear browser cache
2. Navigate to `/pay/:invoiceId`
3. Measure page load time in DevTools

**Expected Result**:
- Page loads in < 3 seconds
- No console errors
- All resources load successfully

#### Test 5.2: Polling Performance
**Steps**:
1. Create a payment
2. Leave page open for 5 minutes
3. Check network tab for polling requests

**Expected Result**:
- ~30 polling requests made (1 every 10 seconds)
- Each request completes in < 1 second
- No memory leaks
- CPU usage remains low

#### Test 5.3: Multiple Tabs
**Steps**:
1. Create a payment
2. Open same payment page in multiple tabs
3. Update payment status in database

**Expected Result**:
- All tabs update within 10 seconds
- No duplicate API calls from same tab
- No race conditions

## API Testing

### Test API 1: Transaction Status Endpoint (Iskapay)
```bash
curl -X GET http://localhost:3001/api/transaction-status/INV-1061-20260110101312-EQE6 \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "payment_id": 152011,
    "merchant_order_id": "INV-1061-20260110101312-EQE6",
    "amount": "50000.00",
    "status": "pending",
    "payment_method": "qris",
    "qr_code": "https://pg-iskapay.com/storage/qrcodes/...",
    "expired_at": "2026-01-10T03:43:12.000000Z"
  }
}
```

### Test API 2: Transaction Status Endpoint (Tripay)
```bash
curl -X GET http://localhost:3001/api/transaction-status/T1234567890ABC \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "reference": "T1234567890ABC",
    "merchant_order_id": "T1234567890ABC",
    "merchant_ref": "PREMIUM-1736478792123-ABC1234",
    "method": "QRIS",
    "amount": 50000,
    "status": "UNPAID",
    "checkout_url": "https://tripay.co.id/checkout/T1234567890ABC"
  }
}
```

## Database Validation

### Check Payment History Table
```sql
-- View recent payments
SELECT 
  reference,
  merchant_ref,
  method,
  amount,
  status,
  created_at,
  updated_at,
  paid_at
FROM payment_history
ORDER BY created_at DESC
LIMIT 10;

-- Check for duplicates
SELECT merchant_ref, COUNT(*) 
FROM payment_history 
GROUP BY merchant_ref 
HAVING COUNT(*) > 1;

-- Verify status transitions
SELECT 
  merchant_ref,
  status,
  created_at,
  updated_at,
  paid_at
FROM payment_history
WHERE merchant_ref = 'your_invoice_id';
```

## Security Tests

### Test SEC-1: XSS Prevention
**Steps**:
1. Try injecting script in WhatsApp number field: `<script>alert('XSS')</script>`
2. Submit form

**Expected Result**:
- Input is sanitized
- No script execution
- Backend rejects invalid input

### Test SEC-2: SQL Injection Prevention
**Steps**:
1. Try SQL injection in invoice ID: `/pay/1' OR '1'='1`

**Expected Result**:
- Query is parameterized
- No data leakage
- Returns proper error

### Test SEC-3: CSRF Protection
**Steps**:
1. Check that cookies have `SameSite` attribute
2. Verify `withCredentials: true` is set in axios calls

**Expected Result**:
- CORS properly configured
- Credentials sent correctly
- No CSRF vulnerabilities

## Browser Compatibility

Test on the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

## Accessibility Tests

### Test A11Y-1: Keyboard Navigation
**Steps**:
1. Navigate to payment page
2. Use Tab key to navigate
3. Use Enter/Space to activate buttons

**Expected Result**:
- All interactive elements are accessible
- Focus indicators are visible
- No keyboard traps

### Test A11Y-2: Screen Reader
**Steps**:
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate payment page

**Expected Result**:
- All content is announced
- Images have alt text
- Status updates are announced

## Checklist

### Pre-deployment
- [ ] All unit tests pass
- [ ] Build succeeds without errors
- [ ] No console errors in browser
- [ ] No linting errors
- [ ] Backend compiles successfully
- [ ] Database migrations applied
- [ ] Environment variables configured

### Functional Tests
- [ ] Iskapay payment creation works
- [ ] Tripay payment creation works
- [ ] QR code displays correctly
- [ ] Payment button works for Tripay
- [ ] Polling updates status
- [ ] Timer counts down correctly
- [ ] History page works
- [ ] Language toggle works
- [ ] Mobile responsive

### Security Tests
- [ ] No XSS vulnerabilities
- [ ] No SQL injection vulnerabilities
- [ ] CSRF protection enabled
- [ ] No security vulnerabilities found by CodeQL
- [ ] API endpoints secured

### Performance Tests
- [ ] Page loads in < 3 seconds
- [ ] Polling doesn't cause memory leaks
- [ ] No excessive API calls
- [ ] Images optimized

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] ARIA labels present

## Known Issues

None at this time.

## Rollback Plan

If issues are found in production:

1. Revert to previous version:
```bash
git revert cbf26dd
git push origin main
```

2. Redeploy previous stable version

3. Investigate issues in staging environment

4. Fix and re-test before redeploying

## Support Contacts

- Backend issues: Check backend logs
- Frontend issues: Check browser console
- Payment gateway issues: Contact Iskapay/Tripay support
- Database issues: Check PostgreSQL logs
