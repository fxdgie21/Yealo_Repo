import React, { useState } from 'react';
import { ArrowDown, ShoppingBag, ShieldCheck, Sparkles, Snowflake, Truck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { IceParticlesCanvas } from './IceParticlesCanvas';

interface HeroProps {
  onOpenOrderModal: (productId?: string, quantity?: number) => void;
  onExploreProducts: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenOrderModal, onExploreProducts }) => {
  const { t, language } = useLanguage();
  const [activeBagPreview, setActiveBagPreview] = useState<'1kg' | '5kg' | '10kg'>('5kg');

  const scrollToAbout = () => {
    const el = document.querySelector('#about');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const bagDetails = {
    '1kg': {
      price: '₱8',
      count: '~35 Large Gourmet Cubes',
      ideal: language === 'en' ? 'Chills 5–8 beverages or smoothies' : 'Sapat sa 5–8 inumin o smoothies',
      tag: language === 'en' ? 'Personal & Home Fridge' : 'Pambahay at Sari-Sari Store',
    },
    '5kg': {
      price: '₱40',
      count: '~180 Dense Pure Tubes',
      ideal: language === 'en' ? 'Chills 25+ glasses or keeps cooler frozen 6+ hrs' : 'Pang-25+ baso o 6+ oras na cooler sa party',
      tag: language === 'en' ? 'Best Seller • Cafés & Parties' : 'Patok sa Café, Milk Tea, & Party',
    },
    '10kg': {
      price: '₱80',
      count: '~380 Wholesale Cold Pieces',
      ideal: language === 'en' ? 'Heavy-duty commercial sack for events & buffets' : 'Pang-negosyo, handaan, catering, at restobar',
      tag: language === 'en' ? 'Commercial & Catering Sack' : 'Pakyawan & Catering Sack',
    },
  };

  return (
    <section
      id="home"
      className="relative pt-24 sm:pt-32 lg:pt-36 pb-20 sm:pb-28 bg-[#FED74C] overflow-hidden select-none"
    >
      {/* Dynamic Sublimating Ice Crystal Mist Canvas */}
      <IceParticlesCanvas density={24} className="pointer-events-none absolute inset-0 z-0 opacity-45" />

      {/* Background subtle light ambient rays */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-[#FDD023] blur-2xl opacity-60"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Lowercase Bold Headline & Yealo Branding */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Live Dispatch & Cold-Chain Radar Tag */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div
                id="hero-location-tag"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 text-[#111827] text-xs font-black tracking-wider uppercase backdrop-blur-xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>{t.hero.badge}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-[#111827] text-[11px] font-black tracking-wider uppercase border border-amber-300 shadow-2xs">
                <Truck className="w-3.5 h-3.5 text-amber-900" />
                <span>
                  {language === 'en' ? 'Dispatch: 20-40 mins' : 'Mabilis na Hatid: 20-40 mins'}
                </span>
              </div>
            </div>

            {/* Lowercase headline matching mockup aesthetic */}
            <h1
              id="hero-headline"
              className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-[70px] text-[#111827] tracking-tight leading-[1.04] mb-5 lowercase break-words"
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
            <p className="text-sm sm:text-base md:text-lg font-medium text-[#111827]/85 max-w-lg mb-6 leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* Interactive Bag Yield Quick-Preview Widget */}
            <div className="w-full max-w-lg mb-7 p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-amber-300/90 shadow-md backdrop-blur-xs">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <Snowflake className="w-3.5 h-3.5 text-amber-700" />
                  <span>{language === 'en' ? 'Instant Bag Size Selector' : 'Piliin ang Sukat ng Bag'}</span>
                </span>
                <span className="text-[11px] font-black font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {bagDetails[activeBagPreview].price} COD
                </span>
              </div>

              {/* 3 Pills for Size */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-amber-100/70 rounded-xl mb-2.5">
                {(['1kg', '5kg', '10kg'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setActiveBagPreview(sz)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                      activeBagPreview === sz
                        ? 'bg-[#111827] text-[#FDD023] shadow-xs'
                        : 'text-slate-700 hover:text-black hover:bg-white/60'
                    }`}
                  >
                    {sz} bag
                  </button>
                ))}
              </div>

              {/* Details of selected bag */}
              <div className="text-xs text-slate-700 flex flex-col gap-0.5">
                <div className="font-bold text-[#111827] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{bagDetails[activeBagPreview].tag} ({bagDetails[activeBagPreview].count})</span>
                </div>
                <p className="text-[11px] text-slate-600 pl-5">
                  {bagDetails[activeBagPreview].ideal}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                id="hero-order-ice-btn"
                onClick={() => onOpenOrderModal(undefined, 1)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest text-[#111827] bg-[#FDD023] hover:bg-amber-300 border-2 border-[#111827] active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>{language === 'en' ? 'ORDER ICE NOW' : 'MAG-ORDER NA'}</span>
              </button>

              <button
                id="hero-about-us-btn"
                onClick={scrollToAbout}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest text-white bg-[#111827] hover:bg-black active:scale-95 transition-all shadow-lg shadow-black/15 cursor-pointer"
              >
                <span>ABOUT US</span>
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Trust badge */}
            <div className="mt-7 flex flex-wrap items-center gap-5 text-xs font-bold text-[#111827]/90">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-900" />
                <span>{t.hero.roPureBadge}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-900" />
                <span>{t.hero.foodGradeBadge}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual - Crystal Clear Ice with Splashes */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Circular yellow contrast backdrop */}
              <div className="relative w-full aspect-square max-w-[440px] mx-auto rounded-full bg-white/20 p-3 sm:p-4 backdrop-blur-xs flex items-center justify-center border-4 border-white/50 shadow-2xl">
                {/* Floating Crystal Ice Composite */}
                <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-sky-100/60 to-white/80 group">
                  <img
                    src="/images/crystal-ice-cubes.jpg"
                    alt="Yealo crystal clear ice cubes and tubes"
                    className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />

                  {/* Frost Micro-badge floating overlay */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-[#111827]/85 backdrop-blur-md text-[#FDD023] border border-amber-400 text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                    <Snowflake className="w-3.5 h-3.5 animate-spin" />
                    <span>-18°C Frozen Solid</span>
                  </div>
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

