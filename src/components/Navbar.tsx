import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, ShoppingBag, Globe, Truck, Search, ChevronRight, Phone, Clock } from 'lucide-react';
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
  const [isMounted, setIsMounted] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background body scroll when mobile side drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        id="main-navigation"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-amber-200/50 py-3'
            : 'bg-transparent py-4 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-between">
          {/* Left Side: Services & Products */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-end pr-6 lg:pr-10">
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
          </div>

          {/* Center: Iconic Circular Yellow Yealo Logo */}
          <div className="hidden md:flex items-center justify-center shrink-0">
            <a
              href="#home"
              id="nav-logo"
              className="flex items-center justify-center group focus:outline-none hover:scale-105 transition-transform"
              aria-label="Yealo Home"
            >
              <YealoLogo size="md" />
            </a>
          </div>

          {/* Right Side: Reviews & Contacts */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-start pl-6 lg:pr-2">
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
          </div>

          {/* Desktop: Language Toggle, Track, Dispatch & Cart on Far Right (Cleanly separated) */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0 pl-4 border-l border-amber-300/40">
            {/* Language Toggle */}
            <div className="flex items-center bg-amber-100/80 rounded-full p-0.5 border border-amber-300/60 shadow-2xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-slate-700 hover:text-black'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('tl')}
                className={`px-2 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer ${
                  language === 'tl'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-slate-700 hover:text-black'
                }`}
              >
                TL
              </button>
            </div>

            {/* Track Order Direct Link */}
            <button
              onClick={() => handleLinkClick('#track')}
              className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider text-slate-800 bg-[#FED74C]/40 hover:bg-[#FED74C] border border-amber-300/80 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Track Order Live Status"
            >
              <Search className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden lg:inline">{language === 'en' ? 'Track' : 'Track'}</span>
            </button>

            {/* Store Owner Dispatch Link (Admin Portal) */}
            <button
              id="nav-admin-portal-btn"
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-amber-950 bg-amber-200/80 hover:bg-amber-300 border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Store Owner & Dispatch Portal"
            >
              <Truck className="w-3.5 h-3.5 text-amber-900" />
              <span className="hidden lg:inline">{language === 'en' ? 'Dispatch' : 'Dispatch'}</span>
            </button>

            {/* Order / Bag Indicator */}
            <button
              id="nav-orders-drawer-btn"
              onClick={orderCount > 0 ? onOpenOrdersDrawer : () => onOpenOrderModal()}
              className="relative p-2.5 rounded-full bg-white/80 hover:bg-[#FDD023] border border-amber-300 text-slate-900 shadow-xs transition-colors cursor-pointer"
              aria-label="View recent orders"
              title={orderCount > 0 ? `${orderCount} order(s) placed` : 'Place an order'}
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              {orderCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#111827] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {orderCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: Controls (Brand Logo + Actions + Burger Menu Button) */}
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
                onClick={() => setMobileMenuOpen(true)}
                className="p-2.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-none border bg-white/90 text-[#111827] hover:bg-[#FED74C]/40 border-amber-300 shadow-xs"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 
        PORTALED MOBILE SIDE DRAWER:
        Rendered directly into document.body to avoid being trapped or distorted by 
        the <header>'s backdrop-filter or fixed stacking context in mobile webviews / Facebook Lite!
      */}
      {isMounted &&
        createPortal(
          <div
            id="mobile-side-menu-portal"
            className={`fixed inset-0 z-[99999] md:hidden transition-all duration-300 ${
              mobileMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            {/* Full-screen Dark Backdrop Overlay */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out ${
                mobileMenuOpen ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Off-canvas Sliding Side Panel (Slides in strictly from the right side) */}
            <aside
              className={`fixed top-0 right-0 bottom-0 w-[84%] max-w-[320px] h-[100dvh] bg-[#FFFDF0] shadow-2xl border-l-2 border-amber-300 flex flex-col justify-between transition-transform duration-300 ease-out z-[100000] ${
                mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {/* Top Drawer Header Bar */}
              <div className="shrink-0 p-4 sm:p-5 border-b border-amber-200/80 bg-white flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <YealoLogo size="sm" />
                  <div>
                    <span className="font-heading font-black text-sm tracking-wider text-slate-900 block leading-tight">
                      YEALO
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 tracking-widest uppercase block">
                      Pure Ice Delivery
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-2xl bg-amber-100 hover:bg-amber-200 text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-amber-300"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Scrollable Navigation Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Language Selector */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-100/70 border border-amber-200">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
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

                {/* Navigation Links */}
                <nav className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 pb-1">
                    Menu
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('#services')}
                    className="w-full py-2.5 px-3.5 rounded-2xl font-black uppercase tracking-wider text-xs text-slate-800 hover:bg-amber-100 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>{t.nav.services}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('#products')}
                    className="w-full py-2.5 px-3.5 rounded-2xl font-black uppercase tracking-wider text-xs text-slate-800 hover:bg-amber-100 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>{t.nav.products}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('#about')}
                    className="w-full py-2.5 px-3.5 rounded-2xl font-black uppercase tracking-wider text-xs text-slate-800 hover:bg-amber-100 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>{language === 'en' ? 'About Us' : 'Tungkol Sa Amin'}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('#reviews')}
                    className="w-full py-2.5 px-3.5 rounded-2xl font-black uppercase tracking-wider text-xs text-slate-800 hover:bg-amber-100 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>{t.nav.reviews}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('#track')}
                    className="w-full py-2.5 px-3.5 rounded-2xl font-black uppercase tracking-wider text-xs text-amber-950 bg-[#FED74C]/35 hover:bg-[#FED74C]/60 border border-amber-300 transition-all text-left flex items-center justify-between cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-amber-800" />
                      <span>{language === 'en' ? 'Track Order' : 'I-track ang Order'}</span>
                    </div>
                    <span className="text-[10px] bg-[#111827] text-[#FDD023] font-black px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('#contact')}
                    className="w-full py-2.5 px-3.5 rounded-2xl font-black uppercase tracking-wider text-xs text-slate-800 hover:bg-amber-100 hover:text-black transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>{t.nav.contacts}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </nav>

                {/* Operating Hours & Direct Hotline Callout */}
                <div className="p-3 rounded-2xl bg-white border border-amber-200/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>6:00 AM - 10:00 PM Daily</span>
                  </div>
                  <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hotline: 0917-555-8812</span>
                  </p>
                </div>
              </div>

              {/* Anchored Bottom Actions */}
              <div className="shrink-0 p-4 border-t border-amber-200/80 bg-white space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-[#111827] bg-[#FED74C] hover:bg-[#FDD023] flex items-center justify-center gap-2 border border-amber-400 shadow-xs cursor-pointer transition-all"
                >
                  <Truck className="w-4 h-4 text-[#111827]" />
                  <span>Owner Dispatch Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenOrderModal();
                  }}
                  className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-[#111827] hover:bg-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#FDD023]" />
                  <span>{t.nav.orderNow}</span>
                </button>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
};
