import React from 'react';
import { MapPin, Navigation, Phone, ExternalLink, Clock, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LocationMapSection: React.FC = () => {
  const { t, language } = useLanguage();
  const directionsUrl =
    'https://www.google.com/maps/search/?api=1&query=San+Jose+City+Nueva+Ecija+3121+Philippines';

  return (
    <section id="location" className="py-20 bg-[#FFFDF0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Info card */}
          <div className="lg:col-span-5 p-8 sm:p-10 rounded-3xl bg-white border border-amber-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FDD023]/25 border border-amber-300 text-xs font-black text-[#111827] uppercase tracking-wider mb-4">
                <Truck className="w-3.5 h-3.5" />
                <span>{t.location.badge}</span>
              </div>
              <h2
                id="location-title"
                className="font-script text-5xl sm:text-6xl text-[#111827] mb-3"
              >
                {t.location.title}
              </h2>
              <p
                id="location-subtitle"
                className="text-slate-700 leading-relaxed text-sm sm:text-base mt-2"
              >
                {t.location.subtitle}
              </p>

              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-2xl bg-[#FFFDF0] border border-amber-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FDD023] flex items-center justify-center text-[#111827] shrink-0 font-black">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase text-slate-500">{t.location.distHub}</h4>
                    <p className="font-black text-sm text-[#111827] mt-0.5">
                      San Jose, Philippines, 3121
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.location.distHubDesc}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFDF0] border border-amber-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FDD023] flex items-center justify-center text-[#111827] shrink-0 font-black">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase text-slate-500">{t.location.hoursTitle}</h4>
                    <p className="font-black text-sm text-[#111827] mt-0.5">
                      {t.location.hoursValue}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.location.hoursDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <a
                id="location-get-directions-btn"
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-1/2 py-3.5 px-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider text-[#111827] bg-[#FDD023] hover:bg-amber-300 shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>{t.location.viewMapBtn}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <a
                id="location-call-us-btn"
                href="tel:09625415941"
                className="w-full sm:w-1/2 py-3.5 px-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider text-white bg-[#111827] hover:bg-black flex items-center justify-center gap-2 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>{t.location.callBtn}</span>
              </a>
            </div>
          </div>

          {/* Right: Embedded Map Centered on San Jose, Philippines 3121 */}
          <div className="lg:col-span-7 min-h-[380px] rounded-3xl overflow-hidden border border-amber-200 shadow-sm relative bg-slate-100">
            <iframe
              title="Yealo Ice San Jose Philippines 3121 Location Map"
              src="https://maps.google.com/maps?q=San+Jose+City,+Nueva+Ecija+3121,+Philippines&t=&z=14&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full min-h-[400px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Floating Info Tag */}
            <div className="absolute top-4 right-4 bg-white/95 border border-amber-200 p-3.5 rounded-2xl shadow-md hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FDD023] text-[#111827] flex items-center justify-center font-black shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-[#111827]">{t.location.routeTagTitle}</div>
                <div className="text-[11px] text-slate-500">{t.location.routeTagDesc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
