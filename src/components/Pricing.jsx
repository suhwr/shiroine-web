import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Check, Globe, ExternalLink } from 'lucide-react';
import { translations } from '../translations';
import { CONTACT_INFO, PAYMENT_INFO } from '../config';
import { Button } from './ui/button';
import { Card } from './ui/card';

const Pricing = () => {
  const [language, setLanguage] = useState('id');
  const navigate = useNavigate();
  
  const communityLink = React.useMemo(() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'https://community.shiroine.my.id/';
    }
    return `https://community.${hostname}/`;
  }, []);

  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  const userPlans = [
    {
      id: 'user-5d',
      duration: t.days5,
      price: 'Rp 7.000',
      popular: false,
    },
    {
      id: 'user-15d',
      duration: t.days15,
      price: 'Rp 15.000',
      popular: true,
    },
    {
      id: 'user-1m',
      duration: t.month1,
      price: 'Rp 20.000',
      popular: false,
    },
  ];

  const groupPlans = [
    {
      id: 'group-15d',
      duration: t.days15,
      price: 'Rp 30.000',
      popular: false,
    },
    {
      id: 'group-1m',
      duration: t.month1,
      price: 'Rp 50.000',
      popular: true,
    },
  ];

  const handleBuyPremium = (plan) => {
    // Navigate to checkout page with plan details
    const planData = [...userPlans, ...groupPlans].find(p => p.id === plan);
    
    if (planData) {
      navigate('/checkout', {
        state: {
          id: planData.id,
          duration: planData.duration,
          price: planData.price,
          type: planData.id.startsWith('user') ? t.userPremium : t.groupPremium
        }
      });
    }
  };

  const benefits = [
    t.unlimitedLimit,
    t.premiumFeatures,
    t.prioritySupport,
  ];

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

      {/* Pricing Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              {t.pricingTitle}
            </h1>
            <p className="hero-description">
              {t.pricingDescription}
            </p>
          </div>
        </div>
      </section>

      {/* User Premium Section */}
      <section className="pricing-section">
        <div className="container">
          <div className="pricing-type-header">
            <h2 className="pricing-type-title">{t.userPremium}</h2>
            <p className="pricing-type-description">{t.userPremiumDescription}</p>
          </div>
          <div className="pricing-grid">
            {userPlans.map((plan) => (
              <Card key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && (
                  <div className="popular-badge">
                    <span>{t.popularPlan}</span>
                  </div>
                )}
                <div className="pricing-card-header">
                  <h3 className="pricing-plan-duration">{plan.duration}</h3>
                  <div className="pricing-plan-price">{plan.price}</div>
                </div>
                <div className="pricing-benefits">
                  <p className="benefits-title">{t.benefits}:</p>
                  <ul className="benefits-list">
                    {benefits.map((benefit, idx) => (
                      <li key={idx} className="benefit-item">
                        <Check size={18} className="benefit-check" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pricing-note">
                  <p className="note-text">{t.userNote}</p>
                </div>
                <Button 
                  className={`btn-pricing ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleBuyPremium(plan.id)}
                >
                  {t.buyNow}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Group Premium Section */}
      <section className="pricing-section">
        <div className="container">
          <div className="pricing-type-header">
            <h2 className="pricing-type-title">{t.groupPremium}</h2>
            <p className="pricing-type-description">{t.groupPremiumDescription}</p>
          </div>
          <div className="pricing-grid pricing-grid-group">
            {groupPlans.map((plan) => (
              <Card key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && (
                  <div className="popular-badge">
                    <span>{t.popularPlan}</span>
                  </div>
                )}
                <div className="pricing-card-header">
                  <h3 className="pricing-plan-duration">{plan.duration}</h3>
                  <div className="pricing-plan-price">{plan.price}</div>
                </div>
                <div className="pricing-benefits">
                  <p className="benefits-title">{t.benefits}:</p>
                  <ul className="benefits-list">
                    {benefits.map((benefit, idx) => (
                      <li key={idx} className="benefit-item">
                        <Check size={18} className="benefit-check" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pricing-note">
                  <p className="note-text">{t.groupNote}</p>
                </div>
                <Button 
                  className={`btn-pricing ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleBuyPremium(plan.id)}
                >
                  {t.buyNow}
                </Button>
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
                  <li><a href="/#features" className="footer-link">{t.features}</a></li>
                  <li><a href="/#faq" className="footer-link">{t.faq}</a></li>
                  <li><a href="/#donation" className="footer-link">{t.donation}</a></li>
                  <li><a href="/pricing" className="footer-link">{t.pricing}</a></li>
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

export default Pricing;
