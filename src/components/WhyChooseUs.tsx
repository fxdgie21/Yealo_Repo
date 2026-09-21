import React from 'react';
import { Droplets, Sparkles, Zap, BadgePercent, ArrowUpRight } from 'lucide-react';

interface WhyChooseUsProps {
  onOpenOrderModal: () => void;
}

export const WhyChooseUs: React.FC<WhyChooseUsProps> = ({ onOpenOrderModal }) => {
  const cards = [
    {
      id: 'why-pure-clean',
      title: 'PURE & CLEAN',
      tagline: 'Multi-Stage Filtration',
      description: 'Made using carefully treated water and hygienic production processes.',
      icon: Droplets,
      gradient: 'from-[#00B8E6] to-[#0077B6]',
      lightBg: 'bg-[#EFFFFF]',
      badge: 'Reverse Osmosis',
    },
    {
      id: 'why-high-quality',
      title: 'HIGH QUALITY',
      tagline: 'Ultra-Clear Crystal Solid',
      description: 'Crystal-clear, fresh, and carefully packed for every order.',
      icon: Sparkles,
      gradient: 'from-[#0077B6] to-[#005B8C]',
      lightBg: 'bg-[#E8F8FD]',
      badge: 'Slow Melting',
    },
    {
      id: 'why-fast-delivery',
      title: 'FAST DELIVERY',
      tagline: 'Chilled Express Fleet',
      description: 'Reliable ice delivery for homes, stores, restaurants, and events.',
      icon: Zap,
      gradient: 'from-[#00B8E6] to-[#0099CC]',
      lightBg: 'bg-[#EFFFFF]',
      badge: 'On-Time Guaranteed',
    },
    {
      id: 'why-affordable',
      title: 'AFFORDABLE',
      tagline: 'Direct Manufacturer Pricing',
      description: 'Competitive pricing for both retail and wholesale customers.',
      icon: BadgePercent,
      gradient: 'from-[#0077B6] to-[#00B8E6]',
      lightBg: 'bg-[#E8F8FD]',
      badge: 'Volume Discounts',
    },
  ];

  return (
    <section id="why-choose-us" className="py-24 relative overflow-hidden bg-white">
      {/* Background ambient ice glow */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#EFFFFF] rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D8F6FF]/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFFFFF] border border-[#B6E6F5] text-xs font-bold text-[#0077B6] uppercase tracking-wider mb-4">
            The GlacierPure Standard
          </div>
          <h2
            id="why-choose-us-title"
            className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#0A2540] tracking-tight"
          >
            Why Choose Our Ice?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            We hold ourselves to rigorous hospitality and food-safety standards. Every cube, tube, and
            block is crafted to keep your drinks crisp and chill your supplies longer.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                id={card.id}
                className="group relative p-7 rounded-3xl bg-white border border-[#D8F6FF] hover:border-[#00B8E6] shadow-sm hover:shadow-xl hover:shadow-[#00B8E6]/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                {/* Top Row: Icon & Tag */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl ${card.lightBg} border border-[#B6E6F5] flex items-center justify-center text-[#0077B6] group-hover:scale-110 group-hover:bg-gradient-to-br ${card.gradient} group-hover:text-white transition-all duration-300 shadow-xs`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-bold text-[#0077B6] bg-[#EFFFFF] px-2.5 py-1 rounded-full border border-[#D8F6FF]">
                      {card.badge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="font-heading font-bold text-xl text-[#0A2540] group-hover:text-[#0077B6] transition-colors tracking-tight">
                    {card.title}
                  </h3>
                  <div className="text-xs font-semibold text-[#00B8E6] mt-0.5 mb-3">
                    {card.tagline}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Bottom subtle accent line */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-[#0077B6] transition-colors">
                  <span>Learn details</span>
                  <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick highlight banner underneath */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#EFFFFF] via-white to-[#D8F6FF] border border-[#B6E6F5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00B8E6]/15 flex items-center justify-center text-[#0077B6] shrink-0">
              <Sparkles className="w-5 h-5 text-[#0077B6]" />
            </div>
            <p className="text-sm text-[#0A2540] font-medium">
              Need continuous supply contracts for a bar, café, or dining franchise?
            </p>
          </div>
          <button
            onClick={onOpenOrderModal}
            className="shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0077B6] hover:bg-[#005F94] shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            Get Commercial Contract
          </button>
        </div>
      </div>
    </section>
  );
};
