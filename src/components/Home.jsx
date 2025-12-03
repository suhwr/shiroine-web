import React, { useState } from 'react';
import { MessageCircle, Download, Smile, Users, Gamepad2, Heart, Copy, Check, ChevronDown, ExternalLink, Globe } from 'lucide-react';
import { translations } from '../translations';
import { QRCodeSVG } from 'qrcode.react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from '../hooks/use-toast';

const Home = () => {
  const [copiedCommand, setCopiedCommand] = useState(null);
  const [copiedDonation, setCopiedDonation] = useState(null);
  const [language, setLanguage] = useState('id');
  const { toast } = useToast();

  // Dynamic community link based on current domain
  const communityLink = React.useMemo(() => {
    const hostname = window.location.hostname;
    // For localhost/development, use a fallback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://community.shiroine.my.id/';
    }
    return `https://community.${hostname}/`;
  }, []);

  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  const iconMap = {
    Download: Download,
    Smile: Smile,
    Users: Users,
    Gamepad2: Gamepad2
  };

  // Feature data with translations
  const features = [
    {
      id: 1,
      title: t.downloaderTitle,
      description: t.downloaderDescription,
      icon: 'Download',
      commands: ['.tiktok <url>', '.instagram <url>', '.youtube <url>']
    },
    {
      id: 2,
      title: t.stickerTitle,
      description: t.stickerDescription,
      icon: 'Smile',
      commands: ['.sticker', '.stickergif']
    },
    {
      id: 3,
      title: t.groupTitle,
      description: t.groupDescription,
      icon: 'Users',
      commands: ['.kick @user', '.promote @user', '.demote @user']
    },
    {
      id: 4,
      title: t.gamesTitle,
      description: t.gamesDescription,
      icon: 'Gamepad2',
      commands: ['.tebakgambar', '.kuis', '.tebakkata']
    }
  ];

  // FAQ data with translations
  const faqData = [
    { id: 1, question: t.faq1Question, answer: t.faq1Answer },
    { id: 2, question: t.faq2Question, answer: t.faq2Answer },
    { id: 3, question: t.faq3Question, answer: t.faq3Answer },
    { id: 4, question: t.faq4Question, answer: t.faq4Answer },
    { id: 5, question: t.faq5Question, answer: t.faq5Answer },
    { id: 6, question: t.faq6Question, answer: t.faq6Answer },
  ];

  // Donation methods data
  const donationMethods = [
    {
      id: 1,
      name: 'QRIS',
      description: t.qrisDescription,
      type: 'qris',
      info: t.qrisInfo,
      qrisString: '00020101021126570011ID.DANA.WWW011893600915377709982202097770998220303UMI51440014ID.CO.QRIS.WWW0215ID10254099274110303UMI5204481453033605802ID5913Shiroine Cell6015Kota Jakarta Ti61051347063044DC7',
      logo: '/images/qris-logo.svg'
    },
    {
      id: 2,
      name: 'DANA',
      description: t.danaDescription,
      type: 'dana',
      info: '083863595922',
      accountName: 'Shiroine Bot',
      logo: '/images/dana-logo.svg'
    },
    {
      id: 3,
      name: 'PayPal',
      description: t.paypalDescription,
      type: 'paypal',
      info: '@shiroine',
      logo: '/images/paypal-logo.svg'
    }
  ];

  const copyToClipboard = (text, type, id) => {
    navigator.clipboard.writeText(text);
    if (type === 'command') {
      setCopiedCommand(id);
      setTimeout(() => setCopiedCommand(null), 2000);
    } else if (type === 'donation') {
      setCopiedDonation(id);
      setTimeout(() => setCopiedDonation(null), 2000);
    }
    toast({
      title: t.copySuccess,
      description: t.copyDescription,
    });
  };

  return (
    <div className="home-container">
      {/* Header/Navigation */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <MessageCircle className="logo-icon" size={32} />
              <span className="logo-text">Shiroine</span>
            </div>
            <nav className="nav-links">
              <a href="#features" className="nav-link">{t.features}</a>
              <a href="#faq" className="nav-link">{t.faq}</a>
              <a href="#donation" className="nav-link">{t.donation}</a>
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

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-text">{t.heroBadge}</span>
            </div>
            <h1 className="hero-title">
              {t.heroTitle} <span className="highlight-text">Shiroine</span>
            </h1>
            <p className="hero-description">
              {t.heroDescription}
            </p>
            <div className="hero-buttons">
              <Button 
                className="btn-primary btn-lg"
                onClick={() => window.open(communityLink, '_blank')}
              >
                <ExternalLink size={20} />
                {t.joinCommunity}
              </Button>
              <Button 
                className="btn-secondary btn-lg"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              >
                {t.viewFeatures}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="how-to-use-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.howToUseTitle}</h2>
            <p className="section-description">{t.howToUseDescription}</p>
          </div>
          <div className="steps-grid">
            <Card className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">{t.step1Title}</h3>
              <p className="step-description">{t.step1Description}</p>
            </Card>
            <Card className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">{t.step2Title}</h3>
              <p className="step-description">{t.step2Description} <code className="command-code">.join &lt;link grup&gt;</code> {t.step2DescriptionEnd}</p>
            </Card>
            <Card className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">{t.step3Title}</h3>
              <p className="step-description">{t.step3Description}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.featuresTitle}</h2>
            <p className="section-description">{t.featuresDescription}</p>
          </div>
          <div className="features-grid">
            {features.map((feature) => {
              const Icon = iconMap[feature.icon];
              return (
                <Card key={feature.id} className="feature-card">
                  <div className="feature-icon">
                    <Icon size={32} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <div className="feature-commands">
                    <p className="commands-label">{t.exampleCommand}</p>
                    {feature.commands.map((cmd, idx) => (
                      <div key={idx} className="command-item">
                        <code className="command-text">{cmd}</code>
                        <button
                          className="copy-button"
                          onClick={() => copyToClipboard(cmd, 'command', `${feature.id}-${idx}`)}
                        >
                          {copiedCommand === `${feature.id}-${idx}` ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.faqTitle}</h2>
            <p className="section-description">{t.faqDescription}</p>
          </div>
          <div className="faq-container">
            <Accordion type="single" collapsible className="faq-accordion">
              {faqData.map((faq) => (
                <AccordionItem key={faq.id} value={`item-${faq.id}`} className="faq-item">
                  <AccordionTrigger className="faq-question">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="faq-answer">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section id="donation" className="donation-section">
        <div className="container">
          <div className="section-header">
            <div className="donation-icon">
              <Heart size={40} />
            </div>
            <h2 className="section-title">{t.donationTitle}</h2>
            <p className="section-description">
              {t.donationDescription}
            </p>
          </div>
          <div className="donation-grid">
            {donationMethods.map((method) => (
              <Card key={method.id} className="donation-card">
                <div className="donation-logo-container">
                  <img 
                    src={method.logo} 
                    alt={`${method.name} logo`} 
                    className="donation-logo"
                  />
                </div>
                <h3 className="donation-method-name">{method.name}</h3>
                <p className="donation-method-description">{method.description}</p>
                {method.type === 'qris' ? (
                  <div className="qris-placeholder">
                    <p className="donation-info">{method.info}</p>
                    <div className="qris-box" style={{ background: 'white', border: 'none', padding: '16px' }}>
                      <QRCodeSVG 
                        value={method.qrisString} 
                        size={168}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="donation-details">
                    {method.accountName && (
                      <p className="account-name">a.n. {method.accountName}</p>
                    )}
                    <div className="info-copy-container">
                      <code className="donation-info-code">{method.info}</code>
                      <button
                        className="copy-button-donation"
                        onClick={() => copyToClipboard(method.info, 'donation', method.id)}
                      >
                        {copiedDonation === method.id ? (
                          <Check size={18} />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
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
                  <li><a href="#features" className="footer-link">{t.features}</a></li>
                  <li><a href="#faq" className="footer-link">{t.faq}</a></li>
                  <li><a href="#donation" className="footer-link">{t.donation}</a></li>
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

export default Home;