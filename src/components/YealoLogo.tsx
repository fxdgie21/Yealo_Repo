import React from 'react';

interface YealoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const YealoLogo: React.FC<YealoLogoProps> = ({ className = '', size = 'md' }) => {
  const dimensionClass = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-lg',
  }[size];

  return (
    <div
      className={`relative rounded-full bg-[#FDD023] flex items-center justify-center font-heading font-black tracking-widest text-[#111827] shadow-sm hover:scale-105 transition-transform select-none ${dimensionClass} ${className}`}
      style={{
        boxShadow: '0 4px 14px rgba(253, 208, 35, 0.4)',
      }}
      aria-label="Yealo Logo"
    >
      <span className="font-extrabold tracking-wider transform translate-y-px">YEALO</span>
    </div>
  );
};
