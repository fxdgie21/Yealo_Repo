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
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
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

export interface SimulatedOrderTracking {
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

// Preset simulated orders showcasing diverse fulfillment stages
const SIMULATED_ORDERS: Record<string, SimulatedOrderTracking> = {
  'YLO-94821': {
    orderId: 'YLO-94821',
    customerName: 'Maria Santos (Bean & Brew Cafe)',
    phone: '0917-882-4109',
    productName: 'Tube Ice',
    bagSize: '5kg',
    quantity: 4,
    total: 190,
    paymentMethod: 'Cash on Delivery (COD)',
    deliveryAddress: 'Tobias St., Brgy. Bantug',
    cityArea: 'Science City of Muñoz',
    landmark: 'Beside Central Luzon State University Main Gate',
    estimatedArrival: '15 - 20 mins',
    riderName: 'Kuya Arnel (Rider #03)',
    riderPhone: '0917-555-8812',
    vehicleType: 'Insulated Cold-Box Tricycle',
    status: 'Out for Delivery',
    currentStepIndex: 3,
    steps: [
      {
        title: 'Order Placed',
        titleTl: 'Natanggap ang Order',
        desc: 'Customer order recorded in Muñoz dispatch hub',
        descTl: 'Na-log ang order sa Muñoz dispatch hub',
        time: '1:45 PM',
        done: true,
        current: false,
      },
      {
        title: 'Confirmed by Dispatch',
        titleTl: 'Kumpirmado ng Dispatch',
        desc: 'Inventory reserved from fresh Reverse Osmosis batch',
        descTl: 'Nareserba ang fresh batch mula sa RO plant',
        time: '1:50 PM',
        done: true,
        current: false,
      },
      {
        title: 'Ice Packed & Sealed',
        titleTl: 'Na-pack at Na-seal ang Yelo',
        desc: 'Double-sealed in 100% food-grade insulated bags',
        descTl: 'Food-grade packaging at quality inspected',
        time: '2:02 PM',
        done: true,
        current: false,
      },
      {
        title: 'Out for Delivery',
        titleTl: 'Papunta na ang Rider',
        desc: 'Rider en route via Maharlika Highway route',
        descTl: 'Papunta na si Kuya Arnel dala ang inyong yelo',
        time: '2:15 PM',
        done: false,
        current: true,
      },
      {
        title: 'Delivered',
        titleTl: 'Naihatid na',
        desc: 'Handed over at customer address & payment collected',
        descTl: 'Na-receive at bayad na via COD',
        time: 'Pending Delivery',
        done: false,
        current: false,
      },
    ],
  },
  'YLO-48192': {
    orderId: 'YLO-48192',
    customerName: 'Engr. David Ramos',
    phone: '0928-441-9201',
    productName: 'Cube Ice',
    bagSize: '10kg',
    quantity: 2,
    total: 180,
    paymentMethod: 'GCash upon Delivery',
    deliveryAddress: 'Rizal Street, Brgy. Malasin',
    cityArea: 'San Jose City',
    landmark: 'Near City Public Market',
    estimatedArrival: 'Delivered Today',
    riderName: 'Kuya Jomar (Rider #07)',
    riderPhone: '0919-444-2200',
    vehicleType: 'Insulated Express Delivery Van',
    status: 'Delivered',
    currentStepIndex: 4,
    steps: [
      {
        title: 'Order Placed',
        titleTl: 'Natanggap ang Order',
        desc: 'Online order confirmed',
        descTl: 'Online order natanggap',
        time: '10:15 AM',
        done: true,
        current: false,
      },
      {
        title: 'Confirmed by Dispatch',
        titleTl: 'Kumpirmado ng Dispatch',
        desc: 'San Jose route scheduled',
        descTl: 'Nai-schedule sa San Jose route',
        time: '10:20 AM',
        done: true,
        current: false,
      },
      {
        title: 'Ice Packed & Sealed',
        titleTl: 'Na-pack at Na-seal',
        desc: '2x 10kg premium cube bags loaded into cold-storage',
        descTl: 'Nai-load sa refrigerated container',
        time: '10:35 AM',
        done: true,
        current: false,
      },
      {
        title: 'Out for Delivery',
        titleTl: 'Bumibiyahe ang Rider',
        desc: 'Rider en route to Brgy. Malasin',
        descTl: 'Biyahe papunta sa San Jose address',
        time: '10:50 AM',
        done: true,
        current: false,
      },
      {
        title: 'Delivered',
        titleTl: 'Matagumpay na Naihatid',
        desc: 'Received in pristine condition with 0% melt loss',
        descTl: 'Naihatid nang buo at solid na solid',
        time: '11:18 AM',
        done: true,
        current: true,
      },
    ],
  },
  'YLO-33910': {
    orderId: 'YLO-33910',
    customerName: 'Nanay Corazon (Sari-Sari Store)',
    phone: '0908-112-9988',
    productName: 'Tube Ice',
    bagSize: '1kg',
    quantity: 10,
    total: 230,
    paymentMethod: 'Cash on Delivery (COD)',
    deliveryAddress: 'Poblacion East, tapat ng simbahan',
    cityArea: 'Science City of Muñoz',
    landmark: 'Front of St. Sebastian Parish',
    estimatedArrival: '30 - 40 mins',
    riderName: 'Kuya Ben (Rider #01)',
    riderPhone: '0922-333-1122',
    vehicleType: 'Insulated Cold-Box Tricycle',
    status: 'Preparing',
    currentStepIndex: 2,
    steps: [
      {
        title: 'Order Placed',
        titleTl: 'Natanggap ang Order',
        desc: 'Order logged for morning batch delivery',
        descTl: 'Naka-log para sa morning delivery batch',
        time: '2:10 PM',
        done: true,
        current: false,
      },
      {
        title: 'Confirmed by Dispatch',
        titleTl: 'Kumpirmado ng Dispatch',
        desc: 'Stock verified at Central Cold Storage Hub',
        descTl: 'Na-verify sa Muñoz Cold Storage',
        time: '2:14 PM',
        done: true,
        current: false,
      },
      {
        title: 'Ice Packed & Sealed',
        titleTl: 'Kasalukuyang Bina-bag',
        desc: 'Bagging fresh crystal-clear tube ice from filtration line',
        descTl: 'Kasalukuyang nag-iimpake ng yelo para sa delivery',
        time: '2:22 PM',
        done: false,
        current: true,
      },
      {
        title: 'Out for Delivery',
        titleTl: 'Papunta na ang Rider',
        desc: 'Queueing for rider motorcycle dispatch',
        descTl: 'Susunod na isasakay sa delivery trike',
        time: 'Est. 2:40 PM',
        done: false,
        current: false,
      },
      {
        title: 'Delivered',
        titleTl: 'Naihatid na',
        desc: 'Pending delivery completion',
        descTl: 'Mag-abang sa inyong lokasyon',
        time: 'Est. 2:55 PM',
        done: false,
        current: false,
      },
    ],
  },
  'YLO-77201': {
    orderId: 'YLO-77201',
    customerName: 'Chef Bryan (Fiesta Grille & Bar)',
    phone: '0917-333-9090',
    productName: 'Cube Ice',
    bagSize: '5kg',
    quantity: 6,
    total: 270,
    paymentMethod: 'Cash on Delivery (COD)',
    deliveryAddress: 'Maharlika Highway, boundary Talavera',
    cityArea: 'Talavera Hub',
    landmark: 'Beside Shell Gas Station',
    estimatedArrival: '45 - 60 mins',
    riderName: 'Dispatch Queue (Assigning Rider)',
    riderPhone: '0917-555-0199',
    vehicleType: 'Yealo Fleet Delivery Van',
    status: 'Pending',
    currentStepIndex: 0,
    steps: [
      {
        title: 'Order Placed',
        titleTl: 'Natanggap ang Order',
        desc: 'Order entered into dispatch queue',
        descTl: 'Pumasok na sa system ang order',
        time: 'Just now',
        done: false,
        current: true,
      },
      {
        title: 'Confirmed by Dispatch',
        titleTl: 'Kukumpirmahin ng Dispatcher',
        desc: 'Verifying delivery route availability',
        descTl: 'Tinitingnan ang ruta at schedule',
        time: 'Pending',
        done: false,
        current: false,
      },
      {
        title: 'Ice Packed & Sealed',
        titleTl: 'Ipa-pack ang Yelo',
        desc: 'Awaiting packing line assignment',
        descTl: 'Ihahanda mula sa cold vault',
        time: 'Pending',
        done: false,
        current: false,
      },
      {
        title: 'Out for Delivery',
        titleTl: 'Ibibiyahe ng Rider',
        desc: 'Rider dispatch pending',
        descTl: 'Isasakay sa van papunta sa inyo',
        time: 'Pending',
        done: false,
        current: false,
      },
      {
        title: 'Delivered',
        titleTl: 'Naihatid na',
        desc: 'Pending completion',
        descTl: 'Kumpirmasyon pagka-abot',
        time: 'Pending',
        done: false,
        current: false,
      },
    ],
  },
};

// Generator for any arbitrary Order ID typed by user
function generateSimulatedOrder(id: string): SimulatedOrderTracking {
  const cleanId = id.toUpperCase().trim();
  const sampleNum = cleanId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const statusOptions: FulfillmentStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
  const status = statusOptions[sampleNum % statusOptions.length];

  let currentStepIndex = 0;
  if (status === 'Pending') currentStepIndex = 0;
  else if (status === 'Confirmed') currentStepIndex = 1;
  else if (status === 'Preparing') currentStepIndex = 2;
  else if (status === 'Out for Delivery') currentStepIndex = 3;
  else if (status === 'Delivered') currentStepIndex = 4;

  const steps = [
    {
      title: 'Order Placed',
      titleTl: 'Natanggap ang Order',
      desc: 'Order registered in the system',
      descTl: 'Narehistro na sa system ang order',
      time: '15 mins ago',
      done: currentStepIndex > 0,
      current: currentStepIndex === 0,
    },
    {
      title: 'Confirmed by Dispatch',
      titleTl: 'Kumpirmado ng Dispatch',
      desc: 'Ice batch reserved from cold vault',
      descTl: 'Nareserba mula sa planta ng Yealo',
      time: '12 mins ago',
      done: currentStepIndex > 1,
      current: currentStepIndex === 1,
    },
    {
      title: 'Ice Packed & Sealed',
      titleTl: 'Na-pack at Na-seal ang Yelo',
      desc: 'Insulated packaging sealed for delivery',
      descTl: 'Naihanda sa food-grade insulated pouch',
      time: '8 mins ago',
      done: currentStepIndex > 2,
      current: currentStepIndex === 2,
    },
    {
      title: 'Out for Delivery',
      titleTl: 'Papunta na ang Rider',
      desc: 'Assigned to delivery route',
      descTl: 'Bumibiyahe na ang rider papunta sa inyo',
      time: '3 mins ago',
      done: currentStepIndex > 3,
      current: currentStepIndex === 3,
    },
    {
      title: 'Delivered',
      titleTl: 'Matagumpay na Naihatid',
      desc: 'Handed over and COD settled',
      descTl: 'Naihatid nang maayos at buo',
      time: status === 'Delivered' ? 'Completed' : 'Pending',
      done: currentStepIndex >= 4,
      current: currentStepIndex === 4,
    },
  ];

  return {
    orderId: cleanId,
    customerName: 'Valued Customer',
    phone: '0917-***-****',
    productName: sampleNum % 2 === 0 ? 'Tube Ice' : 'Cube Ice',
    bagSize: sampleNum % 3 === 0 ? '10kg' : '5kg',
    quantity: (sampleNum % 4) + 1,
    total: ((sampleNum % 4) + 1) * 45 + 30,
    paymentMethod: 'Cash on Delivery (COD)',
    deliveryAddress: 'Maharlika Highway, Science City of Muñoz',
    cityArea: 'Science City of Muñoz',
    landmark: 'Nueva Ecija',
    estimatedArrival:
      status === 'Delivered'
        ? 'Delivered'
        : status === 'Out for Delivery'
        ? '15 - 25 mins'
        : '35 - 50 mins',
    riderName: 'Kuya Arnel (Rider #03)',
    riderPhone: '0917-555-8812',
    vehicleType: 'Insulated Cold-Box Tricycle',
    status,
    currentStepIndex,
    steps,
  };
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  onOpenOrderModal,
  externalTrackingId,
}) => {
  const { language } = useLanguage();
  const [searchInput, setSearchInput] = useState('YLO-94821');
  const [activeTracking, setActiveTracking] = useState<SimulatedOrderTracking | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Load initial tracking on mount or external prop change
  useEffect(() => {
    const idToLookup = externalTrackingId || 'YLO-94821';
    setSearchInput(idToLookup);
    performLookup(idToLookup);
  }, [externalTrackingId]);

  const performLookup = async (id: string) => {
    if (!id.trim()) return;
    setIsSearching(true);

    const clean = id.trim().toUpperCase();

    // 1. Check preset simulated orders first
    if (SIMULATED_ORDERS[clean]) {
      setActiveTracking(JSON.parse(JSON.stringify(SIMULATED_ORDERS[clean])));
      setIsSearching(false);
      return;
    }

    // 2. Query live Firestore database for registered order
    try {
      let firestoreData: any = null;
      // Try direct doc by ID
      const directSnap = await getDoc(doc(db, 'orders', clean));
      if (directSnap.exists()) {
        firestoreData = directSnap.data();
      } else {
        // Try searching by orderNumber or id
        const ordersRef = collection(db, 'orders');
        const qNum = query(ordersRef, where('orderNumber', '==', clean));
        const numSnap = await getDocs(qNum);
        if (!numSnap.empty) {
          firestoreData = numSnap.docs[0].data();
        }
      }

      if (firestoreData) {
        const simFromFirestore = generateSimulatedOrder(firestoreData.orderNumber || clean);
        simFromFirestore.customerName = firestoreData.customerName || 'Valued Customer';
        simFromFirestore.phone = firestoreData.phoneNumber || '';
        simFromFirestore.productName = firestoreData.productName || 'Yealo Ice';
        simFromFirestore.quantity = firestoreData.quantity || 1;
        simFromFirestore.total = firestoreData.total || 0;
        simFromFirestore.deliveryAddress = firestoreData.deliveryAddress || 'Nueva Ecija';
        simFromFirestore.cityArea = firestoreData.cityArea || 'Science City of Muñoz';
        simFromFirestore.status = (firestoreData.status as FulfillmentStatus) || 'Pending';

        const stepIdx =
          firestoreData.status === 'Delivered'
            ? 4
            : firestoreData.status === 'Out for Delivery'
            ? 3
            : firestoreData.status === 'Preparing'
            ? 2
            : firestoreData.status === 'Confirmed'
            ? 1
            : 0;

        simFromFirestore.currentStepIndex = stepIdx;
        simFromFirestore.steps.forEach((st, idx) => {
          st.done = idx < stepIdx || (firestoreData.status === 'Delivered' && idx <= 4);
          st.current = idx === stepIdx;
        });

        setActiveTracking(simFromFirestore);
        setIsSearching(false);
        return;
      }
    } catch {
      // Continue to local storage fallback
    }

    // 3. Check localStorage
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
          const simFromReal = generateSimulatedOrder(found.orderNumber);
          simFromReal.customerName = found.customerName;
          simFromReal.phone = found.phoneNumber;
          simFromReal.productName = found.productName;
          simFromReal.quantity = found.quantity;
          simFromReal.total = found.total;
          simFromReal.deliveryAddress = found.deliveryAddress;
          simFromReal.status = (found.status as FulfillmentStatus) || 'Pending';

          const stepIdx =
            found.status === 'Delivered'
              ? 4
              : found.status === 'Out for Delivery'
              ? 3
              : found.status === 'Preparing'
              ? 2
              : 0;
          simFromReal.currentStepIndex = stepIdx;
          simFromReal.steps.forEach((st, idx) => {
            st.done = idx < stepIdx || (found.status === 'Delivered' && idx <= 4);
            st.current = idx === stepIdx;
          });

          setActiveTracking(simFromReal);
          setIsSearching(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    // 4. Otherwise generate an accurate simulated tracking model
    setActiveTracking(generateSimulatedOrder(clean));
    setIsSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(searchInput);
  };

  // Quick preset selector
  const handleSelectPreset = (id: string) => {
    setSearchInput(id);
    performLookup(id);
  };

  // Interactive Demo: Advance status to next step to showcase real-time tracking
  const handleAdvanceStatus = () => {
    if (!activeTracking) return;
    const stages: FulfillmentStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
    const curIdx = stages.indexOf(activeTracking.status);
    const nextIdx = (curIdx + 1) % stages.length;
    const nextStatus = stages[nextIdx];

    const updated = { ...activeTracking };
    updated.status = nextStatus;
    updated.currentStepIndex = nextIdx;
    updated.estimatedArrival =
      nextStatus === 'Delivered'
        ? 'Delivered'
        : nextStatus === 'Out for Delivery'
        ? '15 - 20 mins'
        : nextStatus === 'Preparing'
        ? '30 - 40 mins'
        : '45 - 60 mins';

    updated.steps = updated.steps.map((st, i) => ({
      ...st,
      done: i < nextIdx || (nextStatus === 'Delivered' && i <= 4),
      current: i === nextIdx,
    }));

    setActiveTracking(updated);
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
              ? 'Enter your Order ID (e.g. #YLO-94821) below to view real-time packing progress, rider assignment, and estimated delivery arrival across Muñoz and San Jose City.'
              : 'I-type ang iyong Order Tracking ID upang masubaybayan ang pag-iimpake, rider dispatch, at oras ng dating ng inyong fresh ice.'}
          </p>
        </div>

        {/* Search Bar & Sample ID Shortcuts */}
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
                    ? 'Enter Order ID (e.g. YLO-94821)...'
                    : 'Ilagay ang Order ID (hal. YLO-94821)...'
                }
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/90 text-white font-mono font-bold text-sm sm:text-base placeholder:font-sans placeholder:text-slate-500 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              id="order-tracking-search-btn"
              type="submit"
              disabled={isSearching}
              className="py-3.5 px-7 rounded-xl font-heading font-black text-xs uppercase tracking-wider bg-[#FDD023] hover:bg-amber-300 text-[#111827] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
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

          {/* Preset Sample Order Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">
              {language === 'en' ? 'Try simulated orders:' : 'Subukan ang demo IDs:'}
            </span>
            {[
              { id: 'YLO-94821', label: 'Out for Delivery (Rider En Route)', color: 'text-purple-300 border-purple-500/40 bg-purple-500/10' },
              { id: 'YLO-33910', label: 'Preparing (Ice Packing)', color: 'text-sky-300 border-sky-500/40 bg-sky-500/10' },
              { id: 'YLO-48192', label: 'Delivered (Completed)', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
              { id: 'YLO-77201', label: 'Pending (Queue)', color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all cursor-pointer hover:border-white ${preset.color} ${
                  activeTracking?.orderId === preset.id ? 'ring-1 ring-white' : ''
                }`}
              >
                {preset.id}
              </button>
            ))}
          </div>
        </div>

        {/* RESULTS CARD */}
        {activeTracking && (
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

              {/* ETA & Interactive Demo Advance Button */}
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

                {/* Status Switcher for Demo */}
                <button
                  type="button"
                  onClick={handleAdvanceStatus}
                  title="Simulate advancing to next delivery step"
                  className="px-3.5 py-2.5 rounded-2xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {language === 'en' ? 'Advance Step (Demo)' : 'Susunod na Hakbang'}
                  </span>
                  <span className="sm:hidden">Next Step</span>
                </button>
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
        )}
      </div>
    </section>
  );
};
