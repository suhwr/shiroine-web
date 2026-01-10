import React, { useState, useEffect } from 'react';
import { MessageCircle, Globe, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { translations } from '../translations';
import { PAYMENT_API_CONFIG } from '../config';
import Footer from './Footer';
import Sidebar from './Sidebar';
import axios from 'axios';
import { toast } from 'sonner';

const History = () => {
  const [language, setLanguage] = useState('id');
  const [history, setHistory] = useState([]);
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('user'); // 'user' or 'group'
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();
  const t = translations[language];

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

  // Fetch payment history from API
  const fetchHistory = async (page = 1) => {
    if (!identifier) {
      toast.error(language === 'id' ? 'Masukkan nomor WhatsApp atau ID grup' : 'Enter WhatsApp number or group ID');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${PAYMENT_API_CONFIG.baseUrl}/api/payment-history`,
        {
          identifier: identifier,
          type: identifierType,
          page: page
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setHistory(response.data.data.history || []);
        setPagination({
          page: response.data.data.page,
          perPage: response.data.data.perPage,
          totalCount: response.data.data.totalCount,
          totalPages: response.data.data.totalPages,
          hasNext: response.data.data.hasNext,
          hasPrevious: response.data.data.hasPrevious,
        });
        setCurrentPage(page);
      } else {
        toast.error(response.data.message || (language === 'id' ? 'Gagal memuat riwayat' : 'Failed to load history'));
        setHistory([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('History fetch error:', error);
      const errorMessage = error.response?.data?.message || 
        (language === 'id' ? 'Gagal memuat riwayat pembayaran' : 'Failed to load payment history');
      toast.error(errorMessage);
      setHistory([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchHistory(1);
  };

  const handlePageChange = (newPage) => {
    fetchHistory(newPage);
  };

  const getStatusInfo = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return {
          icon: CheckCircle,
          color: 'var(--accent-primary)',
          text: language === 'id' ? 'Berhasil' : 'Paid',
          bgColor: 'rgba(34, 211, 238, 0.1)'
        };
      case 'UNPAID':
        return {
          icon: Clock,
          color: '#f59e0b',
          text: language === 'id' ? 'Menunggu' : 'Pending',
          bgColor: 'rgba(245, 158, 11, 0.1)'
        };
      case 'FAILED':
      case 'EXPIRED':
        return {
          icon: XCircle,
          color: '#ef4444',
          text: language === 'id' ? 'Gagal' : 'Failed',
          bgColor: 'rgba(239, 68, 68, 0.1)'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'var(--text-muted)',
          text: status || (language === 'id' ? 'Tidak Diketahui' : 'Unknown'),
          bgColor: 'var(--bg-tertiary)'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="home-container">
      {/* Header */}
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

      {/* History Content */}
      <section className="hero-section">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h1 className="hero-title mb-4">
              {language === 'id' ? 'Riwayat Pembayaran' : 'Payment History'}
            </h1>
            <p className="text-gray-400 mb-8">
              {language === 'id' 
                ? 'Lihat semua transaksi pembayaran Anda' 
                : 'View all your payment transactions'}
            </p>

            {/* Search Form */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 className="text-lg font-semibold mb-4">
                {language === 'id' ? 'Cari Riwayat Pembayaran' : 'Search Payment History'}
              </h2>
              
              <div className="mb-4">
                <Label className="mb-2 block">
                  {language === 'id' ? 'Tipe' : 'Type'}
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="identifierType"
                      value="user"
                      checked={identifierType === 'user'}
                      onChange={(e) => setIdentifierType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>{language === 'id' ? 'Nomor WhatsApp' : 'WhatsApp Number'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="identifierType"
                      value="group"
                      checked={identifierType === 'group'}
                      onChange={(e) => setIdentifierType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>{language === 'id' ? 'ID Grup' : 'Group ID'}</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={identifierType === 'user' 
                    ? (language === 'id' ? 'Masukkan nomor WhatsApp (contoh: 628123456789)' : 'Enter WhatsApp number (e.g., 628123456789)')
                    : (language === 'id' ? 'Masukkan ID Grup' : 'Enter Group ID')}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                  disabled={loading}
                />
                <Button 
                  onClick={handleSearch}
                  disabled={loading || !identifier}
                  className="btn-primary"
                  style={{ minWidth: '120px' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      {language === 'id' ? 'Mencari...' : 'Searching...'}
                    </>
                  ) : (
                    language === 'id' ? 'Cari' : 'Search'
                  )}
                </Button>
              </div>
            </div>

            {history.length === 0 ? (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <Clock size={48} style={{ 
                  color: 'var(--text-muted)', 
                  margin: '0 auto 16px' 
                }} />
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text-primary)'
                }}>
                  {language === 'id' ? 'Belum Ada Riwayat' : 'No History Yet'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {language === 'id' 
                    ? 'Anda belum memiliki transaksi pembayaran' 
                    : 'You don\'t have any payment transactions yet'}
                </p>
                <Button onClick={() => navigate('/pricing')} className="btn-primary">
                  {language === 'id' ? 'Lihat Paket Premium' : 'View Premium Packages'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((transaction, index) => {
                  const statusInfo = getStatusInfo(transaction.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={index} style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '24px',
                      transition: 'border-color 0.2s ease'
                    }}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Transaction Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: statusInfo.bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <StatusIcon size={20} style={{ color: statusInfo.color }} />
                            </div>
                            <div className="flex-1">
                              <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '4px',
                                color: 'var(--text-primary)'
                              }}>
                                {transaction.orderItems?.[0]?.name || (language === 'id' ? 'Transaksi' : 'Transaction')}
                              </h3>
                              <div style={{ 
                                fontSize: '14px', 
                                color: 'var(--text-muted)',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px'
                              }}>
                                <span>Ref: {transaction.merchantRef || transaction.reference}</span>
                                {transaction.method && (
                                  <>
                                    <span>•</span>
                                    <span>{transaction.method}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-secondary)',
                            marginBottom: '8px'
                          }}>
                            {formatDate(transaction.createdAt)}
                          </div>
                        </div>

                        {/* Amount and Status */}
                        <div className="flex flex-col items-end gap-2">
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                          }}>
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: statusInfo.bgColor,
                            fontSize: '14px',
                            fontWeight: '500',
                            color: statusInfo.color
                          }}>
                            <StatusIcon size={16} />
                            {statusInfo.text}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {transaction.status === 'UNPAID' && (transaction.reference || transaction.merchantRef) && (
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <Button 
                            onClick={() => {
                              // Use merchantRef or reference as the invoice ID
                              const invoiceId = transaction.merchantRef || transaction.reference;
                              navigate(`/pay/${invoiceId}`);
                            }}
                            className="btn-primary"
                            style={{ width: '100%' }}
                          >
                            <ExternalLink size={16} />
                            {language === 'id' ? 'Lanjutkan Pembayaran' : 'Continue Payment'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevious || loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ChevronLeft size={18} />
                  {language === 'id' ? 'Sebelumnya' : 'Previous'}
                </Button>
                
                <span className="text-sm text-gray-400">
                  {language === 'id' ? 'Halaman' : 'Page'} {currentPage} {language === 'id' ? 'dari' : 'of'} {pagination.totalPages}
                  {' '}({pagination.totalCount} {language === 'id' ? 'transaksi' : 'transactions'})
                </span>
                
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext || loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {language === 'id' ? 'Berikutnya' : 'Next'}
                  <ChevronRight size={18} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer language={language} />
    </div>
  );
};

export default History;
