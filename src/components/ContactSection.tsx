import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ContactSectionProps {
  onShowToast: (title: string, message: string) => void;
  prefillSubject?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  onShowToast,
  prefillSubject = '',
}) => {
  const { t, language } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceArea, setServiceArea] = useState('Science City of Muñoz');
  const [subject, setSubject] = useState(prefillSubject || 'Daily Commercial Supply');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  React.useEffect(() => {
    if (prefillSubject) {
      setSubject(prefillSubject);
    }
  }, [prefillSubject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !message.trim()) {
      onShowToast(
        language === 'en' ? 'Missing Fields' : 'Kulang na Datos',
        language === 'en'
          ? 'Please provide your name, phone number, and message.'
          : 'Pakilagay ang inyong pangalan, numero ng telepono, at mensahe.'
      );
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      onShowToast(
        language === 'en' ? 'Message Sent' : 'Message Sent!',
        language === 'en'
          ? 'Yealo support & dispatch team will reach out promptly.'
          : 'Magre-reach out agad ang Yealo dispatch team sa inyo.'
      );
      setFullName('');
      setEmail('');
      setPhone('');
      setMessage('');
    }, 500);
  };

  return (
    <section id="contact" className="py-24 relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="contact-title" className="font-script text-5xl sm:text-6xl text-[#111827] mb-3">
            {t.contact.title}
          </h2>
          <div className="w-16 h-1.5 bg-[#FDD023] mx-auto rounded-full mb-6" />
          <p id="contact-subtitle" className="text-base sm:text-lg text-slate-700 leading-relaxed">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Information Cards (Left) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-[#FFFDF0] border border-amber-200 shadow-sm">
              <h3 className="font-heading font-black text-xl text-[#111827] mb-6">
                {language === 'en' ? 'Fast & Direct Dispatch' : 'Mabilis at Direktang Dispatch'}
              </h3>

              <div className="space-y-6 text-sm">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#FDD023] text-[#111827] flex items-center justify-center shrink-0 shadow-xs font-black">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase text-slate-500 tracking-wider">
                      {t.contact.visitUs}
                    </h4>
                    <p className="text-slate-800 font-bold mt-0.5 leading-relaxed">
                      {t.contact.hubName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.contact.hubDesc}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#FDD023] text-[#111827] flex items-center justify-center shrink-0 shadow-xs font-black">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase text-slate-500 tracking-wider">
                      {t.contact.phoneUs}
                    </h4>
                    <p className="text-slate-800 font-bold mt-0.5">
                      <a href="tel:+639171234567" className="hover:text-amber-700 transition-colors">
                        +63 917 123 4567
                      </a>
                    </p>
                    <p className="text-xs text-slate-500">Landline: (044) 940-YEALO</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#FDD023] text-[#111827] flex items-center justify-center shrink-0 shadow-xs font-black">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase text-slate-500 tracking-wider">
                      EMAIL
                    </h4>
                    <p className="text-slate-800 font-bold mt-0.5">
                      <a href="mailto:orders@yealoice.com" className="hover:text-amber-700 transition-colors">
                        orders@yealoice.com
                      </a>
                    </p>
                    <p className="text-xs text-slate-500">inquiry@yealoice.com</p>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#FDD023] text-[#111827] flex items-center justify-center shrink-0 shadow-xs font-black">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase text-slate-500 tracking-wider">
                      {t.contact.hours}
                    </h4>
                    <p className="text-slate-800 font-bold mt-0.5">
                      {language === 'en' ? 'Monday – Sunday' : 'Lunes – Linggo'}
                    </p>
                    <p className="text-xs text-slate-600">6:00 AM – 8:00 PM</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-black text-[#111827] bg-[#FDD023]">
                      <Truck className="w-3 h-3" />
                      <span>{language === 'en' ? 'Daily Express Dispatch' : 'Araw-araw na Express Dispatch'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form (Right) */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-amber-200 shadow-lg">
              {isSubmitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-[#FDD023] text-[#111827] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-heading font-black text-2xl text-[#111827] mb-2">
                    {language === 'en' ? 'Message Sent Successfully' : 'Matagumpay na Naipadala'}
                  </h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                    {language === 'en'
                      ? 'Thank you for reaching out to Yealo! Our team will get in touch with you shortly.'
                      : 'Salamat sa pakikipag-ugnayan sa Yealo! Makikipag-ugnayan agad ang aming team sa inyo.'}
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider text-white bg-[#111827] hover:bg-black transition-all cursor-pointer"
                  >
                    {language === 'en' ? 'Send Another Message' : 'Magpadala Muli ng Mensahe'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-fullname" className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.contact.fullName} *
                      </label>
                      <input
                        id="contact-fullname"
                        type="text"
                        required
                        placeholder={language === 'en' ? 'e.g. Maria Santos / Kapehan Café' : 'hal. Maria Santos / Kapehan Café'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FDD023] transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.contact.phone} *
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        required
                        placeholder="+63 9XX XXX XXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FDD023] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-area" className="block text-xs font-bold text-slate-700 mb-1.5">
                        {language === 'en' ? 'Delivery City / Municipality' : 'Delivery City / Town'}
                      </label>
                      <select
                        id="contact-area"
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FDD023] transition-all"
                      >
                        <option value="Science City of Muñoz">Science City of Muñoz</option>
                        <option value="San Jose City">San Jose City</option>
                        <option value="Talavera">Talavera (Nearby Route)</option>
                        <option value="Other Nueva Ecija Area">{language === 'en' ? 'Other Nueva Ecija Area' : 'Other Nueva Ecija Area'}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.contact.subject}
                      </label>
                      <select
                        id="contact-subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FDD023] transition-all"
                      >
                        <option value="Daily Commercial Supply">
                          {language === 'en' ? 'Daily Commercial Supply (Café / Resto)' : 'Daily Supply (Café / Resto / Milk Tea)'}
                        </option>
                        <option value="Bulk Order for Event">
                          {language === 'en' ? 'Bulk Order for Event / Wedding' : 'Bulk Order para sa Event / Party / Kasal'}
                        </option>
                        <option value="Sari-Sari Store Reseller">
                          {language === 'en' ? 'Sari-Sari Store Reseller Program' : 'Reseller Supply para sa Tindahan'}
                        </option>
                        <option value="Ice Machine / Plant Question">
                          {language === 'en' ? 'General Inquiry / Plant Visit' : 'General Inquiry / Plant Inquiries'}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t.contact.message} *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      placeholder={
                        language === 'en'
                          ? 'Tell us about how many 1kg, 5kg, or 10kg bags of Tube Ice or Cube Ice you need, delivery frequency, or inquiries...'
                          : 'Sabihin kung ilang bags ng 1kg, 5kg, o 10kg Tube Ice o Cube Ice ang kailangan, gaano kadalas ang delivery, atbp...'
                      }
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FDD023] transition-all"
                    />
                  </div>

                  <button
                    id="contact-send-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider text-white bg-[#111827] hover:bg-black shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t.contact.sending}</span>
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t.contact.sendBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
