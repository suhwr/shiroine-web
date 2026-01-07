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

export const TRIPAY_CONFIG = {
  apiKey: process.env.REACT_APP_TRIPAY_API_KEY || '',
  privateKey: process.env.REACT_APP_TRIPAY_PRIVATE_KEY || '',
  merchantCode: process.env.REACT_APP_TRIPAY_MERCHANT_CODE || '',
  // Use sandbox for development/testing, production for live
  mode: process.env.REACT_APP_TRIPAY_MODE || 'sandbox',
  apiUrl: process.env.REACT_APP_TRIPAY_MODE === 'production' 
    ? 'https://tripay.co.id/api' 
    : 'https://tripay.co.id/api-sandbox',
};
