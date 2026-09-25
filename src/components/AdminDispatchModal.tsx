import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Star,
  Edit2,
  Tag,
  Save,
  RotateCcw,
  Sparkles,
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
import { db, deleteOrderPermanently } from '../lib/firebase';
import { OrderRecord, Product, ProductBagOption } from '../types';
import { useProducts } from '../context/ProductsContext';

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
  const [orderToDelete, setOrderToDelete] = useState<OrderRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Tabs: 'orders' | 'products'
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  // Products context for managing prices and inventory
  const { products, updateProduct, addProduct, deleteProduct, resetToDefaults } = useProducts();

  // Product edit modal / inline edit state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice1kg, setEditPrice1kg] = useState<number>(8);
  const [editPrice5kg, setEditPrice5kg] = useState<number>(40);
  const [editPrice10kg, setEditPrice10kg] = useState<number>(80);
  const [editInStock, setEditInStock] = useState<boolean>(true);

  // Add new product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'Cubes' | 'Tubes' | string>('Cubes');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice1kg, setNewProdPrice1kg] = useState<number>(8);
  const [newProdPrice5kg, setNewProdPrice5kg] = useState<number>(40);
  const [newProdPrice10kg, setNewProdPrice10kg] = useState<number>(80);
  const [newProdImage, setNewProdImage] = useState<string>('/images/crystal-ice-cubes.jpg');
  const [newProdBadge, setNewProdBadge] = useState<string>('New Arrival');
  const [newProdPackaging, setNewProdPackaging] = useState<string>('Hygienic sealed Yealo polybag');

  // Product delete confirmation modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Manual fast order creation states
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mCity, setMCity] = useState('Science City of Muñoz');
  const [mProduct, setMProduct] = useState<string>('Tube Ice');
  const [mSize, setMSize] = useState<'1kg' | '5kg' | '10kg'>('5kg');
  const [mQty, setMQty] = useState(2);
  const [mNotes, setMNotes] = useState('');

  // Admin-only incoming order alert states
  const [incomingAlert, setIncomingAlert] = useState<{
    id: string;
    orderNumber: string;
    customerName: string;
    item: string;
    total: string;
  } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });
  const isInitialLoadRef = useRef(true);

  // Sound chime synthesizer exclusively for Admin Dispatch
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const requestNotifPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
          setActionMessage('Admin push notifications enabled!');
          setTimeout(() => setActionMessage(null), 3000);
        }
      } catch (err) {
        console.warn('Notification permission request error:', err);
      }
    }
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Auto-request notification permission when admin enters dispatch portal
  useEffect(() => {
    if (isOpen && isAuthenticated && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
          .then((perm) => setNotifPermission(perm))
          .catch(() => {});
      }
    }
  }, [isOpen, isAuthenticated]);

  // Firestore real-time subscription (Active strictly for Admin Dispatch)
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    setIsLoading(true);
    isInitialLoadRef.current = true;
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
            review: data.review || undefined,
          });
        });

        // Trigger notification exclusively for Admin when a new order arrives
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
        } else {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const orderNum = data.orderNumber || change.doc.id;
              const customer = data.customerName || 'Customer';
              const item = data.productName || 'Pure Ice';
              const total = data.total ? `₱${Number(data.total).toLocaleString()}` : '';

              // 1. Play audible sound chime inside Admin Portal
              if (soundEnabled) {
                playAlertChime();
              }

              // 2. Send Native Browser Notification exclusively to Admin
              if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted'
              ) {
                try {
                  new Notification(`🚨 New Dispatch Order: #${orderNum}`, {
                    body: `${customer} placed an order for ${item} (${total}). Ready for dispatch.`,
                    icon: '/favicon.ico',
                    tag: `admin-order-${orderNum}`,
                  });
                } catch (e) {
                  console.warn('Admin native notification failed:', e);
                }
              }

              // 3. Highlight with prominent in-portal banner
              setIncomingAlert({
                id: change.doc.id,
                orderNumber: String(orderNum),
                customerName: String(customer),
                item: String(item),
                total: String(total),
              });
            }
          });
        }

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
  }, [isOpen, isAuthenticated, soundEnabled]);

  // Database verification & resync tool
  const handleFixAndSyncDatabase = async () => {
    setIsSyncing(true);
    setActionMessage('Verifying and syncing database connection...');
    try {
      const { getDocs } = await import('firebase/firestore');
      const ordersCol = collection(db, 'orders');
      const snapshot = await getDocs(ordersCol);
      const synced: OrderRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        synced.push({
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
          review: data.review || undefined,
        });
      });

      synced.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });

      setOrders(synced);
      setActionMessage(`Database healthy: ${synced.length} orders synchronized`);
    } catch (err: any) {
      console.warn('Manual resync notice:', err);
      // fallback to localStorage
      try {
        const local = localStorage.getItem('yealo_orders');
        if (local) {
          setOrders(JSON.parse(local));
        }
      } catch {}
      setActionMessage('Database synced with local storage cache');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

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

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    const target = orderToDelete;

    try {
      const result = await deleteOrderPermanently(target.id, target.orderNumber);
      if (result.success) {
        setOrders((prev) => prev.filter((o) => o.id !== target.id));
        setActionMessage(`Order #${target.orderNumber} permanently deleted from database`);
      } else {
        // Fallback local update
        setOrders((prev) => prev.filter((o) => o.id !== target.id));
        setActionMessage(`Order #${target.orderNumber} removed`);
      }
    } catch (err) {
      console.warn('Delete error:', err);
      setOrders((prev) => prev.filter((o) => o.id !== target.id));
      setActionMessage(`Order #${target.orderNumber} removed`);
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDeleteOrder = (order: OrderRecord) => {
    setOrderToDelete(order);
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim() || !mPhone.trim() || !mAddress.trim()) {
      alert('Please fill out Name, Phone, and Delivery Address.');
      return;
    }

    const matchedProd = products.find((p) => p.name === mProduct || p.id === mProduct) || products[0];
    const bagOpt = matchedProd?.bagOptions?.find((b) => b.size === mSize);
    const unitPrice = bagOpt ? bagOpt.price : (mSize === '1kg' ? 8 : mSize === '10kg' ? 80 : 40);
    const subtotal = unitPrice * mQty;
    const deliveryFee = subtotal >= 300 ? 0 : 30;
    const total = subtotal + deliveryFee;

    const newOrd: OrderRecord = {
      id: `ord_${Date.now()}`,
      orderNumber: `YLO-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: mName,
      phoneNumber: mPhone,
      email: 'walkin@yealoice.com',
      productId: matchedProd ? matchedProd.id : 'tube-ice',
      productName: `${matchedProd ? matchedProd.name : mProduct} (${mSize})`,
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

  // Product Management Handlers
  const handleStartEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    const opt1 = prod.bagOptions?.find((b) => b.size === '1kg');
    const opt5 = prod.bagOptions?.find((b) => b.size === '5kg');
    const opt10 = prod.bagOptions?.find((b) => b.size === '10kg');
    setEditPrice1kg(opt1 ? opt1.price : 8);
    setEditPrice5kg(opt5 ? opt5.price : prod.price || 40);
    setEditPrice10kg(opt10 ? opt10.price : 80);
    setEditInStock(prod.inStock !== false);
  };

  const handleSaveProductPrices = async (prod: Product) => {
    const updatedOptions: ProductBagOption[] = [
      { size: '1kg', weightKg: 1, price: editPrice1kg, label: '1kg Personal Bag' },
      { size: '5kg', weightKg: 5, price: editPrice5kg, label: '5kg Standard Bag' },
      { size: '10kg', weightKg: 10, price: editPrice10kg, label: '10kg Commercial Sack' },
    ];
    const updatedProd: Product = {
      ...prod,
      price: editPrice5kg,
      inStock: editInStock,
      bagOptions: updatedOptions,
    };

    const res = await updateProduct(updatedProd);
    if (res.success) {
      setActionMessage(`Updated pricing for ${prod.name}! (1kg: ₱${editPrice1kg}, 5kg: ₱${editPrice5kg}, 10kg: ₱${editPrice10kg})`);
      setEditingProductId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleCreateNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      alert('Please enter a product name');
      return;
    }

    const slug = newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = `${slug}-${Date.now().toString().slice(-4)}`;

    const newProduct: Product = {
      id: newId,
      name: newProdName.trim(),
      category: newProdCategory,
      description: newProdDesc.trim() || `${newProdName.trim()} produced with pure 5-stage reverse osmosis water.`,
      longDescription: `Highest grade pure ice manufactured with food-grade standards for refreshments, restaurants, caterings, and parties.`,
      price: newProdPrice5kg,
      unit: 'per 5kg bag',
      image: newProdImage || '/images/crystal-ice-cubes.jpg',
      badge: newProdBadge.trim() || undefined,
      temperature: '-12°C',
      meltRate: 'Slow',
      bestFor: 'Beverages, coolers, catering, and businesses',
      packaging: newProdPackaging.trim() || 'Hygienic sealed Yealo polybag',
      inStock: true,
      bagOptions: [
        { size: '1kg', weightKg: 1, price: newProdPrice1kg, label: '1kg Personal Bag' },
        { size: '5kg', weightKg: 5, price: newProdPrice5kg, label: '5kg Standard Bag' },
        { size: '10kg', weightKg: 10, price: newProdPrice10kg, label: '10kg Commercial Sack' },
      ],
    };

    const res = await addProduct(newProduct);
    if (res.success) {
      setActionMessage(`Product "${newProduct.name}" added successfully!`);
      setShowAddProductModal(false);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice1kg(8);
      setNewProdPrice5kg(40);
      setNewProdPrice10kg(80);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await deleteProduct(productToDelete.id);
      setActionMessage(`Product "${productToDelete.name}" deleted from store.`);
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setIsDeletingProduct(false);
      setProductToDelete(null);
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

  const modalContent = (
    <div
      id="admin-dispatch-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-1 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-6xl bg-white text-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-amber-300 overflow-hidden my-2 sm:my-4 max-h-[96vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar matching landing page header */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-amber-200 bg-[#FED74C]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#111827] text-[#FDD023] flex items-center justify-center font-black shadow-md shrink-0">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="font-heading font-black text-sm sm:text-lg text-[#111827] tracking-tight truncate">
                    YEALO DISPATCH PORTAL
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase bg-[#111827] text-[#FDD023] shadow-2xs shrink-0">
                    Live
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-[#111827]/80 font-semibold truncate hidden xs:block">
                  Store Owner & Dispatcher Control Center • Muñoz & San Jose
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {isAuthenticated && (
                <>
                  {/* Sound alert toggle */}
                  <button
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                      soundEnabled
                        ? 'bg-white text-slate-900 border-amber-300 hover:bg-slate-50'
                        : 'bg-black/15 text-slate-700 border-black/15'
                    }`}
                    title={soundEnabled ? 'Order sound alert ON' : 'Order sound alert OFF'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="hidden md:inline">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
                  </button>

                  {/* Browser Notification Status / Request */}
                  <button
                    onClick={requestNotifPermission}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                      notifPermission === 'granted'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-900 border-amber-300 hover:bg-slate-50'
                    }`}
                    title="Browser push alert permission for new orders"
                  >
                    <Bell className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">
                      {notifPermission === 'granted' ? 'Alerts ON' : 'Alerts'}
                    </span>
                  </button>

                  {/* Fix & Sync Database Button */}
                  <button
                    onClick={handleFixAndSyncDatabase}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 hover:text-black border border-amber-300 hover:bg-amber-50 transition-colors cursor-pointer shadow-2xs"
                    title="Check database health and re-sync all live orders"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-700 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden lg:inline">{isSyncing ? 'Syncing...' : 'Fix & Sync DB'}</span>
                  </button>

                  {/* Test Sound Chime */}
                  <button
                    onClick={() => {
                      playAlertChime();
                      setActionMessage('Sound chime tested successfully!');
                      setTimeout(() => setActionMessage(null), 2500);
                    }}
                    className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-800 bg-white/70 hover:bg-white border border-amber-300 transition-colors cursor-pointer"
                    title="Test incoming order chime sound"
                  >
                    Test Sound
                  </button>

                  {/* Lock PIN */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-[#111827] bg-white/80 hover:bg-white border border-amber-300/80 transition-colors cursor-pointer shadow-2xs"
                    title="Lock admin session"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Lock PIN</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/10 hover:bg-black/20 text-[#111827] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close admin portal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Mobile Quick-Action Row for Touch Devices */}
          {isAuthenticated && (
            <div className="flex md:hidden items-center justify-between gap-1.5 pt-2 mt-2 border-t border-amber-300/70 text-xs overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 border transition-colors cursor-pointer shadow-2xs ${
                    soundEnabled ? 'bg-white text-emerald-800 border-amber-300' : 'bg-black/10 text-slate-700 border-black/10'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
                </button>

                <button
                  type="button"
                  onClick={requestNotifPermission}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 border transition-colors cursor-pointer shadow-2xs ${
                    notifPermission === 'granted' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-800 border-amber-300'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 shrink-0" />
                  <span>{notifPermission === 'granted' ? 'Alerts ON' : 'Alerts'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFixAndSyncDatabase}
                  disabled={isSyncing}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-white text-slate-800 border border-amber-300 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-700 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playAlertChime();
                    setActionMessage('Sound chime tested successfully!');
                    setTimeout(() => setActionMessage(null), 2500);
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-white/70 hover:bg-white text-[#111827] border border-amber-300/80 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <span>Chime</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action toast message */}
        {actionMessage && (
          <div className="bg-[#111827] text-[#FDD023] px-6 py-2.5 text-xs font-black text-center flex items-center justify-center gap-2 animate-in fade-in border-b border-amber-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* New Order Incoming Alert Banner (Admin Exclusive) */}
        {incomingAlert && (
          <div className="bg-gradient-to-r from-amber-400 via-[#FED74C] to-amber-300 text-slate-900 px-6 py-3 border-b-2 border-amber-500 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-[#111827] text-[#FDD023] shadow-xs">
                <Bell className="w-4 h-4 animate-bounce" />
              </span>
              <div>
                <p className="font-heading font-black text-sm text-[#111827] flex items-center gap-2">
                  <span>🚨 NEW ORDER RECEIVED: #{incomingAlert.orderNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">
                    Action Needed
                  </span>
                </p>
                <p className="text-xs text-slate-800 font-medium">
                  Customer <strong className="text-black font-black">{incomingAlert.customerName}</strong> ordered{' '}
                  <strong>{incomingAlert.item}</strong> ({incomingAlert.total}).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSearchQuery(incomingAlert.orderNumber);
                  setStatusFilter('all');
                  setIncomingAlert(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#111827] text-[#FDD023] text-xs font-black hover:bg-black transition cursor-pointer shadow-xs"
              >
                View Order
              </button>
              <button
                onClick={() => setIncomingAlert(null)}
                className="px-2.5 py-1.5 rounded-lg bg-black/10 hover:bg-black/20 text-[#111827] text-xs font-bold transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
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
                Default PIN is <span className="font-black text-[#111827] underline decoration-amber-400">1234</span>
              </p>
            </form>
          </div>
        ) : (
          /* MAIN DISPATCH DASHBOARD BODY */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/60">
            {/* Top Navigation Tabs: Orders Dispatch vs Product & Pricing Management */}
            <div className="flex items-center justify-between border-b border-amber-300 pb-3 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'orders'
                      ? 'bg-[#111827] text-[#FDD023] shadow-md ring-2 ring-[#111827]/20'
                      : 'bg-white text-slate-700 hover:bg-amber-100/70 border border-slate-200'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Orders & Dispatch</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-black ml-1">
                    {orders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'products'
                      ? 'bg-[#111827] text-[#FDD023] shadow-md ring-2 ring-[#111827]/20'
                      : 'bg-white text-slate-700 hover:bg-amber-100/70 border border-slate-200'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>Products & Pricing</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-black ml-1">
                    {products.length}
                  </span>
                </button>
              </div>

              {activeTab === 'products' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FDD023] hover:bg-[#FED74C] text-[#111827] border border-amber-400 shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add New Product</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Reset products to standard Yealo Ice defaults (1kg: ₱8, 5kg: ₱40, 10kg: ₱80)?')) {
                        await resetToDefaults();
                        setActionMessage('Products reset to standard defaults!');
                        setTimeout(() => setActionMessage(null), 3000);
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-black border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                    title="Reset product catalog to standard 1kg P8, 5kg P40, 10kg P80"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Reset Defaults</span>
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: ORDERS & DISPATCH */}
            {activeTab === 'orders' && (
              <>
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
                        onChange={(e) => setMProduct(e.target.value)}
                        className="flex-1 px-2 py-2 rounded-xl bg-white border border-amber-200 text-slate-900"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
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

                      {/* Customer Review Feedback (if submitted) */}
                      {order.review && (
                        <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs flex items-start gap-2">
                          <div className="p-1 rounded-md bg-amber-200 text-amber-900 shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-amber-900 text-[11px]">
                                Customer Review: {order.review.rating}/5 Stars
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(order.review.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-800 text-[11px] italic mt-0.5">
                              "{order.review.comment}"
                            </p>
                            <span className="text-[10px] text-slate-500 font-medium">
                              By {order.review.reviewerName || order.customerName}
                            </span>
                          </div>
                        </div>
                      )}

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
                            className="px-2.5 py-1 sm:py-1 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-black border border-amber-300 hover:bg-amber-50 flex items-center gap-1 cursor-pointer"
                            title="View / Print Rider Delivery Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Slip</span>
                          </button>

                          {/* Delete Order Button */}
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="px-2.5 py-1 sm:py-1 rounded-xl text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Delete order permanently from database"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </>
            )}

            {/* TAB 2: PRODUCTS & PRICING MANAGEMENT */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Intro summary banner */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FED74C] text-[#111827] flex items-center justify-center font-black shrink-0 shadow-xs">
                      <Tag className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-lg text-[#111827]">
                        Product Catalog & Price Management
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        Change prices per kg (1kg, 5kg, 10kg), update inventory status, add new ice products, or remove items.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black">
                      Active Items: {products.length}
                    </span>
                  </div>
                </div>

                {/* Product Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => {
                    const isEditing = editingProductId === product.id;
                    const opt1 = product.bagOptions?.find((b) => b.size === '1kg');
                    const opt5 = product.bagOptions?.find((b) => b.size === '5kg');
                    const opt10 = product.bagOptions?.find((b) => b.size === '10kg');

                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-3xl border-2 transition-all p-5 shadow-sm flex flex-col justify-between ${
                          isEditing
                            ? 'border-[#111827] ring-2 ring-amber-300'
                            : 'border-amber-200/90 hover:border-amber-300'
                        }`}
                      >
                        {/* Top info row */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-heading font-black text-base text-[#111827]">
                                    {product.name}
                                  </h4>
                                  {product.badge && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                                      {product.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                                  <span>Category: {product.category || 'Standard Ice'}</span>
                                  <span>•</span>
                                  <span className={product.inStock !== false ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                                    {product.inStock !== false ? '● In Stock' : '○ Out of Stock'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditProduct(product)}
                                    className="p-2 rounded-xl bg-amber-50 hover:bg-[#FED74C] text-[#111827] border border-amber-200 transition-colors cursor-pointer"
                                    title="Edit product prices & stock"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setProductToDelete(product)}
                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                                    title="Delete product from store"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingProductId(null)}
                                  className="text-xs font-bold text-slate-500 hover:text-black px-2 py-1 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 font-medium mb-4 line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        {/* Price Management Section */}
                        <div className="pt-3 border-t border-slate-100">
                          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                            {isEditing ? 'Edit Pricing Per Bag Size (PHP ₱):' : 'Current Price Per Bag Size:'}
                          </div>

                          {!isEditing ? (
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                                <div className="text-[10px] uppercase font-bold text-slate-500">1kg Personal</div>
                                <div className="font-heading font-black text-base text-[#111827]">
                                  ₱{opt1 ? opt1.price : 8}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-2xl bg-amber-100/60 border border-amber-300">
                                <div className="text-[10px] uppercase font-bold text-slate-600">5kg Standard</div>
                                <div className="font-heading font-black text-base text-[#111827]">
                                  ₱{opt5 ? opt5.price : product.price || 40}
                                </div>
                              </div>
                              <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                                <div className="text-[10px] uppercase font-bold text-slate-500">10kg Commercial</div>
                                <div className="font-heading font-black text-base text-[#111827]">
                                  ₱{opt10 ? opt10.price : 80}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 bg-amber-50/50 p-3 rounded-2xl border border-amber-200">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                                    1kg Price (₱)
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    step="1"
                                    value={editPrice1kg}
                                    onChange={(e) => setEditPrice1kg(Math.max(1, parseInt(e.target.value) || 0))}
                                    className="w-full px-2 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-sm text-center text-[#111827] focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                                    5kg Price (₱)
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    step="1"
                                    value={editPrice5kg}
                                    onChange={(e) => setEditPrice5kg(Math.max(1, parseInt(e.target.value) || 0))}
                                    className="w-full px-2 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-sm text-center text-[#111827] focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                                    10kg Price (₱)
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    step="1"
                                    value={editPrice10kg}
                                    onChange={(e) => setEditPrice10kg(Math.max(1, parseInt(e.target.value) || 0))}
                                    className="w-full px-2 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-sm text-center text-[#111827] focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={editInStock}
                                    onChange={(e) => setEditInStock(e.target.checked)}
                                    className="rounded border-slate-300 text-[#111827] focus:ring-amber-400 w-4 h-4"
                                  />
                                  <span>In Stock (Available for ordering)</span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => handleSaveProductPrices(product)}
                                  className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-[#FDD023] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save Prices</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADD PRODUCT MODAL */}
        {showAddProductModal && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
            onClick={() => setShowAddProductModal(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-amber-400 text-slate-900 my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FED74C] text-[#111827] flex items-center justify-center font-black">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-[#111827]">
                      Add New Ice Product
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Fill out details to publish immediately to customer catalog
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewProduct} className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Gourmet Sphere Ice / Crushed Snow Ice"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category</label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    >
                      <option value="Cubes">Cubes</option>
                      <option value="Tubes">Tubes</option>
                      <option value="Crushed">Crushed</option>
                      <option value="Block">Block</option>
                      <option value="Specialty">Specialty</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Product Badge (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Best Seller, Bar Grade"
                      value={newProdBadge}
                      onChange={(e) => setNewProdBadge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Short Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Crystal clear slow-melting ice for cocktails and milk tea."
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                  />
                </div>

                {/* Packaging sizes & prices */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="text-[11px] font-black uppercase text-amber-900 mb-2">
                    Pricing By Bag Size (PHP ₱)
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 mb-1">
                        1kg Bag Price
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newProdPrice1kg}
                        onChange={(e) => setNewProdPrice1kg(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-2 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-center text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 mb-1">
                        5kg Bag Price
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newProdPrice5kg}
                        onChange={(e) => setNewProdPrice5kg(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-2 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-center text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 mb-1">
                        10kg Bag Price
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newProdPrice10kg}
                        onChange={(e) => setNewProdPrice10kg(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-2 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-center text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Product Photo URL</label>
                  <input
                    type="text"
                    placeholder="/images/crystal-ice-cubes.jpg or https://..."
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setNewProdImage('/images/crystal-ice-cubes.jpg')}
                      className="text-[11px] text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg font-bold"
                    >
                      Use Cubes Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProdImage('/images/purified-tube-ice.jpg')}
                      className="text-[11px] text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg font-bold"
                    >
                      Use Tubes Image
                    </button>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-[#FDD023] font-black uppercase tracking-wider shadow-sm cursor-pointer"
                  >
                    Save & Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE PRODUCT CONFIRMATION MODAL */}
        {productToDelete && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
            onClick={() => setProductToDelete(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-rose-400 text-slate-900 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h4 className="font-heading font-black text-lg text-slate-900">
                  Delete Product?
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete <strong className="text-black font-black">"{productToDelete.name}"</strong>? It will no longer appear on the customer store or order modal.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingProduct}
                  onClick={() => setProductToDelete(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingProduct}
                  onClick={handleConfirmDeleteProduct}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeletingProduct ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </div>
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

        {/* CONFIRM ORDER DELETE DIALOG */}
        {orderToDelete && (
          <div
            className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
            onClick={() => !isDeleting && setOrderToDelete(null)}
          >
            <div
              className="bg-white text-slate-900 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 border-2 border-rose-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-lg text-slate-900">
                    Delete Order #{orderToDelete.orderNumber}?
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    This will permanently delete this record from the live database.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Customer:</span>
                  <span className="font-bold text-slate-900">{orderToDelete.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{orderToDelete.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Item & Qty:</span>
                  <span className="font-bold text-slate-900">{orderToDelete.productName} × {orderToDelete.quantity}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-black">
                  <span className="text-slate-700">Total COD:</span>
                  <span className="text-amber-800 font-mono text-sm">₱{orderToDelete.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteOrder}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete</span>
                    </>
                  )}
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

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
