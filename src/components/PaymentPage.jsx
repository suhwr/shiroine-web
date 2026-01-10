import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Globe, Clock, CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { translations } from '../translations';
import { PAYMENT_API_CONFIG, CONTACT_INFO } from '../config';
import { Button } from './ui/button';
import { Card } from './ui/card';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebar from './Sidebar';

const PaymentPage = () => {
  const [language, setLanguage] = useState('id');
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [qrImageError, setQrImageError] = useState(false);
  
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const t = translations[language];
  const pollIntervalRef = useRef(null);

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

  // Fetch payment status
  const fetchPaymentStatus = useCallback(async (showLoadingState = true) => {
    if (!invoiceId) {
      setError(language === 'id' ? 'ID invoice tidak ditemukan' : 'Invoice ID not found');
      setLoading(false);
      return;
    }

    try {
      if (showLoadingState) {
        setLoading(true);
      }
      
      const response = await axios.get(
        `${PAYMENT_API_CONFIG.baseUrl}${PAYMENT_API_CONFIG.endpoints.transactionStatus}/${invoiceId}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        setPaymentData(data);
        
        // If payment is completed, stop polling
        if (data.status === 'paid' || data.status === 'PAID' || data.status === 'completed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          toast.success(language === 'id' ? 'Pembayaran berhasil!' : 'Payment successful!');
        }
        
        // If payment is failed/expired/cancelled, stop polling
        if (['failed', 'FAILED', 'expired', 'EXPIRED', 'cancelled', 'CANCELLED'].includes(data.status)) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } else {
        setError(response.data.message || (language === 'id' ? 'Gagal memuat data pembayaran' : 'Failed to load payment data'));
      }
    } catch (err) {
      console.error('Error fetching payment status:', err);
      setError(err.response?.data?.message || (language === 'id' ? 'Terjadi kesalahan saat memuat data pembayaran' : 'An error occurred while loading payment data'));
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [invoiceId, language]);

  // Initial fetch and setup polling
  useEffect(() => {
    fetchPaymentStatus(true);

    // Set up polling interval - check every 10 seconds
    // This is a balance between real-time updates and server load
    // For Iskapay (no webhooks), this provides near-real-time status updates
    // For Tripay (has webhooks), this ensures consistency and handles missed webhooks
    const POLL_INTERVAL = 10000; // 10 seconds
    
    pollIntervalRef.current = setInterval(() => {
      fetchPaymentStatus(false);
    }, POLL_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchPaymentStatus]);

  // Calculate time remaining
  useEffect(() => {
    if (!paymentData || !paymentData.expired_at) return;

    const expiredAt = paymentData.expired_at;
    
    const updateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(expiredAt);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining(language === 'id' ? 'Kadaluarsa' : 'Expired');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
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
  }, [paymentData?.expired_at, language]);

  const getStatusInfo = () => {
    if (!paymentData) return { icon: Clock, color: 'text-gray-400', text: language === 'id' ? 'Memuat...' : 'Loading...', bgColor: 'bg-gray-500/10' };

    const status = paymentData.status?.toLowerCase();
    
    switch (status) {
      case 'paid':
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          text: language === 'id' ? 'Berhasil' : 'Paid',
          bgColor: 'bg-green-500/10'
        };
      case 'pending':
      case 'unpaid':
        return {
          icon: Clock,
          color: 'text-yellow-400',
          text: language === 'id' ? 'Menunggu' : 'Pending',
          bgColor: 'bg-yellow-500/10'
        };
      case 'failed':
      case 'expired':
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-400',
          text: language === 'id' ? 'Gagal' : 'Failed',
          bgColor: 'bg-red-500/10'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-400',
          text: status || (language === 'id' ? 'Tidak Diketahui' : 'Unknown'),
          bgColor: 'bg-gray-500/10'
        };
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (loading) {
    return (
      <div className="home-container">
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

        <section className="hero-section">
          <div className="container">
            <div className="flex items-center justify-center min-h-[50vh]">
              <Loader2 className="animate-spin text-green-400" size={48} />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="home-container">
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

        <section className="hero-section">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <Card className="checkout-card p-8 border-2 border-red-500 bg-red-500/10">
                <div className="flex justify-center mb-6">
                  <XCircle className="text-red-400" size={80} />
                </div>
                <h1 className="text-3xl font-bold text-center mb-4 text-white">
                  {language === 'id' ? 'Terjadi Kesalahan' : 'An Error Occurred'}
                </h1>
                <p className="text-center text-gray-200 text-lg mb-6">
                  {error || (language === 'id' ? 'Data pembayaran tidak ditemukan' : 'Payment data not found')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="btn-primary"
                  >
                    {language === 'id' ? 'Kembali ke Pricing' : 'Back to Pricing'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const isPaid = paymentData.status === 'paid' || paymentData.status === 'PAID' || paymentData.status === 'completed';
  const isPending = paymentData.status === 'pending' || paymentData.status === 'UNPAID';
  const isFailed = ['failed', 'FAILED', 'expired', 'EXPIRED', 'cancelled', 'CANCELLED'].includes(paymentData.status);

  return (
    <div className="home-container">
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

      <section className="hero-section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              className="mb-6"
            >
              <ArrowLeft size={18} />
              {language === 'id' ? 'Kembali' : 'Back'}
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment QR Code / Status */}
              <div className="lg:col-span-2">
                <Card className={`checkout-card p-8 border-2 ${statusInfo.bgColor} ${
                  isPaid ? 'border-green-500' : isPending ? 'border-yellow-500' : 'border-red-500'
                }`}>
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <StatusIcon className={statusInfo.color} size={48} />
                    </div>
                    
                    <h1 className="text-2xl font-bold mb-2 text-white">
                      {isPaid ? (language === 'id' ? '🎉 Pembayaran Berhasil!' : '🎉 Payment Successful!') :
                       isPending ? (language === 'id' ? '⏳ Menunggu Pembayaran' : '⏳ Waiting for Payment') :
                       (language === 'id' ? '❌ Pembayaran Gagal' : '❌ Payment Failed')}
                    </h1>

                    {/* QRIS Payment - Show QR Code */}
                    {isPending && (paymentData.qr_code || paymentData.payment_number || paymentData.qr_string) && 
                     (paymentData.payment_method === 'qris' || paymentData.payment_method === 'QRIS' || !paymentData.payment_method || paymentData.payment_method.toLowerCase().includes('qris')) && (
                      <>
                        <p className="text-gray-300 mb-6">
                          {language === 'id' 
                            ? 'Scan QR code di bawah ini untuk melakukan pembayaran' 
                            : 'Scan the QR code below to make payment'}
                        </p>
                        
                        {/* QR Code Display */}
                        <div className="flex justify-center mb-6">
                          <div className="bg-white p-4 rounded-lg">
                            {!qrImageError && paymentData.qr_code && paymentData.qr_code.startsWith('http') ? (
                              <img 
                                src={paymentData.qr_code} 
                                alt="QR Code" 
                                className="w-64 h-64 object-contain"
                                onError={() => setQrImageError(true)}
                              />
                            ) : (
                              // Use QRCodeSVG for QR strings (payment_number or qr_string)
                              (paymentData.payment_number || paymentData.qr_string || paymentData.qr_code) && (
                                <QRCodeSVG 
                                  value={paymentData.payment_number || paymentData.qr_string || paymentData.qr_code} 
                                  size={256}
                                  level="H"
                                  includeMargin={true}
                                />
                              )
                            )}
                          </div>
                        </div>

                        {timeRemaining && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-1">
                              {language === 'id' ? 'Waktu Tersisa' : 'Time Remaining'}
                            </p>
                            <p className="text-2xl font-bold text-yellow-400">
                              {timeRemaining}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <RefreshCw size={16} className="animate-spin" />
                          <span>
                            {language === 'id' 
                              ? 'Status diperbarui otomatis setiap 10 detik' 
                              : 'Status updates automatically every 10 seconds'}
                          </span>
                        </div>
                      </>
                    )}

                    {/* PayPal Payment - Show PayPal Button */}
                    {isPending && paymentData.payment_number && paymentData.payment_method && 
                     (paymentData.payment_method.toLowerCase() === 'paypal') && (
                      <>
                        <p className="text-gray-300 mb-6">
                          {language === 'id' 
                            ? 'Klik tombol di bawah untuk melanjutkan pembayaran dengan PayPal' 
                            : 'Click the button below to continue payment with PayPal'}
                        </p>
                        
                        {/* PayPal Button */}
                        <div className="mb-6">
                          <Button 
                            onClick={() => window.open(paymentData.payment_number, '_blank')}
                            className="w-full btn-primary text-lg py-6"
                            size="lg"
                          >
                            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                            </svg>
                            {language === 'id' ? 'Bayar dengan PayPal' : 'Pay with PayPal'}
                          </Button>
                        </div>

                        {timeRemaining && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-1">
                              {language === 'id' ? 'Waktu Tersisa' : 'Time Remaining'}
                            </p>
                            <p className="text-2xl font-bold text-yellow-400">
                              {timeRemaining}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <RefreshCw size={16} className="animate-spin" />
                          <span>
                            {language === 'id' 
                              ? 'Status diperbarui otomatis setelah pembayaran selesai' 
                              : 'Status updates automatically after payment completion'}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Virtual Account Payment - Show Account Number */}
                    {isPending && paymentData.payment_number && paymentData.payment_method && 
                     (paymentData.payment_method.toLowerCase().includes('va') || 
                      paymentData.payment_method.toLowerCase().includes('virtual')) && (
                      <>
                        <p className="text-gray-300 mb-6">
                          {language === 'id' 
                            ? 'Transfer ke nomor Virtual Account di bawah ini' 
                            : 'Transfer to the Virtual Account number below'}
                        </p>
                        
                        {/* Virtual Account Number Display */}
                        <div className="mb-6">
                          <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-6">
                            <p className="text-sm text-gray-400 mb-2">
                              {language === 'id' ? 'Nomor Virtual Account' : 'Virtual Account Number'}
                            </p>
                            <div className="flex items-center justify-center gap-4">
                              <p className="text-3xl font-mono font-bold text-yellow-400 tracking-wider">
                                {paymentData.payment_number}
                              </p>
                              <Button
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(paymentData.payment_number);
                                  toast.success(language === 'id' ? 'Nomor disalin!' : 'Number copied!');
                                }}
                                className="btn-secondary"
                              >
                                {language === 'id' ? 'Salin' : 'Copy'}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-950 border-2 border-blue-500 rounded-lg p-4 mb-6">
                          <h3 className="font-semibold text-blue-300 mb-2">
                            {language === 'id' ? 'Cara Pembayaran:' : 'How to Pay:'}
                          </h3>
                          <ol className="text-sm text-white space-y-1 list-decimal list-inside">
                            <li>{language === 'id' 
                              ? 'Buka aplikasi mobile banking atau ATM' 
                              : 'Open your mobile banking app or ATM'}</li>
                            <li>{language === 'id' 
                              ? 'Pilih menu Transfer' 
                              : 'Select Transfer menu'}</li>
                            <li>{language === 'id' 
                              ? 'Masukkan nomor Virtual Account di atas' 
                              : 'Enter the Virtual Account number above'}</li>
                            <li>{language === 'id' 
                              ? 'Konfirmasi dan selesaikan pembayaran' 
                              : 'Confirm and complete the payment'}</li>
                          </ol>
                        </div>

                        {timeRemaining && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-1">
                              {language === 'id' ? 'Waktu Tersisa' : 'Time Remaining'}
                            </p>
                            <p className="text-2xl font-bold text-yellow-400">
                              {timeRemaining}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <RefreshCw size={16} className="animate-spin" />
                          <span>
                            {language === 'id' 
                              ? 'Status diperbarui otomatis setiap 10 detik' 
                              : 'Status updates automatically every 10 seconds'}
                          </span>
                        </div>
                      </>
                    )}

                    {isPending && !paymentData.qr_code && !paymentData.payment_number && !paymentData.qr_string && paymentData.checkout_url && (
                      <>
                        <p className="text-gray-300 mb-6">
                          {language === 'id' 
                            ? 'Klik tombol di bawah untuk melanjutkan ke halaman pembayaran' 
                            : 'Click the button below to continue to payment page'}
                        </p>
                        
                        <Button 
                          onClick={() => window.open(paymentData.checkout_url, '_blank')}
                          className="btn-primary mb-6"
                          size="lg"
                        >
                          {language === 'id' ? 'Bayar Sekarang' : 'Pay Now'}
                        </Button>

                        {timeRemaining && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-1">
                              {language === 'id' ? 'Waktu Tersisa' : 'Time Remaining'}
                            </p>
                            <p className="text-2xl font-bold text-yellow-400">
                              {timeRemaining}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <RefreshCw size={16} className="animate-spin" />
                          <span>
                            {language === 'id' 
                              ? 'Status diperbarui otomatis setiap 10 detik' 
                              : 'Status updates automatically every 10 seconds'}
                          </span>
                        </div>
                      </>
                    )}

                    {isPaid && (
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
                        </ul>
                      </div>
                    )}

                    {isFailed && (
                      <div className="mt-6">
                        <p className="text-gray-300 mb-4">
                          {language === 'id'
                            ? 'Pembayaran Anda telah gagal atau kadaluarsa. Silakan buat transaksi baru.'
                            : 'Your payment has failed or expired. Please create a new transaction.'}
                        </p>
                        <Button 
                          onClick={() => navigate('/pricing')}
                          className="btn-primary"
                        >
                          {language === 'id' ? 'Coba Lagi' : 'Try Again'}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Payment Details */}
              <div className="lg:col-span-1">
                <Card className="checkout-card p-6">
                  <h2 className="text-xl font-bold mb-4 text-white">
                    {language === 'id' ? 'Detail Pembayaran' : 'Payment Details'}
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">{language === 'id' ? 'Invoice ID' : 'Invoice ID'}:</span>
                      <span className="font-medium text-white text-sm break-all">{paymentData.merchant_order_id || invoiceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">{language === 'id' ? 'Metode' : 'Method'}:</span>
                      <span className="font-medium text-white">{paymentData.payment_method || 'QRIS'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">{language === 'id' ? 'Total' : 'Total'}:</span>
                      <span className="font-medium text-white">{formatCurrency(paymentData.total_amount || paymentData.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">{language === 'id' ? 'Status' : 'Status'}:</span>
                      <span className={`font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
                    </div>
                    {paymentData.paid_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">{language === 'id' ? 'Dibayar' : 'Paid At'}:</span>
                        <span className="font-medium text-white text-sm">
                          {new Date(paymentData.paid_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    {paymentData.created_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">{language === 'id' ? 'Dibuat' : 'Created'}:</span>
                        <span className="font-medium text-white text-sm">
                          {new Date(paymentData.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>

                  {isPaid && (
                    <div className="mt-6">
                      <Button 
                        onClick={() => navigate('/')}
                        className="w-full btn-primary"
                      >
                        {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
                      </Button>
                    </div>
                  )}
                </Card>

                {isPending && (
                  <Card className="checkout-card p-6 mt-4">
                    <h3 className="font-semibold text-white mb-3">
                      {language === 'id' ? '💡 Cara Pembayaran' : '💡 How to Pay'}
                    </h3>
                    <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                      <li>{language === 'id' ? 'Buka aplikasi e-wallet Anda' : 'Open your e-wallet app'}</li>
                      <li>{language === 'id' ? 'Pilih menu Scan QR' : 'Select Scan QR menu'}</li>
                      <li>{language === 'id' ? 'Scan QR code di atas' : 'Scan the QR code above'}</li>
                      <li>{language === 'id' ? 'Konfirmasi pembayaran' : 'Confirm payment'}</li>
                      <li>{language === 'id' ? 'Status akan diperbarui otomatis' : 'Status will update automatically'}</li>
                    </ol>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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

export default PaymentPage;
