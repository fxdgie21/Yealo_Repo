import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShoppingBag,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useProducts } from '../context/ProductsContext';
import { Product, OrderRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
  initialQuantity?: number;
  initialSize?: '1kg' | '5kg' | '10kg';
  onOrderSuccess: (order: OrderRecord) => void;
}

type BagSize = '1kg' | '5kg' | '10kg';

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
  initialQuantity = 1,
  initialSize = '5kg',
  onOrderSuccess,
}) => {
  const { t, language } = useLanguage();
  const { products } = useProducts();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || 'cube-ice'
  );
  const [selectedBagSize, setSelectedBagSize] = useState<BagSize>(initialSize);
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [cityArea, setCityArea] = useState('Science City of Muñoz');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState(
    language === 'en'
      ? 'Morning Dispatch (7:00 AM - 10:00 AM)'
      : 'Umagang Dispatch (7:00 AM - 10:00 AM)'
  );
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'rush'>('standard');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    }
    if (initialQuantity) {
      setQuantity(initialQuantity);
    }
    if (initialSize) {
      setSelectedBagSize(initialSize);
    }
    const today = new Date().toISOString().split('T')[0];
    setDeliveryDate(today);
  }, [initialProductId, initialQuantity, initialSize, isOpen]);

  if (!isOpen) return null;

  const currentProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const getPrice = (product: Product, size: BagSize) => {
    const opt = product.bagOptions?.find((b) => b.size === size);
    return opt ? opt.price : product.price;
  };

  const unitPrice = currentProduct ? getPrice(currentProduct, selectedBagSize) : 50;
  const subtotal = unitPrice * quantity;
  // Delivery fee logic for Muñoz & San Jose City
  const baseDeliveryFee = subtotal >= 300 ? 0 : 35;
  const deliveryFee = deliverySpeed === 'rush' ? baseDeliveryFee + 30 : baseDeliveryFee;
  const estimatedTotal = subtotal + deliveryFee;

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) {
      errs.customerName = language === 'en' ? 'Please enter your full name' : 'Pakilagay ang inyong full name';
    }
    if (!phoneNumber.trim()) {
      errs.phoneNumber = language === 'en' ? 'Please enter your contact phone number' : 'Pakilagay ang inyong phone number';
    }
    if (!deliveryAddress.trim()) {
      errs.deliveryAddress = language === 'en' ? 'Please enter your street address / landmark' : 'Pakilagay ang inyong delivery address / landmark';
    }
    if (!deliveryDate) {
      errs.deliveryDate = language === 'en' ? 'Please select a delivery date' : 'Pumili ng delivery date';
    }
    if (quantity < 1) {
      errs.quantity = language === 'en' ? 'Quantity must be at least 1' : 'Dapat at least 1 bag ang order';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const orderNumber = `YLO-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullAddress = `${deliveryAddress}, ${cityArea}, Nueva Ecija`;

    const newOrder: OrderRecord = {
      id: `ord_${Date.now()}`,
      orderNumber,
      customerName,
      phoneNumber,
      email: email || 'inquiry4yealo@gmail.com',
      productId: currentProduct.id,
      productName: `${currentProduct.name} (${selectedBagSize})`,
      bagSize: selectedBagSize,
      quantity,
      unitPrice,
      subtotal,
      deliveryFee,
      total: estimatedTotal,
      deliveryAddress: fullAddress,
      cityArea,
      landmark: deliveryAddress,
      deliveryDate,
      deliveryTime: `${deliveryTime} (${deliverySpeed === 'rush' ? 'Express Rush' : 'Standard'})`,
      additionalNotes,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };

    // Save to Firestore central database for the Store Owner / Admin Dispatch Portal
    try {
      await setDoc(doc(db, 'orders', newOrder.id), {
        ...newOrder,
        timestamp: serverTimestamp(),
      });
    } catch (firestoreErr) {
      console.warn('Firestore live order sync error:', firestoreErr);
    }

    // Also persist in local storage for customer receipt and quick history
    try {
      const stored = localStorage.getItem('yealo_orders');
      const ordersList: OrderRecord[] = stored ? JSON.parse(stored) : [];
      ordersList.unshift(newOrder);
      localStorage.setItem('yealo_orders', JSON.stringify(ordersList));
      localStorage.setItem('glacierpure_orders', JSON.stringify(ordersList));
    } catch (err) {
      console.error('LocalStorage error', err);
    }

    setSubmittedOrder(newOrder);
    setIsSubmitting(false);
    onOrderSuccess(newOrder);

    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FDD023', '#111827', '#FEF08A', '#0284C7'],
      });
    } catch {
      // ignore
    }
  };

  const handleResetAndClose = () => {
    setSubmittedOrder(null);
    setErrors({});
    onClose();
  };

  return (
    <div
      id="order-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden my-4 sm:my-6 max-h-[92dvh] sm:max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200 bg-[#FED74C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center font-black">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-[#111827]">
                {submittedOrder
                  ? language === 'en' ? 'Order Confirmed' : 'Kumpirmadong Order'
                  : t.orderModal.modalTitle}
              </h3>
              <p className="text-xs text-[#111827]/80 font-semibold">
                {submittedOrder
                  ? language === 'en' ? 'Receipt & Dispatch details' : 'Resibo at detalye ng dispatch'
                  : t.orderModal.step1Desc}
              </p>
            </div>
          </div>

          <button
            id="order-modal-close-button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 sm:p-8">
          {submittedOrder ? (
            /* SUCCESS CONFIRMATION SCREEN */
            <div id="order-confirmation-screen" className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#FDD023] text-[#111827] flex items-center justify-center mx-auto mb-4 shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black text-[#111827] bg-[#FDD023]/30 border border-amber-300 mb-2">
                Order #{submittedOrder.orderNumber}
              </span>

              <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#111827] mb-2">
                {language === 'en' ? 'Order Received!' : 'Order Received!'}
              </h2>

              <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed mb-6">
                {language === 'en'
                  ? 'Thank you! Your Yealo ice request has been logged. Our delivery driver will contact you prior to dispatch.'
                  : 'Salamat! Na-receive na ang inyong Yealo ice order. Tatawag o magte-text ang delivery rider bago ihatid.'}
              </p>

              {/* Receipt Card */}
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#FFFDF0] border border-amber-200 text-left space-y-3 mb-8">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-amber-200/60">
                  <span className="text-slate-500 font-medium">{language === 'en' ? 'Customer:' : 'Customer:'}</span>
                  <span className="font-bold text-[#111827]">{submittedOrder.customerName}</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-3 border-b border-amber-200/60">
                  <span className="text-slate-500 font-medium">{language === 'en' ? 'Product & Quantity:' : 'Product & Quantity:'}</span>
                  <span className="font-bold text-[#111827]">
                    {submittedOrder.productName} × {submittedOrder.quantity} {language === 'en' ? 'bag(s)' : 'bag(s)'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-3 border-b border-amber-200/60">
                  <span className="text-slate-500 font-medium">{language === 'en' ? 'Destination:' : 'Delivery Address:'}</span>
                  <span className="font-bold text-[#111827] text-right truncate max-w-[220px]">
                    {submittedOrder.deliveryAddress}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-3 border-b border-amber-200/60">
                  <span className="text-slate-500 font-medium">{language === 'en' ? 'Schedule:' : 'Schedule:'}</span>
                  <span className="font-bold text-[#111827]">
                    {submittedOrder.deliveryDate} • {submittedOrder.deliveryTime}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-800 font-black">{language === 'en' ? 'Total to Pay (COD):' : 'Total to Pay (COD):'}</span>
                  <span className="font-heading font-black text-xl text-amber-700">
                    ₱{submittedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="order-done-btn"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-wider text-white bg-[#111827] hover:bg-black shadow-md transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Back to Products' : 'Back to Products'}
                </button>
              </div>
            </div>
          ) : (
            /* INTERACTIVE ORDER FORM */
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Product & Bag Size Selector */}
              <div className="p-5 rounded-2xl bg-[#FFFDF0] border border-amber-200 space-y-4">
                <div className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Select Product & Packaging Size' : 'Piliin ang Product at Bag Size'}</span>
                </div>

                {/* Products List */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {language === 'en' ? 'Ice Type *' : 'Ice Type *'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProductId(p.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          selectedProductId === p.id
                            ? 'bg-[#FDD023] border-[#111827] text-[#111827] shadow-sm ring-2 ring-[#FDD023]/40'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-heading font-black text-sm truncate">{p.name}</div>
                          <div className="text-[11px] opacity-80 truncate">{p.badge || (p.inStock !== false ? 'In Stock' : 'Pre-order')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bag Size: 1kg, 5kg, 10kg */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {language === 'en' ? 'Bag Size *' : 'Bag Size *'}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['1kg', '5kg', '10kg'] as BagSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedBagSize(size)}
                        className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedBagSize === size
                            ? 'bg-[#111827] border-[#111827] text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-black text-xs uppercase">{size} Bag</div>
                        <div className="text-xs font-extrabold mt-0.5">
                          ₱{getPrice(currentProduct, size)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Number of Bags:' : 'Dami / Number of Bags:'}
                  </span>
                  <div className="flex items-center border border-slate-200 rounded-full bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center font-black text-sm text-[#111827] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="space-y-4">
                <div className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Customer & Location Information' : 'Customer & Delivery Info'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="order-customer-name" className="block text-xs font-bold text-slate-700 mb-1">
                      {t.orderModal.customerName} *
                    </label>
                    <input
                      id="order-customer-name"
                      type="text"
                      placeholder={language === 'en' ? 'e.g. Maria Santos' : 'hal. Maria Santos'}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                        errors.customerName
                          ? 'border-red-400 focus:ring-red-400'
                          : 'border-slate-200 focus:ring-[#FDD023]'
                      }`}
                    />
                    {errors.customerName && (
                      <p className="text-[11px] text-red-500 mt-1">{errors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="order-phone-number" className="block text-xs font-bold text-slate-700 mb-1">
                      {t.orderModal.phoneNumber} *
                    </label>
                    <input
                      id="order-phone-number"
                      type="tel"
                      placeholder="+63 9XX XXX XXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                        errors.phoneNumber
                          ? 'border-red-400 focus:ring-red-400'
                          : 'border-slate-200 focus:ring-[#FDD023]'
                      }`}
                    />
                    {errors.phoneNumber && (
                      <p className="text-[11px] text-red-500 mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>
                </div>

                {/* City Location Select */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Service Area / Municipality *' : 'Service Area / Town *'}
                    </label>
                    <select
                      value={cityArea}
                      onChange={(e) => setCityArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FDD023]"
                    >
                      <option value="Science City of Muñoz">Science City of Muñoz, Nueva Ecija</option>
                      <option value="San Jose City">San Jose City, Nueva Ecija</option>
                      <option value="Talavera (Nearby Route)">Talavera, Nueva Ecija (Nearby Route)</option>
                      <option value="Lupao / Sto. Domingo">Lupao / Sto. Domingo (Commercial)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="order-delivery-address" className="block text-xs font-bold text-slate-700 mb-1">
                      {t.orderModal.deliveryAddress} *
                    </label>
                    <input
                      id="order-delivery-address"
                      type="text"
                      placeholder={language === 'en' ? 'Brgy, Street name, Store name, or Landmark' : 'Brgy, street name, tindahan / café, o landmark'}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                        errors.deliveryAddress
                          ? 'border-red-400 focus:ring-red-400'
                          : 'border-slate-200 focus:ring-[#FDD023]'
                      }`}
                    />
                    {errors.deliveryAddress && (
                      <p className="text-[11px] text-red-500 mt-1">{errors.deliveryAddress}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="order-delivery-date" className="block text-xs font-bold text-slate-700 mb-1">
                      {t.orderModal.deliveryDate} *
                    </label>
                    <input
                      id="order-delivery-date"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FDD023]"
                    />
                  </div>

                  <div>
                    <label htmlFor="order-delivery-time" className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Preferred Delivery Window *' : 'Delivery Window *'}
                    </label>
                    <select
                      id="order-delivery-time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FDD023]"
                    >
                      <option value="Morning Dispatch (7:00 AM - 10:00 AM)">
                        {language === 'en' ? 'Morning Dispatch (7:00 AM - 10:00 AM)' : 'Morning Dispatch (7:00 AM - 10:00 AM)'}
                      </option>
                      <option value="Midday (11:00 AM - 2:00 PM)">
                        {language === 'en' ? 'Midday (11:00 AM - 2:00 PM)' : 'Midday Dispatch (11:00 AM - 2:00 PM)'}
                      </option>
                      <option value="Afternoon (3:00 PM - 6:00 PM)">
                        {language === 'en' ? 'Afternoon (3:00 PM - 6:00 PM)' : 'Afternoon Dispatch (3:00 PM - 6:00 PM)'}
                      </option>
                      <option value="Immediate Rush (Within 45 mins)">
                        {language === 'en' ? 'Immediate Rush (Within 45 mins)' : 'Immediate Rush (Within 45 mins)'}
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="order-additional-notes" className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Special Instructions (Optional)' : 'Special Instructions (Optional)'}
                  </label>
                  <input
                    id="order-additional-notes"
                    type="text"
                    placeholder={
                      language === 'en'
                        ? 'e.g. Leave at store counter, bring change for ₱500, contact upon arrival'
                        : 'hal. Iwan sa counter, magdala ng panukli sa ₱500, tawag pagdating'
                    }
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FDD023]"
                  />
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-4 rounded-2xl bg-[#FFFDF0] border border-amber-200 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>{language === 'en' ? 'Subtotal' : 'Subtotal'} ({quantity} × {selectedBagSize} @ ₱{unitPrice})</span>
                  <span className="font-bold text-slate-800">₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === 'en' ? 'Delivery Fee (Muñoz / San Jose City)' : 'Delivery Fee (Muñoz / San Jose)'}</span>
                  </span>
                  <span className="font-bold text-slate-800">
                    {deliveryFee === 0
                      ? language === 'en' ? 'FREE (Orders over ₱300)' : 'LIBRE (Orders over ₱300)'
                      : `₱${deliveryFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-amber-200 flex justify-between items-baseline">
                  <span className="text-sm font-black text-[#111827]">
                    {language === 'en' ? 'Estimated Total' : 'Total Amount'}
                  </span>
                  <span className="font-heading font-black text-2xl text-amber-700">
                    ₱{estimatedTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="order-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider text-white bg-[#111827] hover:bg-black shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'en' ? 'Processing Order...' : 'Processing Order...'}</span>
                  </span>
                ) : (
                  <>
                    <span>{t.orderModal.confirmOrderBtn} (₱{estimatedTotal.toLocaleString()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {language === 'en'
                    ? 'Pay via Cash on Delivery (COD) or GCash upon driver arrival.'
                    : 'Magbayad via Cash on Delivery (COD) o GCash pagdating ng rider.'}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
