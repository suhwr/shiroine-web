import React, { useState } from 'react';
import { MessageCircle, Download, Smile, Users, Gamepad2, Copy, Check, ChevronDown, ExternalLink, Globe } from 'lucide-react';
import { translations } from '../translations';
import { CONTACT_INFO } from '../config';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from '../hooks/use-toast';
import Sidebar from './Sidebar';

const Home = () => {
  const [copiedCommand, setCopiedCommand] = useState(null);
  const [language, setLanguage] = useState('id');
  const { toast } = useToast();

  // Dynamic community link based on current domain
  const communityLink = React.useMemo(() => {
    const hostname = window.location.hostname;
    // For localhost/development, use a fallback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://gc.shiroine.my.id/';
    }
    return `https://gc.${hostname}/`;
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


  const copyToClipboard = (text, type, id) => {
    navigator.clipboard.writeText(text);
    if (type === 'command') {
      setCopiedCommand(id);
      setTimeout(() => setCopiedCommand(null), 2000);
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
              <a href="#features" className="nav-link">{t.features}</a>
              <a href="#faq" className="nav-link">{t.faq}</a>
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
              <Button 
                className="btn-primary btn-lg"
                onClick={() => window.location.href = '/pricing'}
              >
                {t.buyPremium}
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
                  <li><a href="/donate" className="footer-link">{t.donation}</a></li>
                  <li><a href="/pricing" className="footer-link">{t.pricing}</a></li>
                  <li><a href="/checkout" className="footer-link">{t.checkout}</a></li>
                  <li><a href="/history" className="footer-link">{language === 'id' ? 'Riwayat' : 'History'}</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-heading">{t.legal}</h4>
                <ul className="footer-list">
                  <li><a href="/privacy-policy" className="footer-link">{t.privacyPolicy}</a></li>
                  <li><a href="/terms-of-service" className="footer-link">{t.termsOfService}</a></li>
                  <li><a href="/about-us" className="footer-link">{t.aboutUs}</a></li>
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

export default Home;