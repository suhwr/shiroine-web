import React, { useState } from 'react';
import { MessageCircle, Heart, Copy, Check, Globe } from 'lucide-react';
import { translations } from '../translations';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from '../hooks/use-toast';
import Footer from './Footer';
import Sidebar from './Sidebar';

const Donate = () => {
  const [copiedDonation, setCopiedDonation] = useState(null);
  const [language, setLanguage] = useState('id');
  const [logoErrors, setLogoErrors] = useState({});
  const { toast } = useToast();

  const communityLink = React.useMemo(() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://gc.shiroine.my.id/';
    }
    return `https://gc.${hostname}/`;
  }, []);

  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

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
      type: 'text',
      info: '083863595922',
      accountName: 'Shiroine Bot',
      logo: '/images/dana-logo.svg'
    },
    {
      id: 3,
      name: 'PayPal',
      description: t.paypalDescription,
      type: 'text',
      info: '@shiroine',
      logo: '/images/paypal-logo.svg'
    }
  ];

  const copyToClipboard = (text, type, id) => {
    navigator.clipboard.writeText(text);
    if (type === 'donation') {
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

      {/* Donation Section */}
      <section className="donation-section" style={{ paddingTop: '120px' }}>
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
                    alt={`${method.name} payment method logo`} 
                    className="donation-logo"
                    loading="lazy"
                    width="120"
                    height="40"
                    onError={(e) => { 
                      e.target.style.display = 'none'; 
                      setLogoErrors(prev => ({ ...prev, [method.id]: true }));
                    }}
                  />
                </div>
                {logoErrors[method.id] && (
                  <h3 className="donation-method-name">{method.name}</h3>
                )}
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

      <Footer language={language} />
    </div>
  );
};

export default Donate;
