import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Check, Loader2, Globe } from 'lucide-react';
import { translations } from '../translations';
import { TRIPAY_CONFIG, CONTACT_INFO } from '../config';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';
import axios from 'axios';

const Checkout = () => {
  const [language, setLanguage] = useState('id');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentChannels, setPaymentChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const t = translations[language];

  // Get plan details from navigation state
  const planDetails = location.state || {
    id: 'user-5d',
    duration: '5 Days',
    price: 'Rp 7.000',
    type: 'User Premium'
  };

  const communityLink = React.useMemo(() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://community.shiroine.my.id/';
    }
    return `https://community.${hostname}/`;
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  // Extract numeric price from string like "Rp 7.000"
  const getNumericPrice = (priceStr) => {
    return parseInt(priceStr.replace(/[^0-9]/g, ''));
  };

  // Fetch available payment channels from Tripay
  useEffect(() => {
    const fetchPaymentChannels = async () => {
      try {
        setLoading(true);
        
        // Check if API key is configured
        if (!TRIPAY_CONFIG.apiKey) {
          console.warn('Tripay API key not configured');
          setPaymentChannels([]);
          setLoading(false);
          return;
        }

        const response = await axios.get(`${TRIPAY_CONFIG.apiUrl}/merchant/payment-channel`, {
          headers: {
            'Authorization': `Bearer ${TRIPAY_CONFIG.apiKey}`,
          }
        });

        if (response.data.success) {
          // Filter only active channels
          const activeChannels = response.data.data.filter(channel => channel.active);
          setPaymentChannels(activeChannels);
        }
      } catch (error) {
        console.error('Error fetching payment channels:', error);
        toast.error(language === 'id' ? 'Gagal memuat metode pembayaran' : 'Failed to load payment methods');
        setPaymentChannels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentChannels();
  }, [language]);

  // Create transaction with Tripay
  const handleProceedPayment = async () => {
    // Validate inputs
    if (!whatsappNumber) {
      toast.error(t.whatsappRequired);
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error(language === 'id' ? 'Pilih metode pembayaran' : 'Select a payment method');
      return;
    }

    if (!TRIPAY_CONFIG.apiKey || !TRIPAY_CONFIG.privateKey || !TRIPAY_CONFIG.merchantCode) {
      toast.error(language === 'id' 
        ? 'Konfigurasi pembayaran belum lengkap. Silakan hubungi admin.' 
        : 'Payment configuration incomplete. Please contact admin.');
      return;
    }

    try {
      setProcessing(true);

      const amount = getNumericPrice(planDetails.price);
      const merchantRef = `PREMIUM-${Date.now()}`;
      
      // Generate signature for Tripay
      // NOTE: In production, this should be done on the backend for security
      const generateSignature = (merchantCode, merchantRef, amount) => {
        const CryptoJS = require('crypto-js');
        const data = merchantCode + merchantRef + amount;
        return CryptoJS.HmacSHA256(data, TRIPAY_CONFIG.privateKey).toString();
      };
      
      // Prepare transaction data according to Tripay documentation
      const transactionData = {
        method: selectedPaymentMethod,
        merchant_ref: merchantRef,
        amount: amount,
        customer_name: whatsappNumber, // Using WhatsApp number as customer identifier
        customer_email: `${whatsappNumber}@shiroine.id`, // Dummy email
        customer_phone: whatsappNumber,
        order_items: [
          {
            name: `${planDetails.type} - ${planDetails.duration}`,
            price: amount,
            quantity: 1,
          }
        ],
        return_url: `${window.location.origin}/payment-status`,
        expired_time: (Math.floor(Date.now() / 1000) + (24 * 60 * 60)), // 24 hours
        signature: generateSignature(TRIPAY_CONFIG.merchantCode, merchantRef, amount)
      };

      // Create transaction
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
        
        // Redirect to payment page or show payment instructions
        if (paymentData.checkout_url) {
          window.location.href = paymentData.checkout_url;
        } else {
          // Show payment instructions in a modal or new page
          navigate('/payment-instructions', { 
            state: { 
              paymentData,
              planDetails 
            } 
          });
        }
      } else {
        toast.error(response.data.message || (language === 'id' ? 'Gagal membuat transaksi' : 'Failed to create transaction'));
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error.response?.data?.message || (language === 'id' ? 'Terjadi kesalahan saat memproses pembayaran' : 'An error occurred while processing payment'));
    } finally {
      setProcessing(false);
    }
  };

  // Group payment channels by type
  const groupedChannels = paymentChannels.reduce((acc, channel) => {
    const group = channel.group;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(channel);
    return acc;
  }, {});

  return (
    <div className="home-container">
      {/* Header/Navigation */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <MessageCircle className="logo-icon" size={32} />
              <span className="logo-text">Shiroine</span>
            </div>
            <nav className="nav-links">
              <a href="/" className="nav-link">{t.features}</a>
              <a href="/#faq" className="nav-link">{t.faq}</a>
              <a href="/#donation" className="nav-link">{t.donation}</a>
              <a href="/pricing" className="nav-link">{t.pricing}</a>
              <Button 
                className="btn-secondary"
                onClick={toggleLanguage}
                style={{ padding: '8px 16px', minHeight: 'auto' }}
              >
                <Globe size={18} />
                {language === 'id' ? 'EN' : 'ID'}
              </Button>
              <Button 
                className="btn-primary btn-join"
                onClick={() => window.open(communityLink, '_blank')}
              >
                {t.joinCommunity}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Checkout Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              {t.checkoutTitle}
            </h1>
            <Button 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              className="mb-6"
            >
              <ArrowLeft size={18} />
              {t.backToPricing}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">{t.orderSummary}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.planType}:</span>
                    <span className="font-medium">{planDetails.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.planDuration}:</span>
                    <span className="font-medium">{planDetails.duration}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>{t.total}:</span>
                      <span className="text-green-500">{planDetails.price}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">{t.paymentMethod}</h2>

                {/* WhatsApp Number Input */}
                <div className="mb-6">
                  <Label htmlFor="whatsapp" className="mb-2 block">
                    {t.whatsappNumber} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder={t.whatsappNumberPlaceholder}
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    {language === 'id' 
                      ? 'Contoh: 628123456789 (gunakan kode negara tanpa +)' 
                      : 'Example: 628123456789 (use country code without +)'}
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin mr-2" size={24} />
                    <span>{t.loadingPaymentMethods}</span>
                  </div>
                ) : paymentChannels.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>{t.noPaymentMethods}</p>
                    <p className="text-sm mt-2">
                      {language === 'id' 
                        ? 'Silakan konfigurasi Tripay API terlebih dahulu' 
                        : 'Please configure Tripay API first'}
                    </p>
                  </div>
                ) : (
                  <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <div className="space-y-4">
                      {Object.entries(groupedChannels).map(([group, channels]) => (
                        <div key={group} className="space-y-2">
                          <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">
                            {group === 'Virtual Account' ? t.virtualAccount :
                             group === 'E-Wallet' ? t.eWallet :
                             group === 'Convenience Store' ? t.retailOutlet :
                             group}
                          </h3>
                          <div className="space-y-2">
                            {channels.map((channel) => (
                              <div
                                key={channel.code}
                                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                                  selectedPaymentMethod === channel.code
                                    ? 'border-green-500 bg-green-500/10'
                                    : 'border-gray-700 hover:border-gray-600'
                                }`}
                                onClick={() => setSelectedPaymentMethod(channel.code)}
                              >
                                <RadioGroupItem value={channel.code} id={channel.code} />
                                <div className="flex-1 flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    {channel.icon_url && (
                                      <img 
                                        src={channel.icon_url} 
                                        alt={channel.name} 
                                        className="h-6 w-auto"
                                      />
                                    )}
                                    <Label htmlFor={channel.code} className="cursor-pointer">
                                      {channel.name}
                                    </Label>
                                  </div>
                                  {channel.total_fee && channel.total_fee.flat && (
                                    <span className="text-sm text-gray-400">
                                      +Rp {channel.total_fee.flat.toLocaleString('id-ID')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                <Button
                  className="w-full mt-6 btn-primary"
                  onClick={handleProceedPayment}
                  disabled={processing || loading || !selectedPaymentMethod || !whatsappNumber}
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      {t.paymentProcessing}
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {t.proceedPayment}
                    </>
                  )}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <MessageCircle size={28} />
                <span className="footer-logo-text">Shiroine</span>
              </div>
              <p className="footer-tagline">
                {t.footerTagline}
              </p>
            </div>
            <div className="footer-links-section">
              <div className="footer-column">
                <h4 className="footer-heading">{t.navigation}</h4>
                <ul className="footer-list">
                  <li><a href="/#features" className="footer-link">{t.features}</a></li>
                  <li><a href="/#faq" className="footer-link">{t.faq}</a></li>
                  <li><a href="/#donation" className="footer-link">{t.donation}</a></li>
                  <li><a href="/pricing" className="footer-link">{t.pricing}</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-heading">{t.community}</h4>
                <ul className="footer-list">
                  <li>
                    <a href={communityLink} target="_blank" rel="noopener noreferrer" className="footer-link">
                      {t.joinWhatsApp}
                    </a>
                  </li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-heading">{t.contactOwner}</h4>
                <ul className="footer-list">
                  <li>
                    <a href={`mailto:${CONTACT_INFO.email}`} className="footer-link footer-contact-link">
                      <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      {CONTACT_INFO.email}
                    </a>
                  </li>
                  <li>
                    <a href={`https://wa.me/${CONTACT_INFO.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="footer-link footer-contact-link">
                      <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      {CONTACT_INFO.whatsappDisplay}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">
              {t.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Checkout;
