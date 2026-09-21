import React from 'react';
import { Truck, Sparkles, Settings, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ServicesSectionProps {
  onRequestQuote: (serviceTitle?: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onRequestQuote }) => {
  const { t, language } = useLanguage();

  const serviceCards = [
    {
      id: 'fast-delivery',
      title: language === 'en' ? 'Fast Delivery' : 'Mabilis na Delivery',
      icon: Truck,
      desc:
        language === 'en'
          ? 'Prompt, temperature-protected delivery directly to your doorstep in Muñoz and San Jose City, Nueva Ecija.'
          : 'Mabilis at temperature-protected delivery diretso sa inyong doorstep sa Muñoz at San Jose City, Nueva Ecija.',
      features:
        language === 'en'
          ? ['Local express dispatch', 'Careful insulated handling', 'Scheduled morning & afternoon drops']
          : ['Local express dispatch', 'Insulated handling para hindi matunaw', 'Morning & afternoon scheduled delivery'],
    },
    {
      id: 'purified-clean',
      title: language === 'en' ? 'Purified and Clean' : 'Purified & Super Linis',
      icon: Sparkles,
      desc:
        language === 'en'
          ? 'Processed through an uncompromising 5-stage reverse osmosis filtration system for 100% food-grade crystal ice.'
          : 'Dumadaan sa 5-stage reverse osmosis filtration system para sa 100% food-grade crystal-clear ice.',
      features:
        language === 'en'
          ? ['99.9% TDS eliminated', 'Hygienically sealed bags', 'Zero aftertaste or odor']
          : ['99.9% impurities tinanggal', 'Hygienically sealed bags', 'Walang amoy o bad aftertaste'],
    },
    {
      id: 'reliable-service',
      title: language === 'en' ? 'Reliable Service' : 'Maaasahang Partner',
      icon: Settings,
      desc:
        language === 'en'
          ? 'Dependable supply partnership for cafés, restaurants, convenience stores, and event caterers with emergency restocks.'
          : 'Reliable ice supply partner para sa mga café, kainan, milk tea shop, at caterers na may rush restock support.',
      features:
        language === 'en'
          ? ['Recurring weekly subscriptions', 'Fair, transparent wholesale rates', 'Dedicated customer support']
          : ['Recurring weekly orders', 'Affordable wholesale rates', 'Dedicated customer hotline'],
    },
  ];

  return (
    <section id="services" className="py-24 relative bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Script Font */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="services-title" className="font-script text-5xl sm:text-6xl text-[#111827] mb-3">
            {t.services.title}
          </h2>
          <div className="w-16 h-1.5 bg-[#FDD023] mx-auto rounded-full mb-6" />
          <p className="text-base sm:text-lg text-slate-700 font-normal max-w-xl mx-auto">
            {language === 'en'
              ? 'From daily retail bag pickups to high-volume commercial restaurant restocks, Yealo delivers reliable ice solutions.'
              : 'Mula sa pang-araw-araw na supot hanggang sa bultuhang suplay para sa mga kainan at restawran, narito ang Yealo para sa inyo.'}
          </p>
        </div>

        {/* 3 Core Services Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {serviceCards.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                className="p-8 rounded-3xl bg-white border border-amber-200/90 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Clean Icon Container */}
                  <div className="w-14 h-14 rounded-2xl bg-[#FFFDF0] border border-amber-200 flex items-center justify-center text-[#111827] group-hover:bg-[#FDD023] transition-colors mb-6 shadow-xs">
                    <Icon className="w-7 h-7 stroke-[1.75]" />
                  </div>

                  <h3 className="font-heading font-black text-2xl text-[#111827] mb-3 group-hover:text-amber-600 transition-colors">
                    {srv.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                    {srv.desc}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    {srv.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FDD023]" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={() => onRequestQuote(srv.title)}
                    className="w-full py-2.5 px-4 rounded-full text-xs font-black uppercase tracking-wider text-[#111827] bg-[#FFFDF0] hover:bg-[#FDD023] border border-amber-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Inquire Now' : 'Inquire Na'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
