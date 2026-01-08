import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Check, Globe, ExternalLink } from 'lucide-react';
import { translations } from '../translations';
import { CONTACT_INFO, PAYMENT_INFO } from '../config';
import { Button } from './ui/button';
import { Card } from './ui/card';
import Footer from './Footer';

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

      <Footer language={language} />
    </div>
  );
};

export default Pricing;
