import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Package,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Search,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Layers,
  Printer,
  ChevronRight,
  ShieldCheck,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OrderRecord } from '../types';

interface AdminDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'tl';
}

const DEFAULT_PIN = '1234';

export const AdminDispatchModal: React.FC<AdminDispatchModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('yealo_admin_auth') === 'true';
  });
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<OrderRecord | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);

  // Manual fast order creation states
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mCity, setMCity] = useState('Science City of Muñoz');
  const [mProduct, setMProduct] = useState<'Tube Ice' | 'Cube Ice'>('Tube Ice');
  const [mSize, setMSize] = useState<'1kg' | '5kg' | '10kg'>('5kg');
  const [mQty, setMQty] = useState(2);
  const [mNotes, setMNotes] = useState('');

  // Firestore real-time subscription
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    setIsLoading(true);
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: OrderRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            orderNumber: data.orderNumber || docSnap.id,
            customerName: data.customerName || 'Anonymous Customer',
            phoneNumber: data.phoneNumber || '',
            email: data.email || '',
            productId: data.productId || 'tube-ice',
            productName: data.productName || 'Pure Ice',
            bagSize: data.bagSize || '5kg',
            quantity: Number(data.quantity) || 1,
            unitPrice: Number(data.unitPrice) || 0,
            subtotal: Number(data.subtotal) || 0,
            deliveryFee: Number(data.deliveryFee) || 0,
            total: Number(data.total) || 0,
            deliveryAddress: data.deliveryAddress || 'Muñoz, Nueva Ecija',
            cityArea: data.cityArea || 'Science City of Muñoz',
            landmark: data.landmark || '',
            deliveryDate: data.deliveryDate || new Date().toISOString().split('T')[0],
            deliveryTime: data.deliveryTime || 'Morning Dispatch',
            additionalNotes: data.additionalNotes || '',
            createdAt: data.createdAt || new Date().toISOString(),
            status: (data.status as OrderRecord['status']) || 'Pending',
          });
        });

        // Sort latest first
        fetched.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          return timeB - timeA;
        });

        setOrders(fetched);
        setIsLoading(false);
      },
      (error) => {
        console.warn('Firestore live listener notice (falling back to local cache):', error);
        try {
          const local = localStorage.getItem('yealo_orders');
          if (local) {
            setOrders(JSON.parse(local));
          }
        } catch (e) {
          console.error(e);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.trim() === DEFAULT_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('yealo_admin_auth', 'true');
      setPinError('');
    } else {
      setPinError(language === 'en' ? 'Incorrect PIN code. Hint: 1234' : 'Maling PIN code. Subukan ang 1234');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('yealo_admin_auth');
    setEnteredPin('');
  };

  // Status transition helper
  const handleUpdateStatus = async (orderId: string, newStatus: OrderRecord['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Update local state smoothly
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      setActionMessage(`Order marked as "${newStatus}"`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.warn('Firestore update fallback:', err);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setActionMessage(`Updated to ${newStatus}`);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Delete this order from the dispatch board?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.warn('Delete error:', err);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim() || !mPhone.trim() || !mAddress.trim()) {
      alert('Please fill out Name, Phone, and Delivery Address.');
      return;
    }

    const priceMap: Record<string, number> = { '1kg': 20, '5kg': 40, '10kg': 75 };
    const unitPrice = priceMap[mSize] || 40;
    const subtotal = unitPrice * mQty;
    const deliveryFee = subtotal >= 300 ? 0 : 30;
    const total = subtotal + deliveryFee;

    const newOrd: OrderRecord = {
      id: `ord_${Date.now()}`,
      orderNumber: `YLO-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: mName,
      phoneNumber: mPhone,
      email: 'walkin@yealoice.com',
      productId: mProduct === 'Tube Ice' ? 'tube-ice' : 'cube-ice',
      productName: `${mProduct} (${mSize})`,
      bagSize: mSize,
      quantity: mQty,
      unitPrice,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress: `${mAddress}, ${mCity}, Nueva Ecija`,
      cityArea: mCity,
      landmark: mAddress,
      deliveryDate: new Date().toLocaleDateString('en-CA'),
      deliveryTime: 'Immediate Rush',
      additionalNotes: mNotes || 'Walk-in / Phone Call Order',
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };

    try {
      await setDoc(doc(db, 'orders', newOrd.id), {
        ...newOrd,
        timestamp: serverTimestamp(),
      });
      setOrders((prev) => [newOrd, ...prev]);
      setShowManualOrderForm(false);
      setMName('');
      setMPhone('');
      setMAddress('');
      setMNotes('');
      setActionMessage('Manual order dispatched successfully!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setOrders((prev) => [newOrd, ...prev]);
      setShowManualOrderForm(false);
    }
  };

  // Metrics Calculations
  const totalSales = orders.reduce((sum, ord) => sum + (ord.status !== 'Cancelled' ? ord.total : 0), 0);
  const totalBags = orders.reduce((sum, ord) => sum + (ord.status !== 'Cancelled' ? ord.quantity : 0), 0);
  
  const bags1kg = orders.reduce((sum, o) => o.status !== 'Cancelled' && o.bagSize === '1kg' ? sum + o.quantity : sum, 0);
  const bags5kg = orders.reduce((sum, o) => o.status !== 'Cancelled' && o.bagSize === '5kg' ? sum + o.quantity : sum, 0);
  const bags10kg = orders.reduce((sum, o) => o.status !== 'Cancelled' && o.bagSize === '10kg' ? sum + o.quantity : sum, 0);

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const preparingCount = orders.filter((o) => o.status === 'Preparing').length;
  const deliveringCount = orders.filter((o) => o.status === 'Out for Delivery').length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

  // Filtered orders list
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === 'all' ? true : order.status.toLowerCase() === statusFilter.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.customerName.toLowerCase().includes(q) ||
      order.phoneNumber.toLowerCase().includes(q) ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.deliveryAddress.toLowerCase().includes(q) ||
      order.productName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div
      id="admin-dispatch-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-6xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-amber-300 overflow-hidden my-4 max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar matching landing page header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200 bg-[#FED74C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#111827] text-[#FDD023] flex items-center justify-center font-black shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-[#111827] tracking-tight">
                  YEALO DISPATCH PORTAL
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#111827] text-[#FDD023] shadow-2xs">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-[#111827]/80 font-semibold">
                Store Owner & Dispatcher Control Center • Science City of Muñoz & San Jose
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#111827] bg-white/70 hover:bg-white border border-amber-300/80 transition-colors cursor-pointer shadow-2xs"
                title="Lock admin session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock PIN</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close admin portal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action toast message */}
        {actionMessage && (
          <div className="bg-[#111827] text-[#FDD023] px-6 py-2.5 text-xs font-black text-center flex items-center justify-center gap-2 animate-in fade-in border-b border-amber-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* AUTHENTICATION GATE (PIN ENTRY) */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-14 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#FED74C]/30 border-2 border-amber-400 text-[#111827] flex items-center justify-center mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-[#111827]" />
            </div>
            <h4 className="font-heading font-black text-2xl text-[#111827] mb-2">
              Store Owner Verification
            </h4>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed font-medium">
              Enter your 4-digit Store Owner / Dispatch PIN code to access live orders, sales summaries, and rider dispatch actions.
            </p>

            <form onSubmit={handlePinSubmit} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="Enter 4-digit PIN (Default: 1234)"
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError('');
                  }}
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 rounded-2xl bg-amber-50/50 border-2 border-amber-300 text-[#111827] placeholder:text-slate-400 placeholder:tracking-normal placeholder:text-xs focus:outline-none focus:border-[#111827] focus:ring-2 focus:ring-amber-200"
                />
                {pinError && <p className="text-rose-600 text-xs mt-2 font-bold">{pinError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-[#111827] hover:bg-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4 text-[#FDD023]" />
                <span>Unlock Dispatch Portal</span>
              </button>

              <p className="text-[11px] text-slate-500 pt-2 font-medium">
                Need quick demo access? Default PIN is <span className="font-black text-[#111827] underline decoration-amber-400">1234</span>
              </p>
            </form>
          </div>
        ) : (
          /* MAIN DISPATCH DASHBOARD BODY */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/60">
            {/* 1. DAILY SALES & BAG METRICS SUMMARY BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Daily Sales Card */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>Total Sales</span>
                  <div className="p-1 rounded-full bg-amber-100 text-amber-900">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-[#111827]">
                  ₱{totalSales.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Cash on Delivery (COD) volume
                </div>
              </div>

              {/* Total Bags Ordered */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>Total Bags</span>
                  <div className="p-1 rounded-full bg-amber-100 text-amber-900">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-[#111827]">
                  {totalBags} <span className="text-sm font-bold text-slate-500">bags</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-1 flex gap-2 font-mono font-semibold">
                  <span>1kg: <strong className="text-black">{bags1kg}</strong></span>
                  <span>5kg: <strong className="text-black">{bags5kg}</strong></span>
                  <span>10kg: <strong className="text-black">{bags10kg}</strong></span>
                </div>
              </div>

              {/* Pending Action Required */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 shadow-xs">
                <div className="flex items-center justify-between text-xs text-amber-900 font-extrabold mb-1">
                  <span>Needs Dispatch</span>
                  <div className="p-1 rounded-full bg-[#FED74C] text-black">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-amber-950">
                  {pendingCount + preparingCount} <span className="text-sm font-bold text-amber-800">orders</span>
                </div>
                <div className="text-[10px] text-amber-900 font-bold mt-1">
                  {pendingCount} Pending • {preparingCount} Preparing
                </div>
              </div>

              {/* In Transit / Delivered */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>Riders on Road</span>
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-800">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-emerald-700">
                  {deliveringCount} <span className="text-sm font-bold text-slate-500">active</span>
                </div>
                <div className="text-[10px] text-slate-600 font-medium mt-1">
                  {deliveredCount} completed today
                </div>
              </div>
            </div>

            {/* 2. CONTROLS, SEARCH & STATUS FILTER */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer, phone, street, landmark, or YLO #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#111827] focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'Pending', 'Preparing', 'Out for Delivery', 'Delivered'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#111827] text-[#FDD023] shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    {st === 'all' ? 'All Orders' : st}
                  </button>
                ))}

                <button
                  onClick={() => setShowManualOrderForm(!showManualOrderForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FED74C] hover:bg-[#FDD023] text-[#111827] border border-amber-400 transition-colors whitespace-nowrap cursor-pointer ml-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Quick Order</span>
                </button>
              </div>
            </div>

            {/* MANUAL QUICK ORDER FORM TOGGLE */}
            {showManualOrderForm && (
              <form
                onSubmit={handleCreateManualOrder}
                className="p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-4 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <span className="font-heading font-black text-sm text-[#111827] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-800" />
                    Log Phone-in / Walk-in Order (Muñoz / San Jose)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualOrderForm(false)}
                    className="text-xs font-bold text-slate-500 hover:text-black cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Customer Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Aling Nena Sari-sari / Cafe"
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Contact Phone *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 0917-555-0199"
                      value={mPhone}
                      onChange={(e) => setMPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Municipality</label>
                    <select
                      value={mCity}
                      onChange={(e) => setMCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    >
                      <option value="Science City of Muñoz">Science City of Muñoz</option>
                      <option value="San Jose City">San Jose City</option>
                      <option value="Talavera">Talavera</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 mb-1 font-bold">Street Address & Landmark *</label>
                    <input
                      required
                      type="text"
                      placeholder="Brgy. Poblacion East, tapat ng plaza"
                      value={mAddress}
                      onChange={(e) => setMAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Product & Size</label>
                    <div className="flex gap-2">
                      <select
                        value={mProduct}
                        onChange={(e) => setMProduct(e.target.value as any)}
                        className="flex-1 px-2 py-2 rounded-xl bg-white border border-amber-200 text-slate-900"
                      >
                        <option value="Tube Ice">Tube Ice</option>
                        <option value="Cube Ice">Cube Ice</option>
                      </select>
                      <select
                        value={mSize}
                        onChange={(e) => setMSize(e.target.value as any)}
                        className="w-20 px-2 py-2 rounded-xl bg-white border border-amber-200 text-slate-900"
                      >
                        <option value="1kg">1kg</option>
                        <option value="5kg">5kg</option>
                        <option value="10kg">10kg</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Quantity (Bags)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={mQty}
                      onChange={(e) => setMQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-[#FDD023] font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                  >
                    Save & Dispatch
                  </button>
                </div>
              </form>
            )}

            {/* 3. ORDERS LIST */}
            {isLoading ? (
              <div className="text-center py-16">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-600 font-bold">Loading incoming orders from live database...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-amber-200 rounded-3xl bg-white">
                <Package className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h4 className="font-heading font-black text-slate-900 text-base">No Orders Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 font-medium">
                  {statusFilter === 'all'
                    ? 'No orders have been submitted yet. Place a test order through the storefront or use "+ Quick Order" above.'
                    : `No orders currently matching "${statusFilter}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusColors = {
                    Pending: 'bg-amber-100 text-amber-900 border-amber-300',
                    Preparing: 'bg-blue-100 text-blue-900 border-blue-300',
                    'Out for Delivery': 'bg-purple-100 text-purple-900 border-purple-300',
                    Delivered: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    Cancelled: 'bg-rose-100 text-rose-900 border-rose-300',
                  };

                  return (
                    <div
                      key={order.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 transition-all shadow-xs space-y-3"
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-100">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-sm text-[#111827] bg-[#FED74C]/30 px-2.5 py-0.5 rounded-lg border border-amber-300">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase border ${
                              statusColors[order.status] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Total Amount Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-bold">COD Due:</span>
                          <span className="font-heading font-black text-xl text-[#111827]">
                            ₱{order.total.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Main Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Column 1: Customer & Phone */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                            Customer Details
                          </div>
                          <div className="font-bold text-sm text-[#111827]">{order.customerName}</div>
                          <div className="flex items-center gap-2 pt-0.5">
                            <a
                              href={`tel:${order.phoneNumber}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold transition-colors"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{order.phoneNumber}</span>
                            </a>
                            <a
                              href={`sms:${order.phoneNumber}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors"
                              title="Send text message"
                            >
                              <span>SMS</span>
                            </a>
                          </div>
                        </div>

                        {/* Column 2: Product & Bag Specs */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                            Ice Quantity & Size
                          </div>
                          <div className="font-bold text-[#111827] text-sm">
                            {order.productName}
                          </div>
                          <div className="text-slate-700 flex items-center gap-2 font-medium">
                            <span className="bg-amber-100 px-2 py-0.5 rounded-md font-mono font-black text-amber-900">
                              {order.quantity} {order.quantity === 1 ? 'bag' : 'bags'}
                            </span>
                            <span>•</span>
                            <span>₱{order.unitPrice} each</span>
                          </div>
                          {order.deliveryFee > 0 ? (
                            <span className="text-[11px] text-slate-500 font-medium">
                              Includes ₱{order.deliveryFee} delivery fee
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-bold">
                              Free Delivery Qualified
                            </span>
                          )}
                        </div>

                        {/* Column 3: Destination & Window */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                            Delivery Destination
                          </div>
                          <div className="flex items-start gap-1.5 text-slate-800 font-medium leading-snug">
                            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <span>{order.deliveryAddress}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px] pt-1 font-semibold">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>{order.deliveryTime}</span>
                          </div>
                          {order.additionalNotes && (
                            <div className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200 italic font-medium">
                              "{order.additionalNotes}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Action Buttons Bar */}
                      <div className="pt-3 border-t border-amber-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                          <span>Set Status:</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {/* Pending Button */}
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Pending')}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              order.status === 'Pending'
                                ? 'bg-[#FED74C] text-[#111827] shadow-2xs font-black border border-amber-400'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-100'
                            }`}
                          >
                            1. Pending
                          </button>

                          {/* Preparing Button */}
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              order.status === 'Preparing'
                                ? 'bg-blue-600 text-white shadow-2xs font-black'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            2. Preparing
                          </button>

                          {/* Out for Delivery Button */}
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              order.status === 'Out for Delivery'
                                ? 'bg-purple-600 text-white shadow-2xs font-black'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Truck className="w-3 h-3" />
                            <span>3. Out for Delivery</span>
                          </button>

                          {/* Delivered Button */}
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-600 text-white shadow-2xs font-black'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>4. Delivered</span>
                          </button>

                          {/* Print Receipt / Slip Button */}
                          <button
                            onClick={() => setSelectedOrderForReceipt(order)}
                            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-black border border-amber-300 hover:bg-amber-50 flex items-center gap-1 cursor-pointer"
                            title="View / Print Rider Delivery Slip"
                          >
                            <Printer className="w-3 h-3 text-amber-700" />
                            <span className="hidden sm:inline">Slip</span>
                          </button>

                          {/* Delete Order Button */}
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PRINTABLE RIDER DELIVERY SLIP MODAL */}
        {selectedOrderForReceipt && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            onClick={() => setSelectedOrderForReceipt(null)}
          >
            <div
              className="bg-white text-slate-900 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4 border-2 border-black font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
                <h4 className="font-heading font-black text-xl tracking-tight text-slate-900">
                  YEALO PURE ICE
                </h4>
                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">
                  Rider Dispatch Slip • Muñoz Hub
                </p>
                <div className="font-mono text-xs font-bold text-amber-700 mt-1">
                  {selectedOrderForReceipt.orderNumber}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Customer:</span>
                  <span className="font-black text-slate-900">{selectedOrderForReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Phone:</span>
                  <span className="font-black text-slate-900">{selectedOrderForReceipt.phoneNumber}</span>
                </div>
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-bold block mb-0.5">Address:</span>
                  <span className="font-bold text-slate-900 leading-tight block">
                    {selectedOrderForReceipt.deliveryAddress}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-bold">Item:</span>
                  <span className="font-black text-slate-900">{selectedOrderForReceipt.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Quantity:</span>
                  <span className="font-black text-slate-900">
                    {selectedOrderForReceipt.quantity} bags
                  </span>
                </div>
                {selectedOrderForReceipt.additionalNotes && (
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                    <strong>Note:</strong> {selectedOrderForReceipt.additionalNotes}
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t-2 border-slate-900 pt-2 font-black">
                  <span>COD AMOUNT TO COLLECT:</span>
                  <span className="text-lg font-mono">₱{selectedOrderForReceipt.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-[#111827] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForReceipt(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 border-t border-amber-200 bg-[#FFFDF0] flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">Firestore Live Dispatch System • Synchronized to delivery fleet</span>
          </div>
          <span className="hidden sm:inline text-slate-500 font-medium">Yealo Ice Muñoz & San Jose City</span>
        </div>
      </div>
    </div>
  );
};
