import React from 'react';
import { ArrowDown, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeroProps {
  onOpenOrderModal: () => void;
  onExploreProducts: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenOrderModal, onExploreProducts }) => {
  const { t, language } = useLanguage();

  const scrollToAbout = () => {
    const el = document.querySelector('#about');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 bg-[#FED74C] overflow-hidden select-none"
    >
      {/* Background subtle light ambient rays */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-[#FDD023] blur-2xl opacity-60"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Lowercase Bold Headline & Yealo Branding */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Location Tag */}
            <div
              id="hero-location-tag"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/10 text-[#111827] text-xs font-black tracking-wider uppercase mb-5 backdrop-blur-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#111827] animate-ping" />
              <span>{t.hero.badge}</span>
            </div>

            {/* Lowercase headline matching mockup aesthetic */}
            <h1
              id="hero-headline"
              className="font-heading font-black text-5xl sm:text-6xl md:text-7xl lg:text-[74px] text-[#111827] tracking-tight leading-[1.02] mb-6 lowercase"
            >
              {language === 'en' ? (
                <>
                  fresh ice<br />
                  fair prices<br />
                  reliable delivery
                </>
              ) : (
                <>
                  fresh ice<br />
                  presyong tapat<br />
                  reliable delivery
                </>
              )}
            </h1>

            {/* Tagline / Subtitle */}
            <p className="text-base sm:text-lg font-medium text-[#111827]/80 max-w-lg mb-8 leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <button
                id="hero-about-us-btn"
                onClick={scrollToAbout}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest text-white bg-[#111827] hover:bg-black active:scale-95 transition-all shadow-lg shadow-black/15 cursor-pointer"
              >
                <span>ABOUT US</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                id="hero-order-ice-btn"
                onClick={onOpenOrderModal}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest text-[#111827] bg-white hover:bg-amber-50 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{language === 'en' ? 'ORDER ICE' : 'ORDER ICE NA'}</span>
              </button>
            </div>

            {/* Trust badge */}
            <div className="mt-8 flex items-center gap-6 text-xs font-bold text-[#111827]/85">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{t.hero.roPureBadge}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.hero.foodGradeBadge}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual - Crystal Clear Ice with Splashes */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Circular yellow contrast backdrop */}
              <div className="relative w-full aspect-square max-w-[460px] mx-auto rounded-full bg-white/20 p-4 backdrop-blur-xs flex items-center justify-center border-4 border-white/40 shadow-2xl">
                {/* Floating Crystal Ice Composite */}
                <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-sky-100/60 to-white/80">
                  <img
                    src="/images/crystal-ice-cubes.jpg"
                    alt="Yealo crystal clear ice cubes and tubes"
                    className="w-full h-full object-cover object-center scale-105 hover:scale-110 transition-transform duration-700"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Torn Paper / Brush Transition to the White Section Below */}
      <div className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-10 sm:h-14 md:h-16 text-white preserve-3d"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C120,45 280,15 440,40 C600,65 720,20 880,48 C1040,70 1200,30 1340,52 C1390,56 1420,50 1440,45 L1440,60 L0,60 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};
