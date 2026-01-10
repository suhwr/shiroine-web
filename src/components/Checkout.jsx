import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Check, Loader2, Globe } from 'lucide-react';
import { translations } from '../translations';
import { PAYMENT_API_CONFIG, CONTACT_INFO } from '../config';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';
import axios from 'axios';
import Sidebar from './Sidebar';

const Checkout = () => {
  const [language, setLanguage] = useState('id');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentChannels, setPaymentChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const t = translations[language];

  // Get plan details from navigation state with proper defaults
  const planDetails = React.useMemo(() => {
    const state = location.state || {};
    return {
      id: state.id || 'user-5d',
      duration: state.duration || '5 Days',
      price: state.price || 'Rp 7.000',
      type: state.type || 'User Premium'
    };
  }, [location.state]);

  const communityLink = React.useMemo(() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://gc.shiroine.my.id/';
    }
    return `https://gc.${hostname}/`;
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  // Extract numeric price from string like "Rp 7.000"
  // Note: This assumes Indonesian format (thousands separator with dot)
  // and integer prices only (no decimal cents)
  const getNumericPrice = (priceStr) => {
    // Remove all non-digit characters (Rp, dots, commas, spaces)
    return parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  };

  // Fetch available payment channels from backend (which proxies to Tripay)
  useEffect(() => {
    const fetchPaymentChannels = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `${PAYMENT_API_CONFIG.baseUrl}${PAYMENT_API_CONFIG.endpoints.paymentChannels}`,
          {
            withCredentials: true, // Include cookies
          }
        );

        if (response.data.success) {
          setPaymentChannels(response.data.data);
        } else {
          console.warn('Failed to load payment channels:', response.data.message);
          setPaymentChannels([]);
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

  // Verify user/group
  const handleVerify = async () => {
    if (!whatsappNumber) {
      toast.error(language === 'id' ? 'Masukkan nomor WhatsApp atau ID grup' : 'Enter WhatsApp number or group ID');
      return;
    }

    try {
      setVerifying(true);
      const isGroup = planDetails.type.toLowerCase().includes('group') || planDetails.id.startsWith('group');
      
      const response = await axios.post(
        `${PAYMENT_API_CONFIG.baseUrl}/api/verify-user`,
        {
          identifier: whatsappNumber,
          type: isGroup ? 'group' : 'user'
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setVerified(true);
        setVerificationResult(response.data);
        toast.success(response.data.message);
      } else {
        setVerified(false);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || 
        (language === 'id' ? 'Gagal memverifikasi' : 'Failed to verify');
      toast.error(errorMessage);
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  // Create transaction via backend API
  const handleProceedPayment = async () => {
    // Validate inputs
    if (!whatsappNumber) {
      toast.error(t.whatsappRequired);
      return;
    }

    if (!verified) {
      toast.error(language === 'id' ? 'Harap verifikasi nomor/ID terlebih dahulu' : 'Please verify your number/ID first');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error(t.selectPaymentMethod);
      return;
    }

    try {
      setProcessing(true);

      const amount = getNumericPrice(planDetails.price);
      const isGroup = planDetails.type.toLowerCase().includes('group') || planDetails.id.startsWith('group');
      
      // Prepare transaction data for backend
      const transactionData = {
        method: selectedPaymentMethod,
        amount: amount,
        customerName: verificationResult?.data?.name || `Customer-${whatsappNumber}`,
        customerPhone: isGroup ? '' : whatsappNumber,
        groupId: isGroup ? whatsappNumber : '',
        orderItems: [
          {
            name: `${planDetails.type || 'Premium'} - ${planDetails.duration || 'Subscription'}`,
            price: amount,
            quantity: 1,
          }
        ],
        returnUrl: `${window.location.origin}/payment-verification`,
      };

      // Create transaction via backend
      const response = await axios.post(
        `${PAYMENT_API_CONFIG.baseUrl}${PAYMENT_API_CONFIG.endpoints.createTransaction}`,
        transactionData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true, // Include cookies for payment history
        }
      );

      if (response.data.success) {
        const paymentData = response.data.data;
        
        toast.success(language === 'id' ? 'Transaksi berhasil dibuat!' : 'Transaction created successfully!');
        
        // Redirect to internal payment page for all payment methods
        // Extract invoice ID from merchant_order_id or reference
        const invoiceId = paymentData.merchant_order_id || paymentData.reference;
        
        if (invoiceId) {
          // Give user a moment to see the success message
          setTimeout(() => {
            navigate(`/pay/${invoiceId}`);
          }, 1000);
        } else {
          // Fallback: if no invoice ID, navigate back to pricing
          setTimeout(() => navigate('/pricing'), 2000);
        }
      } else {
        const errorMessage = response.data.message || t.transactionError || (language === 'id' ? 'Gagal membuat transaksi' : 'Failed to create transaction');
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error.response?.data?.message || t.paymentProcessingError || (language === 'id' ? 'Terjadi kesalahan saat memproses pembayaran' : 'An error occurred while processing payment'));
    } finally {
      setProcessing(false);
    }
  };

  // Group payment channels by type with safe fallback
  const groupedChannels = React.useMemo(() => {
    if (!Array.isArray(paymentChannels)) return {};
    
    return paymentChannels.reduce((acc, channel) => {
      const group = channel.group || 'Other';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(channel);
      return acc;
    }, {});
  }, [paymentChannels]);

  return (
    <div className="home-container">
      {/* Header/Navigation */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <Sidebar 
                language={language}
                onLanguageToggle={toggleLanguage}
                communityLink={communityLink}
                translations={t}
              />
              <img src="/android-chrome-192x192.png" alt="Shiroine Logo" className="logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
              <span className="logo-text">Shiroine</span>
            </div>
            <nav className="nav-links">
              <a href="/" className="nav-link">{t.features}</a>
              <a href="/#faq" className="nav-link">{t.faq}</a>
              <a href="/donate" className="nav-link">{t.donation}</a>
              <a href="/pricing" className="nav-link">{t.pricing}</a>
              <Button 
                className="btn-secondary"
                onClick={toggleLanguage}
                style={{ padding: '8px 16px', minHeight: 'auto' }}
              >
                <Globe size={18} />
                {language === 'id' ? 'EN' : 'ID'}
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
              <Card className="checkout-card p-6">
                <h2 className="text-xl font-bold mb-4 text-white">{t.orderSummary}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">{t.planType}:</span>
                    <span className="font-medium text-white">{planDetails.type || 'Premium'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">{t.planDuration}:</span>
                    <span className="font-medium text-white">{planDetails.duration || '-'}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">{t.total}:</span>
                      <span className="text-green-400">{planDetails.price || 'Rp 0'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-2">
              <Card className="checkout-card p-6">
                <h2 className="text-xl font-bold mb-6 text-white">{t.paymentMethod}</h2>

                {/* Premium Stacking Policy Notice */}
                <div className="mb-6 p-4 bg-blue-950 border-2 border-blue-500 rounded-lg">
                  <h3 className="font-semibold text-yellow-300 mb-2">
                    {language === 'id' ? '⚠️ Penting: Kebijakan Premium' : '⚠️ Important: Premium Policy'}
                  </h3>
                  <ul className="text-sm text-white space-y-1">
                    <li>• {language === 'id' 
                      ? 'Premium dapat ditumpuk: jika masih ada sisa durasi, waktu baru akan ditambahkan ke durasi yang tersisa' 
                      : 'Premium can be stacked: if there is remaining time, new time will be added to the remaining duration'}</li>
                    <li>• {language === 'id' 
                      ? 'Special limit akan direset ke 0 dan max_special_limit akan diperbarui sesuai paket baru, meskipun paket sebelumnya memiliki limit lebih tinggi' 
                      : 'Special limit will be reset to 0 and max_special_limit will be updated according to new plan, even if previous plan had higher limit'}</li>
                    <li className="text-yellow-300 font-medium">• {language === 'id' 
                      ? 'Contoh: Jika Anda memiliki paket 30 hari (15 limit) dengan sisa 3 hari, lalu membeli paket 15 hari (10 limit), durasi akan menjadi 18 hari tetapi max_special_limit menjadi 10' 
                      : 'Example: If you have 30 days plan (15 limit) with 3 days remaining, then buy 15 days plan (10 limit), duration becomes 18 days but max_special_limit becomes 10'}</li>
                  </ul>
                </div>

                {/* Phone/Group ID Input with Verification */}
                <div className="mb-6">
                  <Label htmlFor="whatsapp" className="mb-2 block text-white font-semibold">
                    {planDetails.type.toLowerCase().includes('group') || planDetails.id.startsWith('group')
                      ? (language === 'id' ? 'ID Grup' : 'Group ID')
                      : t.whatsappNumber} <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="whatsapp"
                      type="text"
                      placeholder={planDetails.type.toLowerCase().includes('group') || planDetails.id.startsWith('group')
                        ? (language === 'id' ? 'Masukkan ID Grup' : 'Enter Group ID')
                        : t.whatsappNumberPlaceholder}
                      value={whatsappNumber}
                      onChange={(e) => {
                        setWhatsappNumber(e.target.value);
                        setVerified(false);
                        setVerificationResult(null);
                      }}
                      className="flex-1 text-white bg-gray-800/50 border-gray-700 placeholder:text-gray-400"
                      disabled={verifying}
                    />
                    <Button 
                      onClick={handleVerify}
                      disabled={verifying || !whatsappNumber}
                      variant="outline"
                      className="border-gray-700 text-white hover:bg-gray-800 hover:text-white"
                      style={{ minWidth: '100px' }}
                    >
                      {verifying ? (
                        <>
                          <Loader2 size={18} className="animate-spin mr-2" />
                          {language === 'id' ? 'Verifikasi...' : 'Verifying...'}
                        </>
                      ) : (
                        language === 'id' ? 'Verifikasi' : 'Verify'
                      )}
                    </Button>
                  </div>
                  {verified && verificationResult && verificationResult.message && (
                    <div className="mt-2 p-3 bg-green-950 border-2 border-green-500 rounded-md flex items-center gap-2">
                      <Check size={18} className="text-green-300" />
                      <span className="text-sm text-white font-medium">{verificationResult.message}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-200 mt-2 font-medium">
                    {planDetails.type.toLowerCase().includes('group') || planDetails.id.startsWith('group')
                      ? (language === 'id' 
                        ? '💡 Cara mendapatkan ID Grup: Datang ke grup tujuan dan gunakan command .ginfo, lalu ambil ID (contoh: 120363xxxxx) tanpa @g.us' 
                        : '💡 How to get Group ID: Go to the target group and use .ginfo command, then take the ID (example: 120363xxxxx) without @g.us')
                      : (language === 'id' 
                        ? 'Contoh: 628123456789 (gunakan kode negara tanpa +)' 
                        : 'Example: 628123456789 (use country code without +)')}
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8 text-white">
                    <Loader2 className="animate-spin mr-2" size={24} />
                    <span>{t.loadingPaymentMethods}</span>
                  </div>
                ) : paymentChannels.length === 0 ? (
                  <div className="text-center py-8 text-gray-200">
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
                          <h3 className="font-semibold text-sm text-gray-100 uppercase tracking-wide">
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
                                        alt={channel.name || 'Payment method'} 
                                        className="h-6 w-auto"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    )}
                                    <Label htmlFor={channel.code} className="cursor-pointer text-white">
                                      {channel.name || 'Payment Method'}
                                    </Label>
                                  </div>
                                  {channel.total_fee && channel.total_fee.flat && (
                                    <span className="text-sm text-gray-200">
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
