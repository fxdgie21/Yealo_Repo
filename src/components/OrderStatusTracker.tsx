import React, { useState, useEffect, useRef } from 'react';
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
  Star,
  ThumbsUp,
  Send,
  Award,
  Check,
  Edit2,
  Bike,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { OrderRecord, ReviewItem } from '../types';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useRiders } from '../context/RidersContext';

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
  riderId?: string;
  riderName: string;
  riderPhone: string;
  vehicleType: string;
  status: FulfillmentStatus;
  currentStepIndex: number;
  review?: {
    rating: number;
    comment: string;
    compliments?: string[];
    submittedAt: string;
    reviewerName?: string;
    riderId?: string;
    riderName?: string;
  };
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
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [statusUpdatedFlash, setStatusUpdatedFlash] = useState(false);

  // Keep reference to active Firestore real-time listener unsubs
  const unsubscribeRealtimeRef = useRef<(() => void) | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Clean up listener on component unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRealtimeRef.current) {
        unsubscribeRealtimeRef.current();
        unsubscribeRealtimeRef.current = null;
      }
    };
  }, []);

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

  // Helper to convert raw order data from Firestore into OrderTrackingDetails
  const parseTrackingData = (data: any, orderIdentifier: string): OrderTrackingDetails => {
    const orderNum = data.orderNumber || orderIdentifier;
    const status = (data.status as FulfillmentStatus) || 'Pending';
    const address = data.deliveryAddress || 'Nueva Ecija';
    const createdAt = data.createdAt
      ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;
    const { steps, stepIdx, estimatedArrival } = buildTrackingSteps(status, orderNum, address, createdAt);

    return {
      orderId: orderNum,
      customerName: data.customerName || 'Valued Customer',
      phone: data.phoneNumber || '',
      productName: data.productName || 'Yealo Tube Ice',
      bagSize: data.bagSize || '5kg',
      quantity: Number(data.quantity) || 1,
      total: Number(data.total) || 0,
      paymentMethod: data.paymentMethod || 'Cash on Delivery (COD)',
      deliveryAddress: address,
      cityArea: data.cityArea || 'Science City of Muñoz',
      landmark: data.landmark || '',
      estimatedArrival,
      riderName: data.riderName || 'Kuya Arnel (Rider #03)',
      riderPhone: data.riderPhone || '0917-555-8812',
      vehicleType: data.vehicleType || 'Insulated Cold-Box Tricycle',
      status,
      currentStepIndex: stepIdx,
      steps,
    };
  };

  const performLookup = async (id: string) => {
    const clean = id.trim().toUpperCase();
    if (!clean) return;

    setIsSearching(true);
    setSearchError(null);

    // Cancel any existing real-time listener before starting a new search
    if (unsubscribeRealtimeRef.current) {
      unsubscribeRealtimeRef.current();
      unsubscribeRealtimeRef.current = null;
    }

    try {
      // 1. Check direct doc by ID first
      const directRef = doc(db, 'orders', clean);
      const directSnap = await getDoc(directRef);

      if (directSnap.exists()) {
        const initialData = directSnap.data();
        const tracking = parseTrackingData(initialData, clean);
        setActiveTracking(tracking);
        prevStatusRef.current = tracking.status;
        setIsSearching(false);
        setIsLiveConnected(true);

        // Attach Real-Time onSnapshot listener to the specific document
        const unsub = onSnapshot(
          directRef,
          (liveSnap) => {
            if (liveSnap.exists()) {
              const liveData = liveSnap.data();
              const updated = parseTrackingData(liveData, clean);
              if (prevStatusRef.current && prevStatusRef.current !== updated.status) {
                setStatusUpdatedFlash(true);
                setTimeout(() => setStatusUpdatedFlash(false), 4000);
              }
              prevStatusRef.current = updated.status;
              setActiveTracking(updated);
            }
          },
          (err) => {
            console.warn('Real-time tracking snapshot notice:', err);
          }
        );
        unsubscribeRealtimeRef.current = unsub;
        return;
      }

      // 2. Check query by orderNumber field (e.g. YLO-XXXXXX)
      const ordersRef = collection(db, 'orders');
      const qNum = query(ordersRef, where('orderNumber', '==', clean));
      const numSnap = await getDocs(qNum);

      if (!numSnap.empty) {
        const matchedDoc = numSnap.docs[0];
        const initialData = matchedDoc.data();
        const tracking = parseTrackingData(initialData, clean);
        setActiveTracking(tracking);
        prevStatusRef.current = tracking.status;
        setIsSearching(false);
        setIsLiveConnected(true);

        // Attach Real-Time onSnapshot query listener so whenever admin changes status in portal, it instantly reflects!
        const unsub = onSnapshot(
          qNum,
          (querySnapshot) => {
            if (!querySnapshot.empty) {
              const liveDoc = querySnapshot.docs[0];
              const liveData = liveDoc.data();
              const updated = parseTrackingData(liveData, clean);
              if (prevStatusRef.current && prevStatusRef.current !== updated.status) {
                setStatusUpdatedFlash(true);
                setTimeout(() => setStatusUpdatedFlash(false), 4000);
              }
              prevStatusRef.current = updated.status;
              setActiveTracking(updated);
            }
          },
          (err) => {
            console.warn('Real-time query snapshot notice:', err);
          }
        );
        unsubscribeRealtimeRef.current = unsub;
        return;
      }
    } catch (firestoreErr) {
      console.warn('Firestore lookup notice, falling back to local search:', firestoreErr);
    }

    // 3. Fallback: Query localStorage
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
            found.createdAt
              ? new Date(found.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined
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
          prevStatusRef.current = status;
          setIsSearching(false);
          setIsLiveConnected(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    // 4. Built-in interactive demo orders so visitors can immediately test the tracker
    if (clean === 'YLO-94821' || clean === 'DEMO-1') {
      const demoOrder = {
        orderId: 'YLO-94821',
        customerName: 'Christian Gomez',
        phone: '0917-882-9901',
        productName: 'Yealo Tube Ice',
        bagSize: '5kg',
        quantity: 4,
        total: 160,
        paymentMethod: 'Cash on Delivery (COD)',
        deliveryAddress: 'CLSU Agro-Eco Park, Science City of Muñoz',
        cityArea: 'Science City of Muñoz',
        landmark: 'Near CLSU Main Gate',
        estimatedArrival: '12 - 18 mins',
        riderName: 'Kuya Arnel Ramos',
        riderPhone: '0917-555-8812',
        vehicleType: 'Insulated Cold-Box Tricycle (Muñoz TODA #03)',
        status: 'Out for Delivery' as FulfillmentStatus,
        currentStepIndex: 3,
        steps: buildTrackingSteps('Out for Delivery', 'YLO-94821', 'CLSU Agro-Eco Park, Science City of Muñoz', '10:30 AM').steps,
      };
      setActiveTracking(demoOrder);
      prevStatusRef.current = 'Out for Delivery';
      setIsSearching(false);
      setIsLiveConnected(true);
      return;
    }

    if (clean === 'YLO-77102' || clean === 'DEMO-2') {
      const demoOrder = {
        orderId: 'YLO-77102',
        customerName: 'Maria Elena Dela Cruz',
        phone: '0928-444-1923',
        productName: 'Yealo Cube Ice',
        bagSize: '10kg',
        quantity: 2,
        total: 160,
        paymentMethod: 'Cash on Delivery (COD)',
        deliveryAddress: 'Maharlika Highway, tapat ng City Hall',
        cityArea: 'San Jose City',
        landmark: 'Beside Shell Station',
        estimatedArrival: '25 - 35 mins',
        riderName: 'Kuya Bong Dalisay',
        riderPhone: '0928-444-1923',
        vehicleType: 'Express Motorcycle with Twin Coolers',
        status: 'Preparing' as FulfillmentStatus,
        currentStepIndex: 2,
        steps: buildTrackingSteps('Preparing', 'YLO-77102', 'Maharlika Highway, San Jose City', '11:15 AM').steps,
      };
      setActiveTracking(demoOrder);
      prevStatusRef.current = 'Preparing';
      setIsSearching(false);
      setIsLiveConnected(true);
      return;
    }

    // 5. Not found in database, local orders, or demo presets
    setActiveTracking(null);
    setIsLiveConnected(false);
    setSearchError(
      language === 'en'
        ? `No active order found with ID "${clean}". Please verify your Order ID and try again, or try the quick demo buttons below.`
        : `Walang nahanap na order na may ID na "${clean}". Paki-check ang inyong Order ID o subukan ang mga demo button sa ibaba.`
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

          {/* User's recent orders shortcuts & Instant Demo links */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            {recentOrderNumbers.length > 0 && (
              <>
                <span className="text-slate-400 font-medium">
                  {language === 'en' ? 'Your orders:' : 'Inyong mga order:'}
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
                <span className="text-slate-600">|</span>
              </>
            )}

            {/* Quick Demo Testing Links */}
            <span className="text-slate-400 font-medium">
              {language === 'en' ? 'Quick demo preview:' : 'Subukan ang live preview:'}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchInput('YLO-94821');
                performLookup('YLO-94821');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-400/15 border border-amber-400/40 hover:bg-amber-400/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Truck className="w-3 h-3 text-amber-400" />
              <span>{language === 'en' ? 'Demo: Out for Delivery (#YLO-94821)' : 'Demo: Delivering (#YLO-94821)'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput('YLO-77102');
                performLookup('YLO-77102');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-300 bg-cyan-400/15 border border-cyan-400/40 hover:bg-cyan-400/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Package className="w-3 h-3 text-cyan-400" />
              <span>{language === 'en' ? 'Demo: Ice Packing (#YLO-77102)' : 'Demo: Packing (#YLO-77102)'}</span>
            </button>
          </div>

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
            {/* Live Real-Time Auto-Update Alert Banner */}
            {statusUpdatedFlash && (
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold animate-bounce shadow-md">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>
                    {language === 'en'
                      ? `🔔 Order status automatically updated to "${activeTracking.status}" by Dispatch!`
                      : `🔔 Awtomatikong na-update ang status ng order sa "${activeTracking.status}" ng Dispatch!`}
                  </span>
                </div>
                <span className="text-[11px] uppercase tracking-wider font-mono opacity-90 hidden sm:inline">
                  Real-time Sync Active
                </span>
              </div>
            )}

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
                  {isLiveConnected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Sync</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  {language === 'en' ? 'Customer:' : 'Pangalan:'}{' '}
                  <strong className="text-white">{activeTracking.customerName}</strong> •{' '}
                  {activeTracking.cityArea}
                </p>
              </div>

              {/* Estimated Arrival Time Box & Instant Refresh */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => performLookup(activeTracking.orderId)}
                  disabled={isSearching}
                  className="p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Check live status from dispatch"
                >
                  <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin text-amber-400' : ''}`} />
                </button>
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
                <span className="text-amber-400 font-mono font-black">{badgeInfo?.percent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-700/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${badgeInfo?.percent}%` }}
                />
              </div>
            </div>

            {/* LIVE COLD-CHAIN GPS ROUTE RADAR BANNER */}
            <div className="mx-6 sm:mx-8 my-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-400/40 shadow-inner relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 font-heading">
                    {language === 'en' ? 'Live Cold-Chain GPS Radar' : 'Live Cold-Chain GPS Radar'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                    • Muñoz Central Hub to {activeTracking.cityArea}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-bold text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>-18°C Insulated Thermal Cargo</span>
                </div>
              </div>

              {/* Animated Road Track */}
              <div className="py-4 relative">
                {/* Connecting Path Line */}
                <div className="h-2 w-full bg-slate-800 rounded-full relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 rounded-full transition-all duration-700"
                    style={{
                      width:
                        activeTracking.status === 'Delivered'
                          ? '100%'
                          : activeTracking.status === 'Out for Delivery'
                          ? '72%'
                          : activeTracking.status === 'Preparing'
                          ? '38%'
                          : '15%',
                    }}
                  />
                  {/* Subtle animated light dot traversing the route */}
                  <div className="absolute top-0 bottom-0 w-8 bg-white/50 blur-xs rounded-full animate-[pulse_2s_infinite]" />
                </div>

                {/* Waypoint Markers */}
                <div className="flex items-center justify-between text-[11px] pt-3 font-bold text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-[10px]">
                      ❄️
                    </span>
                    <div>
                      <div className="text-white font-extrabold text-[11px]">Muñoz Ice Plant</div>
                      <div className="text-[10px] text-slate-400">Pure RO Line</div>
                    </div>
                  </div>

                  {/* Rider Transit Marker */}
                  <div className="flex flex-col items-center text-center px-2">
                    <div className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 text-[10px] font-black flex items-center gap-1">
                      <Truck className="w-3 h-3 text-amber-400 animate-bounce" />
                      <span>{activeTracking.riderName}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      {activeTracking.status === 'Out for Delivery'
                        ? 'En Route • ~12-18m away'
                        : activeTracking.status === 'Delivered'
                        ? 'Safely Delivered'
                        : 'Packing at Station'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-right">
                    <div>
                      <div className="text-white font-extrabold text-[11px] truncate max-w-[140px] sm:max-w-[200px]">
                        {activeTracking.deliveryAddress}
                      </div>
                      <div className="text-[10px] text-slate-400">{activeTracking.cityArea}</div>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-[10px]">
                      📍
                    </span>
                  </div>
                </div>
              </div>

              {/* Telemetry bottom bar */}
              <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Courier: <strong className="text-slate-200">{activeTracking.riderName}</strong></span>
                  <span>•</span>
                  <span>Vehicle: <strong className="text-slate-200">{activeTracking.vehicleType}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${activeTracking.riderPhone}`}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-black transition-colors"
                  >
                    Direct Call: {activeTracking.riderPhone}
                  </a>
                </div>
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
