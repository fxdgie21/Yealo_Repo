import React, { useState, useEffect } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  X,
  ShieldCheck,
  Quote,
} from 'lucide-react';
import { ReviewItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ReviewsSectionProps {
  onShowToast: (title: string, message: string) => void;
}

const defaultYealoReviewsEn: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Anna Ramos',
    role: 'Café Owner, Muñoz',
    location: 'Science City of Muñoz',
    rating: 5,
    comment: 'Yealo tube ice is incredibly pure! Zero freezer odor, stays frozen all afternoon during peak hours in our coffee shop. Fast delivery every morning without fail.',
    date: 'Yesterday',
    verified: true,
    productOrdered: 'Tube Ice (5kg)',
  },
  {
    id: 'rev-2',
    name: 'Eduardo Santos',
    role: 'Restobar Manager, San Jose City',
    location: 'San Jose City, Nueva Ecija',
    rating: 5,
    comment: 'The crystal clear cubes look amazing in our high-end cocktails and iced drinks. Uncompromising cleanliness, great fair pricing, and trustworthy drivers.',
    date: '3 days ago',
    verified: true,
    productOrdered: 'Cube Ice (10kg)',
  },
  {
    id: 'rev-3',
    name: 'Karen Villareal',
    role: 'Catering Director',
    location: 'Nueva Ecija',
    rating: 5,
    comment: 'Ordering 10kg sacks for weekend weddings has never been this seamless. The bags are heavy gauge and hygienic. 5/5 stars for Yealo team!',
    date: '1 week ago',
    verified: true,
    productOrdered: 'Cube & Tube Ice',
  },
];

const defaultYealoReviewsTl: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Anna Ramos',
    role: 'Café Owner, Muñoz',
    location: 'Science City of Muñoz',
    rating: 5,
    comment: 'Super linaw at walang any aftertaste ang tube ice ng Yealo! Sobrang tagal matunaw kahit peak hours sa coffee shop namin. On-time and maaasahan ang delivery every day.',
    date: 'Kahapon',
    verified: true,
    productOrdered: 'Tube Ice (5kg)',
  },
  {
    id: 'rev-2',
    name: 'Eduardo Santos',
    role: 'Restobar Manager, San Jose City',
    location: 'San Jose City, Nueva Ecija',
    rating: 5,
    comment: 'Ang ganda ng crystal cubes para sa mga cold drinks and cocktails namin. 100% food-grade safe, presyong tapat, at super bait ng mga delivery riders ng Yealo.',
    date: '3 days ago',
    verified: true,
    productOrdered: 'Cube Ice (10kg)',
  },
  {
    id: 'rev-3',
    name: 'Karen Villareal',
    role: 'Catering Director',
    location: 'Nueva Ecija',
    rating: 5,
    comment: 'Sobrang convenient mag-order ng 10kg sacks para sa mga weekend events and weddings. Makapal at hygienic ang packaging. 5 stars for the Yealo team!',
    date: '1 week ago',
    verified: true,
    productOrdered: 'Cube & Tube Ice',
  },
];

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ onShowToast }) => {
  const { t, language } = useLanguage();
  const defaultReviews = language === 'en' ? defaultYealoReviewsEn : defaultYealoReviewsTl;
  const [reviews, setReviews] = useState<ReviewItem[]>(defaultReviews);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRole, setReviewerRole] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const loadReviews = () => {
      try {
        const saved = localStorage.getItem('yealo_reviews');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReviews([...parsed, ...defaultReviews]);
            return;
          }
        }
      } catch (e) {
        console.error('Error reading saved reviews', e);
      }
      setReviews(defaultReviews);
    };

    loadReviews();
    window.addEventListener('yealo_reviews_updated', loadReviews);
    return () => window.removeEventListener('yealo_reviews_updated', loadReviews);
  }, [language]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerComment.trim()) {
      setFormError(language === 'en' ? 'Please provide both your name and review feedback.' : 'Pakilagay ang inyong name at review feedback.');
      return;
    }

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: reviewerName.trim(),
      role: reviewerRole.trim() || (language === 'en' ? 'Verified Buyer' : 'Verified Suki'),
      rating: reviewerRating,
      comment: reviewerComment.trim(),
      date: language === 'en' ? 'Just now' : 'Just now',
      verified: true,
      productOrdered: 'Yealo Food-Grade Ice',
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);

    try {
      localStorage.setItem('yealo_reviews', JSON.stringify([newRev]));
    } catch {
      // ignore
    }

    onShowToast(
      language === 'en' ? 'Review Submitted' : 'Review Submitted',
      language === 'en'
        ? 'Thank you for sharing your experience with Yealo!'
        : 'Salamat sa pag-share ng inyong experience sa Yealo!'
    );

    // Reset & close
    setReviewerName('');
    setReviewerRole('');
    setReviewerComment('');
    setReviewerRating(5);
    setFormError('');
    setIsModalOpen(false);
  };

  return (
    <section id="reviews" className="py-24 relative bg-[#FFFDF0] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 id="reviews-title" className="font-script text-5xl sm:text-6xl text-[#111827] mb-3">
            {t.reviews.title}
          </h2>
          <div className="w-16 h-1.5 bg-[#FDD023] mx-auto rounded-full mb-6" />
          <p className="text-base sm:text-lg text-slate-700 font-normal">
            {t.reviews.subtitle}
          </p>
        </div>

        {/* Rating Breakdown Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-amber-200/90 shadow-sm mb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: 5.0 Big Rating */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-100">
              <div className="font-heading font-black text-6xl sm:text-7xl text-[#111827]">
                5.0
              </div>
              <div className="flex items-center gap-1 text-[#FDD023] my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#FDD023]" />
                ))}
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                {t.reviews.overallRating}
              </span>
            </div>

            {/* Right: 4 Score Breakdown Bars */}
            <div className="md:col-span-8 space-y-4">
              {[
                { label: t.reviews.serviceMetric, score: '5.0', percent: '100%' },
                { label: t.reviews.hygieneMetric, score: '5.0', percent: '100%' },
                { label: t.reviews.commMetric, score: '5.0', percent: '100%' },
                { label: t.reviews.deliveryMetric, score: '5.0', percent: '100%' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#111827]">
                    <span>{item.label}</span>
                    <span className="text-amber-700 font-black">{item.score}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FDD023] rounded-full transition-all duration-1000"
                      style={{ width: item.percent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Review Cards Carousel */}
        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((offset) => {
              const itemIndex = (currentIndex + offset) % reviews.length;
              const review = reviews[itemIndex];
              const isCenter = offset === 0;

              return (
                <div
                  key={`${review.id}-${offset}`}
                  className={`relative p-7 rounded-3xl bg-white border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md ${
                    isCenter ? 'border-[#FDD023] ring-2 ring-[#FDD023]/30' : 'border-amber-200/80'
                  }`}
                >
                  <Quote className="w-8 h-8 text-amber-200 absolute top-6 right-6 opacity-60" />

                  <div>
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-[#FDD023] fill-[#FDD023]' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-slate-700 text-sm leading-relaxed italic mb-6">
                      "{review.comment}"
                    </p>
                  </div>

                  {/* Customer info */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-black text-sm text-[#111827]">
                          {review.name}
                        </span>
                        <span title={t.reviews.verifiedBuyer}>
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {review.role || review.location}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{review.date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls & Leave Review CTA */}
          <div className="flex items-center justify-between mt-10 pt-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider text-[#111827] bg-[#FDD023] hover:bg-amber-300 shadow-sm transition-all cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>{t.reviews.leaveReviewBtn}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-full bg-white border border-amber-200 hover:bg-[#FDD023] text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-full bg-white border border-amber-200 hover:bg-[#FDD023] text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Next review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5">
              <h3 className="font-heading font-black text-xl text-[#111827]">
                {t.reviews.modalTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'en'
                  ? 'Share your feedback on our Tube Ice, Cube Ice, or delivery service.'
                  : 'I-share ang inyong feedback sa Tube Ice, Cube Ice, o delivery service.'}
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  {t.reviews.ratingLabel}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewerRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewerRating ? 'text-[#FDD023] fill-[#FDD023]' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {reviewerRating} Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  {t.reviews.nameLabel} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Maria Santos' : 'hal. Maria Santos'}
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDD023]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  {t.reviews.roleLabel}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g. Coffee Shop Owner, Muñoz' : 'hal. Coffee Shop Owner / Tindahan, Muñoz'}
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDD023]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  {t.reviews.commentLabel} *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    language === 'en'
                      ? 'How was the ice clarity, melting rate, and delivery timing?'
                      : 'Kumusta ang linaw ng yelo, tagal matunaw, at delivery service?'
                  }
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDD023]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full font-black text-xs uppercase tracking-wider text-[#111827] bg-[#FDD023] hover:bg-amber-300 transition-all shadow-md cursor-pointer"
              >
                {t.reviews.submitBtn}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
