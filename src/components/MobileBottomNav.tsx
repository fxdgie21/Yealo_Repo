import React from 'react';
import { ShoppingBag, Truck, Search, ShieldCheck, Home, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MobileBottomNavProps {
  onOpenOrderModal: () => void;
  onOpenOrdersDrawer: () => void;
  onOpenAdmin: () => void;
  orderCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenOrderModal,
  onOpenOrdersDrawer,
  onOpenAdmin,
  orderCount,
}) => {
  const { language } = useLanguage();

  const handleScrollTo = (targetId: string) => {
    const el = document.querySelector(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-amber-200/90 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] transition-all select-none"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* 1. Products / Home */}
        <button
          type="button"
          onClick={() => handleScrollTo('#products')}
          className="flex flex-col items-center justify-center p-1 text-slate-700 hover:text-black active:scale-95 transition-all cursor-pointer min-w-[56px]"
          title="Browse Ice Products"
        >
          <Home className="w-5 h-5 text-slate-800 mb-0.5" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
            {language === 'en' ? 'Catalog' : 'Tinda'}
          </span>
        </button>

        {/* 2. Track Order */}
        <button
          type="button"
          onClick={() => handleScrollTo('#track')}
          className="flex flex-col items-center justify-center p-1 text-slate-700 hover:text-black active:scale-95 transition-all cursor-pointer min-w-[56px] relative"
          title="Track Live Order Status"
        >
          <div className="relative">
            <Truck className="w-5 h-5 text-slate-800 mb-0.5" />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
            {language === 'en' ? 'Track' : 'Sundan'}
          </span>
        </button>

        {/* 3. Hero Order Action (Center Floating Pill) */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={onOpenOrderModal}
            className="w-13 h-13 rounded-full bg-[#111827] text-[#FDD023] hover:bg-black active:scale-90 transition-all flex flex-col items-center justify-center shadow-xl ring-4 ring-[#FED74C] cursor-pointer"
            aria-label="Place an Ice Order"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="text-[9px] font-black uppercase tracking-wider text-[#111827] block text-center mt-0.5">
            Order
          </span>
        </div>

        {/* 4. My Orders / Bag */}
        <button
          type="button"
          onClick={orderCount > 0 ? onOpenOrdersDrawer : onOpenOrderModal}
          className="flex flex-col items-center justify-center p-1 text-slate-700 hover:text-black active:scale-95 transition-all cursor-pointer min-w-[56px] relative"
          title="View recent orders"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-slate-800 mb-0.5" />
            {orderCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#111827] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {orderCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
            {language === 'en' ? 'Orders' : 'Listahan'}
          </span>
        </button>

        {/* 5. Dispatch / Admin Portal */}
        <button
          type="button"
          onClick={onOpenAdmin}
          className="flex flex-col items-center justify-center p-1 text-slate-700 hover:text-amber-900 active:scale-95 transition-all cursor-pointer min-w-[56px]"
          title="Owner Dispatch Portal"
        >
          <ShieldCheck className="w-5 h-5 text-amber-700 mb-0.5" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
            Dispatch
          </span>
        </button>
      </div>
    </nav>
  );
};
