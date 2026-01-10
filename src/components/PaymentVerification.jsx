import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, CheckCircle, XCircle, Clock, ArrowLeft, Loader2, Globe } from 'lucide-react';
import { translations } from '../translations';
import { PAYMENT_API_CONFIG, CONTACT_INFO } from '../config';
import { Button } from './ui/button';
import { Card } from './ui/card';
import axios from 'axios';
import Sidebar from './Sidebar';

const PaymentVerification = () => {
  const [language, setLanguage] = useState('id');
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const t = translations[language];

  // Get merchant_order_id or reference from URL parameters
  const merchantOrderId = searchParams.get('merchant_order_id') || searchParams.get('reference') || searchParams.get('order_id');

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

  // Check payment status
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!merchantOrderId) {
        setError(language === 'id' ? 'ID transaksi tidak ditemukan' : 'Transaction ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${PAYMENT_API_CONFIG.baseUrl}${PAYMENT_API_CONFIG.endpoints.transactionStatus}/${merchantOrderId}`,
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setPaymentData(response.data.data);
          setPaymentStatus(response.data.data.status);
        } else {
          setError(response.data.message || (language === 'id' ? 'Gagal memuat status pembayaran' : 'Failed to load payment status'));
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        setError(err.response?.data?.message || (language === 'id' ? 'Terjadi kesalahan saat memeriksa status pembayaran' : 'An error occurred while checking payment status'));
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [merchantOrderId, language]);

  const getStatusIcon = () => {
    if (loading) {
      return <Loader2 className="animate-spin text-blue-400" size={80} />;
    }

    switch (paymentStatus) {
      case 'PAID':
      case 'paid':
      case 'completed':
        return <CheckCircle className="text-green-400" size={80} />;
      case 'UNPAID':
      case 'pending':
        return <Clock className="text-yellow-400" size={80} />;
      case 'FAILED':
      case 'failed':
      case 'EXPIRED':
      case 'expired':
      case 'CANCELLED':
      case 'cancelled':
        return <XCircle className="text-red-400" size={80} />;
      default:
        return <Clock className="text-gray-400" size={80} />;
    }
  };

  const getStatusTitle = () => {
    if (loading) {
      return language === 'id' ? 'Memeriksa Status Pembayaran...' : 'Checking Payment Status...';
    }

    if (error) {
      return language === 'id' ? 'Terjadi Kesalahan' : 'An Error Occurred';
    }

    switch (paymentStatus) {
      case 'PAID':
      case 'paid':
      case 'completed':
        return language === 'id' ? '🎉 Pembayaran Berhasil!' : '🎉 Payment Successful!';
      case 'UNPAID':
      case 'pending':
        return language === 'id' ? '⏳ Menunggu Pembayaran' : '⏳ Waiting for Payment';
      case 'FAILED':
      case 'failed':
        return language === 'id' ? '❌ Pembayaran Gagal' : '❌ Payment Failed';
      case 'EXPIRED':
      case 'expired':
        return language === 'id' ? '⏰ Pembayaran Kadaluarsa' : '⏰ Payment Expired';
      case 'CANCELLED':
      case 'cancelled':
        return language === 'id' ? '🚫 Pembayaran Dibatalkan' : '🚫 Payment Cancelled';
      default:
        return language === 'id' ? 'Status Pembayaran' : 'Payment Status';
    }
  };

  const getStatusMessage = () => {
    if (loading) {
      return language === 'id' 
        ? 'Mohon tunggu, kami sedang memeriksa status pembayaran Anda...' 
        : 'Please wait, we are checking your payment status...';
    }

    if (error) {
      return error;
    }

    switch (paymentStatus) {
      case 'PAID':
      case 'paid':
      case 'completed':
        return language === 'id'
          ? 'Selamat! Pembayaran Anda telah berhasil diproses. Premium Anda telah diaktifkan dan siap digunakan.'
          : 'Congratulations! Your payment has been successfully processed. Your premium has been activated and is ready to use.';
      case 'UNPAID':
      case 'pending':
        return language === 'id'
          ? 'Pembayaran Anda sedang menunggu konfirmasi. Silakan selesaikan pembayaran Anda.'
          : 'Your payment is pending confirmation. Please complete your payment.';
      case 'FAILED':
      case 'failed':
        return language === 'id'
          ? 'Pembayaran Anda gagal diproses. Silakan coba lagi atau hubungi support untuk bantuan.'
          : 'Your payment failed to process. Please try again or contact support for assistance.';
      case 'EXPIRED':
      case 'expired':
        return language === 'id'
          ? 'Pembayaran Anda telah kadaluarsa. Silakan buat transaksi baru untuk melanjutkan.'
          : 'Your payment has expired. Please create a new transaction to continue.';
      case 'CANCELLED':
      case 'cancelled':
        return language === 'id'
          ? 'Pembayaran Anda telah dibatalkan. Anda dapat membuat transaksi baru kapan saja.'
          : 'Your payment has been cancelled. You can create a new transaction anytime.';
      default:
        return language === 'id'
          ? 'Status pembayaran tidak diketahui. Silakan hubungi support untuk bantuan.'
          : 'Payment status unknown. Please contact support for assistance.';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'PAID':
      case 'paid':
      case 'completed':
        return 'border-green-500 bg-green-500/10';
      case 'UNPAID':
      case 'pending':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'FAILED':
      case 'failed':
      case 'EXPIRED':
      case 'expired':
      case 'CANCELLED':
      case 'cancelled':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

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

      {/* Verification Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="max-w-2xl mx-auto">
              <Card className={`checkout-card p-8 border-2 ${getStatusColor()}`}>
                {/* Status Icon */}
                <div className="flex justify-center mb-6">
                  {getStatusIcon()}
                </div>

                {/* Status Title */}
                <h1 className="text-3xl font-bold text-center mb-4 text-white">
                  {getStatusTitle()}
                </h1>

                {/* Status Message */}
                <p className="text-center text-gray-200 text-lg mb-6">
                  {getStatusMessage()}
                </p>

                {/* Payment Details */}
                {!loading && !error && paymentData && (
                  <div className="space-y-4 mb-6 p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-300">{language === 'id' ? 'ID Transaksi' : 'Transaction ID'}:</span>
                      <span className="font-medium text-white">{paymentData.merchant_order_id || merchantOrderId}</span>
                    </div>
                    {paymentData.amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">{language === 'id' ? 'Total Pembayaran' : 'Total Payment'}:</span>
                        <span className="font-medium text-white">
                          Rp {typeof paymentData.amount === 'number' 
                            ? paymentData.amount.toLocaleString('id-ID') 
                            : paymentData.amount}
                        </span>
                      </div>
                    )}
                    {paymentData.payment_method && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">{language === 'id' ? 'Metode Pembayaran' : 'Payment Method'}:</span>
                        <span className="font-medium text-white">{paymentData.payment_method}</span>
                      </div>
                    )}
                    {paymentData.paid_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">{language === 'id' ? 'Waktu Pembayaran' : 'Payment Time'}:</span>
                        <span className="font-medium text-white">
                          {new Date(paymentData.paid_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {(paymentStatus === 'PAID' || paymentStatus === 'paid' || paymentStatus === 'completed') && (
                    <Button 
                      onClick={() => navigate('/')}
                      className="btn-primary"
                    >
                      <CheckCircle size={18} />
                      {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
                    </Button>
                  )}
                  
                  {(paymentStatus === 'FAILED' || paymentStatus === 'failed' || 
                    paymentStatus === 'EXPIRED' || paymentStatus === 'expired' ||
                    paymentStatus === 'CANCELLED' || paymentStatus === 'cancelled') && (
                    <>
                      <Button 
                        onClick={() => navigate('/pricing')}
                        className="btn-primary"
                      >
                        {language === 'id' ? 'Coba Lagi' : 'Try Again'}
                      </Button>
                      <Button 
                        onClick={() => window.open(`https://wa.me/${CONTACT_INFO.whatsappNumber}`, '_blank')}
                        variant="outline"
                      >
                        <MessageCircle size={18} />
                        {language === 'id' ? 'Hubungi Support' : 'Contact Support'}
                      </Button>
                    </>
                  )}

                  {(paymentStatus === 'UNPAID' || paymentStatus === 'pending') && paymentData?.payment_url && (
                    <Button 
                      onClick={() => window.location.href = paymentData.payment_url}
                      className="btn-primary"
                    >
                      {language === 'id' ? 'Lanjutkan Pembayaran' : 'Continue Payment'}
                    </Button>
                  )}

                  {!loading && (
                    <Button 
                      onClick={() => navigate('/')}
                      variant="outline"
                    >
                      <ArrowLeft size={18} />
                      {language === 'id' ? 'Kembali' : 'Go Back'}
                    </Button>
                  )}
                </div>

                {/* Success Additional Info */}
                {(paymentStatus === 'PAID' || paymentStatus === 'paid' || paymentStatus === 'completed') && (
                  <div className="mt-6 p-4 bg-green-950 border-2 border-green-500 rounded-lg">
                    <h3 className="font-semibold text-green-300 mb-2">
                      {language === 'id' ? '✨ Premium Anda Sudah Aktif!' : '✨ Your Premium is Now Active!'}
                    </h3>
                    <ul className="text-sm text-white space-y-1">
                      <li>• {language === 'id' 
                        ? 'Nikmati semua fitur premium tanpa batas' 
                        : 'Enjoy all premium features without limits'}</li>
                      <li>• {language === 'id' 
                        ? 'Akses ke fitur eksklusif premium' 
                        : 'Access to exclusive premium features'}</li>
                      <li>• {language === 'id' 
                        ? 'Dukungan prioritas dari tim kami' 
                        : 'Priority support from our team'}</li>
                    </ul>
                  </div>
                )}
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

export default PaymentVerification;
