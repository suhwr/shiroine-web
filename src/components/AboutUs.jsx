import React, { useState } from 'react';
import { MessageCircle, Globe, Heart, Users, Zap, Shield, Code, Star, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { translations } from '../translations';
import Footer from './Footer';
import Sidebar from './Sidebar';

const AboutUs = () => {
  const [language, setLanguage] = useState('id');
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

  const content = {
    id: {
      title: "Tentang Shiroine",
      subtitle: "Bot WhatsApp Gratis untuk Semua",
      intro: "Shiroine adalah bot WhatsApp yang dirancang untuk memudahkan aktivitas digital Anda. Dengan berbagai fitur menarik dan mudah digunakan, Shiroine hadir sebagai solusi gratis untuk kebutuhan grup WhatsApp Anda.",
      
      mission: {
        title: "Misi Kami",
        description: "Menyediakan bot WhatsApp berkualitas tinggi yang dapat diakses oleh semua orang tanpa biaya. Kami percaya bahwa teknologi harus mudah diakses dan bermanfaat untuk komunitas."
      },

      features: {
        title: "Apa yang Kami Tawarkan",
        items: [
          {
            icon: Download,
            title: "Downloader Serbaguna",
            description: "Download konten dari berbagai platform seperti TikTok, Instagram, YouTube, dan lainnya dengan mudah dan cepat."
          },
          {
            icon: Star,
            title: "Fitur Premium",
            description: "Akses ke fitur-fitur eksklusif dengan paket premium yang terjangkau untuk pengalaman yang lebih baik."
          },
          {
            icon: Users,
            title: "Manajemen Grup",
            description: "Kelola grup WhatsApp dengan mudah menggunakan berbagai tools moderasi otomatis."
          },
          {
            icon: Zap,
            title: "Cepat & Responsif",
            description: "Bot yang selalu aktif dan siap merespon perintah Anda dengan cepat."
          }
        ]
      },

      whyShiroine: {
        title: "Mengapa Memilih Shiroine?",
        reasons: [
          {
            icon: Heart,
            title: "100% Gratis",
            description: "Fitur dasar Shiroine dapat digunakan sepenuhnya gratis. Anda hanya perlu upgrade ke premium jika ingin fitur lebih lengkap."
          },
          {
            icon: Shield,
            title: "Aman & Terpercaya",
            description: "Kami mengutamakan keamanan dan privasi pengguna. Data Anda dijaga dengan baik dan tidak disalahgunakan."
          },
          {
            icon: Users,
            title: "Komunitas Aktif",
            description: "Bergabunglah dengan ribuan pengguna Shiroine di komunitas WhatsApp kami untuk berbagi pengalaman dan mendapat bantuan."
          },
          {
            icon: Code,
            title: "Selalu Berkembang",
            description: "Kami terus menambahkan fitur baru dan meningkatkan performa bot berdasarkan feedback dari komunitas."
          }
        ]
      },

      team: {
        title: "Tim Kami",
        description: "Shiroine dikembangkan dan dikelola oleh tim yang berdedikasi untuk memberikan layanan terbaik. Kami terus berinovasi dan mendengarkan feedback dari komunitas untuk meningkatkan pengalaman pengguna."
      },

      values: {
        title: "Nilai-Nilai Kami",
        items: [
          {
            title: "Gratis & Terbuka",
            description: "Kami percaya teknologi harus dapat diakses oleh semua orang"
          },
          {
            title: "Kualitas Tinggi",
            description: "Kami berkomitmen untuk memberikan layanan dengan kualitas terbaik"
          },
          {
            title: "Komunitas First",
            description: "Pengguna adalah prioritas utama kami, feedback Anda membentuk arah pengembangan"
          },
          {
            title: "Inovasi Berkelanjutan",
            description: "Kami tidak pernah berhenti berinovasi untuk memberikan fitur-fitur baru"
          }
        ]
      },

      contact: {
        title: "Hubungi Kami",
        description: "Punya pertanyaan atau saran? Jangan ragu untuk menghubungi kami:",
        options: [
          "WhatsApp: +62 831-5666-9609",
          "Email: sherdi240@gmail.com",
          "Bergabung dengan komunitas WhatsApp kami untuk diskusi dan bantuan"
        ]
      }
    },
    en: {
      title: "About Shiroine",
      subtitle: "Free WhatsApp Bot for Everyone",
      intro: "Shiroine is a WhatsApp bot designed to make your digital activities easier. With various interesting and easy-to-use features, Shiroine comes as a free solution for your WhatsApp group needs.",
      
      mission: {
        title: "Our Mission",
        description: "Providing high-quality WhatsApp bot that can be accessed by everyone for free. We believe that technology should be easily accessible and beneficial to the community."
      },

      features: {
        title: "What We Offer",
        items: [
          {
            icon: Download,
            title: "Versatile Downloader",
            description: "Download content from various platforms like TikTok, Instagram, YouTube, and more easily and quickly."
          },
          {
            icon: Star,
            title: "Premium Features",
            description: "Access exclusive features with affordable premium packages for a better experience."
          },
          {
            icon: Users,
            title: "Group Management",
            description: "Manage WhatsApp groups easily using various automatic moderation tools."
          },
          {
            icon: Zap,
            title: "Fast & Responsive",
            description: "A bot that's always active and ready to respond to your commands quickly."
          }
        ]
      },

      whyShiroine: {
        title: "Why Choose Shiroine?",
        reasons: [
          {
            icon: Heart,
            title: "100% Free",
            description: "Shiroine's basic features can be used completely free. You only need to upgrade to premium if you want more complete features."
          },
          {
            icon: Shield,
            title: "Safe & Trusted",
            description: "We prioritize user security and privacy. Your data is well protected and not misused."
          },
          {
            icon: Users,
            title: "Active Community",
            description: "Join thousands of Shiroine users in our WhatsApp community to share experiences and get help."
          },
          {
            icon: Code,
            title: "Constantly Evolving",
            description: "We continuously add new features and improve bot performance based on community feedback."
          }
        ]
      },

      team: {
        title: "Our Team",
        description: "Shiroine is developed and managed by a team dedicated to providing the best service. We continue to innovate and listen to feedback from the community to improve user experience."
      },

      values: {
        title: "Our Values",
        items: [
          {
            title: "Free & Open",
            description: "We believe technology should be accessible to everyone"
          },
          {
            title: "High Quality",
            description: "We are committed to providing services with the best quality"
          },
          {
            title: "Community First",
            description: "Users are our top priority, your feedback shapes the direction of development"
          },
          {
            title: "Continuous Innovation",
            description: "We never stop innovating to provide new features"
          }
        ]
      },

      contact: {
        title: "Contact Us",
        description: "Have questions or suggestions? Don't hesitate to contact us:",
        options: [
          "WhatsApp: +62 831-5666-9609",
          "Email: sherdi240@gmail.com",
          "Join our WhatsApp community for discussions and support"
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

      {/* About Us Content */}
      <section className="hero-section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h1 className="hero-title mb-4">{currentContent.title}</h1>
            <p className="text-xl text-gray-300 mb-4">{currentContent.subtitle}</p>
            <p className="text-gray-400 mb-8">{currentContent.intro}</p>

            {/* Mission */}
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
              }}>{currentContent.mission.title}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{currentContent.mission.description}</p>
            </div>

            {/* Features We Offer */}
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
              }}>{currentContent.features.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentContent.features.items.map((item, index) => {
                  const Icon = item.icon;
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
                        }}>{item.title}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Why Shiroine */}
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
              }}>{currentContent.whyShiroine.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentContent.whyShiroine.reasons.map((reason, index) => {
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

            {/* Team */}
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
              }}>{currentContent.team.title}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{currentContent.team.description}</p>
            </div>

            {/* Values */}
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
              }}>{currentContent.values.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentContent.values.items.map((value, index) => (
                  <div key={index}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: 'var(--accent-primary)'
                    }}>{value.title}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>{value.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
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
              }}>{currentContent.contact.title}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{currentContent.contact.description}</p>
              <ul className="space-y-2">
                {currentContent.contact.options.map((option, index) => (
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

export default AboutUs;
