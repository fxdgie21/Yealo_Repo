import React, { useState } from 'react';
import { X, ShoppingBag, Thermometer, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ProductModalProps {
  product: Product | null;
  initialSize?: '1kg' | '5kg' | '10kg';
  onClose: () => void;
  onOrderProduct: (product: Product, quantity: number, selectedSize?: '1kg' | '5kg' | '10kg') => void;
}

type BagSize = '1kg' | '5kg' | '10kg';

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  initialSize = '5kg',
  onClose,
  onOrderProduct,
}) => {
  const { language } = useLanguage();
  const [selectedSize, setSelectedSize] = useState<BagSize>(initialSize);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const getPrice = (size: BagSize) => {
    const opt = product.bagOptions?.find((b) => b.size === size);
    return opt ? opt.price : product.price;
  };

  const currentUnitPrice = getPrice(selectedSize);
  const subtotal = currentUnitPrice * quantity;

  return (
    <div
      id="product-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="product-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-md transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto">
          {/* Top Visual Banner */}
          <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black text-[#111827] bg-[#FDD023] shadow-sm">
                {product.badge || (language === 'en' ? 'Pure Quality' : 'Dalisay na Kalidad')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-black/50 backdrop-blur-xs">
                {product.category}
              </span>
            </div>

            <div className="absolute bottom-4 left-6 right-6 text-white">
              <h3 className="font-heading font-black text-2xl sm:text-3xl tracking-tight">
                {product.name}
              </h3>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                {language === 'en'
                  ? '5-Stage Reverse Osmosis Purified • Muñoz & San Jose City Delivery'
                  : '5-Stage Reverse Osmosis Purified • Muñoz & San Jose City Delivery'}
              </p>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 mb-2">
                {language === 'en' ? 'Overview & Purity' : 'Deskripsyon at Kalidad'}
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                {product.longDescription || product.description}
              </p>
            </div>

            {/* Bag Size Selector */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                {language === 'en' ? 'Choose Packaging Size:' : 'Pumili ng Laki ng Supot:'}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['1kg', '5kg', '10kg'] as BagSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                      selectedSize === size
                        ? 'bg-[#FDD023] border-[#111827] text-[#111827] shadow-sm ring-2 ring-[#FDD023]/50'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-black text-sm">{size}</div>
                    <div className="text-[11px] opacity-80">₱{getPrice(size)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Specs */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FFFDF0] border border-amber-200">
              <div className="flex items-center gap-2.5">
                <Thermometer className="w-4 h-4 text-amber-700" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    {language === 'en' ? 'Freezing Temp' : 'Temperatura'}
                  </div>
                  <div className="text-xs font-black text-[#111827]">{product.temperature}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    {language === 'en' ? 'Melt Rate' : 'Bilis ng Pagkatunaw'}
                  </div>
                  <div className="text-xs font-black text-[#111827]">{product.meltRate}</div>
                </div>
              </div>
            </div>

            {/* Price & Quantity */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500">
                  {language === 'en' ? 'Price' : 'Presyo'} ({selectedSize})
                </div>
                <div className="font-heading font-black text-2xl text-[#111827]">
                  ₱{currentUnitPrice}
                </div>
              </div>

              {/* Counter */}
              <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full bg-white text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center font-black text-sm text-[#111827]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-full bg-white text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-500">Subtotal</div>
                <div className="font-heading font-black text-xl text-amber-700">
                  ₱{subtotal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Order Action Button */}
            <button
              id="modal-order-confirm-btn"
              onClick={() => {
                onOrderProduct(product, quantity, selectedSize);
                onClose();
              }}
              className="w-full py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider text-white bg-[#111827] hover:bg-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {language === 'en'
                  ? `Order ${quantity}× ${selectedSize} Bag (${product.name})`
                  : `Umorder ng ${quantity}× ${selectedSize} (${product.name})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
