import React, { useState } from 'react';
import { MessageCircle, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { translations } from '../translations';
import Footer from './Footer';

const PrivacyPolicy = () => {
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
      title: "Kebijakan Privasi",
      lastUpdated: "Terakhir diperbarui: Januari 2026",
      sections: [
        {
          title: "1. Informasi yang Kami Kumpulkan",
          content: "Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami ketika menggunakan layanan Shiroine Bot, termasuk:\n\n• Nomor WhatsApp untuk komunikasi dan verifikasi pembayaran\n• Informasi pembayaran untuk pemrosesan transaksi premium\n• Data penggunaan bot untuk meningkatkan layanan\n• Cookie untuk menyimpan preferensi dan riwayat pembayaran"
        },
        {
          title: "2. Penggunaan Cookie",
          content: "Kami menggunakan cookie untuk:\n\n• Menyimpan riwayat pembayaran Anda\n• Menyimpan item dalam keranjang belanja\n• Mengingat preferensi Anda\n• Meningkatkan pengalaman pengguna\n\nCookie kami tidak memiliki masa kadaluarsa dan akan tetap tersimpan di perangkat Anda untuk memberikan pengalaman yang konsisten."
        },
        {
          title: "3. Cara Kami Menggunakan Informasi",
          content: "Informasi yang kami kumpulkan digunakan untuk:\n\n• Memproses transaksi pembayaran Anda\n• Memberikan layanan premium bot\n• Mengirimkan notifikasi terkait layanan\n• Meningkatkan dan mengoptimalkan layanan kami\n• Mencegah penipuan dan penyalahgunaan"
        },
        {
          title: "4. Pembagian Informasi",
          content: "Kami dapat membagikan informasi Anda dengan:\n\n• Tripay sebagai penyedia gateway pembayaran untuk memproses transaksi\n• Penyedia layanan pihak ketiga yang membantu operasional kami\n\nKami tidak akan menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga."
        },
        {
          title: "5. Keamanan Data",
          content: "Kami mengimplementasikan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi Anda dari akses, pengubahan, pengungkapan, atau penghancuran yang tidak sah."
        },
        {
          title: "6. Hak Anda",
          content: "Anda memiliki hak untuk:\n\n• Mengakses informasi pribadi Anda\n• Meminta koreksi data yang tidak akurat\n• Meminta penghapusan data Anda\n• Menolak pemrosesan data tertentu\n• Menarik persetujuan kapan saja"
        },
        {
          title: "7. Perubahan Kebijakan",
          content: "Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Kami akan memberi tahu Anda tentang perubahan dengan memposting kebijakan privasi yang baru di halaman ini."
        },
        {
          title: "8. Hubungi Kami",
          content: "Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di:\n\n• Email: sherdi240@gmail.com\n• WhatsApp: +62 831-5666-9609"
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: January 2026",
      sections: [
        {
          title: "1. Information We Collect",
          content: "We collect information you provide directly to us when using Shiroine Bot services, including:\n\n• WhatsApp number for communication and payment verification\n• Payment information for premium transaction processing\n• Bot usage data to improve services\n• Cookies to store preferences and payment history"
        },
        {
          title: "2. Cookie Usage",
          content: "We use cookies to:\n\n• Store your payment history\n• Save items in your shopping cart\n• Remember your preferences\n• Enhance user experience\n\nOur cookies do not expire and will remain on your device to provide a consistent experience."
        },
        {
          title: "3. How We Use Information",
          content: "The information we collect is used to:\n\n• Process your payment transactions\n• Provide premium bot services\n• Send service-related notifications\n• Improve and optimize our services\n• Prevent fraud and abuse"
        },
        {
          title: "4. Information Sharing",
          content: "We may share your information with:\n\n• Tripay as payment gateway provider to process transactions\n• Third-party service providers who assist our operations\n\nWe will not sell or rent your personal information to third parties."
        },
        {
          title: "5. Data Security",
          content: "We implement appropriate technical and organizational security measures to protect your information from unauthorized access, alteration, disclosure, or destruction."
        },
        {
          title: "6. Your Rights",
          content: "You have the right to:\n\n• Access your personal information\n• Request correction of inaccurate data\n• Request deletion of your data\n• Object to certain data processing\n• Withdraw consent at any time"
        },
        {
          title: "7. Policy Changes",
          content: "We may update this privacy policy from time to time. We will notify you of changes by posting the new privacy policy on this page."
        },
        {
          title: "8. Contact Us",
          content: "If you have questions about this privacy policy, please contact us at:\n\n• Email: sherdi240@gmail.com\n• WhatsApp: +62 831-5666-9609"
        }
      ]
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

      {/* Privacy Policy Content */}
      <section className="hero-section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h1 className="hero-title mb-4">{currentContent.title}</h1>
            <p className="text-gray-400 mb-8">{currentContent.lastUpdated}</p>

            <div className="space-y-6">
              {currentContent.sections.map((section, index) => (
                <div key={index} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: 'var(--text-primary)'
                  }}>{section.title}</h2>
                  <p style={{
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.6'
                  }}>{section.content}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button onClick={() => navigate('/')} className="btn-primary">
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

export default PrivacyPolicy;
