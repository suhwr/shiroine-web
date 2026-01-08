// Cookie utility functions for managing cart and payment history

/**
 * Get cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

/**
 * Set cookie value
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days until expiration (default: 365)
 */
export const setCookie = (name, value, days = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

/**
 * Delete cookie by name
 * @param {string} name - Cookie name
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Get payment history from cookies
 * @returns {Array} Array of payment transactions
 */
export const getPaymentHistory = () => {
  try {
    const history = getCookie('paymentHistory');
    return history ? JSON.parse(decodeURIComponent(history)) : [];
  } catch (error) {
    console.error('Error parsing payment history:', error);
    return [];
  }
};

/**
 * Add transaction to payment history
 * @param {Object} transaction - Transaction object
 */
export const addToPaymentHistory = (transaction) => {
  try {
    const history = getPaymentHistory();
    history.unshift(transaction);
    
    // Keep only last 50 transactions
    const limitedHistory = history.slice(0, 50);
    
    setCookie('paymentHistory', encodeURIComponent(JSON.stringify(limitedHistory)));
  } catch (error) {
    console.error('Error adding to payment history:', error);
  }
};

/**
 * Update transaction status in payment history
 * @param {string} reference - Transaction reference
 * @param {string} status - New status
 */
export const updatePaymentStatus = (reference, status) => {
  try {
    const history = getPaymentHistory();
    const updatedHistory = history.map(transaction => {
      if (transaction.reference === reference) {
        return {
          ...transaction,
          status: status,
          updatedAt: new Date().toISOString()
        };
      }
      return transaction;
    });
    
    setCookie('paymentHistory', encodeURIComponent(JSON.stringify(updatedHistory)));
  } catch (error) {
    console.error('Error updating payment status:', error);
  }
};

/**
 * Get cart items from cookies
 * @returns {Array} Array of cart items
 */
export const getCart = () => {
  try {
    const cart = getCookie('cart');
    return cart ? JSON.parse(decodeURIComponent(cart)) : [];
  } catch (error) {
    console.error('Error parsing cart:', error);
    return [];
  }
};

/**
 * Set cart items in cookies
 * @param {Array} items - Array of cart items
 */
export const setCart = (items) => {
  try {
    setCookie('cart', encodeURIComponent(JSON.stringify(items)));
  } catch (error) {
    console.error('Error setting cart:', error);
  }
};

/**
 * Add item to cart
 * @param {Object} item - Cart item
 */
export const addToCart = (item) => {
  try {
    const cart = getCart();
    
    // Check if item already exists
    const existingItemIndex = cart.findIndex(i => i.id === item.id);
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
    } else {
      // Add new item
      cart.push({ ...item, quantity: 1 });
    }
    
    setCart(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};

/**
 * Remove item from cart
 * @param {string} itemId - Item ID to remove
 */
export const removeFromCart = (itemId) => {
  try {
    const cart = getCart();
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
};

/**
 * Update cart item quantity
 * @param {string} itemId - Item ID
 * @param {number} quantity - New quantity
 */
export const updateCartQuantity = (itemId, quantity) => {
  try {
    const cart = getCart();
    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.max(0, quantity) };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  } catch (error) {
    console.error('Error updating cart quantity:', error);
  }
};

/**
 * Clear cart
 */
export const clearCart = () => {
  try {
    setCart([]);
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
};

/**
 * Get cart total
 * @returns {number} Total cart value
 */
export const getCartTotal = () => {
  try {
    const cart = getCart();
    return cart.reduce((total, item) => {
      const price = typeof item.price === 'string' 
        ? parseInt(item.price.replace(/[^0-9]/g, ''), 10) 
        : item.price;
      return total + (price * (item.quantity || 1));
    }, 0);
  } catch (error) {
    console.error('Error calculating cart total:', error);
    return 0;
  }
};

/**
 * Get cart item count
 * @returns {number} Total number of items in cart
 */
export const getCartItemCount = () => {
  try {
    const cart = getCart();
    return cart.reduce((count, item) => count + (item.quantity || 1), 0);
  } catch (error) {
    console.error('Error getting cart item count:', error);
    return 0;
  }
};
