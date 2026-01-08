import React from 'react';
import { Menu, X, Home, Download, MessageCircle, Heart, CreditCard, Clock, Shield, FileText, Users, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

const Sidebar = ({ language, onLanguageToggle, communityLink, translations }) => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations;

  const menuItems = [
    { 
      icon: Home, 
      label: language === 'id' ? 'Beranda' : 'Home', 
      href: '/',
      onClick: () => navigate('/')
    },
    { 
      icon: Download, 
      label: t.features, 
      href: '#features',
      onClick: () => {
        if (location.pathname === '/') {
          document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate('/#features');
        }
      }
    },
    { 
      icon: MessageCircle, 
      label: t.faq, 
      href: '#faq',
      onClick: () => {
        if (location.pathname === '/') {
          document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate('/#faq');
        }
      }
    },
    { 
      icon: Heart, 
      label: t.donation, 
      href: '/donate',
      onClick: () => navigate('/donate')
    },
    { 
      icon: CreditCard, 
      label: t.pricing, 
      href: '/pricing',
      onClick: () => navigate('/pricing')
    },
    { 
      icon: Clock, 
      label: language === 'id' ? 'Riwayat' : 'History', 
      href: '/history',
      onClick: () => navigate('/history')
    },
    { 
      icon: Shield, 
      label: t.privacyPolicy, 
      href: '/privacy-policy',
      onClick: () => navigate('/privacy-policy')
    },
    { 
      icon: FileText, 
      label: t.termsOfService, 
      href: '/terms-of-service',
      onClick: () => navigate('/terms-of-service')
    },
    { 
      icon: Users, 
      label: t.aboutUs, 
      href: '/about-us',
      onClick: () => navigate('/about-us')
    },
  ];

  const handleMenuItemClick = (item) => {
    item.onClick();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="sidebar-menu-button"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sidebar-content">
        <SheetHeader>
          <SheetTitle className="sidebar-title">
            <div className="sidebar-logo">
              <img src="/android-chrome-192x192.png" alt="Shiroine Logo" className="sidebar-logo-icon" />
              <span>Shiroine</span>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="sidebar-menu">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href.startsWith('#') && location.pathname === '/' && location.hash === item.href);
            
            return (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item)}
                className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <Button 
            className="sidebar-language-btn"
            onClick={() => {
              onLanguageToggle();
            }}
            variant="outline"
          >
            <Globe size={18} />
            {language === 'id' ? 'EN' : 'ID'}
          </Button>
          
          <Button 
            className="sidebar-community-btn"
            onClick={() => window.open(communityLink, '_blank')}
          >
            <MessageCircle size={18} />
            {t.joinCommunity}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
