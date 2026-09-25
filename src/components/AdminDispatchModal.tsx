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
  Upload,
  Camera,
  Image as ImageIcon,
  Eye,
  EyeOff,
  User,
  UserCheck,
  UserPlus,
  Bike,
  Navigation,
  MessageSquare,
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
import { OrderRecord, Product, ProductBagOption, Rider } from '../types';
import { useProducts } from '../context/ProductsContext';
import { useRiders } from '../context/RidersContext';
import { ImageUploader } from './ImageUploader';
import { processAndCompressImage } from '../lib/imageUpload';

interface AdminDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'tl';
}

const ADMIN_PASSWORD = 'Yealo2026';

export const AdminDispatchModal: React.FC<AdminDispatchModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('yealo_admin_auth') === 'true';
  });
  const [enteredPin, setEnteredPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  // Tabs: 'orders' | 'products' | 'riders'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'riders'>('orders');

  // Products context for managing prices and inventory
  const { products, updateProduct, addProduct, deleteProduct, resetToDefaults } = useProducts();

  // Riders context for delivery fleet management
  const {
    riders,
    addRider,
    updateRider,
    deleteRider,
    resetRidersToDefaults,
  } = useRiders();

  // Rider filtering & search
  const [riderSearchQuery, setRiderSearchQuery] = useState('');
  const [riderStatusFilter, setRiderStatusFilter] = useState<'all' | 'Available' | 'On Delivery' | 'Off Duty'>('all');

  // Add rider modal state
  const [showAddRiderModal, setShowAddRiderModal] = useState(false);
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderVehicle, setNewRiderVehicle] = useState('Insulated Cold-Box Tricycle');
  const [newRiderPlate, setNewRiderPlate] = useState('');
  const [newRiderZone, setNewRiderZone] = useState('Science City of Muñoz');
  const [newRiderStatus, setNewRiderStatus] = useState<'Available' | 'On Delivery' | 'Off Duty'>('Available');
  const [newRiderNotes, setNewRiderNotes] = useState('');
  const [isSavingRider, setIsSavingRider] = useState(false);

  // Edit rider modal state
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [editRiderName, setEditRiderName] = useState('');
  const [editRiderPhone, setEditRiderPhone] = useState('');
  const [editRiderVehicle, setEditRiderVehicle] = useState('');
  const [editRiderPlate, setEditRiderPlate] = useState('');
  const [editRiderZone, setEditRiderZone] = useState('');
  const [editRiderStatus, setEditRiderStatus] = useState<'Available' | 'On Delivery' | 'Off Duty'>('Available');
  const [editRiderNotes, setEditRiderNotes] = useState('');
  const [isUpdatingRider, setIsUpdatingRider] = useState(false);

  // Delete rider state
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);
  const [isDeletingRider, setIsDeletingRider] = useState(false);

  // Product edit modal / inline edit state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('Cubes');
  const [editBadge, setEditBadge] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editImage, setEditImage] = useState<string>('');
  const [editPrice1kg, setEditPrice1kg] = useState<number>(8);
  const [editPrice5kg, setEditPrice5kg] = useState<number>(40);
  const [editPrice10kg, setEditPrice10kg] = useState<number>(80);
  const [editInStock, setEditInStock] = useState<boolean>(true);
  const [isUploadingDirect, setIsUploadingDirect] = useState<string | null>(null);

  // Add new product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'Cubes' | 'Tubes' | string>('Cubes');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice1kg, setNewProdPrice1kg] = useState<number>(8);
  const [newProdPrice5kg, setNewProdPrice5kg] = useState<number>(40);
  const [newProdPrice10kg, setNewProdPrice10kg] = useState<number>(80);
  const [newProdImage, setNewProdImage] = useState<string>('');
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
    const input = enteredPin.trim();
    if (input === ADMIN_PASSWORD || input.toLowerCase() === 'yealo2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('yealo_admin_auth', 'true');
      setPinError('');
    } else {
      setPinError(
        language === 'en'
          ? 'Incorrect password. Please try again.'
          : 'Maling password. Pakisubukang muli.'
      );
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
      const order = orders.find((o) => o.id === orderId);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      // If moving to Out for Delivery and no rider assigned yet, auto-assign first available rider
      if (newStatus === 'Out for Delivery' && (!order?.riderName || !order?.riderId)) {
        const availableRider = riders.find((r) => r.status === 'Available') || riders[0];
        if (availableRider) {
          updateData.riderId = availableRider.id;
          updateData.riderName = availableRider.name;
          updateData.riderPhone = availableRider.phone;
          updateData.vehicleType = availableRider.vehicleType;
          updateData.riderPlate = availableRider.plateNumber;
        }
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);

      // Update local state smoothly
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updateData, status: newStatus } : o))
      );

      setActionMessage(
        updateData.riderName && !order?.riderName
          ? `Order #${order?.orderNumber || ''} dispatched with ${updateData.riderName}!`
          : `Order marked as "${newStatus}"`
      );
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
    setEditName(prod.name);
    setEditCategory(prod.category || 'Cubes');
    setEditBadge(prod.badge || '');
    setEditDesc(prod.description || '');
    setEditImage(prod.image || '/images/crystal-ice-cubes.jpg');
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
      name: editName.trim() || prod.name,
      category: editCategory || prod.category,
      badge: editBadge.trim() ? editBadge.trim() : undefined,
      description: editDesc.trim() || prod.description,
      image: editImage.trim() || prod.image,
      price: editPrice5kg,
      inStock: editInStock,
      bagOptions: updatedOptions,
    };

    const res = await updateProduct(updatedProd);
    if (res.success) {
      setActionMessage(`Updated "${updatedProd.name}" and prices successfully!`);
      setEditingProductId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  // Direct 1-click photo upload for quick card actions
  const handleDirectCardImageUpload = async (product: Product, file: File) => {
    if (!file.type.startsWith('image/')) {
      setActionMessage('Please select a valid image file (PNG, JPG, WebP)');
      setTimeout(() => setActionMessage(null), 3500);
      return;
    }
    setIsUploadingDirect(product.id);
    try {
      const result = await processAndCompressImage(file, file.name);
      const updatedProd: Product = {
        ...product,
        image: result.dataUrl,
      };
      await updateProduct(updatedProd);
      setActionMessage(`Directly updated photo for "${product.name}"!`);
    } catch (err: any) {
      console.error('Direct upload failed:', err);
      setActionMessage(`Photo upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploadingDirect(null);
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
      setNewProdImage('');
      setNewProdBadge('New Arrival');
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

  // Rider Fleet Management Handlers
  const handleOpenAddRider = () => {
    setNewRiderName('');
    setNewRiderPhone('');
    setNewRiderVehicle('Insulated Cold-Box Tricycle');
    setNewRiderPlate('');
    setNewRiderZone('Science City of Muñoz');
    setNewRiderStatus('Available');
    setNewRiderNotes('');
    setShowAddRiderModal(true);
  };

  const handleCreateRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiderName.trim() || !newRiderPhone.trim()) {
      alert('Please provide rider name and contact phone number');
      return;
    }
    setIsSavingRider(true);
    try {
      const slug = newRiderName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newId = `rider-${slug || 'fleet'}-${Date.now().toString().slice(-4)}`;
      const newRider: Rider = {
        id: newId,
        name: newRiderName.trim(),
        phone: newRiderPhone.trim(),
        vehicleType: newRiderVehicle.trim() || 'Insulated Cold-Box Tricycle',
        plateNumber: newRiderPlate.trim() || 'TODA Registered',
        assignedZone: newRiderZone.trim() || 'Science City of Muñoz',
        status: newRiderStatus,
        notes: newRiderNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await addRider(newRider);
      setShowAddRiderModal(false);
      setActionMessage(`Rider "${newRider.name}" registered to delivery fleet!`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to add rider: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSavingRider(false);
    }
  };

  const handleStartEditRider = (r: Rider) => {
    setEditingRider(r);
    setEditRiderName(r.name);
    setEditRiderPhone(r.phone);
    setEditRiderVehicle(r.vehicleType);
    setEditRiderPlate(r.plateNumber);
    setEditRiderZone(r.assignedZone);
    setEditRiderStatus(r.status);
    setEditRiderNotes(r.notes || '');
  };

  const handleSaveRiderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRider) return;
    if (!editRiderName.trim() || !editRiderPhone.trim()) {
      alert('Please provide rider name and contact phone number');
      return;
    }
    setIsUpdatingRider(true);
    try {
      const updated: Rider = {
        ...editingRider,
        name: editRiderName.trim(),
        phone: editRiderPhone.trim(),
        vehicleType: editRiderVehicle.trim(),
        plateNumber: editRiderPlate.trim(),
        assignedZone: editRiderZone.trim(),
        status: editRiderStatus,
        notes: editRiderNotes.trim() || undefined,
      };

      await updateRider(updated);
      setEditingRider(null);
      setActionMessage(`Updated rider details for "${updated.name}"!`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to update rider: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingRider(false);
    }
  };

  const handleQuickRiderStatusChange = async (rider: Rider, status: Rider['status']) => {
    await updateRider({ ...rider, status });
    setActionMessage(`${rider.name} status updated to "${status}"`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleConfirmDeleteRider = async () => {
    if (!riderToDelete) return;
    setIsDeletingRider(true);
    try {
      await deleteRider(riderToDelete.id);
      setActionMessage(`Rider "${riderToDelete.name}" removed from delivery fleet.`);
      setRiderToDelete(null);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to delete rider: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDeletingRider(false);
    }
  };

  const handleAssignRiderToOrder = async (orderId: string, riderId: string) => {
    const selected = riders.find((r) => r.id === riderId);
    try {
      const updateData = selected
        ? {
            riderId: selected.id,
            riderName: selected.name,
            riderPhone: selected.phone,
            vehicleType: selected.vehicleType,
            riderPlate: selected.plateNumber,
            updatedAt: serverTimestamp(),
          }
        : {
            riderId: '',
            riderName: '',
            riderPhone: '',
            vehicleType: '',
            riderPlate: '',
            updatedAt: serverTimestamp(),
          };

      await updateDoc(doc(db, 'orders', orderId), updateData);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                riderId: selected?.id,
                riderName: selected?.name,
                riderPhone: selected?.phone,
                vehicleType: selected?.vehicleType,
                riderPlate: selected?.plateNumber,
              }
            : o
        )
      );
      setActionMessage(selected ? `Assigned "${selected.name}" to order!` : 'Rider unassigned from order');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.warn('Assign rider fallback:', err);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                riderId: selected?.id,
                riderName: selected?.name,
                riderPhone: selected?.phone,
                vehicleType: selected?.vehicleType,
                riderPlate: selected?.plateNumber,
              }
            : o
        )
      );
      setActionMessage(selected ? `Assigned "${selected.name}"` : 'Rider unassigned');
      setTimeout(() => setActionMessage(null), 3000);
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

  // Filtered delivery riders list
  const filteredRiders = riders.filter((rider) => {
    const matchesStatus =
      riderStatusFilter === 'all' ? true : rider.status === riderStatusFilter;
    const q = riderSearchQuery.toLowerCase();
    const matchesSearch =
      rider.name.toLowerCase().includes(q) ||
      rider.phone.toLowerCase().includes(q) ||
      rider.vehicleType.toLowerCase().includes(q) ||
      rider.plateNumber.toLowerCase().includes(q) ||
      rider.assignedZone.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const availableRidersCount = riders.filter((r) => r.status === 'Available').length;
  const onDeliveryRidersCount = riders.filter((r) => r.status === 'On Delivery').length;
  const offDutyRidersCount = riders.filter((r) => r.status === 'Off Duty').length;

  if (!isOpen) return null;

  const modalContent = (
    <div
      id="admin-dispatch-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-6xl bg-white text-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-amber-300 overflow-hidden my-0 sm:my-4 h-[100dvh] sm:h-[92vh] flex flex-col"
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
                  {/* Sound alert toggle (Desktop) */}
                  <button
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
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
                    <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
                  </button>

                  {/* Browser Notification Status / Request (Desktop) */}
                  <button
                    onClick={requestNotifPermission}
                    className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                      notifPermission === 'granted'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-900 border-amber-300 hover:bg-slate-50'
                    }`}
                    title="Browser push alert permission for new orders"
                  >
                    <Bell className="w-3.5 h-3.5 shrink-0" />
                    <span>{notifPermission === 'granted' ? 'Alerts ON' : 'Alerts'}</span>
                  </button>

                  {/* Fix & Sync Database Button (Desktop) */}
                  <button
                    onClick={handleFixAndSyncDatabase}
                    disabled={isSyncing}
                    className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 hover:text-black border border-amber-300 hover:bg-amber-50 transition-colors cursor-pointer shadow-2xs"
                    title="Check database health and re-sync all live orders"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-700 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
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

        {/* AUTHENTICATION GATE (PASSWORD ENTRY) */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-14 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#FED74C]/30 border-2 border-amber-400 text-[#111827] flex items-center justify-center mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-[#111827]" />
            </div>
            <h4 className="font-heading font-black text-2xl text-[#111827] mb-2">
              Store Owner Verification
            </h4>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed font-medium">
              Enter the Store Owner password to access live orders, sales summaries, and rider dispatch actions.
            </p>

            <form onSubmit={handlePinSubmit} className="w-full space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  maxLength={32}
                  autoFocus
                  placeholder="Enter Admin Password"
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError('');
                  }}
                  className="w-full text-center font-bold text-base py-3 px-10 rounded-2xl bg-amber-50/50 border-2 border-amber-300 text-[#111827] placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs focus:outline-none focus:border-[#111827] focus:ring-2 focus:ring-amber-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {pinError && <p className="text-rose-600 text-xs mt-2 font-bold">{pinError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-[#111827] hover:bg-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4 text-[#FDD023]" />
                <span>Unlock Dispatch Portal</span>
              </button>
            </form>
          </div>
        ) : (
          /* MAIN DISPATCH DASHBOARD BODY */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/60">
            {/* Top Navigation Tabs: Orders Dispatch vs Product & Pricing Management vs Fleet */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-amber-300/80 pb-3 gap-3">
              {/* Responsive Segmented Tab Control */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-2xl w-full sm:w-auto overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                    activeTab === 'orders'
                      ? 'bg-[#111827] text-[#FDD023] shadow-md ring-2 ring-[#111827]/20'
                      : 'text-slate-700 hover:text-black hover:bg-white/60'
                  }`}
                >
                  <Truck className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Orders & Dispatch</span>
                  <span className="sm:hidden">Orders</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-black ml-0.5">
                    {orders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                    activeTab === 'products'
                      ? 'bg-[#111827] text-[#FDD023] shadow-md ring-2 ring-[#111827]/20'
                      : 'text-slate-700 hover:text-black hover:bg-white/60'
                  }`}
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Products & Pricing</span>
                  <span className="sm:hidden">Catalog</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-black ml-0.5">
                    {products.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('riders')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                    activeTab === 'riders'
                      ? 'bg-[#111827] text-[#FDD023] shadow-md ring-2 ring-[#111827]/20'
                      : 'text-slate-700 hover:text-black hover:bg-white/60'
                  }`}
                >
                  <Bike className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Delivery Fleet</span>
                  <span className="sm:hidden">Riders</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-black ml-0.5">
                    {riders.length}
                  </span>
                </button>
              </div>

              {/* Action Buttons for Products Tab */}
              {activeTab === 'products' && (
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(true)}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FDD023] hover:bg-[#FED74C] text-[#111827] border border-amber-400 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Product</span>
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

              {/* Action Buttons for Riders Tab */}
              {activeTab === 'riders' && (
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleOpenAddRider}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FDD023] hover:bg-[#FED74C] text-[#111827] border border-amber-400 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Rider</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Reset delivery fleet roster to default Yealo Ice riders?')) {
                        await resetRidersToDefaults();
                        setActionMessage('Fleet reset to default riders!');
                        setTimeout(() => setActionMessage(null), 3000);
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-black border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                    title="Reset fleet to standard riders"
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

                      {/* Assigned Delivery Rider Bar */}
                      <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#111827] text-[#FDD023] flex items-center justify-center font-black shrink-0 shadow-2xs">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">
                              Assigned Delivery Rider
                            </span>
                            {order.riderName ? (
                              <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                                <span className="font-black text-[#111827]">
                                  {order.riderName}
                                </span>
                                {order.riderPhone && (
                                  <a
                                    href={`tel:${order.riderPhone}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] transition-colors"
                                    title="Call rider"
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{order.riderPhone}</span>
                                  </a>
                                )}
                                {order.vehicleType && (
                                  <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                    {order.vehicleType} {order.riderPlate ? `• ${order.riderPlate}` : ''}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-800 text-[11px] font-bold italic pt-0.5 block">
                                No specific rider assigned yet
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={order.riderId || ''}
                            onChange={(e) => handleAssignRiderToOrder(order.id, e.target.value)}
                            className="text-xs font-bold py-1.5 px-3 rounded-xl bg-white border border-amber-300 text-slate-800 focus:outline-none focus:border-[#111827] cursor-pointer shadow-2xs"
                            title="Assign a registered fleet rider to this delivery"
                          >
                            <option value="">{order.riderName ? 'Change Rider...' : 'Assign Rider...'}</option>
                            {riders.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.vehicleType} • {r.status})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Status Action Buttons Bar */}
                      <div className="pt-3 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between sm:justify-start gap-1.5">
                          <span>Set Fulfillment Status:</span>
                          <span className="sm:hidden font-mono font-bold text-slate-700">#{order.orderNumber}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                          {/* Pending Button */}
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Pending')}
                            className={`px-3 py-2 sm:py-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
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
                            className={`px-3 py-2 sm:py-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
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
                            className={`px-3 py-2 sm:py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
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
                            className={`px-3 py-2 sm:py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
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
                            className="px-2.5 py-2 sm:py-1 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-black border border-amber-300 hover:bg-amber-50 flex items-center justify-center gap-1 cursor-pointer"
                            title="View / Print Rider Delivery Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Slip</span>
                          </button>

                          {/* Delete Order Button */}
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="px-2.5 py-2 sm:py-1 rounded-xl text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
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
                              {/* Direct photo upload thumbnail */}
                              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-slate-900 border-2 border-amber-300 shadow-xs group">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {isUploadingDirect === product.id ? (
                                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-amber-300">
                                    <RefreshCw className="w-5 h-5 animate-spin mb-0.5" />
                                    <span className="text-[8px] font-black uppercase">Saving...</span>
                                  </div>
                                ) : (
                                  <label
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                                    title="Click to directly upload and replace photo"
                                  >
                                    <Camera className="w-4 h-4 text-amber-300 mb-0.5" />
                                    <span className="text-[8px] font-black uppercase text-amber-300">Upload</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDirectCardImageUpload(product, file);
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                )}
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
                                  {/* Direct Upload Photo Quick Button */}
                                  <label
                                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-[#FED74C] text-[#111827] border border-amber-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                                    title="Directly upload new image file for this product"
                                  >
                                    <Upload className="w-3.5 h-3.5 text-amber-900" />
                                    <span className="hidden sm:inline text-[11px] font-black">Upload Photo</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDirectCardImageUpload(product, file);
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleStartEditProduct(product)}
                                    className="p-2 rounded-xl bg-amber-50 hover:bg-[#FED74C] text-[#111827] border border-amber-200 transition-colors cursor-pointer"
                                    title="Edit product details, photo & prices"
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

                          {!isEditing && (
                            <p className="text-xs text-slate-600 font-medium mb-4 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>

                        {/* Price Management / Full Editor Section */}
                        <div className="pt-3 border-t border-slate-100">
                          {!isEditing ? (
                            <>
                              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                                Current Price Per Bag Size:
                              </div>
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
                            </>
                          ) : (
                            <div className="space-y-4 bg-amber-50/60 p-4 rounded-3xl border border-amber-300">
                              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                                <span className="font-heading font-black text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                                  <Edit2 className="w-3.5 h-3.5 text-amber-800" />
                                  Edit Product Details & Photo
                                </span>
                              </div>

                              {/* Direct Image Uploader for editing existing product */}
                              <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
                                <ImageUploader
                                  value={editImage}
                                  onChange={setEditImage}
                                  label="Product Photo (Direct Upload)"
                                  helperText="Upload any image directly from your phone/computer, drag & drop, or paste from clipboard"
                                />
                              </div>

                              {/* Product Name, Category & Badge */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                                    Product Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                                      Category
                                    </label>
                                    <select
                                      value={editCategory}
                                      onChange={(e) => setEditCategory(e.target.value)}
                                      className="w-full px-2 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    >
                                      <option value="Cubes">Cubes</option>
                                      <option value="Tubes">Tubes</option>
                                      <option value="Crushed">Crushed</option>
                                      <option value="Block">Block</option>
                                      <option value="Specialty">Specialty</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                                      Badge
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Best Seller"
                                      value={editBadge}
                                      onChange={(e) => setEditBadge(e.target.value)}
                                      className="w-full px-2 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                                  Short Description
                                </label>
                                <input
                                  type="text"
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-medium text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                              </div>

                              {/* Pricing per size */}
                              <div>
                                <div className="text-[10px] font-black uppercase text-slate-700 mb-1.5">
                                  Pricing By Bag Size (PHP ₱)
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
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
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
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
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
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
                              </div>

                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-amber-200">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={editInStock}
                                    onChange={(e) => setEditInStock(e.target.checked)}
                                    className="rounded border-slate-300 text-[#111827] focus:ring-amber-400 w-4 h-4"
                                  />
                                  <span>In Stock (Available for ordering)</span>
                                </label>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => setEditingProductId(null)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-black bg-white border border-slate-300 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveProductPrices(product)}
                                    className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-[#FDD023] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save Changes</span>
                                  </button>
                                </div>
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

            {/* TAB 3: DELIVERY FLEET & RIDERS MANAGEMENT */}
            {activeTab === 'riders' && (
              <div className="space-y-6">
                {/* Intro summary banner */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FED74C] text-[#111827] flex items-center justify-center font-black shrink-0 shadow-xs">
                      <Bike className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-lg text-[#111827]">
                        Delivery Fleet & Rider Roster
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        Manage delivery riders, mobile contact numbers, vehicle assignments, TODA registration, and delivery coverage zones.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    <button
                      type="button"
                      onClick={handleOpenAddRider}
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FDD023] hover:bg-[#FED74C] text-[#111827] border border-amber-400 shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add New Rider</span>
                    </button>
                  </div>
                </div>

                {/* 1. Fleet Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {/* Total Riders */}
                  <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                      <span>Total Fleet</span>
                      <div className="p-1 rounded-full bg-amber-100 text-amber-900">
                        <Bike className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="font-heading font-black text-2xl text-[#111827]">
                      {riders.length}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Registered Drivers
                    </div>
                  </div>

                  {/* Available & Ready */}
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
                      <span>Available</span>
                      <div className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="font-heading font-black text-2xl text-emerald-700">
                      {availableRidersCount}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      Ready for dispatch
                    </div>
                  </div>

                  {/* On Delivery / In Transit */}
                  <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-purple-800 font-bold mb-1">
                      <span>On Road</span>
                      <div className="p-1 rounded-full bg-purple-100 text-purple-700">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="font-heading font-black text-2xl text-purple-700">
                      {onDeliveryRidersCount}
                    </div>
                    <div className="text-[11px] text-purple-600 font-medium mt-0.5">
                      Delivering ice orders
                    </div>
                  </div>

                  {/* Off Duty */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                      <span>Off Duty</span>
                      <div className="p-1 rounded-full bg-slate-100 text-slate-600">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="font-heading font-black text-2xl text-slate-700">
                      {offDutyRidersCount}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      On break / Rest day
                    </div>
                  </div>
                </div>

                {/* 2. Search & Filter Bar */}
                <div className="bg-white p-3 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search rider name, phone, plate #, vehicle, or zone..."
                      value={riderSearchQuery}
                      onChange={(e) => setRiderSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#111827] focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(['all', 'Available', 'On Delivery', 'Off Duty'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setRiderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                          riderStatusFilter === st
                            ? 'bg-[#111827] text-[#FDD023] shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-amber-100'
                        }`}
                      >
                        {st === 'all' ? `All Riders (${riders.length})` : `${st}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Rider Cards Grid */}
                {filteredRiders.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-dashed border-amber-300 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <Bike className="w-6 h-6" />
                    </div>
                    <h5 className="font-heading font-black text-base text-slate-800">
                      No delivery riders found
                    </h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {riderSearchQuery
                        ? `No riders matching "${riderSearchQuery}". Try clearing search or change filter.`
                        : 'No riders registered yet. Add your first delivery rider below.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddRider}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-[#FDD023] font-black text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add New Rider</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRiders.map((rider) => {
                      const activeAssignedCount = orders.filter(
                        (o) => o.riderId === rider.id && o.status !== 'Delivered' && o.status !== 'Cancelled'
                      ).length;

                      const statusBadgeStyles = {
                        Available: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                        'On Delivery': 'bg-purple-100 text-purple-800 border-purple-300',
                        'Off Duty': 'bg-slate-100 text-slate-700 border-slate-300',
                      };

                      return (
                        <div
                          key={rider.id}
                          className="bg-white rounded-3xl border-2 border-amber-200/90 hover:border-amber-300 p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all"
                        >
                          <div>
                            {/* Rider Top Info */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#FED74C] text-[#111827] flex items-center justify-center font-black text-base shadow-xs shrink-0">
                                  {rider.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-heading font-black text-base text-[#111827] leading-tight">
                                    {rider.name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-0.5">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{rider.phone}</span>
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shrink-0 ${
                                  statusBadgeStyles[rider.status] || 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {rider.status}
                              </span>
                            </div>

                            {/* Details List */}
                            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                              {/* Vehicle & Plate */}
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-slate-400 font-bold text-[11px] shrink-0">
                                  Vehicle & Plate:
                                </span>
                                <div className="text-right">
                                  <span className="font-bold text-[#111827] block">
                                    {rider.vehicleType}
                                  </span>
                                  <span className="font-mono text-[11px] text-amber-800 font-bold block">
                                    {rider.plateNumber}
                                  </span>
                                </div>
                              </div>

                              {/* Service Coverage Area */}
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-slate-400 font-bold text-[11px] shrink-0">
                                  Coverage Hub:
                                </span>
                                <span className="font-medium text-slate-700 text-right">
                                  {rider.assignedZone}
                                </span>
                              </div>

                              {/* Active Orders */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400 font-bold text-[11px]">
                                  Active Dispatches:
                                </span>
                                <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                                  activeAssignedCount > 0
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {activeAssignedCount} ongoing {activeAssignedCount === 1 ? 'order' : 'orders'}
                                </span>
                              </div>

                              {/* Equipment Notes */}
                              {rider.notes && (
                                <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 font-medium italic mt-2">
                                  "{rider.notes}"
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Status Buttons & Action Bar */}
                          <div className="space-y-3 pt-3 border-t border-slate-100">
                            {/* Fast Status Switcher */}
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                Quick Status Toggle:
                              </span>
                              <div className="grid grid-cols-3 gap-1">
                                {(['Available', 'On Delivery', 'Off Duty'] as const).map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleQuickRiderStatusChange(rider, st)}
                                    className={`py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                      rider.status === st
                                        ? st === 'Available'
                                          ? 'bg-emerald-600 text-white shadow-2xs'
                                          : st === 'On Delivery'
                                          ? 'bg-purple-600 text-white shadow-2xs'
                                          : 'bg-slate-700 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {st === 'On Delivery' ? 'Delivering' : st}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Contact Links & Edit / Delete Buttons */}
                            <div className="flex items-center justify-between gap-1.5 pt-1">
                              <div className="flex items-center gap-1">
                                <a
                                  href={`tel:${rider.phone}`}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors"
                                  title="Call rider"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>Call</span>
                                </a>
                                <a
                                  href={`sms:${rider.phone}`}
                                  className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors"
                                  title="SMS rider"
                                >
                                  SMS
                                </a>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditRider(rider)}
                                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-slate-800 border border-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  title="Edit rider details"
                                >
                                  <Edit2 className="w-3 h-3 text-amber-700" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setRiderToDelete(rider)}
                                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer transition-colors"
                                  title="Remove rider from roster"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border-2 border-amber-300">
                  <ImageUploader
                    value={newProdImage}
                    onChange={setNewProdImage}
                    label="Product Image (Upload from Device)"
                    helperText="Pick any photo from your phone or computer. It will automatically optimize and upload directly."
                  />
                  {!newProdImage && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200/80">
                      <span className="text-[10px] font-bold text-slate-500">Or use standard sample:</span>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('/images/crystal-ice-cubes.jpg')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 text-slate-700 cursor-pointer"
                      >
                        Sample Cubes
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('/images/pure-tube-ice.jpg')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 text-slate-700 cursor-pointer"
                      >
                        Sample Tubes
                      </button>
                    </div>
                  )}
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

        {/* ADD RIDER MODAL */}
        {showAddRiderModal && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
            onClick={() => setShowAddRiderModal(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-amber-400 text-slate-900 my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FED74C] text-[#111827] flex items-center justify-center font-black">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-[#111827]">
                      Register New Delivery Rider
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Add a driver to the Yealo Pure Ice dispatch fleet
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddRiderModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRider} className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Rider Full Name / Callsign *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Kuya Arnel Ramos"
                    value={newRiderName}
                    onChange={(e) => setNewRiderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Contact Mobile Number *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 0917-555-8812"
                      value={newRiderPhone}
                      onChange={(e) => setNewRiderPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={newRiderVehicle}
                      onChange={(e) => setNewRiderVehicle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    >
                      <option value="Insulated Cold-Box Tricycle">Insulated Cold-Box Tricycle</option>
                      <option value="Tricycle with Ice Cargo">Tricycle with Ice Cargo</option>
                      <option value="Express Delivery Motorcycle (Twin Coolers)">Express Motorcycle (Twin Coolers)</option>
                      <option value="Multicab / Small Delivery Truck">Multicab / Small Truck</option>
                      <option value="Kolong-Kolong Heavy Carrier">Kolong-Kolong Heavy Carrier</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Plate / TODA Registration #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Muñoz TODA #03 (Plate 4819-NE)"
                      value={newRiderPlate}
                      onChange={(e) => setNewRiderPlate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Primary Service Zone
                    </label>
                    <select
                      value={newRiderZone}
                      onChange={(e) => setNewRiderZone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    >
                      <option value="Science City of Muñoz (Poblacion & CLSU Area)">Science City of Muñoz (Poblacion & CLSU Area)</option>
                      <option value="Bantug, Maligaya, & Villa Neva">Bantug, Maligaya, & Villa Neva</option>
                      <option value="San Jose City & Fast Rush Orders">San Jose City & Fast Rush Orders</option>
                      <option value="Talavera & Baloc Area">Talavera & Baloc Area</option>
                      <option value="All Coverage Zones">All Coverage Zones</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Initial Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Available', 'On Delivery', 'Off Duty'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewRiderStatus(st)}
                        className={`py-2 rounded-xl font-bold border transition-all text-xs cursor-pointer ${
                          newRiderStatus === st
                            ? 'bg-[#111827] text-[#FDD023] border-[#111827] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Equipment & Delivery Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Equipped with 50kg foam chest, plastic ties, and ice tongs. Emergency phone: 0918-..."
                    value={newRiderNotes}
                    onChange={(e) => setNewRiderNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827] resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddRiderModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRider}
                    className="px-6 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-[#FDD023] font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    {isSavingRider ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Register Rider</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT RIDER MODAL */}
        {editingRider && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
            onClick={() => setEditingRider(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-amber-400 text-slate-900 my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FED74C] text-[#111827] flex items-center justify-center font-black">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-[#111827]">
                      Edit Rider Details
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Update phone, vehicle, plate, or active service zone
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRider(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRiderEdit} className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Rider Full Name / Callsign *
                  </label>
                  <input
                    required
                    type="text"
                    value={editRiderName}
                    onChange={(e) => setEditRiderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Contact Mobile Number *
                    </label>
                    <input
                      required
                      type="text"
                      value={editRiderPhone}
                      onChange={(e) => setEditRiderPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Vehicle Type
                    </label>
                    <input
                      type="text"
                      value={editRiderVehicle}
                      onChange={(e) => setEditRiderVehicle(e.target.value)}
                      placeholder="e.g. Insulated Cold-Box Tricycle"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Plate / TODA Registration #
                    </label>
                    <input
                      type="text"
                      value={editRiderPlate}
                      onChange={(e) => setEditRiderPlate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Primary Service Zone
                    </label>
                    <input
                      type="text"
                      value={editRiderZone}
                      onChange={(e) => setEditRiderZone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Current Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Available', 'On Delivery', 'Off Duty'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditRiderStatus(st)}
                        className={`py-2 rounded-xl font-bold border transition-all text-xs cursor-pointer ${
                          editRiderStatus === st
                            ? 'bg-[#111827] text-[#FDD023] border-[#111827] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Equipment & Delivery Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editRiderNotes}
                    onChange={(e) => setEditRiderNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#111827] resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRider(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingRider}
                    className="px-6 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-[#FDD023] font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    {isUpdatingRider ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE RIDER MODAL */}
        {riderToDelete && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
            onClick={() => setRiderToDelete(null)}
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
                  Remove Delivery Rider?
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to remove <strong className="text-black font-black">"{riderToDelete.name}"</strong> ({riderToDelete.vehicleType}) from the fleet roster?
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingRider}
                  onClick={() => setRiderToDelete(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingRider}
                  onClick={handleConfirmDeleteRider}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeletingRider ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Remove</span>
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
                <div className="flex justify-between border-t border-slate-200 pt-2 items-start">
                  <span className="text-slate-500 font-bold">Assigned Rider:</span>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block">
                      {selectedOrderForReceipt.riderName || 'Kuya Arnel Ramos'}
                    </span>
                    {selectedOrderForReceipt.riderPhone && (
                      <span className="text-[11px] text-slate-600 font-mono block">
                        {selectedOrderForReceipt.riderPhone}
                      </span>
                    )}
                    {selectedOrderForReceipt.vehicleType && (
                      <span className="text-[10px] text-slate-500 block">
                        {selectedOrderForReceipt.vehicleType}
                      </span>
                    )}
                  </div>
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
