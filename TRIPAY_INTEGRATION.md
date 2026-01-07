# Tripay Payment Gateway Integration

This document explains how to integrate and configure Tripay payment gateway for the Shiroine Bot premium payment system.

## Overview

The checkout page integrates with Tripay payment gateway to allow users to purchase premium plans using various payment methods including:
- Virtual Account (Bank Transfer)
- E-Wallet (QRIS, GoPay, OVO, DANA, etc.)
- Retail Outlets (Alfamart, Indomaret, etc.)

## Setup Instructions

### 1. Register for Tripay Account

1. Visit [Tripay.co.id](https://tripay.co.id)
2. Register for a merchant account
3. Verify your account and complete KYC if required

### 2. Get API Credentials

1. Log in to your Tripay dashboard
2. Navigate to **Developer** section
3. Copy the following credentials:
   - **API Key**: Your public API key
   - **Private Key**: Your private key for signature generation
   - **Merchant Code**: Your unique merchant identifier

### 3. Configure Environment Variables

Create or update your `.env` file with the Tripay credentials:

```env
# Tripay Payment Gateway Configuration
# Mode: 'sandbox' for testing, 'production' for live
REACT_APP_TRIPAY_MODE=sandbox
REACT_APP_TRIPAY_API_KEY=your_tripay_api_key_here
REACT_APP_TRIPAY_PRIVATE_KEY=your_tripay_private_key_here
REACT_APP_TRIPAY_MERCHANT_CODE=your_merchant_code_here
```

**Important Notes:**
- Use `sandbox` mode during development and testing
- Switch to `production` mode only when ready to accept real payments
- **Never commit your `.env` file to version control** - it's already in `.gitignore`

### 4. Testing

#### Sandbox Mode
1. Set `REACT_APP_TRIPAY_MODE=sandbox`
2. Use sandbox credentials from Tripay dashboard
3. Refer to [Tripay Sandbox Documentation](https://tripay.co.id/developer) for test payment methods

#### Production Mode
1. Set `REACT_APP_TRIPAY_MODE=production`
2. Use production credentials
3. Ensure you've completed all Tripay verification requirements

## Payment Flow

1. **User selects a plan** on `/pricing` page
2. **Redirected to checkout** at `/checkout` with plan details
3. **Enter WhatsApp number** for verification and contact
4. **Select payment method** from available Tripay channels
5. **Payment processing**:
   - Transaction created via Tripay API
   - User redirected to Tripay payment page or shown payment instructions
   - User completes payment through selected method
6. **Payment verification** (handled by Tripay callback/webhook)

## API Integration Details

### Endpoints Used

1. **Get Payment Channels**
   - Endpoint: `GET /merchant/payment-channel`
   - Purpose: Fetch available payment methods
   - Shows active channels with their fees and details

2. **Create Transaction**
   - Endpoint: `POST /transaction/create`
   - Purpose: Create a new payment transaction
   - Requires signature verification for security

### Security Considerations

⚠️ **CRITICAL SECURITY WARNING:**

The current implementation includes client-side signature generation for demonstration purposes. **This is NOT recommended for production use** as it exposes your private key in the browser.

### Production Recommendations:

1. **Backend Integration Required**: For production deployment, you MUST implement a backend server that:
   - Handles signature generation securely
   - Creates Tripay transactions server-side
   - Validates payment callbacks/webhooks
   - Manages user premium status in a database
   - Protects your Tripay private key

2. **Private Key Protection**: Never expose your private key in client-side code or commit it to version control.

3. **Environment Variables**: Keep all Tripay credentials in `.env` file (already gitignored).

### Current Implementation (Development Only)

The checkout page currently generates signatures client-side using `crypto-js`. This is acceptable for:
- Local development and testing
- Sandbox/demo environments
- Understanding the integration flow

**Before going live, you MUST migrate signature generation to a backend server.**

### Recommended Backend Implementation

```javascript
// Example backend endpoint (Node.js/Express)
app.post('/api/create-payment', async (req, res) => {
  const { planId, whatsappNumber, paymentMethod } = req.body;
  
  // Generate signature server-side
  const signature = crypto
    .createHmac('sha256', process.env.TRIPAY_PRIVATE_KEY)
    .update(process.env.TRIPAY_MERCHANT_CODE + merchantRef + amount)
    .digest('hex');
  
  // Create transaction with Tripay
  // ... (call Tripay API)
  
  res.json({ success: true, data: paymentData });
});
```

## Webhook Configuration

To receive payment notifications:

1. Set up a webhook endpoint in your backend (e.g., `/api/tripay/callback`)
2. Configure the webhook URL in Tripay dashboard
3. Verify webhook signature to ensure authenticity
4. Update user premium status based on payment status

Example webhook handler:
```javascript
app.post('/api/tripay/callback', (req, res) => {
  const callbackSignature = req.headers['x-callback-signature'];
  const payload = req.body;
  
  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.TRIPAY_PRIVATE_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  if (callbackSignature === generatedSignature) {
    // Process payment status update
    // Update user premium status in database
  }
  
  res.json({ success: true });
});
```

## Documentation References

- [Tripay Developer Documentation](https://tripay.co.id/developer)
- [Tripay API Reference](https://tripay.co.id/developer?tab=api)
- [Payment Channels List](https://tripay.co.id/developer?tab=channels)

## Troubleshooting

### Payment methods not showing
- Verify API key is correct
- Check if Tripay account is active
- Ensure you're using the correct API URL (sandbox vs production)

### Transaction creation fails
- Verify all required environment variables are set
- Check signature generation is correct
- Ensure amount is in correct format (integer, no decimals)

### Webhook not receiving callbacks
- Verify webhook URL is publicly accessible
- Check webhook signature validation
- Review Tripay dashboard logs

## Support

For Tripay-specific issues:
- Visit [Tripay Support](https://tripay.co.id)
- Email: support@tripay.co.id

For implementation issues:
- Contact the development team
- Review the source code in `/src/components/Checkout.jsx`
