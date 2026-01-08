import React, { useState, useEffect } from 'react';
import { MessageCircle, Globe, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { translations } from '../translations';
import { getPaymentHistory } from '../lib/cookies';
import Footer from './Footer';

const History = () => {
  const [language, setLanguage] = useState('id');
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const t = translations[language];

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

  useEffect(() => {
    // Load payment history from cookies
    const paymentHistory = getPaymentHistory();
    setHistory(paymentHistory);
  }, []);

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
                      {transaction.status === 'UNPAID' && transaction.reference && (
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <Button 
                            onClick={() => window.open(`https://tripay.co.id/checkout/${transaction.reference}`, '_blank')}
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
          </div>
        </div>
      </section>

      <Footer language={language} />
    </div>
  );
};

export default History;
