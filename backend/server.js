const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const axios = require('axios');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Tripay configuration
const TRIPAY_CONFIG = {
  apiKey: process.env.TRIPAY_API_KEY,
  privateKey: process.env.TRIPAY_PRIVATE_KEY,
  merchantCode: process.env.TRIPAY_MERCHANT_CODE,
  mode: process.env.TRIPAY_MODE || 'sandbox',
  apiUrl: process.env.TRIPAY_MODE === 'production' 
    ? 'https://tripay.co.id/api' 
    : 'https://tripay.co.id/api-sandbox',
};

// Middleware
app.use(helmet());

// CORS configuration - allow credentials and specific origin
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => 
      origin.startsWith(allowedOrigin) || origin === allowedOrigin
    );
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Utility function to generate Tripay signature
const generateSignature = (merchantCode, merchantRef, amount) => {
  const data = merchantCode + merchantRef + amount;
  return crypto.createHmac('sha256', TRIPAY_CONFIG.privateKey).update(data).digest('hex');
};

// Utility function to verify callback signature
const verifyCallbackSignature = (callbackSignature, payload) => {
  const generatedSignature = crypto
    .createHmac('sha256', TRIPAY_CONFIG.privateKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  return callbackSignature === generatedSignature;
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: TRIPAY_CONFIG.mode 
  });
});

// Get payment channels
app.get('/api/payment-channels', async (req, res) => {
  try {
    if (!TRIPAY_CONFIG.apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured'
      });
    }

    const response = await axios.get(`${TRIPAY_CONFIG.apiUrl}/merchant/payment-channel`, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_CONFIG.apiKey}`,
      }
    });

    // Filter only active channels
    const activeChannels = response.data.data.filter(channel => channel.active);

    res.json({
      success: true,
      data: activeChannels
    });
  } catch (error) {
    console.error('Error fetching payment channels:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment channels',
      error: error.response?.data?.message || error.message
    });
  }
});

// Create transaction
app.post('/api/create-transaction', async (req, res) => {
  try {
    const { 
      method, 
      amount, 
      customerName, 
      customerPhone, 
      orderItems,
      returnUrl 
    } = req.body;

    // Validate required fields
    if (!method || !amount || !customerPhone || !orderItems) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!TRIPAY_CONFIG.apiKey || !TRIPAY_CONFIG.privateKey || !TRIPAY_CONFIG.merchantCode) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured properly'
      });
    }

    // Generate unique merchant reference
    const merchantRef = `PREMIUM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Generate signature
    const signature = generateSignature(TRIPAY_CONFIG.merchantCode, merchantRef, amount);
    
    // Prepare transaction data
    const transactionData = {
      method: method,
      merchant_ref: merchantRef,
      amount: amount,
      customer_name: customerName || `Customer-${customerPhone}`,
      customer_email: `noreply@${process.env.DOMAIN || 'shiroine.my.id'}`,
      customer_phone: customerPhone,
      order_items: orderItems,
      return_url: returnUrl || `https://${process.env.DOMAIN || 'shiroine.my.id'}/pricing`,
      expired_time: (Math.floor(Date.now() / 1000) + (24 * 60 * 60)), // 24 hours
      signature: signature
    };

    // Create transaction with Tripay
    const response = await axios.post(
      `${TRIPAY_CONFIG.apiUrl}/transaction/create`,
      transactionData,
      {
        headers: {
          'Authorization': `Bearer ${TRIPAY_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.data.success) {
      const paymentData = response.data.data;
      
      // Store transaction in cookie for payment history
      // Wrap in try-catch to ensure response is sent even if cookie fails
      try {
        const existingHistory = req.cookies.paymentHistory 
          ? JSON.parse(req.cookies.paymentHistory) 
          : [];
        
        const transactionRecord = {
          reference: paymentData.reference,
          merchantRef: merchantRef,
          method: method,
          amount: amount,
          status: 'UNPAID',
          createdAt: new Date().toISOString(),
          orderItems: orderItems
        };
        
        existingHistory.unshift(transactionRecord);
        
        // Keep only last 50 transactions
        const limitedHistory = existingHistory.slice(0, 50);
        
        // Set cookie (no expiration as per requirement)
        // Use root domain for cross-subdomain access
        const cookieOptions = {
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year (effectively non-expiring)
        };
        
        // Set domain for cross-subdomain cookie sharing (e.g., .shiroine.my.id)
        if (process.env.DOMAIN && process.env.NODE_ENV === 'production') {
          cookieOptions.domain = `.${process.env.DOMAIN}`;
        }
        
        res.cookie('paymentHistory', JSON.stringify(limitedHistory), cookieOptions);
      } catch (cookieError) {
        // Log error but don't fail the transaction since Tripay succeeded
        console.error('Error setting payment history cookie:', cookieError);
      }

      // Always send success response to client since Tripay transaction succeeded
      res.json({
        success: true,
        data: paymentData,
        message: 'Transaction created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.data.message || 'Failed to create transaction'
      });
    }
  } catch (error) {
    console.error('Error creating transaction:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.response?.data?.message || error.message
    });
  }
});

// Check transaction status
app.get('/api/transaction-status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    if (!TRIPAY_CONFIG.apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured'
      });
    }

    const response = await axios.get(
      `${TRIPAY_CONFIG.apiUrl}/transaction/detail?reference=${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${TRIPAY_CONFIG.apiKey}`,
        }
      }
    );

    if (response.data.success) {
      // Update transaction status in cookie
      const existingHistory = req.cookies.paymentHistory 
        ? JSON.parse(req.cookies.paymentHistory) 
        : [];
      
      const updatedHistory = existingHistory.map(transaction => {
        if (transaction.reference === reference) {
          return {
            ...transaction,
            status: response.data.data.status,
            updatedAt: new Date().toISOString()
          };
        }
        return transaction;
      });
      
      const cookieOptions = {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000
      };
      
      // Set domain for cross-subdomain cookie sharing
      if (process.env.DOMAIN && process.env.NODE_ENV === 'production') {
        cookieOptions.domain = `.${process.env.DOMAIN}`;
      }
      
      res.cookie('paymentHistory', JSON.stringify(updatedHistory), cookieOptions);

      res.json({
        success: true,
        data: response.data.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
  } catch (error) {
    console.error('Error fetching transaction status:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction status',
      error: error.response?.data?.message || error.message
    });
  }
});

// Tripay callback endpoint
app.post('/callback', async (req, res) => {
  try {
    const callbackSignature = req.headers['x-callback-signature'];
    const payload = req.body;

    // Verify signature
    if (!verifyCallbackSignature(callbackSignature, payload)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Process callback based on payment status
    const { reference, status, merchant_ref, amount } = payload;

    console.log('Tripay Callback:', {
      reference,
      status,
      merchant_ref,
      amount,
      timestamp: new Date().toISOString()
    });

    // Here you can add logic to:
    // 1. Update database with payment status
    // 2. Activate premium service if payment is successful
    // 3. Send notification to user
    // 4. Any other business logic

    if (status === 'PAID') {
      console.log(`Payment successful for reference: ${reference}`);
      // TODO: Activate premium service for user
    } else if (status === 'EXPIRED' || status === 'FAILED') {
      console.log(`Payment ${status.toLowerCase()} for reference: ${reference}`);
    }

    // Always respond with success to Tripay
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing callback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payment history from cookie
app.get('/api/payment-history', (req, res) => {
  try {
    const history = req.cookies.paymentHistory 
      ? JSON.parse(req.cookies.paymentHistory) 
      : [];
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      data: []
    });
  }
});

// Cart management endpoints
app.get('/api/cart', (req, res) => {
  try {
    const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      data: []
    });
  }
});

app.post('/api/cart', (req, res) => {
  try {
    const { items } = req.body;
    
    res.cookie('cart', JSON.stringify(items), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      success: true,
      message: 'Cart updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Shiroine Payment Backend Server                          ║
╠════════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: ${PORT}                                                ║
║  Mode: ${TRIPAY_CONFIG.mode}                                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  if (!TRIPAY_CONFIG.apiKey || !TRIPAY_CONFIG.privateKey || !TRIPAY_CONFIG.merchantCode) {
    console.warn('⚠️  WARNING: Tripay credentials not configured!');
    console.warn('Please set TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, and TRIPAY_MERCHANT_CODE in .env file');
  }
});

module.exports = app;
