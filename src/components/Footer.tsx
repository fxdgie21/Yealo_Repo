import React from 'react';
import { MapPin, Mail, Phone, ChevronUp } from 'lucide-react';
import { YealoLogo } from './YealoLogo';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onScrollToSection: (id: string) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToSection, onOpenAdmin }) => {
  const { t, language } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="relative bg-[#111827] text-white pt-16 pb-12 overflow-hidden">
      {/* Torn Paper / Brush Transition at Top of Black Footer matching mockup */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none -translate-y-[98%]">
        <svg
          viewBox="0 0 1440 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-8 sm:h-10 text-[#111827] preserve-3d"
        >
          <path
            d="M0,40 L0,15 Q360,35 720,12 Q1080,38 1440,15 L1440,40 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 3 Main Pillars matching Mockup: VISIT US, CONTACT US, CALL US */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-16 border-b border-slate-800 text-center md:text-left">
          {/* Pillar 1: VISIT US */}
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FDD023] text-[#111827] flex items-center justify-center font-black">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-black text-sm uppercase tracking-widest text-[#FDD023]">
                {t.footer.visitUsTitle}
              </h4>
            </div>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              {t.footer.visitUsText}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'en'
                ? 'Daily Distribution Hub & Plant Pickups'
                : 'Araw-araw na Hub ng Delivery & Plant Pickups'}
            </p>
          </div>

          {/* Pillar 2: CONTACT US */}
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FDD023] text-[#111827] flex items-center justify-center font-black">
                <Mail className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-black text-sm uppercase tracking-widest text-[#FDD023]">
                {t.footer.contactUsTitle}
              </h4>
            </div>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              <a href="mailto:orders@yealoice.com" className="hover:text-[#FDD023] transition-colors block">
                orders@yealoice.com
              </a>
              <a href="mailto:support@yealoice.com" className="hover:text-[#FDD023] transition-colors block text-xs text-slate-400 mt-1">
                support@yealoice.com
              </a>
            </p>
            <p className="text-xs text-slate-400">
              {language === 'en'
                ? 'Quick response for bulk and recurring orders'
                : 'Mabilis na response para sa bulk at regular orders'}
            </p>
          </div>

          {/* Pillar 3: CALL US */}
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FDD023] text-[#111827] flex items-center justify-center font-black">
                <Phone className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-black text-sm uppercase tracking-widest text-[#FDD023]">
                {t.footer.callUsTitle}
              </h4>
            </div>
            <p className="text-base text-slate-200 font-black leading-relaxed">
              <a href="tel:+639171234567" className="hover:text-[#FDD023] transition-colors block">
                +63 917 123 4567
              </a>
              <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                (044) 940-YEALO
              </span>
            </p>
            <p className="text-xs text-slate-400">
              {language === 'en' ? 'Monday – Sunday: 6:00 AM – 8:00 PM' : 'Monday – Sunday: 6:00 AM – 8:00 PM'}
            </p>
          </div>
        </div>

        {/* Brand Bar & Quick Navigation */}
        <div className="py-10 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <YealoLogo size="sm" />
            <div>
              <span className="font-heading font-black text-lg tracking-wider text-white">
                YEALO
              </span>
              <p className="text-xs text-slate-400">
                {t.footer.tagline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-black uppercase tracking-wider text-slate-400">
            <button
              onClick={() => onScrollToSection('home')}
              className="hover:text-[#FDD023] transition-colors cursor-pointer"
            >
              HOME
            </button>
            <button
              onClick={() => onScrollToSection('services')}
              className="hover:text-[#FDD023] transition-colors cursor-pointer"
            >
              {t.nav.services}
            </button>
            <button
              onClick={() => onScrollToSection('products')}
              className="hover:text-[#FDD023] transition-colors cursor-pointer"
            >
              {t.nav.products}
            </button>
            <button
              onClick={() => onScrollToSection('about')}
              className="hover:text-[#FDD023] transition-colors cursor-pointer"
            >
              ABOUT US
            </button>
            <button
              onClick={() => onScrollToSection('reviews')}
              className="hover:text-[#FDD023] transition-colors cursor-pointer"
            >
              {t.nav.reviews}
            </button>
            <button
              onClick={() => onScrollToSection('contact')}
              className="hover:text-[#FDD023] transition-colors cursor-pointer"
            >
              {t.nav.contacts}
            </button>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <p>© 2026 Yealo. {t.footer.rights} {t.footer.servingNote}</p>
            {onOpenAdmin && (
              <>
                <span>•</span>
                <button
                  onClick={onOpenAdmin}
                  className="text-amber-400/80 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Store Owner / Dispatch Portal (Admin)
                </button>
              </>
            )}
          </div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-[#FDD023] hover:text-white transition-colors cursor-pointer font-bold"
          >
            <span>Back to Top</span>
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
