import React, { useState } from 'react';
import { MessageCircle, Globe, CreditCard, Shield, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { translations } from '../translations';

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
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 text-white">{currentContent.whyTripay.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentContent.whyTripay.reasons.map((reason, index) => {
                  const Icon = reason.icon;
                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Icon className="text-green-500" size={32} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-white">{reason.title}</h3>
                        <p className="text-gray-400">{reason.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 text-white">{currentContent.paymentMethods.title}</h2>
              <div className="space-y-6">
                {currentContent.paymentMethods.methods.map((method, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold mb-3 text-green-500">{method.category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {method.options.map((option, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* How It Works */}
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 text-white">{currentContent.howItWorks.title}</h2>
              <ol className="space-y-3">
                {currentContent.howItWorks.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold text-black">
                      {index + 1}
                    </span>
                    <span className="text-gray-300 pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Security */}
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-white">{currentContent.security.title}</h2>
              <p className="text-gray-300 mb-4">{currentContent.security.description}</p>
              <ul className="space-y-2">
                {currentContent.security.features.map((feature, index) => (
                  <li key={index} className="flex gap-3 text-gray-400">
                    <CheckCircle className="flex-shrink-0 text-green-500" size={20} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Support */}
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-white">{currentContent.support.title}</h2>
              <p className="text-gray-300 mb-4">{currentContent.support.description}</p>
              <ul className="space-y-2">
                {currentContent.support.options.map((option, index) => (
                  <li key={index} className="flex gap-3 text-gray-400">
                    <span className="text-green-500">•</span>
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            </Card>

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
    </div>
  );
};

export default AboutTripay;
