import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, Globe } from 'lucide-react';
import { YealoLogo } from './YealoLogo';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onOpenOrderModal: (productId?: string) => void;
  onOpenOrdersDrawer: () => void;
  orderCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenOrderModal,
  onOpenOrdersDrawer,
  orderCount,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-navigation"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-amber-200/50 py-3'
          : 'bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-between md:justify-center">
        {/* Mobile: Logo on Left */}
        <div className="flex md:hidden items-center">
          <a
            href="#home"
            className="flex items-center justify-center group focus:outline-none"
            aria-label="Yealo Home"
          >
            <YealoLogo size="sm" />
          </a>
        </div>

        {/* Desktop: Centered Unified Navigation - All Items Near Each Other */}
        <nav
          className="hidden md:flex items-center gap-6 lg:gap-8 xl:gap-10"
          aria-label="Main Navigation"
        >
          <button
            id="nav-link-services"
            onClick={() => handleLinkClick('#services')}
            className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#111827] hover:text-amber-800 transition-colors cursor-pointer py-1 px-1"
          >
            {t.nav.services}
          </button>
          <button
            id="nav-link-products"
            onClick={() => handleLinkClick('#products')}
            className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#111827] hover:text-amber-800 transition-colors cursor-pointer py-1 px-1"
          >
            {t.nav.products}
          </button>

          {/* Center: Iconic Circular Yellow Yealo Logo */}
          <a
            href="#home"
            id="nav-logo"
            className="flex items-center justify-center group focus:outline-none mx-2 hover:scale-105 transition-transform"
            aria-label="Yealo Home"
          >
            <YealoLogo size="md" />
          </a>

          <button
            id="nav-link-reviews"
            onClick={() => handleLinkClick('#reviews')}
            className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#111827] hover:text-amber-800 transition-colors cursor-pointer py-1 px-1"
          >
            {t.nav.reviews}
          </button>
          <button
            id="nav-link-contacts"
            onClick={() => handleLinkClick('#contact')}
            className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#111827] hover:text-amber-800 transition-colors cursor-pointer py-1 px-1"
          >
            {t.nav.contacts}
          </button>
        </nav>

        {/* Desktop: Language Toggle & Cart positioned on the right */}
        <div className="hidden md:flex items-center gap-3.5 absolute right-4 sm:right-6 lg:right-8">
          {/* Language Toggle */}
          <div
            id="desktop-language-toggle"
            className="flex items-center p-0.5 rounded-full bg-[#111827]/5 border border-amber-300/80 shadow-xs"
            role="group"
            aria-label="Language selection"
          >
            <button
              type="button"
              id="lang-switch-en"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider transition-all duration-200 cursor-pointer ${
                language === 'en'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#111827] hover:text-amber-900'
              }`}
              aria-pressed={language === 'en'}
              title="English"
            >
              EN
            </button>
            <button
              type="button"
              id="lang-switch-tl"
              onClick={() => setLanguage('tl')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider transition-all duration-200 cursor-pointer ${
                language === 'tl'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#111827] hover:text-amber-900'
              }`}
              aria-pressed={language === 'tl'}
              title="TagLish"
            >
              TAGLISH
            </button>
          </div>

          {/* Cart Icon */}
          <button
            id="nav-cart-btn"
            onClick={orderCount > 0 ? onOpenOrdersDrawer : () => onOpenOrderModal()}
            className="relative p-2 rounded-full hover:bg-black/5 text-[#111827] transition-all cursor-pointer"
            aria-label="View shopping bag"
            title={orderCount > 0 ? `${orderCount} order(s) placed` : 'Place an order'}
          >
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            {orderCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#111827] text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                {orderCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile: Controls (Language + Cart + Hamburger) */}
        <div className="flex md:hidden items-center gap-2">
          {/* Compact Mobile Language Toggle */}
          <div
            id="mobile-header-lang-toggle"
            className="flex items-center p-0.5 rounded-full bg-black/5 border border-amber-300/80"
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all ${
                language === 'en'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#111827]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('tl')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all ${
                language === 'tl'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#111827]'
              }`}
            >
              TL
            </button>
          </div>

          <button
            onClick={orderCount > 0 ? onOpenOrdersDrawer : () => onOpenOrderModal()}
            className="relative p-2 rounded-full text-[#111827] hover:bg-black/5"
            aria-label="View bag"
          >
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            {orderCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#111827] text-white text-[9px] font-bold flex items-center justify-center">
                {orderCount}
              </span>
            )}
          </button>

          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#111827] hover:bg-black/5 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu-drawer"
          className="md:hidden bg-white/95 backdrop-blur-xl border-b border-amber-200 px-6 py-5 shadow-xl animate-in slide-in-from-top-4 duration-200"
        >
          <nav className="flex flex-col gap-4 text-center">
            {/* Language Selector In Mobile Drawer */}
            <div className="flex items-center justify-center gap-2 pb-3 border-b border-amber-200/60">
              <Globe className="w-4 h-4 text-amber-800" />
              <span className="text-xs font-bold text-slate-600">{t.nav.language}:</span>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-[#111827] text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('tl')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  language === 'tl'
                    ? 'bg-[#111827] text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                TagLish
              </button>
            </div>

            <button
              onClick={() => handleLinkClick('#services')}
              className="font-extrabold uppercase tracking-widest text-sm text-slate-800 hover:text-amber-600 py-1"
            >
              {t.nav.services}
            </button>
            <button
              onClick={() => handleLinkClick('#products')}
              className="font-extrabold uppercase tracking-widest text-sm text-slate-800 hover:text-amber-600 py-1"
            >
              {t.nav.products}
            </button>
            <button
              onClick={() => handleLinkClick('#about')}
              className="font-extrabold uppercase tracking-widest text-sm text-slate-800 hover:text-amber-600 py-1"
            >
              {language === 'en' ? 'ABOUT US' : 'TUNGKOL SA AMIN'}
            </button>
            <button
              onClick={() => handleLinkClick('#reviews')}
              className="font-extrabold uppercase tracking-widest text-sm text-slate-800 hover:text-amber-600 py-1"
            >
              {t.nav.reviews}
            </button>
            <button
              onClick={() => handleLinkClick('#contact')}
              className="font-extrabold uppercase tracking-widest text-sm text-slate-800 hover:text-amber-600 py-1"
            >
              {t.nav.contacts}
            </button>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOrderModal();
                }}
                className="w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider text-white bg-[#111827] hover:bg-black shadow-md"
              >
                {t.nav.orderNow}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
