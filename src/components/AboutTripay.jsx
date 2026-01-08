import React, { useState } from 'react';
import { MessageCircle, Globe, CreditCard, Shield, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { translations } from '../translations';
import Footer from './Footer';

const AboutTripay = () => {
  const [language, setLanguage] = useState('id');
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

  const content = {
    id: {
      title: "Tentang Tripay Payment Gateway",
      subtitle: "Gateway Pembayaran Terpercaya untuk Shiroine Bot",
      intro: "Shiroine Bot menggunakan Tripay sebagai payment gateway resmi untuk memproses semua transaksi pembayaran premium. Tripay adalah salah satu payment gateway terkemuka di Indonesia yang telah dipercaya oleh ribuan bisnis online.",
      
      whyTripay: {
        title: "Mengapa Tripay?",
        reasons: [
          {
            icon: Shield,
            title: "Keamanan Terjamin",
            description: "Tripay menggunakan enkripsi tingkat tinggi dan telah tersertifikasi untuk melindungi data dan transaksi Anda."
          },
          {
            icon: CreditCard,
            title: "Banyak Pilihan Pembayaran",
            description: "Mendukung berbagai metode pembayaran termasuk Virtual Account, E-Wallet (QRIS, GoPay, OVO, DANA), dan Retail Outlet (Alfamart, Indomaret)."
          },
          {
            icon: Zap,
            title: "Proses Cepat",
            description: "Konfirmasi pembayaran otomatis dan real-time, sehingga layanan premium Anda langsung aktif setelah pembayaran berhasil."
          },
          {
            icon: CheckCircle,
            title: "Terpercaya",
            description: "Terdaftar dan diawasi oleh Bank Indonesia, serta telah melayani jutaan transaksi dengan tingkat keberhasilan tinggi."
          }
        ]
      },

      paymentMethods: {
        title: "Metode Pembayaran yang Tersedia",
        methods: [
          {
            category: "Virtual Account",
            options: ["BCA", "BNI", "BRI", "Mandiri", "Permata", "BSI", "CIMB Niaga", "Bank Lainnya"]
          },
          {
            category: "E-Wallet",
            options: ["QRIS (Semua E-Wallet)", "GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"]
          },
          {
            category: "Retail Outlet",
            options: ["Alfamart", "Indomaret"]
          }
        ]
      },

      howItWorks: {
        title: "Cara Kerja Pembayaran",
        steps: [
          "Pilih paket premium yang Anda inginkan di halaman Pricing",
          "Masukkan nomor WhatsApp Anda untuk verifikasi",
          "Pilih metode pembayaran yang Anda sukai",
          "Lakukan pembayaran sesuai instruksi yang diberikan",
          "Sistem akan otomatis mengaktifkan layanan premium Anda setelah pembayaran dikonfirmasi",
          "Nikmati fitur premium Shiroine Bot!"
        ]
      },

      security: {
        title: "Keamanan Transaksi",
        description: "Semua transaksi pembayaran diproses melalui backend server yang aman. Website Shiroine tidak menyimpan atau memproses data pembayaran Anda secara langsung. Semua informasi sensitif dienkripsi dan ditangani oleh Tripay dengan standar keamanan tertinggi.",
        features: [
          "Enkripsi SSL/TLS untuk semua komunikasi",
          "Signature verification untuk setiap transaksi",
          "Callback validation untuk konfirmasi pembayaran",
          "Tidak ada penyimpanan data kartu kredit atau informasi sensitif",
          "Compliance dengan standar PCI-DSS"
        ]
      },

      support: {
        title: "Bantuan & Dukungan",
        description: "Jika Anda mengalami kendala dalam proses pembayaran:",
        options: [
          "Hubungi dukungan Tripay: support@tripay.co.id",
          "Hubungi kami di WhatsApp: +62 831-5666-9609",
          "Email: sherdi240@gmail.com",
          "Kunjungi website Tripay: https://tripay.co.id"
        ]
      }
    },
    en: {
      title: "About Tripay Payment Gateway",
      subtitle: "Trusted Payment Gateway for Shiroine Bot",
      intro: "Shiroine Bot uses Tripay as the official payment gateway to process all premium payment transactions. Tripay is one of Indonesia's leading payment gateways trusted by thousands of online businesses.",
      
      whyTripay: {
        title: "Why Tripay?",
        reasons: [
          {
            icon: Shield,
            title: "Guaranteed Security",
            description: "Tripay uses high-level encryption and is certified to protect your data and transactions."
          },
          {
            icon: CreditCard,
            title: "Multiple Payment Options",
            description: "Supports various payment methods including Virtual Account, E-Wallet (QRIS, GoPay, OVO, DANA), and Retail Outlets (Alfamart, Indomaret)."
          },
          {
            icon: Zap,
            title: "Fast Processing",
            description: "Automatic and real-time payment confirmation, so your premium service is immediately activated after successful payment."
          },
          {
            icon: CheckCircle,
            title: "Trusted",
            description: "Registered and supervised by Bank Indonesia, and has served millions of transactions with high success rates."
          }
        ]
      },

      paymentMethods: {
        title: "Available Payment Methods",
        methods: [
          {
            category: "Virtual Account",
            options: ["BCA", "BNI", "BRI", "Mandiri", "Permata", "BSI", "CIMB Niaga", "Other Banks"]
          },
          {
            category: "E-Wallet",
            options: ["QRIS (All E-Wallets)", "GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"]
          },
          {
            category: "Retail Outlet",
            options: ["Alfamart", "Indomaret"]
          }
        ]
      },

      howItWorks: {
        title: "How Payment Works",
        steps: [
          "Select your desired premium package on the Pricing page",
          "Enter your WhatsApp number for verification",
          "Choose your preferred payment method",
          "Make payment according to the instructions provided",
          "The system will automatically activate your premium service after payment confirmation",
          "Enjoy Shiroine Bot premium features!"
        ]
      },

      security: {
        title: "Transaction Security",
        description: "All payment transactions are processed through a secure backend server. Shiroine website does not store or process your payment data directly. All sensitive information is encrypted and handled by Tripay with the highest security standards.",
        features: [
          "SSL/TLS encryption for all communications",
          "Signature verification for every transaction",
          "Callback validation for payment confirmation",
          "No storage of credit card data or sensitive information",
          "Compliance with PCI-DSS standards"
        ]
      },

      support: {
        title: "Help & Support",
        description: "If you experience issues with the payment process:",
        options: [
          "Contact Tripay support: support@tripay.co.id",
          "Contact us on WhatsApp: +62 831-5666-9609",
          "Email: sherdi240@gmail.com",
          "Visit Tripay website: https://tripay.co.id"
        ]
      }
    }
  };

  const currentContent = content[language];

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

      {/* About Tripay Content */}
      <section className="hero-section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h1 className="hero-title mb-4">{currentContent.title}</h1>
            <p className="text-xl text-gray-300 mb-4">{currentContent.subtitle}</p>
            <p className="text-gray-400 mb-8">{currentContent.intro}</p>

            {/* Why Tripay */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '24px',
                color: 'var(--text-primary)'
              }}>{currentContent.whyTripay.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentContent.whyTripay.reasons.map((reason, index) => {
                  const Icon = reason.icon;
                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Icon style={{ color: 'var(--accent-primary)' }} size={32} />
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          marginBottom: '8px',
                          color: 'var(--text-primary)'
                        }}>{reason.title}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{reason.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '24px',
                color: 'var(--text-primary)'
              }}>{currentContent.paymentMethods.title}</h2>
              <div className="space-y-6">
                {currentContent.paymentMethods.methods.map((method, index) => (
                  <div key={index}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: 'var(--accent-primary)'
                    }}>{method.category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {method.options.map((option, idx) => (
                        <span key={idx} style={{
                          padding: '4px 12px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '9999px',
                          fontSize: '14px',
                          color: 'var(--text-secondary)'
                        }}>
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '24px',
                color: 'var(--text-primary)'
              }}>{currentContent.howItWorks.title}</h2>
              <ol className="space-y-3">
                {currentContent.howItWorks.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span style={{
                      width: '32px',
                      height: '32px',
                      background: 'var(--accent-primary)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      color: 'var(--bg-primary)',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', paddingTop: '4px' }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Security */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '16px',
                color: 'var(--text-primary)'
              }}>{currentContent.security.title}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{currentContent.security.description}</p>
              <ul className="space-y-2">
                {currentContent.security.features.map((feature, index) => (
                  <li key={index} className="flex gap-3" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle style={{ color: 'var(--accent-primary)', flexShrink: 0 }} size={20} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '16px',
                color: 'var(--text-primary)'
              }}>{currentContent.support.title}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{currentContent.support.description}</p>
              <ul className="space-y-2">
                {currentContent.support.options.map((option, index) => (
                  <li key={index} className="flex gap-3" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-primary)' }}>•</span>
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 text-center flex gap-4 justify-center">
              <Button onClick={() => navigate('/pricing')} className="btn-primary">
                {language === 'id' ? 'Lihat Paket Premium' : 'View Premium Packages'}
              </Button>
              <Button onClick={() => navigate('/')} variant="outline">
                {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer language={language} />
    </div>
  );
};

export default AboutTripay;
