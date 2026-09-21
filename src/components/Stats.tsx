import React, { useState, useEffect, useRef } from 'react';
import { Award, Users, Headset, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Stats: React.FC = () => {
  const { t } = useLanguage();
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [countYears, setCountYears] = useState(0);
  const [countCustomers, setCountCustomers] = useState(0);
  const [countQuality, setCountQuality] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCountYears(Math.floor(ease * 10));
      setCountCustomers(Math.floor(ease * 1000));
      setCountQuality(Math.floor(ease * 100));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCountYears(10);
        setCountCustomers(1000);
        setCountQuality(100);
      }
    };

    requestAnimationFrame(animate);
  }, [hasAnimated]);

  return (
    <section className="relative z-20 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        ref={containerRef}
        id="business-stats"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 rounded-3xl bg-white shadow-xl border border-amber-200"
      >
        {/* Card 1: Years of Service */}
        <div
          id="stat-card-years"
          className="p-5 rounded-2xl bg-[#FFFDF0] border border-amber-200/70 flex items-center gap-4 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#FDD023] flex items-center justify-center text-[#111827] group-hover:scale-110 transition-all duration-300 shrink-0 font-black">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="font-heading font-black text-3xl sm:text-4xl text-[#111827] tracking-tight">
              {countYears}+
            </div>
            <div className="text-sm font-black text-amber-800 mt-0.5">{t.stats.years}</div>
            <div className="text-xs text-slate-500">{t.stats.yearsSub}</div>
          </div>
        </div>

        {/* Card 2: Happy Customers */}
        <div
          id="stat-card-customers"
          className="p-5 rounded-2xl bg-[#FFFDF0] border border-amber-200/70 flex items-center gap-4 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#FDD023] flex items-center justify-center text-[#111827] group-hover:scale-110 transition-all duration-300 shrink-0 font-black">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="font-heading font-black text-3xl sm:text-4xl text-[#111827] tracking-tight">
              {countCustomers.toLocaleString()}+
            </div>
            <div className="text-sm font-black text-amber-800 mt-0.5">{t.stats.customers}</div>
            <div className="text-xs text-slate-500">{t.stats.customersSub}</div>
          </div>
        </div>

        {/* Card 3: Customer Support */}
        <div
          id="stat-card-support"
          className="p-5 rounded-2xl bg-[#FFFDF0] border border-amber-200/70 flex items-center gap-4 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#FDD023] flex items-center justify-center text-[#111827] group-hover:scale-110 transition-all duration-300 shrink-0 font-black">
            <Headset className="w-7 h-7" />
          </div>
          <div>
            <div className="font-heading font-black text-3xl sm:text-4xl text-[#111827] tracking-tight flex items-center">
              24/7
            </div>
            <div className="text-sm font-black text-amber-800 mt-0.5">{t.stats.support}</div>
            <div className="text-xs text-slate-500">{t.stats.supportSub}</div>
          </div>
        </div>

        {/* Card 4: Quality Assured */}
        <div
          id="stat-card-quality"
          className="p-5 rounded-2xl bg-[#FFFDF0] border border-amber-200/70 flex items-center gap-4 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#FDD023] flex items-center justify-center text-[#111827] group-hover:scale-110 transition-all duration-300 shrink-0 font-black">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <div className="font-heading font-black text-3xl sm:text-4xl text-[#111827] tracking-tight">
              {countQuality}%
            </div>
            <div className="text-sm font-black text-amber-800 mt-0.5">{t.stats.quality}</div>
            <div className="text-xs text-slate-500">{t.stats.qualitySub}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
