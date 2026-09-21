import React from 'react';
import { Snowflake, ArrowRight, PhoneCall } from 'lucide-react';
import { IceParticlesCanvas } from './IceParticlesCanvas';

interface CallToActionProps {
  onOpenOrderModal: () => void;
  onScrollToContact: () => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  onOpenOrderModal,
  onScrollToContact,
}) => {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-r from-[#0077B6] via-[#0099CC] to-[#00B8E6] text-white">
      {/* Dynamic Ice Particle Canvas */}
      <IceParticlesCanvas density={30} className="pointer-events-none absolute inset-0 z-0 opacity-40" />

      {/* Radiant Glow highlights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-[#0A2540]/30 blur-2xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-xs font-bold text-white mb-6">
          <Snowflake className="w-3.5 h-3.5 text-[#D8F6FF]" />
          <span>Express 45-Minute Dispatch Available</span>
        </div>

        <h2
          id="cta-headline"
          className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-white mb-6"
        >
          Need Ice? We've Got You Covered.
        </h2>

        <p
          id="cta-description"
          className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed mb-10 font-normal"
        >
          Fresh, clean, affordable ice delivered when you need it. From single-bag parties to recurring hotel pallet shipments.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="cta-order-ice-btn"
            onClick={onOpenOrderModal}
            className="w-full sm:w-auto px-9 py-4 rounded-xl font-bold text-base text-[#0077B6] bg-white hover:bg-[#EFFFFF] shadow-xl shadow-black/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Snowflake className="w-5 h-5 text-[#00B8E6]" />
            <span>Order Ice</span>
            <ArrowRight className="w-4 h-4 text-[#0077B6]" />
          </button>

          <button
            id="cta-contact-us-btn"
            onClick={onScrollToContact}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-white bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contact Us</span>
          </button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-white/80 font-medium">
          <span className="flex items-center gap-2">✓ Certified Reverse Osmosis</span>
          <span className="flex items-center gap-2">✓ Insulated Cold Chain Transport</span>
          <span className="flex items-center gap-2">✓ Wholesale Credit Terms</span>
        </div>
      </div>
    </section>
  );
};
