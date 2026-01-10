# Pakasir Gateway Adjustments - Implementation Summary

## Date: 2026-01-10

## Overview
This document describes the adjustments made to the Pakasir payment gateway integration to properly handle PayPal, QRIS, and Virtual Account payment methods.

## Problem Statement
The Pakasir gateway integration had several issues:

1. **PayPal**: Transaction created successfully but error at `/pay` page showing "Transaksi tidak ditemukan" (Transaction not found)
2. **QRIS**: Status OK but QR code not displaying at `/pay` page
3. **Virtual Account**: Same issue as PayPal - transaction not found at `/pay` page

## Root Cause Analysis

The issues were caused by:
1. PayPal and VA transactions were not being saved to the database with necessary details
2. The `payment_number` field (containing QR string, VA account number, or PayPal URL) was not being stored
3. The `expired_at` timestamp was not being stored for countdown timer
4. GetTransactionStatus was trying to use `/api/transactiondetail` endpoint for all payment methods, but this endpoint doesn't work for PayPal and VA

## Solutions Implemented

### 1. Database Schema Changes

**File**: `backend/schema.sql`

Added two new columns to `payment_history` table:
- `payment_number TEXT`: Stores payment identifier (QR string, VA account, PayPal URL)
- `expired_at TIMESTAMP`: Stores payment expiration time for countdown timer

**Migration File**: `backend/migrations/add_payment_number_and_expired_at.sql`
- Safe migration script that checks for existing columns before adding
- Can be run multiple times without errors

### 2. Backend Changes (Go)

**File**: `backend/pakasir.go`

#### Change 1: Use API Endpoint for PayPal
```go
// Before: PayPal used URL-based integration
// After: PayPal uses API endpoint like QRIS and VA
if pakasirMethod == "qris" || strings.Contains(pakasirMethod, "_va") || pakasirMethod == "paypal" {
    return g.createAPITransaction(req, orderID, pakasirMethod, description)
}
```

#### Change 2: Save payment_number and expired_at to Database
```go
// Parse expired_at time
var expiredAtTime *time.Time
if exp, ok := paymentData["expired_at"].(string); ok {
    expiredAt = exp
    if parsedTime, err := time.Parse(time.RFC3339, exp); err == nil {
        expiredAtTime = &parsedTime
    }
}

// Insert with new fields
_, err := g.db.Exec(`
    INSERT INTO payment_history 
    (reference, merchant_ref, phone_number, group_id, customer_name, method, amount, status, order_items, payment_number, expired_at, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
`, /* ... */, paymentNumber, expiredAtTime, /* ... */)
```

#### Change 3: Modified GetTransactionStatus Logic
```go
// For PayPal and Virtual Account: return database status only (rely on callback)
methodLower := strings.ToLower(method)
if methodLower == "paypal" || strings.Contains(methodLower, "_va") || strings.Contains(methodLower, "virtual") {
    // Return database status without API check
    responseData := map[string]interface{}{
        "merchant_order_id": orderId,
        "payment_method":    method,
        "amount":            amount,
        "status":            strings.ToLower(status),
        // Include payment_number and expired_at from database
    }
    return responseData, nil
}

// For QRIS: continue using Pakasir API to track status
// (existing code for QRIS tracking remains unchanged)
```

### 3. Frontend Changes (React)

**File**: `src/components/PaymentPage.jsx`

#### Change 1: Enhanced QRIS QR Code Display
```jsx
{/* QRIS Payment - Show QR Code */}
{isPending && (paymentData.qr_code || paymentData.payment_number || paymentData.qr_string) && 
 (paymentData.payment_method === 'qris' || paymentData.payment_method === 'QRIS' || ...) && (
  <>
    {/* QR Code Display */}
    <div className="bg-white p-4 rounded-lg">
      {!qrImageError && paymentData.qr_code && paymentData.qr_code.startsWith('http') ? (
        <img src={paymentData.qr_code} alt="QR Code" />
      ) : (
        // Use QRCodeSVG for QR strings (payment_number)
        <QRCodeSVG 
          value={paymentData.payment_number || paymentData.qr_string || paymentData.qr_code} 
          size={256}
          level="H"
          includeMargin={true}
        />
      )}
    </div>
    {/* Countdown Timer */}
    {timeRemaining && <p>{timeRemaining}</p>}
  </>
)}
```

#### Change 2: Added PayPal Payment Button
```jsx
{/* PayPal Payment - Show PayPal Button */}
{isPending && paymentData.payment_number && 
 paymentData.payment_method.toLowerCase() === 'paypal' && (
  <>
    <p>Klik tombol di bawah untuk melanjutkan pembayaran dengan PayPal</p>
    <Button onClick={() => window.open(paymentData.payment_number, '_blank')}>
      <svg>PayPal Icon</svg>
      Bayar dengan PayPal
    </Button>
    {/* Countdown Timer */}
    {timeRemaining && <p>{timeRemaining}</p>}
    <p>Status diperbarui otomatis setelah pembayaran selesai</p>
  </>
)}
```

#### Change 3: Virtual Account Display Already Exists
The Virtual Account section was already properly implemented, showing:
- Account number with copy button
- Payment instructions
- Countdown timer
- Auto-refresh indicator

## Payment Flow Differences

### QRIS
1. Transaction created → `payment_number` contains QR string
2. Frontend displays QR code using `QRCodeSVG` component
3. Status tracked via `/api/transactiondetail` endpoint (polling every 10 seconds)
4. Premium activated via callback OR status check

### PayPal
1. Transaction created → `payment_number` contains PayPal checkout URL
2. Frontend displays button to open PayPal payment page
3. Status NOT tracked via `/api/transactiondetail` (returns database status only)
4. Premium activated ONLY via callback

### Virtual Account
1. Transaction created → `payment_number` contains VA account number
2. Frontend displays account number with copy button
3. Status NOT tracked via `/api/transactiondetail` (returns database status only)
4. Premium activated ONLY via callback

## Countdown Timer

All payment methods now show countdown timer based on `expired_at` field:
```javascript
useEffect(() => {
  if (!paymentData || !paymentData.expired_at) return;
  
  const updateTimeRemaining = () => {
    const now = new Date();
    const expiry = new Date(paymentData.expired_at);
    const diff = expiry - now;
    
    if (diff <= 0) {
      setTimeRemaining('Kadaluarsa');
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };
  
  updateTimeRemaining();
  const timer = setInterval(updateTimeRemaining, 1000);
  return () => clearInterval(timer);
}, [paymentData?.expired_at]);
```

## Testing Checklist

### Database Migration
- [ ] Run migration script on development database
- [ ] Verify `payment_number` and `expired_at` columns exist
- [ ] Check existing records are not affected

### PayPal Testing
- [ ] Create PayPal transaction
- [ ] Verify transaction saved to database with `payment_number` (URL)
- [ ] Check payment page displays PayPal button
- [ ] Click button and verify PayPal page opens
- [ ] Verify countdown timer displays correctly
- [ ] Test callback updates status correctly

### QRIS Testing
- [ ] Create QRIS transaction
- [ ] Verify transaction saved to database with `payment_number` (QR string)
- [ ] Check payment page displays QR code
- [ ] Verify QR code is scannable
- [ ] Verify countdown timer displays correctly
- [ ] Test status tracking updates automatically

### Virtual Account Testing
- [ ] Create VA transaction (test with different banks)
- [ ] Verify transaction saved to database with `payment_number` (account number)
- [ ] Check payment page displays VA number
- [ ] Test copy button functionality
- [ ] Verify countdown timer displays correctly
- [ ] Test callback updates status correctly

## Deployment Steps

1. **Database Migration**
   ```bash
   psql -U shiroine_user -d shiroine_db -f backend/migrations/add_payment_number_and_expired_at.sql
   ```

2. **Backend Deployment**
   - Deploy updated `backend/pakasir.go`
   - Restart backend service
   - Monitor logs for errors

3. **Frontend Deployment**
   - Build React app: `npm run build`
   - Deploy to hosting platform
   - Clear CDN cache if applicable

4. **Verification**
   - Test each payment method
   - Monitor error logs
   - Check callback processing

## Rollback Plan

If issues occur:

1. **Database**: Columns are nullable, safe to keep
2. **Backend**: Revert `pakasir.go` to previous version
3. **Frontend**: Revert `PaymentPage.jsx` to previous version

No data loss risk as new columns are optional.

## Performance Impact

- Minimal: Only adds two fields to database inserts/queries
- No additional API calls for PayPal/VA (actually reduces calls)
- QRIS behavior unchanged

## Security Considerations

- `payment_number` may contain sensitive data (URLs, account numbers)
- Ensure HTTPS for all payment pages
- PayPal URLs are unique per transaction
- VA numbers are temporary and transaction-specific

## Future Improvements

1. Add retry mechanism for failed callbacks
2. Implement webhook verification for PayPal
3. Add transaction cancellation feature
4. Improve error handling for expired payments

## Support

For issues:
- Check backend logs for detailed error messages
- Verify database schema matches expectations
- Test callback endpoint accessibility
- Review Pakasir API documentation
