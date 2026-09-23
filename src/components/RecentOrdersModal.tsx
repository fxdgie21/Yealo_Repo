import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Clock,
  MapPin,
  CheckCircle,
  Package,
  Trash2,
  Star,
  MessageSquarePlus,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OrderRecord, ReviewItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface RecentOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onClearOrders: () => void;
  onNewOrder: () => void;
  onTrackOrder?: (orderId: string) => void;
  onOrderUpdated?: (updatedOrder: OrderRecord) => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
}

export const RecentOrdersModal: React.FC<RecentOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onClearOrders,
  onNewOrder,
  onTrackOrder,
  onOrderUpdated,
  onShowToast,
}) => {
  const { language } = useLanguage();

  // Track which delivered order is currently displaying the review form
  const [activeReviewOrderId, setActiveReviewOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string>('');

  if (!isOpen) return null;

  const handleOpenReviewForm = (ord: OrderRecord) => {
    setActiveReviewOrderId(ord.id === activeReviewOrderId ? null : ord.id);
    setRating(ord.review?.rating || 5);
    setComment(ord.review?.comment || '');
    setReviewerName(ord.review?.reviewerName || ord.customerName || '');
    setReviewError('');
  };

  const handleSubmitReview = async (e: React.FormEvent, order: OrderRecord) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewError(
        language === 'en'
          ? 'Please leave a short comment about your delivery experience.'
          : 'Mag-iwan po ng maikling feedback tungkol sa inyong delivery experience.'
      );
      return;
    }

    setIsSubmitting(true);
    setReviewError('');

    const newReview = {
      rating,
      comment: comment.trim(),
      submittedAt: new Date().toISOString(),
      reviewerName: (reviewerName.trim() || order.customerName || 'Verified Suki').trim(),
    };

    const updatedOrder: OrderRecord = {
      ...order,
      review: newReview,
    };

    try {
      // 1. Update Firestore order document if it exists
      try {
        const orderDocRef = doc(db, 'orders', order.id);
        await updateDoc(orderDocRef, {
          review: newReview,
        });
      } catch (directErr) {
        // Also query by orderNumber if direct doc ID was different
        try {
          const ordersCol = collection(db, 'orders');
          const q = query(ordersCol, where('orderNumber', '==', order.orderNumber));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            await updateDoc(qSnap.docs[0].ref, {
              review: newReview,
            });
          }
        } catch {
          // ignore network/firestore failures gracefully
        }
      }

      // 2. Persist to localStorage order history
      try {
        const stored = localStorage.getItem('yealo_orders') || localStorage.getItem('glacierpure_orders');
        if (stored) {
          const list: OrderRecord[] = JSON.parse(stored);
          if (Array.isArray(list)) {
            const updatedList = list.map((o) =>
              o.id === order.id || o.orderNumber === order.orderNumber ? updatedOrder : o
            );
            localStorage.setItem('yealo_orders', JSON.stringify(updatedList));
          }
        }
      } catch (storageErr) {
        console.warn('Local storage update notice:', storageErr);
      }

      // 3. Also publish this as a verified public review in yealo_reviews so it appears on the website's customer reviews carousel
      try {
        const publicReview: ReviewItem = {
          id: `rev-order-${order.orderNumber}-${Date.now()}`,
          name: newReview.reviewerName,
          role: language === 'en' ? 'Verified Buyer (Delivered)' : 'Verified Suki (Naihatid)',
          location: order.cityArea || 'Science City of Muñoz',
          rating: newReview.rating,
          comment: newReview.comment,
          date: language === 'en' ? 'Just now' : 'Kamakailan',
          verified: true,
          productOrdered: `${order.productName}${order.bagSize ? ` (${order.bagSize})` : ''}`,
        };

        const existingPublicReviews = localStorage.getItem('yealo_reviews');
        let parsedReviews: ReviewItem[] = [];
        if (existingPublicReviews) {
          try {
            parsedReviews = JSON.parse(existingPublicReviews);
          } catch {
            parsedReviews = [];
          }
        }
        const updatedPublicReviews = [publicReview, ...parsedReviews];
        localStorage.setItem('yealo_reviews', JSON.stringify(updatedPublicReviews));

        // Dispatch a custom event to immediately update ReviewsSection on the page
        window.dispatchEvent(new CustomEvent('yealo_reviews_updated'));
      } catch (revErr) {
        console.warn('Public review sync notice:', revErr);
      }

      // 4. Update parent state
      if (onOrderUpdated) {
        onOrderUpdated(updatedOrder);
      }

      // 5. Notify user
      if (onShowToast) {
        onShowToast(
          language === 'en' ? 'Thank You for Rating!' : 'Salamat sa Inyong Rating!',
          language === 'en'
            ? `Your review for Order #${order.orderNumber} was successfully submitted.`
            : `Matagumpay na naitala ang inyong review para sa Order #${order.orderNumber}.`,
          'success'
        );
      }

      // Close review form
      setActiveReviewOrderId(null);
      setComment('');
    } catch (err: any) {
      console.error('Review submission error:', err);
      setReviewError(
        language === 'en'
          ? 'Failed to submit review. Please try again.'
          : 'Hindi maitala ang review. Pakisubukan muli.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="recent-orders-drawer"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200 bg-[#FFFDF0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FDD023] text-[#111827] flex items-center justify-center font-black">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-[#111827]">
                {language === 'en' ? 'Your Yealo Orders' : 'Inyong Yealo Orders'}
              </h3>
              <p className="text-xs text-slate-500">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {orders.length > 0 && (
              <button
                onClick={onClearOrders}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                title={language === 'en' ? 'Clear local order history' : 'Burahin ang order history'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'Clear History' : 'Clear History'}
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close orders"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-6 space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-heading font-black text-slate-800 text-base">
                {language === 'en' ? 'No orders placed yet' : 'Wala pang orders yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-5">
                {language === 'en'
                  ? 'Place an order for Tube Ice or Cube Ice to track dispatch details and rate your delivery here.'
                  : 'Mag-order ng Tube Ice o Cube Ice para makita ang dispatch details at mag-rate ng delivery dito.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNewOrder();
                }}
                className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider text-[#111827] bg-[#FDD023] hover:bg-amber-300 shadow-sm transition-all cursor-pointer"
              >
                {language === 'en' ? 'Order Now' : 'Order Now'}
              </button>
            </div>
          ) : (
            orders.map((ord) => {
              const isDelivered = ord.status === 'Delivered';
              const hasReview = Boolean(ord.review);
              const isReviewFormOpen = activeReviewOrderId === ord.id;

              return (
                <div
                  key={ord.id}
                  id={`receipt-${ord.id}`}
                  className={`p-4 sm:p-5 rounded-2xl bg-[#FFFDF0] border transition-all space-y-3 ${
                    isDelivered ? 'border-emerald-300 hover:border-emerald-400' : 'border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-black text-[#111827] bg-[#FDD023] border border-amber-300">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isDelivered
                            ? 'text-emerald-800 bg-emerald-100 border border-emerald-300'
                            : ord.status === 'Out for Delivery'
                            ? 'text-amber-800 bg-amber-100 border border-amber-300'
                            : 'text-slate-800 bg-slate-100'
                        }`}
                      >
                        <CheckCircle className={`w-3 h-3 ${isDelivered ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span>{ord.status}</span>
                      </span>

                      {/* Customer Review Button Trigger for Delivered Orders */}
                      {isDelivered && (
                        <button
                          type="button"
                          onClick={() => handleOpenReviewForm(ord)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-2xs ${
                            hasReview
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                          title={hasReview ? 'View or update your review' : 'Rate this delivered order'}
                        >
                          <Star className={`w-3.5 h-3.5 ${hasReview ? 'fill-amber-500 text-amber-500' : 'fill-white text-white'}`} />
                          <span>
                            {hasReview
                              ? language === 'en'
                                ? `Rated ★ ${ord.review?.rating}/5`
                                : `Na-rate ★ ${ord.review?.rating}/5`
                              : language === 'en'
                              ? '★ Rate Delivery'
                              : '★ Mag-Rate'}
                          </span>
                          {isReviewFormOpen ? (
                            <ChevronUp className="w-3 h-3 ml-0.5" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                    <div>
                      <h5 className="font-black text-sm text-[#111827]">
                        {ord.productName} × {ord.quantity}
                        {ord.bagSize && <span className="text-xs text-slate-500 ml-1 font-semibold">({ord.bagSize})</span>}
                      </h5>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-700" />
                        <span className="truncate max-w-xs">{ord.deliveryAddress}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {language === 'en' ? 'Total (COD)' : 'Total (COD)'}
                      </div>
                      <div className="font-heading font-black text-lg text-amber-700">
                        ₱{ord.total.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Dispatch & Live Tracking Navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        {language === 'en' ? 'Scheduled:' : 'Schedule:'} {ord.deliveryDate} ({ord.deliveryTime})
                      </span>
                    </div>

                    {onTrackOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onTrackOrder(ord.orderNumber);
                        }}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400 text-slate-900 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <span>{language === 'en' ? 'Track Live Status' : 'I-track ang Status'}</span>
                      </button>
                    )}
                  </div>

                  {/* READ-ONLY REVIEW SUMMARY (When already submitted and form is closed) */}
                  {hasReview && !isReviewFormOpen && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= (ord.review?.rating || 5)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                          <span className="font-bold text-amber-900 text-xs ml-1">
                            {ord.review?.rating}/5 Stars
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenReviewForm(ord)}
                          className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                        >
                          {language === 'en' ? 'Edit Review' : 'I-edit ang Review'}
                        </button>
                      </div>
                      <p className="text-slate-700 italic">"{ord.review?.comment}"</p>
                      <div className="text-[10px] text-slate-500">
                        {language === 'en' ? 'Reviewed by' : 'Sinulat ni'} {ord.review?.reviewerName || ord.customerName} •{' '}
                        {new Date(ord.review?.submittedAt || ord.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* INLINE REVIEW SUBMISSION FORM (Delivered Orders Only) */}
                  {isDelivered && isReviewFormOpen && (
                    <form
                      onSubmit={(e) => handleSubmitReview(e, ord)}
                      className="mt-3 p-4 sm:p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-300 rounded-2xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-200 text-amber-900">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h6 className="font-heading font-black text-xs sm:text-sm text-slate-900">
                              {language === 'en'
                                ? 'Rate Your Yealo Delivery Experience'
                                : 'I-rate ang Inyong Yealo Delivery'}
                            </h6>
                            <p className="text-[11px] text-slate-600">
                              {language === 'en'
                                ? 'How was the ice temperature, rider speed, and coldness?'
                                : 'Kumusta ang lamig, bilis ng rider, at kalidad ng yelo?'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveReviewOrderId(null)}
                          className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Interactive Star Rating */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-800">
                          {language === 'en' ? 'Delivery Rating:' : 'Rating ng Delivery:'}
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = (hoverRating || rating) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1 rounded-lg hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    isFilled
                                      ? 'text-amber-500 fill-amber-400 drop-shadow-xs'
                                      : 'text-slate-300 fill-slate-100'
                                  }`}
                                />
                              </button>
                            );
                          })}
                          <span className="ml-2 font-black text-xs text-amber-900">
                            {rating === 5 && (language === 'en' ? '5/5 Excellent!' : '5/5 Napakaganda!')}
                            {rating === 4 && (language === 'en' ? '4/5 Very Good' : '4/5 Maayos')}
                            {rating === 3 && (language === 'en' ? '3/5 Average' : '3/5 Pwede na')}
                            {rating === 2 && (language === 'en' ? '2/5 Needs Improvement' : '2/5 Pababang Kalidad')}
                            {rating === 1 && (language === 'en' ? '1/5 Poor' : '1/5 Mahina')}
                          </span>
                        </div>
                      </div>

                      {/* Reviewer Name / Display name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {language === 'en' ? 'Your Name / Business:' : 'Pangalan / Negosyo:'}
                          </label>
                          <input
                            type="text"
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            placeholder={ord.customerName || 'e.g. Juan Dela Cruz / Sari-sari Store'}
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-amber-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#111827]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {language === 'en' ? 'Product Delivered:' : 'Naihatid na Produkto:'}
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={`${ord.productName} (${ord.bagSize || '5kg'})`}
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Comment Input */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {language === 'en' ? 'Your Review Feedback:' : 'Mensahe o Komento:'}
                        </label>
                        <textarea
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={
                            language === 'en'
                              ? 'e.g., Ice arrived crystal clear and completely frozen! Friendly tricycle rider arrived on time.'
                              : 'hal., Buo-buo ang yelo, walang tunaw at napakabait ng rider na naghatid!'
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#111827]"
                          required
                        />
                      </div>

                      {reviewError && (
                        <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                          {reviewError}
                        </p>
                      )}

                      {/* Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveReviewOrderId(null)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        >
                          {language === 'en' ? 'Cancel' : 'Kanselahin'}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#111827] text-white hover:bg-black transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <span>{language === 'en' ? 'Submitting...' : 'Itinatala...'}</span>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>{language === 'en' ? 'Post Review' : 'I-post ang Review'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {language === 'en' ? 'Saved in browser storage & synced to live database' : 'Naka-save sa browser storage at Firestore'}
          </span>
          <button
            onClick={() => {
              onClose();
              onNewOrder();
            }}
            className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider text-white bg-[#111827] hover:bg-black transition-colors cursor-pointer"
          >
            {language === 'en' ? '+ New Order' : '+ New Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
