// Configuration constants for the application

export const CONTACT_INFO = {
  email: 'sherdi240@gmail.com',
  whatsappNumber: '6283156669609',
  whatsappDisplay: '+62 831-5666-9609',
};

export const PAYMENT_INFO = {
  whatsappNumber: '6283863595922',
  command: '.buyprem',
};

// Get the current domain dynamically
const getCurrentDomain = () => {
  if (typeof window === 'undefined') return 'shiroine.web.id';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost:3001'; // Local development backend
  }
  return `pay.${hostname}`;
};

// Payment backend API configuration
export const PAYMENT_API_CONFIG = {
  // Use pay.<current-domain> for API URL
  baseUrl: typeof window !== 'undefined' 
    ? `${window.location.protocol}//${getCurrentDomain()}`
    : 'http://localhost:3001',
  
  endpoints: {
    paymentChannels: '/api/payment-channels',
    createTransaction: '/api/create-transaction',
    transactionStatus: '/api/transaction-status',
    paymentHistory: '/api/payment-history',
    cart: '/api/cart',
    callback: '/callback',
  }
};

// Legacy Tripay config (deprecated - kept for reference only)
// All Tripay requests should now go through the backend API
export const TRIPAY_CONFIG = {
  // These are no longer used in the frontend
  // Backend handles all Tripay communication
  apiKey: '', // Removed from frontend for security
  privateKey: '', // Removed from frontend for security
  merchantCode: '', // Removed from frontend for security
  mode: 'backend', // Indicates we're using backend proxy
  apiUrl: PAYMENT_API_CONFIG.baseUrl, // Points to our backend
};

