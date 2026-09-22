import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, Globe, Truck, Search } from 'lucide-react';
import { YealoLogo } from './YealoLogo';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onOpenOrderModal: (productId?: string) => void;
  onOpenOrdersDrawer: () => void;
  onOpenAdmin: () => void;
  orderCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenOrderModal,
  onOpenOrdersDrawer,
  onOpenAdmin,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Desktop: Brand Logo on Left */}
        <div className="hidden md:flex items-center shrink-0">
          <a
            href="#home"
            id="nav-logo"
            className="flex items-center gap-2 group focus:outline-none hover:scale-105 transition-transform"
            aria-label="Yealo Home"
          >
            <YealoLogo size="sm" />
          </a>
        </div>

        {/* Desktop: Navigation Links in Center */}
        <nav
          className="hidden md:flex items-center gap-4 lg:gap-7 xl:gap-8 mx-4"
          aria-label="Main Navigation"
        >
          <button
            id="nav-link-services"
            onClick={() => handleLinkClick('#services')}
            className="text-xs font-black uppercase tracking-widest text-[#111827] hover:text-amber-800 transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t.nav.services}
          </button>
          <button
            id="nav-link-products"
            onClick={() => handleLinkClick('#products')}
            className="text-xs font-black uppercase tracking-widest text-[#111827] hover:text-amber-800 transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t.nav.products}
          </button>
          <button
            id="nav-link-reviews"
            onClick={() => handleLinkClick('#reviews')}
            className="text-xs font-black uppercase tracking-widest text-[#111827] hover:text-amber-800 transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t.nav.reviews}
          </button>
          <button
            id="nav-link-contacts"
            onClick={() => handleLinkClick('#contact')}
            className="text-xs font-black uppercase tracking-widest text-[#111827] hover:text-amber-800 transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t.nav.contacts}
          </button>
        </nav>

        {/* Desktop: Language Toggle, Track, Dispatch & Cart on Right (Non-overlapping) */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-3 shrink-0">
          {/* Language Toggle */}
          <div
            id="desktop-language-toggle"
            className="flex items-center p-0.5 rounded-full bg-black/5 border border-amber-300/80 shadow-2xs"
            role="group"
            aria-label="Language selection"
          >
            <button
              type="button"
              id="lang-switch-en"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-black tracking-wider transition-all duration-200 cursor-pointer ${
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
              className={`px-2 py-0.5 rounded-full text-[11px] font-black tracking-wider transition-all duration-200 cursor-pointer ${
                language === 'tl'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#111827] hover:text-amber-900'
              }`}
              aria-pressed={language === 'tl'}
              title="TagLish"
            >
              TL
            </button>
          </div>

          {/* Track Order Quick Action */}
          <button
            id="nav-track-order-btn"
            onClick={() => handleLinkClick('#track')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/90 text-slate-800 hover:bg-[#FED74C]/30 hover:text-black border border-amber-300 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Track Your Order"
          >
            <Search className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden lg:inline">{language === 'en' ? 'Track' : 'I-track'}</span>
          </button>

          {/* Dispatch Portal (Store Owner) */}
          <button
            id="nav-dispatch-portal-btn"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#111827] text-[#FDD023] hover:bg-black transition-all shadow-2xs cursor-pointer whitespace-nowrap"
            title="Store Owner / Dispatch Portal"
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Dispatch</span>
          </button>

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
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#111827] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {orderCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile: Controls (Brand Logo + Burger Menu Button) */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Logo on Left for Mobile */}
          <a
            href="#home"
            className="flex items-center group focus:outline-none"
            aria-label="Yealo Home"
          >
            <YealoLogo size="sm" />
          </a>

          {/* Right Mobile Actions: Cart Badge + Burger Menu Button */}
          <div className="flex items-center gap-2">
            {/* Quick Bag Button */}
            <button
              onClick={orderCount > 0 ? onOpenOrdersDrawer : () => onOpenOrderModal()}
              className="relative p-2 rounded-xl text-[#111827] hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="View bag"
              title={orderCount > 0 ? `${orderCount} order(s) placed` : 'Place an order'}
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              {orderCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#111827] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {orderCount}
                </span>
              )}
            </button>

            {/* Burger Menu Button with Clean Amber Hover State */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-none border ${
                mobileMenuOpen
                  ? 'bg-[#111827] text-[#FDD023] border-[#111827] shadow-sm'
                  : 'bg-white/80 text-[#111827] hover:bg-[#FED74C]/30 border-amber-300/80 shadow-xs'
              }`}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Burger Menu Modal / Slide-down) */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu-drawer"
          className="md:hidden bg-[#FFFDF0]/98 backdrop-blur-xl border-b-2 border-amber-300 px-6 py-6 shadow-2xl animate-in slide-in-from-top-3 duration-250 rounded-b-3xl"
        >
          <nav className="flex flex-col gap-3.5 text-center">
            {/* Language Selector In Mobile Drawer */}
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-100/60 border border-amber-200/80 mb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Globe className="w-3.5 h-3.5 text-amber-800" />
                <span>{t.nav.language}:</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-amber-200/50'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('tl')}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    language === 'tl'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-amber-200/50'
                  }`}
                >
                  TagLish
                </button>
              </div>
            </div>

            {/* Nav Links */}
            <button
              onClick={() => handleLinkClick('#services')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold uppercase tracking-widest text-xs text-slate-800 hover:bg-amber-100/80 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <span>{t.nav.services}</span>
              <span className="text-[11px] text-slate-400 font-bold">01</span>
            </button>
            <button
              onClick={() => handleLinkClick('#products')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold uppercase tracking-widest text-xs text-slate-800 hover:bg-amber-100/80 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <span>{t.nav.products}</span>
              <span className="text-[11px] text-slate-400 font-bold">02</span>
            </button>
            <button
              onClick={() => handleLinkClick('#about')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold uppercase tracking-widest text-xs text-slate-800 hover:bg-amber-100/80 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <span>{language === 'en' ? 'ABOUT US' : 'TUNGKOL SA AMIN'}</span>
              <span className="text-[11px] text-slate-400 font-bold">03</span>
            </button>
            <button
              onClick={() => handleLinkClick('#reviews')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold uppercase tracking-widest text-xs text-slate-800 hover:bg-amber-100/80 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <span>{t.nav.reviews}</span>
              <span className="text-[11px] text-slate-400 font-bold">04</span>
            </button>
            <button
              onClick={() => handleLinkClick('#track')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold uppercase tracking-widest text-xs text-amber-900 bg-[#FED74C]/30 hover:bg-[#FED74C]/50 border border-amber-300 transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'en' ? 'TRACK ORDER' : 'I-TRACK ANG ORDER'}</span>
              </div>
              <span className="text-[10px] bg-[#111827] text-[#FDD023] font-black px-2 py-0.5 rounded-full">
                Live
              </span>
            </button>
            <button
              onClick={() => handleLinkClick('#contact')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold uppercase tracking-widest text-xs text-slate-800 hover:bg-amber-100/80 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <span>{t.nav.contacts}</span>
              <span className="text-[11px] text-slate-400 font-bold">05</span>
            </button>

            {/* Bottom Actions: Dispatch Portal & Order Now Button */}
            <div className="pt-3 border-t border-amber-200/80 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-[#111827] bg-[#FED74C] hover:bg-[#FDD023] flex items-center justify-center gap-2 border border-amber-400 shadow-sm cursor-pointer transition-all"
              >
                <Truck className="w-4 h-4 text-[#111827]" />
                <span>Owner Dispatch Portal</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOrderModal();
                }}
                className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-[#111827] hover:bg-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-[#FDD023]" />
                <span>{t.nav.orderNow}</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
