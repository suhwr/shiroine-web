import React, { useState } from 'react';
import { MessageCircle, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { translations } from '../translations';
import Footer from './Footer';

const TermsOfService = () => {
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
      title: "Ketentuan Layanan",
      lastUpdated: "Terakhir diperbarui: Januari 2026",
      sections: [
        {
          title: "1. Penerimaan Ketentuan",
          content: "Dengan mengakses dan menggunakan layanan Shiroine Bot, Anda setuju untuk terikat oleh ketentuan layanan ini. Jika Anda tidak setuju dengan ketentuan ini, harap tidak menggunakan layanan kami."
        },
        {
          title: "2. Deskripsi Layanan",
          content: "Shiroine Bot adalah layanan bot WhatsApp yang menyediakan berbagai fitur termasuk:\n\n• Fitur AI dan chatbot\n• Konversi dan manipulasi media\n• Permainan dan hiburan\n• Tools dan utilitas\n• Layanan premium dengan fitur tambahan\n\nKami berhak untuk mengubah, menangguhkan, atau menghentikan layanan kapan saja tanpa pemberitahuan sebelumnya."
        },
        {
          title: "3. Akun dan Keamanan",
          content: "• Anda bertanggung jawab atas penggunaan nomor WhatsApp Anda\n• Anda harus menjaga kerahasiaan informasi akun Anda\n• Anda bertanggung jawab atas semua aktivitas yang terjadi melalui nomor WhatsApp Anda\n• Anda harus segera memberi tahu kami jika ada penggunaan tidak sah"
        },
        {
          title: "4. Layanan Premium",
          content: "• Layanan premium memerlukan pembayaran yang telah ditentukan\n• Pembayaran diproses melalui Tripay sebagai gateway pembayaran\n• Tidak ada pengembalian dana setelah aktivasi layanan premium\n• Durasi layanan premium sesuai dengan paket yang dipilih\n• Layanan premium tidak dapat ditransfer ke nomor WhatsApp lain"
        },
        {
          title: "5. Pembayaran dan Penagihan",
          content: "• Semua harga dalam Rupiah Indonesia (IDR)\n• Pembayaran harus dilakukan sebelum aktivasi layanan\n• Kami menggunakan Tripay untuk memproses pembayaran dengan aman\n• Bukti pembayaran akan dikirimkan setelah transaksi berhasil\n• Anda bertanggung jawab atas semua biaya yang terkait dengan pembayaran"
        },
        {
          title: "6. Penggunaan yang Dapat Diterima",
          content: "Anda setuju untuk TIDAK:\n\n• Menggunakan layanan untuk tujuan ilegal atau tidak sah\n• Mengirim spam, malware, atau konten berbahaya\n• Melanggar hak kekayaan intelektual\n• Mencoba mengakses sistem kami secara tidak sah\n• Menggunakan bot untuk harassment atau pelecehan\n• Membuat beban berlebihan pada sistem kami"
        },
        {
          title: "7. Konten Pengguna",
          content: "• Anda mempertahankan semua hak atas konten yang Anda buat\n• Anda memberi kami lisensi untuk menggunakan konten tersebut untuk menyediakan layanan\n• Anda bertanggung jawab atas konten yang Anda bagikan\n• Kami berhak menghapus konten yang melanggar ketentuan ini"
        },
        {
          title: "8. Penolakan Jaminan",
          content: "Layanan disediakan \"SEBAGAIMANA ADANYA\" tanpa jaminan apa pun. Kami tidak menjamin bahwa:\n\n• Layanan akan selalu tersedia atau bebas kesalahan\n• Hasil dari penggunaan layanan akan akurat\n• Cacat atau kesalahan akan diperbaiki\n• Layanan bebas dari virus atau komponen berbahaya"
        },
        {
          title: "9. Batasan Tanggung Jawab",
          content: "Kami tidak bertanggung jawab atas:\n\n• Kerugian langsung, tidak langsung, atau konsekuensial\n• Kehilangan keuntungan atau data\n• Gangguan bisnis\n• Kerusakan akibat penggunaan atau ketidakmampuan menggunakan layanan"
        },
        {
          title: "10. Perubahan Ketentuan",
          content: "Kami berhak mengubah ketentuan layanan ini kapan saja. Perubahan akan berlaku segera setelah diposting di halaman ini. Penggunaan layanan yang berkelanjutan setelah perubahan berarti Anda menerima ketentuan yang baru."
        },
        {
          title: "11. Penghentian",
          content: "Kami berhak menghentikan atau menangguhkan akses Anda ke layanan tanpa pemberitahuan sebelumnya jika:\n\n• Anda melanggar ketentuan layanan\n• Penggunaan Anda merugikan layanan atau pengguna lain\n• Diwajibkan oleh hukum"
        },
        {
          title: "12. Hukum yang Berlaku",
          content: "Ketentuan layanan ini diatur oleh hukum Indonesia. Setiap perselisihan akan diselesaikan di pengadilan Indonesia."
        },
        {
          title: "13. Hubungi Kami",
          content: "Jika Anda memiliki pertanyaan tentang ketentuan layanan ini, silakan hubungi kami:\n\n• Email: sherdi240@gmail.com\n• WhatsApp: +62 831-5666-9609"
        }
      ]
    },
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: January 2026",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: "By accessing and using Shiroine Bot services, you agree to be bound by these terms of service. If you do not agree to these terms, please do not use our services."
        },
        {
          title: "2. Service Description",
          content: "Shiroine Bot is a WhatsApp bot service that provides various features including:\n\n• AI and chatbot features\n• Media conversion and manipulation\n• Games and entertainment\n• Tools and utilities\n• Premium services with additional features\n\nWe reserve the right to modify, suspend, or discontinue the service at any time without prior notice."
        },
        {
          title: "3. Account and Security",
          content: "• You are responsible for using your WhatsApp number\n• You must maintain the confidentiality of your account information\n• You are responsible for all activities that occur through your WhatsApp number\n• You must immediately notify us of any unauthorized use"
        },
        {
          title: "4. Premium Services",
          content: "• Premium services require predetermined payment\n• Payments are processed through Tripay as payment gateway\n• No refunds after premium service activation\n• Premium service duration according to selected package\n• Premium services cannot be transferred to another WhatsApp number"
        },
        {
          title: "5. Payment and Billing",
          content: "• All prices in Indonesian Rupiah (IDR)\n• Payment must be made before service activation\n• We use Tripay to process payments securely\n• Proof of payment will be sent after successful transaction\n• You are responsible for all fees associated with payment"
        },
        {
          title: "6. Acceptable Use",
          content: "You agree NOT to:\n\n• Use the service for illegal or unauthorized purposes\n• Send spam, malware, or harmful content\n• Violate intellectual property rights\n• Attempt to access our systems unauthorized\n• Use the bot for harassment\n• Create excessive load on our systems"
        },
        {
          title: "7. User Content",
          content: "• You retain all rights to content you create\n• You grant us a license to use that content to provide services\n• You are responsible for content you share\n• We reserve the right to remove content that violates these terms"
        },
        {
          title: "8. Disclaimer of Warranties",
          content: "Services are provided \"AS IS\" without any warranties. We do not guarantee that:\n\n• Services will always be available or error-free\n• Results from using services will be accurate\n• Defects or errors will be corrected\n• Services are free from viruses or harmful components"
        },
        {
          title: "9. Limitation of Liability",
          content: "We are not responsible for:\n\n• Direct, indirect, or consequential damages\n• Loss of profits or data\n• Business interruption\n• Damages from use or inability to use services"
        },
        {
          title: "10. Changes to Terms",
          content: "We reserve the right to change these terms of service at any time. Changes will be effective immediately after posting on this page. Continued use of services after changes means you accept the new terms."
        },
        {
          title: "11. Termination",
          content: "We reserve the right to terminate or suspend your access to services without prior notice if:\n\n• You violate the terms of service\n• Your use harms the service or other users\n• Required by law"
        },
        {
          title: "12. Governing Law",
          content: "These terms of service are governed by Indonesian law. Any disputes will be resolved in Indonesian courts."
        },
        {
          title: "13. Contact Us",
          content: "If you have questions about these terms of service, please contact us:\n\n• Email: sherdi240@gmail.com\n• WhatsApp: +62 831-5666-9609"
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

      {/* Terms of Service Content */}
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

export default TermsOfService;
