/**
 * Shiroine WhatsApp Bot - Main JavaScript
 * Handles interactivity, animations, and form submissions
 */

// ====================================
// DOM Elements
// ====================================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const demoForm = document.getElementById('demoForm');
const successModal = document.getElementById('successModal');
const faqItems = document.querySelectorAll('.faq-item');

// ====================================
// Navigation
// ====================================

// Handle navbar scroll effect
function handleNavbarScroll() {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

// Close mobile menu when clicking a link
function closeMobileMenu() {
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
    document.body.style.overflow = '';
}

// Initialize navigation
function initNavigation() {
    // Note: scroll listener is added at the bottom of file with throttling
    
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Close menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar') && navMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

// ====================================
// Smooth Scrolling
// ====================================

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ====================================
// FAQ Accordion
// ====================================

function initFAQ() {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQs
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current FAQ
            item.classList.toggle('active');
            question.setAttribute('aria-expanded', !isActive);
        });
    });
}

// ====================================
// Form Handling
// ====================================

function initFormHandling() {
    if (demoForm) {
        demoForm.addEventListener('submit', handleFormSubmit);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(demoForm);
    const phone = formData.get('phone');
    const name = formData.get('name');
    
    // Basic validation
    if (!phone || !name) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Phone number validation (basic - supports international formats)
    // Allows: +country code, spaces, dashes, parentheses, and 7-15 digits
    const phoneRegex = /^[\+]?[0-9]{1,4}?[-.\s]?[(]?[0-9]{1,3}[)]?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}$/;
    const cleanedPhone = phone.replace(/[\s\-().]/g, '');
    if (cleanedPhone.length < 7 || cleanedPhone.length > 15 || !phoneRegex.test(phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = demoForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Connecting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success modal
        openModal();
        
        // Reset form
        demoForm.reset();
        
    } catch {
        showNotification('Something went wrong. Please try again.', 'error');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ====================================
// Modal
// ====================================

function openModal() {
    if (successModal) {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking overlay
function initModal() {
    if (successModal) {
        const overlay = successModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && successModal.classList.contains('active')) {
                closeModal();
            }
        });
    }
}

// Make closeModal globally available
window.closeModal = closeModal;

// ====================================
// Notifications
// ====================================

function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close" aria-label="Close">&times;</button>
    `;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        padding: '16px 48px 16px 20px',
        borderRadius: '12px',
        backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6',
        color: 'white',
        fontWeight: '500',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        zIndex: '3000',
        animation: 'slideIn 0.3s ease-out',
        maxWidth: '400px'
    });
    
    // Add animation keyframes
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
            .notification-close {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        dismissNotification(notification);
    });
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        dismissNotification(notification);
    }, 5000);
}

function dismissNotification(notification) {
    notification.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// ====================================
// Scroll Reveal Animation
// ====================================

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.feature-card, .step-card, .faq-item');
    
    // Store original indices for stagger animation
    const elementIndices = new Map();
    revealElements.forEach((el, index) => {
        elementIndices.set(el, index % 6); // Reset every 6 elements for reasonable stagger
    });
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Use stored index for consistent stagger delay
                const staggerIndex = elementIndices.get(entry.target) || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, staggerIndex * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(el => observer.observe(el));
}

// ====================================
// Chat Animation
// ====================================

// Store interval ID for cleanup
let chatAnimationInterval = null;

function initChatAnimation() {
    const messages = document.querySelectorAll('.message');
    
    messages.forEach((message, index) => {
        message.style.animationDelay = `${index * 0.5 + 0.5}s`;
    });
    
    // Continuously animate typing indicator (optional enhancement)
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        chatAnimationInterval = setInterval(() => {
            // Add subtle animation to last message
            const lastMessage = chatMessages.querySelector('.message:last-child');
            if (lastMessage) {
                lastMessage.style.transform = 'scale(1.01)';
                setTimeout(() => {
                    lastMessage.style.transform = 'scale(1)';
                }, 300);
            }
        }, 5000);
    }
}

// Cleanup function for chat animation
function cleanupChatAnimation() {
    if (chatAnimationInterval) {
        clearInterval(chatAnimationInterval);
        chatAnimationInterval = null;
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', cleanupChatAnimation);

// ====================================
// Initialize Everything
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSmoothScrolling();
    initFAQ();
    initFormHandling();
    initModal();
    initScrollReveal();
    initChatAnimation();
    
    // Initial navbar check
    handleNavbarScroll();
    
    console.log('🤖 Shiroine Bot website initialized!');
});

// ====================================
// Performance Optimization
// ====================================

// Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Replace scroll listener with throttled version
window.addEventListener('scroll', throttle(handleNavbarScroll, 100));
