# Payment Flow Changes - Iskapay & Tripay Integration

## Summary

This document outlines the changes made to implement a unified payment flow for both Iskapay and Tripay payment gateways.

## Problem Statement

The original implementation had the following issues:
1. **Checkout redirected to external URLs**: When creating a payment, users were redirected to external payment URLs (Tripay checkout or Iskapay payment URL)
2. **No QR code display for Iskapay**: Iskapay payments showed the external payment page instead of displaying the QR code directly
3. **No real-time status updates for Iskapay**: Since Iskapay doesn't have webhook callbacks, there was no way to track payment status in real-time
4. **History page always redirected to Tripay**: The payment history page always redirected to Tripay checkout URL, even for Iskapay invoices

## Solution Implemented

### 1. New Payment Page Component (`/pay/:invoiceId`)

Created a new unified payment page that handles both Iskapay and Tripay payments:

**File**: `src/components/PaymentPage.jsx`

**Features**:
- **Dynamic QR Code Display**: For Iskapay payments, displays the QR code image directly on the page
- **Tripay Checkout Integration**: For Tripay payments, provides a button to open the checkout URL in a new tab
- **Real-time Status Polling**: Polls the backend every 10 seconds to check payment status
- **Countdown Timer**: Shows remaining time before payment expires
- **Auto-stop Polling**: Automatically stops polling when payment is completed, failed, or expired
- **Responsive Design**: Works on all device sizes
- **Multi-language Support**: Supports both Indonesian and English

### 2. Updated Checkout Flow

**File**: `src/components/Checkout.jsx`

**Changes**:
- Modified `handleProceedPayment` to redirect to `/pay/:invoiceId` instead of external URLs
- Extracts `merchant_order_id` or `reference` from the payment response
- Redirects to internal payment page for both Iskapay and Tripay

**Before**:
```javascript
// Redirected to paymentData.checkout_url or paymentData.payment_url
window.location.href = paymentData.checkout_url;
```

**After**:
```javascript
// Redirects to internal payment page
const invoiceId = paymentData.merchant_order_id || paymentData.reference;
navigate(`/pay/${invoiceId}`);
```

### 3. Updated History Page

**File**: `src/components/History.jsx`

**Changes**:
- Modified "Continue Payment" button to redirect to `/pay/:invoiceId` instead of Tripay checkout
- Uses `merchantRef` or `reference` from transaction data
- Works for both Iskapay and Tripay invoices

**Before**:
```javascript
// Always redirected to Tripay
window.open(`https://tripay.co.id/checkout/${transaction.reference}`, '_blank')
```

**After**:
```javascript
// Redirects to internal payment page
const invoiceId = transaction.merchantRef || transaction.reference;
navigate(`/pay/${invoiceId}`);
```

### 4. Backend Updates

**File**: `backend/tripay.go`

**Changes**:
- Added `merchant_order_id` field to Tripay responses for consistency with Iskapay
- Maps Tripay's `reference` to `merchant_order_id` in both `CreateTransaction` and `GetTransactionStatus`

**Before**:
```go
// Only returned reference
return paymentData, nil
```

**After**:
```go
// Adds merchant_order_id for consistency
if reference, ok := paymentData["reference"].(string); ok {
    paymentData["merchant_order_id"] = reference
}
return paymentData, nil
```

### 5. Added Route Configuration

**File**: `src/App.js`

**Changes**:
- Added new route `/pay/:invoiceId` for the payment page
- Lazy-loaded `PaymentPage` component

```javascript
<Route path="/pay/:invoiceId" element={<PaymentPage />} />
```

## Technical Details

### Polling Mechanism

The payment page uses a 10-second polling interval to check payment status:

```javascript
useEffect(() => {
  fetchPaymentStatus(true);
  
  // Poll every 10 seconds
  pollIntervalRef.current = setInterval(() => {
    fetchPaymentStatus(false);
  }, 10000);
  
  return () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };
}, [fetchPaymentStatus]);
```

### Status Handling

The payment page handles different payment statuses:

| Status | Action |
|--------|--------|
| `paid`, `PAID`, `completed` | Stop polling, show success message |
| `pending`, `UNPAID` | Continue polling, show QR code or payment button |
| `failed`, `FAILED`, `expired`, `EXPIRED`, `cancelled`, `CANCELLED` | Stop polling, show error message |

### Payment Gateway Detection

The page automatically detects the payment gateway type based on response data:

- **Iskapay**: Has `qr_code` field in the response
- **Tripay**: Has `checkout_url` field in the response

## API Response Formats

### Iskapay Response

```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "payment_id": 152011,
    "merchant_order_id": "INV-1061-20260110101312-EQE6",
    "amount": "50000.00",
    "total_amount": "50000.00",
    "unique_amount": "0.00",
    "status": "pending",
    "payment_method": "qris",
    "qr_code": "https://pg-iskapay.com/storage/qrcodes/INV-1061-20260110101312-EQE6_1768014792.png",
    "payment_url": "https://wallet.iskapay.com/payment/INV-1061-20260110101312-EQE6",
    "expired_at": "2026-01-10T03:43:12.000000Z",
    "created_at": "2026-01-10T03:13:12.000000Z"
  }
}
```

### Tripay Response

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
    "checkout_url": "https://tripay.co.id/checkout/T1234567890ABC",
    "expired_time": 1736565192
  }
}
```

## User Flow

### Checkout Flow

1. User selects a premium plan on `/pricing`
2. User proceeds to `/checkout` with plan details
3. User verifies their WhatsApp number or Group ID
4. User selects a payment method
5. User clicks "Proceed Payment"
6. **NEW**: User is redirected to `/pay/:invoiceId` (instead of external URL)
7. Payment page displays:
   - **For Iskapay**: QR code to scan
   - **For Tripay**: Button to open checkout URL
8. Payment status updates automatically every 10 seconds
9. When paid, user sees success message and can return to home

### History Flow

1. User navigates to `/history`
2. User enters their WhatsApp number or Group ID
3. User sees list of their payment transactions
4. For pending payments, user can click "Continue Payment"
5. **NEW**: User is redirected to `/pay/:invoiceId` (instead of external URL)
6. User completes payment as in checkout flow

## Benefits

1. **Unified Experience**: Both Iskapay and Tripay use the same payment page
2. **Better UX**: Users can see QR codes directly without leaving the site
3. **Real-time Updates**: Status updates automatically without page refresh
4. **Mobile Friendly**: QR codes are easy to scan on mobile devices
5. **Consistent Branding**: Payment page uses the same theme and branding
6. **No Confusion**: Users know they're on the official Shiroine website

## Testing Checklist

- [x] Frontend builds successfully
- [x] Backend compiles successfully
- [ ] Iskapay payment creation redirects to `/pay/:invoiceId`
- [ ] Tripay payment creation redirects to `/pay/:invoiceId`
- [ ] QR code displays for Iskapay payments
- [ ] Checkout button displays for Tripay payments
- [ ] Payment status polls every 10 seconds
- [ ] Polling stops when payment is completed
- [ ] Polling stops when payment fails/expires
- [ ] Countdown timer works correctly
- [ ] History page redirects correctly for both gateways
- [ ] Mobile responsive design works

## Future Improvements

1. **WebSocket Integration**: Replace polling with WebSocket for real-time updates
2. **Push Notifications**: Notify users when payment is completed
3. **Payment Receipt**: Generate and display payment receipt on success
4. **QR Code Fallback**: Generate QR code on frontend if image URL fails
5. **Error Recovery**: Better error handling and retry mechanisms
6. **Analytics**: Track payment completion rates and drop-off points

## Notes

- Iskapay doesn't have webhook callbacks, so polling is necessary
- Tripay has webhooks but polling ensures consistency between both gateways
- The 10-second interval is a balance between real-time updates and server load
- Both gateways now use `merchant_order_id` as the primary identifier
