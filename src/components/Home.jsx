import React, { useState } from 'react';
import { MessageCircle, Download, Smile, Users, Gamepad2, Heart, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { features, faqData, donationMethods, communityLink } from '../mockData';
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
  const { toast } = useToast();

  const iconMap = {
    Download: Download,
    Smile: Smile,
    Users: Users,
    Gamepad2: Gamepad2
  };

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
      title: 'Berhasil disalin!',
      description: 'Text telah disalin ke clipboard',
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
              <a href="#features" className="nav-link">Fitur</a>
              <a href="#faq" className="nav-link">FAQ</a>
              <a href="#donation" className="nav-link">Donasi</a>
              <Button 
                className="btn-primary btn-join"
                onClick={() => window.open(communityLink, '_blank')}
              >
                Join Komunitas
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
              <span className="badge-text">🤖 Bot WhatsApp Gratis</span>
            </div>
            <h1 className="hero-title">
              Bot WhatsApp <span className="highlight-text">Shiroine</span>
            </h1>
            <p className="hero-description">
              Bot WhatsApp serbaguna dengan fitur downloader, sticker maker, group management, dan games. 
              100% gratis dan mudah digunakan!
            </p>
            <div className="hero-buttons">
              <Button 
                className="btn-primary btn-lg"
                onClick={() => window.open(communityLink, '_blank')}
              >
                <ExternalLink size={20} />
                Join Komunitas
              </Button>
              <Button 
                className="btn-secondary btn-lg"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              >
                Lihat Fitur
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="how-to-use-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Cara Menggunakan</h2>
            <p className="section-description">Tambahkan bot Shiroine ke grup WhatsApp kamu dengan mudah</p>
          </div>
          <div className="steps-grid">
            <Card className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Join Komunitas</h3>
              <p className="step-description">Klik tombol "Join Komunitas" untuk bergabung dengan grup WhatsApp Shiroine</p>
            </Card>
            <Card className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Gunakan Command</h3>
              <p className="step-description">Kirim perintah <code className="command-code">.join &lt;link grup&gt;</code> untuk menambahkan bot ke grup kamu</p>
            </Card>
            <Card className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Maksimal 80 Member</h3>
              <p className="step-description">Pastikan grup kamu memiliki maksimal 80 member agar bot bisa join</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Fitur Unggulan</h2>
            <p className="section-description">Berbagai fitur menarik yang bisa kamu gunakan</p>
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
                    <p className="commands-label">Contoh command:</p>
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
            <h2 className="section-title">Pertanyaan Umum</h2>
            <p className="section-description">Jawaban untuk pertanyaan yang sering ditanyakan</p>
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
            <h2 className="section-title">Support Shiroine</h2>
            <p className="section-description">
              Bot Shiroine 100% gratis! Tapi kamu bisa bantu kami tetap aktif dengan donasi sukarela.
              Setiap kontribusi sangat berarti untuk pengembangan bot.
            </p>
          </div>
          <div className="donation-grid">
            {donationMethods.map((method) => (
              <Card key={method.id} className="donation-card">
                <h3 className="donation-method-name">{method.name}</h3>
                <p className="donation-method-description">{method.description}</p>
                {method.type === 'qris' ? (
                  <div className="qris-placeholder">
                    <div className="qris-box">
                      <span className="qris-text">QR Code</span>
                      <span className="qris-subtext">Ganti dengan QR asli</span>
                    </div>
                    <p className="donation-info">{method.info}</p>
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
                Bot WhatsApp gratis dengan berbagai fitur menarik untuk grup kamu
              </p>
            </div>
            <div className="footer-links-section">
              <div className="footer-column">
                <h4 className="footer-heading">Navigasi</h4>
                <ul className="footer-list">
                  <li><a href="#features" className="footer-link">Fitur</a></li>
                  <li><a href="#faq" className="footer-link">FAQ</a></li>
                  <li><a href="#donation" className="footer-link">Donasi</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 className="footer-heading">Komunitas</h4>
                <ul className="footer-list">
                  <li>
                    <a href={communityLink} target="_blank" rel="noopener noreferrer" className="footer-link">
                      Join Grup WhatsApp
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 Shiroine Bot. Made with 💚 for the community
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;