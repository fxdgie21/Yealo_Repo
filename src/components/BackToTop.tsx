import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      id="floating-back-to-top"
      onClick={scrollToTop}
      className="fixed bottom-6 left-6 z-30 w-12 h-12 rounded-full bg-[#FDD023] hover:bg-amber-300 text-[#111827] shadow-lg border border-amber-300 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer animate-in fade-in slide-in-from-bottom-3"
      aria-label="Scroll back to top"
    >
      <ChevronUp className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
};
