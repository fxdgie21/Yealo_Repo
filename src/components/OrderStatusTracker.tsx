import React, { useState, useEffect } from 'react';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  Phone,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { OrderRecord } from '../types';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface OrderStatusTrackerProps {
  onOpenOrderModal?: () => void;
  externalTrackingId?: string;
}

export type FulfillmentStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface OrderTrackingDetails {
  orderId: string;
  customerName: string;
  phone: string;
  productName: string;
  bagSize: string;
  quantity: number;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
  cityArea: string;
  landmark?: string;
  estimatedArrival: string;
  riderName: string;
  riderPhone: string;
  vehicleType: string;
  status: FulfillmentStatus;
  currentStepIndex: number;
  steps: {
    title: string;
    titleTl: string;
    desc: string;
    descTl: string;
    time: string;
    done: boolean;
    current: boolean;
  }[];
}

function buildTrackingSteps(
  status: FulfillmentStatus,
  orderNumber: string,
  deliveryAddress: string,
  createdAt?: string
) {
  const stepIdx =
    status === 'Delivered'
      ? 4
      : status === 'Out for Delivery'
      ? 3
      : status === 'Preparing'
      ? 2
      : status === 'Confirmed'
      ? 1
      : 0;

  const steps = [
    {
      title: 'Order Placed',
      titleTl: 'Natanggap ang Order',
      desc: `Order #${orderNumber} registered in dispatch hub`,
      descTl: `Na-log ang Order #${orderNumber} sa Muñoz dispatch hub`,
      time: createdAt || 'Recorded',
      done: stepIdx > 0 || status === 'Delivered',
      current: stepIdx === 0,
    },
    {
      title: 'Confirmed by Dispatch',
      titleTl: 'Kumpirmado ng Dispatch',
      desc: 'Inventory allocated from fresh pure ice production line',
      descTl: 'Nareserba ang fresh batch mula sa planta',
      time: stepIdx >= 1 ? 'Confirmed' : 'Pending',
      done: stepIdx > 1 || status === 'Delivered',
      current: stepIdx === 1,
    },
    {
      title: 'Ice Packed & Sealed',
      titleTl: 'Na-pack at Na-seal ang Yelo',
      desc: 'Packed in food-grade insulated thermal bags',
      descTl: 'Naihanda sa food-grade insulated pouch',
      time: stepIdx >= 2 ? 'Packed' : 'Pending',
      done: stepIdx > 2 || status === 'Delivered',
      current: stepIdx === 2,
    },
    {
      title: 'Out for Delivery',
      titleTl: 'Papunta na ang Delivery Rider',
      desc: `Rider dispatched to ${deliveryAddress || 'destination address'}`,
      descTl: `Bumibiyahe na ang rider papunta sa ${deliveryAddress || 'inyong lokasyon'}`,
      time: stepIdx >= 3 ? 'En Route' : 'Pending',
      done: stepIdx > 3 || status === 'Delivered',
      current: stepIdx === 3,
    },
    {
      title: 'Delivered',
      titleTl: 'Matagumpay na Naihatid',
      desc: 'Handed over in solid condition and payment received',
      descTl: 'Naihatid nang maayos, buo, at kumpleto',
      time: status === 'Delivered' ? 'Completed' : 'Pending',
      done: status === 'Delivered',
      current: status === 'Delivered',
    },
  ];

  const estimatedArrival =
    status === 'Delivered'
      ? 'Delivered'
      : status === 'Out for Delivery'
      ? '15 - 25 mins'
      : status === 'Preparing'
      ? '25 - 40 mins'
      : status === 'Confirmed'
      ? '40 - 55 mins'
      : 'In Queue';

  return { steps, stepIdx, estimatedArrival };
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  onOpenOrderModal,
  externalTrackingId,
}) => {
  const { language } = useLanguage();
  const [searchInput, setSearchInput] = useState('');
  const [activeTracking, setActiveTracking] = useState<OrderTrackingDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentOrderNumbers, setRecentOrderNumbers] = useState<string[]>([]);

  // Find recent orders to suggest to the user if they've placed orders on this browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yealo_orders');
      if (stored) {
        const parsed: OrderRecord[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const numbers = parsed.map((o) => o.orderNumber).filter(Boolean).slice(0, 4);
          setRecentOrderNumbers(numbers);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Respond to external tracking ID navigation (e.g. clicking Track on an order placed in modal)
  useEffect(() => {
    if (externalTrackingId && externalTrackingId.trim()) {
      setSearchInput(externalTrackingId);
      performLookup(externalTrackingId);
    }
  }, [externalTrackingId]);

  const performLookup = async (id: string) => {
    const clean = id.trim().toUpperCase();
    if (!clean) return;

    setIsSearching(true);
    setSearchError(null);

    // 1. Query Firestore database for the live order
    try {
      let firestoreData: any = null;

      // Try direct doc by ID
      const directSnap = await getDoc(doc(db, 'orders', clean));
      if (directSnap.exists()) {
        firestoreData = directSnap.data();
      } else {
        // Query by orderNumber field
        const ordersRef = collection(db, 'orders');
        const qNum = query(ordersRef, where('orderNumber', '==', clean));
        const numSnap = await getDocs(qNum);
        if (!numSnap.empty) {
          firestoreData = numSnap.docs[0].data();
        }
      }

      if (firestoreData) {
        const orderNum = firestoreData.orderNumber || clean;
        const status = (firestoreData.status as FulfillmentStatus) || 'Pending';
        const address = firestoreData.deliveryAddress || 'Nueva Ecija';
        const createdAt = firestoreData.createdAt ? new Date(firestoreData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
        const { steps, stepIdx, estimatedArrival } = buildTrackingSteps(status, orderNum, address, createdAt);

        const tracking: OrderTrackingDetails = {
          orderId: orderNum,
          customerName: firestoreData.customerName || 'Valued Customer',
          phone: firestoreData.phoneNumber || '',
          productName: firestoreData.productName || 'Yealo Tube Ice',
          bagSize: firestoreData.bagSize || '5kg',
          quantity: firestoreData.quantity || 1,
          total: firestoreData.total || 0,
          paymentMethod: firestoreData.paymentMethod || 'Cash on Delivery (COD)',
          deliveryAddress: address,
          cityArea: firestoreData.cityArea || 'Science City of Muñoz',
          landmark: firestoreData.landmark || '',
          estimatedArrival,
          riderName: firestoreData.riderName || 'Kuya Arnel (Rider #03)',
          riderPhone: firestoreData.riderPhone || '0917-555-8812',
          vehicleType: firestoreData.vehicleType || 'Insulated Cold-Box Tricycle',
          status,
          currentStepIndex: stepIdx,
          steps,
        };

        setActiveTracking(tracking);
        setIsSearching(false);
        return;
      }
    } catch {
      // Continue to local storage fallback
    }

    // 2. Query localStorage fallback
    try {
      const stored = localStorage.getItem('yealo_orders');
      if (stored) {
        const parsed: OrderRecord[] = JSON.parse(stored);
        const found = parsed.find(
          (o) =>
            o.orderNumber.toUpperCase() === clean ||
            o.id.toUpperCase() === clean ||
            o.id.toUpperCase().includes(clean)
        );
        if (found) {
          const status = (found.status as FulfillmentStatus) || 'Pending';
          const { steps, stepIdx, estimatedArrival } = buildTrackingSteps(
            status,
            found.orderNumber,
            found.deliveryAddress,
            found.createdAt ? new Date(found.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
          );

          const tracking: OrderTrackingDetails = {
            orderId: found.orderNumber,
            customerName: found.customerName,
            phone: found.phoneNumber,
            productName: found.productName,
            bagSize: found.bagSize || '5kg',
            quantity: found.quantity,
            total: found.total,
            paymentMethod: 'Cash on Delivery (COD)',
            deliveryAddress: found.deliveryAddress,
            cityArea: found.cityArea || 'Science City of Muñoz',
            landmark: found.landmark,
            estimatedArrival,
            riderName: 'Kuya Arnel (Rider #03)',
            riderPhone: '0917-555-8812',
            vehicleType: 'Insulated Cold-Box Tricycle',
            status,
            currentStepIndex: stepIdx,
            steps,
          };

          setActiveTracking(tracking);
          setIsSearching(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    // 3. Not found in database or local orders
    setActiveTracking(null);
    setSearchError(
      language === 'en'
        ? `No active order found with ID "${clean}". Please verify your Order ID and try again, or place a new order.`
        : `Walang nahanap na order na may ID na "${clean}". Paki-check ang inyong Order ID o mag-order ulit.`
    );
    setIsSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(searchInput);
  };

  const getStatusBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          text: language === 'en' ? 'Pending Confirmation' : 'Naghihintay ng Kumpirmasyon',
          percent: 20,
        };
      case 'Confirmed':
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          dot: 'bg-blue-500',
          text: language === 'en' ? 'Order Confirmed' : 'Kumpirmado na ang Order',
          percent: 40,
        };
      case 'Preparing':
        return {
          bg: 'bg-sky-100 text-sky-900 border-sky-300',
          dot: 'bg-sky-500',
          text: language === 'en' ? 'Ice Packing & Sealing' : 'Kasalukuyang Bina-bag ang Yelo',
          percent: 65,
        };
      case 'Out for Delivery':
        return {
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
          dot: 'bg-purple-600',
          text: language === 'en' ? 'Out for Delivery (Rider En Route)' : 'Papunta na ang Delivery Rider',
          percent: 85,
        };
      case 'Delivered':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-500',
          text: language === 'en' ? 'Delivered & Completed' : 'Matagumpay na Naihatid',
          percent: 100,
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-900 border-slate-300',
          dot: 'bg-slate-500',
          text: status,
          percent: 50,
        };
    }
  };

  const badgeInfo = activeTracking ? getStatusBadge(activeTracking.status) : null;

  return (
    <section id="track" className="py-16 sm:py-24 bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-widest mb-4">
            <Truck className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Live Order Fulfillment Tracker' : 'Live Order & Delivery Tracker'}</span>
          </div>

          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
            {language === 'en' ? (
              <>
                Track Your <span className="text-amber-400">Yealo Ice</span> Delivery
              </>
            ) : (
              <>
                I-track ang Delivery ng <span className="text-amber-400">Yealo Ice</span>
              </>
            )}
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            {language === 'en'
              ? 'Enter your Order ID below to view real-time packing progress, rider assignment, and estimated delivery arrival across Muñoz and San Jose City.'
              : 'I-type ang iyong Order Tracking ID upang masubaybayan ang pag-iimpake, rider dispatch, at oras ng dating ng inyong fresh ice.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-stretch gap-2.5 p-2 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl backdrop-blur-xs"
          >
            <div className="flex-1 relative flex items-center">
              <Search className="w-5 h-5 text-amber-400 absolute left-4 pointer-events-none" />
              <input
                id="order-tracking-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Enter Order ID (e.g. YLO-12345)...'
                    : 'Ilagay ang Order ID (hal. YLO-12345)...'
                }
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/90 text-white font-mono font-bold text-sm sm:text-base placeholder:font-sans placeholder:text-slate-500 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              id="order-tracking-search-btn"
              type="submit"
              disabled={isSearching || !searchInput.trim()}
              className="py-3.5 px-7 rounded-xl font-heading font-black text-xs uppercase tracking-wider bg-[#FDD023] hover:bg-amber-300 text-[#111827] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'en' ? 'Checking...' : 'Hahanapin...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{language === 'en' ? 'Track Order' : 'I-track Na'}</span>
                </>
              )}
            </button>
          </form>

          {/* User's recent orders shortcuts if available */}
          {recentOrderNumbers.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">
                {language === 'en' ? 'Your recent orders:' : 'Inyong mga order kamakailan:'}
              </span>
              {recentOrderNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setSearchInput(num);
                    performLookup(num);
                  }}
                  className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 transition-all cursor-pointer"
                >
                  #{num}
                </button>
              ))}
            </div>
          )}

          {/* Search error notice */}
          {searchError && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{language === 'en' ? 'Order Not Found' : 'Hindi Nahanap ang Order'}</p>
                <p className="mt-0.5 text-rose-300/90">{searchError}</p>
              </div>
            </div>
          )}
        </div>

        {/* RESULTS CARD */}
        {activeTracking ? (
          <div className="rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-md transition-all">
            {/* Top Status Header */}
            <div className="p-6 sm:p-8 bg-[#111827] border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="font-mono font-black text-xl sm:text-2xl text-amber-400">
                    #{activeTracking.orderId}
                  </span>
                  {badgeInfo && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${badgeInfo.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badgeInfo.dot} animate-pulse`} />
                      <span>{badgeInfo.text}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  {language === 'en' ? 'Customer:' : 'Pangalan:'}{' '}
                  <strong className="text-white">{activeTracking.customerName}</strong> •{' '}
                  {activeTracking.cityArea}
                </p>
              </div>

              {/* Estimated Arrival Time Box */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-right">
                  <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                    {language === 'en' ? 'Estimated Arrival' : 'Inaasahang Dating'}
                  </div>
                  <div className="font-heading font-black text-lg text-emerald-400 flex items-center justify-end gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{activeTracking.estimatedArrival}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="px-6 sm:px-8 pt-6 pb-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                <span>{language === 'en' ? 'Fulfillment Progress' : 'Progreso ng Delivery'}</span>
                <span className="text-amber-400">{badgeInfo?.percent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-700/60 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-amber-400 via-yellow-400 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${badgeInfo?.percent}%` }}
                />
              </div>
            </div>

            {/* Stepper Timeline & Details Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Stepper Timeline (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <h4 className="font-heading font-black text-base uppercase tracking-wider text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>{language === 'en' ? 'Delivery Timeline' : 'Timeline ng Paghahatid'}</span>
                </h4>

                <div className="relative border-l-2 border-slate-700 ml-4 pl-6 space-y-6">
                  {activeTracking.steps.map((step, idx) => (
                    <div key={idx} className="relative group">
                      {/* Step Indicator Dot */}
                      <div
                        className={`absolute -left-[33px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                          step.done
                            ? 'bg-emerald-500 text-black shadow-md'
                            : step.current
                            ? 'bg-amber-400 text-black ring-4 ring-amber-400/20 animate-pulse'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {step.done ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <h5
                            className={`font-heading font-black text-sm tracking-wide ${
                              step.current
                                ? 'text-amber-400'
                                : step.done
                                ? 'text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            {language === 'en' ? step.title : step.titleTl}
                          </h5>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded">
                            {step.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {language === 'en' ? step.desc : step.descTl}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Info & Assigned Rider Card (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* Rider Dispatch Info Box */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      {language === 'en' ? 'Assigned Rider' : 'Itinalagang Rider'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {activeTracking.vehicleType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">
                        {activeTracking.riderName}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{activeTracking.riderPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <a
                      href={`tel:${activeTracking.riderPhone}`}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold text-center transition-colors"
                    >
                      {language === 'en' ? 'Call Rider' : 'Tawagan si Kuya'}
                    </a>
                    <a
                      href={`sms:${activeTracking.riderPhone}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center transition-colors"
                    >
                      SMS
                    </a>
                  </div>
                </div>

                {/* Delivery Address & Ice Item Details */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      {language === 'en' ? 'Destination Address' : 'Lugar ng Paghahatiran'}
                    </span>
                    <div className="flex items-start gap-1.5 text-slate-200 font-medium">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        {activeTracking.deliveryAddress}
                        {activeTracking.landmark ? ` (${activeTracking.landmark})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      {language === 'en' ? 'Items Ordered' : 'In-order na Yelo'}
                    </span>
                    <div className="flex items-center justify-between text-slate-200">
                      <span className="font-bold">
                        {activeTracking.productName} ({activeTracking.bagSize})
                      </span>
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">
                        × {activeTracking.quantity} bags
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {language === 'en' ? 'Total to Pay (COD):' : 'Kabuuang Bayarin:'}
                    </span>
                    <span className="font-heading font-black text-lg text-amber-400">
                      ₱{activeTracking.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Re-order or new order prompt */}
                {onOpenOrderModal && (
                  <button
                    type="button"
                    onClick={onOpenOrderModal}
                    className="w-full py-3 rounded-2xl font-heading font-black text-xs uppercase tracking-wider text-[#111827] bg-[#FDD023] hover:bg-amber-300 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    <span>{language === 'en' ? 'Place Another Ice Order' : 'Mag-order Ulit ng Yelo'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : !searchError ? (
          /* Clean empty placeholder prompt encouraging user to track an actual order */
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-800/50 border border-slate-700/60 text-center max-w-xl mx-auto backdrop-blur-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-base sm:text-lg text-white">
              {language === 'en' ? 'Ready to Track Your Delivery' : 'Handa nang I-track ang Delivery'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              {language === 'en'
                ? 'Enter the Order ID provided upon checkout to monitor dispatch status, packing, and courier delivery progress in real time.'
                : 'Ilagay ang Order ID mula sa inyong checkout upang masubaybayan ang progreso ng paghahatid sa real time.'}
            </p>
            {onOpenOrderModal && (
              <button
                type="button"
                onClick={onOpenOrderModal}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#FDD023] hover:bg-amber-300 text-[#111827] transition-all cursor-pointer shadow-md"
              >
                <Package className="w-4 h-4" />
                <span>{language === 'en' ? 'Order Ice Now' : 'Mag-order ng Yelo Ngayon'}</span>
              </button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};
