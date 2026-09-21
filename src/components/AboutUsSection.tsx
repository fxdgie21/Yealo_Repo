import React from 'react';
import { Target, Compass, Droplets } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AboutUsSection: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <section id="about" className="py-20 sm:py-28 bg-[#FFFFFF] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading with Handwritten Script Font */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="font-script text-5xl sm:text-6xl text-[#111827] mb-4">
            {t.about.title}
          </h2>
          <div className="w-16 h-1.5 bg-[#FDD023] mx-auto rounded-full mb-8" />

          {/* Main Description */}
          <p className="text-lg sm:text-xl text-slate-700 leading-relaxed font-normal mb-6">
            {language === 'en'
              ? 'Yealo provides fresh, purified, and crystal-clear ice cubes and ice tubes at affordable prices. We offer reliable delivery for cafés, restaurants, stores, catering businesses, and other customers.'
              : 'Nagpo-provide ang Yealo ng fresh, purified, at crystal-clear ice cubes at ice tubes sa abot-kayang presyo. We offer reliable delivery para sa cafés, restaurants, milk tea shops, stores, catering, at iba pang customers.'}
          </p>

          {/* Tagline Callout */}
          <div className="inline-block bg-amber-50 border border-amber-200 px-6 py-3 rounded-full">
            <span className="font-heading font-black text-sm sm:text-base text-[#111827] tracking-wide">
              {language === 'en'
                ? 'Yealo — Fresh Ice, Fair Price. Reliable Delivery.'
                : 'Yealo — Fresh Ice, Presyong Tapat. Reliable Delivery.'}
            </span>
          </div>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 max-w-5xl mx-auto">
          {/* Mission Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFDF0] border border-amber-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#FDD023] flex items-center justify-center text-[#111827] font-black mb-6 shadow-sm">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2">
              {t.about.missionTitle}
            </h3>
            <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
              {t.about.missionDesc}
            </p>
          </div>

          {/* Vision Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFDF0] border border-amber-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#111827] flex items-center justify-center text-[#FDD023] font-black mb-6 shadow-sm">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-700 mb-2">
              {t.about.visionTitle}
            </h3>
            <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
              {t.about.visionDesc}
            </p>
          </div>
        </div>

        {/* 5-Stage Reverse Osmosis Journey Section */}
        <div className="pt-10 border-t border-slate-100">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">
              {language === 'en' ? 'Why crystal ice?' : 'Bakit crystal ice?'}
            </span>
            <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900 block mb-1">
              {language === 'en' ? 'UNCOMPROMISING PURITY' : 'UNCOMPROMISING PURITY & HYGIENE'}
            </span>
            <h3 className="font-heading font-black text-2xl sm:text-3xl text-amber-600 tracking-tight uppercase">
              {t.about.roTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              {t.about.roSubtitle}
            </p>
          </div>

          {/* 5 Numbered Stages in Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {t.about.stages.map((st, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all"
              >
                {/* Yellow Number Badge */}
                <div className="w-14 h-14 rounded-full bg-[#FDD023] text-[#111827] font-heading font-black text-xl flex items-center justify-center shadow-md mb-4 ring-4 ring-amber-100">
                  {idx + 1}
                </div>
                <div className="text-[11px] font-black uppercase tracking-widest text-amber-700 mb-1">
                  {st.stage}
                </div>
                <div className="font-bold text-sm text-[#111827] mb-2">
                  {st.title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
              <Droplets className="w-4 h-4 text-sky-500" />
              <span>
                {language === 'en'
                  ? 'Zero chemical aftertaste • Certified Food-Grade • Tested Daily'
                  : 'Zero chemical aftertaste • Certified Food-Grade • Tested Daily'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
