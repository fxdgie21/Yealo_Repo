import React, { useState } from 'react';
import { ShoppingBag, Eye, Plus, Minus } from 'lucide-react';
import { Product } from '../types';
import productsData from '../data/products.json';
import { useLanguage } from '../context/LanguageContext';

interface ProductCatalogProps {
  onSelectProduct: (product: Product) => void;
  onQuickOrder: (product: Product, quantity: number, size?: '1kg' | '5kg' | '10kg') => void;
}

type BagSize = '1kg' | '5kg' | '10kg';

// Iconic Yellow Bag Representation
const YellowBagIcon: React.FC<{
  size: BagSize;
  active: boolean;
  onClick: () => void;
  bagLabel: string;
}> = ({ size, active, onClick, bagLabel }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex flex-col items-center focus:outline-none transition-transform active:scale-95 cursor-pointer ${
      active ? 'scale-105' : 'opacity-70 hover:opacity-100'
    }`}
    aria-label={`Select ${size} bag`}
  >
    <div className="relative">
      {/* Bag Handle */}
      <div
        className={`w-8 h-4 mx-auto rounded-t-full border-2 transition-colors ${
          active ? 'border-[#111827]' : 'border-slate-700'
        }`}
      />
      {/* Yellow Bag Body */}
      <div
        className={`w-16 h-18 rounded-2xl flex items-center justify-center font-heading font-black text-sm text-[#111827] shadow-md transition-all ${
          active
            ? 'bg-[#FDD023] ring-3 ring-[#111827] shadow-amber-300'
            : 'bg-[#FEE07C] hover:bg-[#FDD023]'
        }`}
      >
        <span>{size}</span>
      </div>
    </div>
    <span
      className={`mt-2 text-xs font-black uppercase tracking-wider ${
        active ? 'text-[#111827]' : 'text-slate-500'
      }`}
    >
      {bagLabel}
    </span>
  </button>
);

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onSelectProduct,
  onQuickOrder,
}) => {
  const products = productsData as Product[];
  const { t, language } = useLanguage();
  const [selectedGlobalSize, setSelectedGlobalSize] = useState<BagSize>('5kg');
  const [selectedBagSizes, setSelectedBagSizes] = useState<Record<string, BagSize>>({
    'cube-ice': '5kg',
    'tube-ice': '5kg',
  });
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleBagSizeChange = (productId: string, size: BagSize) => {
    setSelectedBagSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleGlobalBagSizeClick = (size: BagSize) => {
    setSelectedGlobalSize(size);
    setSelectedBagSizes({
      'cube-ice': size,
      'tube-ice': size,
    });
  };

  const getPrice = (product: Product, size: BagSize) => {
    const opt = product.bagOptions?.find((b) => b.size === size);
    return opt ? opt.price : product.price;
  };

  const getQuantity = (id: string) => quantities[id] || 1;

  const handleUpdateQuantity = (id: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  return (
    <section id="products" className="py-24 relative bg-[#FFFDF0] overflow-hidden">
      {/* Background warm glow */}
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#FED74C]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Script Font */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 id="products-title" className="font-script text-5xl sm:text-6xl text-[#111827] mb-3">
            {t.products.title}
          </h2>
          <div className="w-16 h-1.5 bg-[#FDD023] mx-auto rounded-full mb-6" />
          <p className="text-base sm:text-lg text-slate-700 max-w-xl mx-auto font-normal">
            {language === 'en' ? (
              <>
                Choose between our crystal-clear <strong>Cube Ice</strong> and food-grade <strong>Tube Ice</strong>,
                available in 1kg, 5kg, and 10kg sealed hygienic bags.
              </>
            ) : (
              <>
                Pumili between our crystal-clear <strong>Cube Ice</strong> at food-grade <strong>Tube Ice</strong>,
                available sa 1kg, 5kg, at 10kg sealed hygienic bags.
              </>
            )}
          </p>
        </div>

        {/* Mockup Bag Size Selector (1kg, 5kg, 10kg yellow bags) */}
        <div className="mb-14 flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 mb-5">
            {language === 'en' ? 'Select Packaging Size' : 'Select Bag Size'}
          </span>
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <YellowBagIcon
              size="1kg"
              bagLabel={language === 'en' ? '1kg bag' : '1kg bag'}
              active={selectedGlobalSize === '1kg'}
              onClick={() => handleGlobalBagSizeClick('1kg')}
            />
            <YellowBagIcon
              size="5kg"
              bagLabel={language === 'en' ? '5kg bag' : '5kg bag'}
              active={selectedGlobalSize === '5kg'}
              onClick={() => handleGlobalBagSizeClick('5kg')}
            />
            <YellowBagIcon
              size="10kg"
              bagLabel={language === 'en' ? '10kg sack' : '10kg sack'}
              active={selectedGlobalSize === '10kg'}
              onClick={() => handleGlobalBagSizeClick('10kg')}
            />
          </div>
        </div>

        {/* Strict 2-Product Grid: Tube Ice and Cube Ice Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {products.map((product) => {
            const currentSize = selectedBagSizes[product.id] || selectedGlobalSize;
            const currentUnitPrice = getPrice(product, currentSize);
            const qty = getQuantity(product.id);
            const subtotal = currentUnitPrice * qty;

            const isTube = product.id === 'tube-ice';
            const productName =
              language === 'en'
                ? product.name
                : isTube
                ? 'Tube Ice'
                : 'Cube Ice';
            const productCategory =
              language === 'en'
                ? product.category
                : isTube
                ? 'Cylindrical Tube Ice'
                : 'Crystal Gourmet Cubes';
            const productDesc =
              language === 'en'
                ? product.description
                : isTube
                ? 'Classic cylindrical ice na may hollow center para sa mabilisang pagpapalamig ng milk tea, iced coffee, juices, at drinks.'
                : 'Solid, crystal-clear gourmet cubes na mabagal matunaw para hindi matabang ang inyong iced coffee, cocktails, o shakes.';

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className="group rounded-3xl bg-white border border-amber-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Image Showcase */}
                <div className="relative aspect-4/3 bg-slate-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Left Tag */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-[#FDD023] text-[#111827] shadow-sm">
                      {product.badge || (language === 'en' ? '5-Stage RO Pure' : '5-Stage RO Dalisay')}
                    </span>
                  </div>

                  {/* Top Right Specs Action */}
                  <button
                    onClick={() => onSelectProduct(product)}
                    className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 hover:bg-white text-slate-800 shadow-md backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="View specifications"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t.products.viewDetails}</span>
                  </button>

                  {/* Bottom Image Overlay Label */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white">
                    <span className="text-xs font-bold tracking-wide uppercase bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs">
                      {product.packaging}
                    </span>
                    <span className="text-xs font-semibold opacity-90">
                      {product.meltRate}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-7 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Category */}
                    <div className="text-xs font-black uppercase tracking-widest text-amber-600 mb-1">
                      {productCategory}
                    </div>

                    {/* Name */}
                    <h3 className="font-heading font-black text-2xl text-[#111827] tracking-tight group-hover:text-amber-600 transition-colors">
                      {productName}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {productDesc}
                    </p>

                    {/* Bag Size Quick Selector Buttons */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                        {language === 'en' ? 'Select Bag Weight:' : 'Piliin ang Bag Size:'}
                      </div>
                      <div className="flex items-center gap-2">
                        {(['1kg', '5kg', '10kg'] as BagSize[]).map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBagSizeChange(product.id, size);
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              currentSize === size
                                ? 'bg-[#FDD023] text-[#111827] shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {size} • ₱{getPrice(product, size)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Order Section */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <span className="font-heading font-black text-3xl text-[#111827]">
                          ₱{currentUnitPrice}
                        </span>
                        <span className="text-xs font-bold text-slate-500 ml-1.5">
                          {language === 'en' ? `per ${currentSize} bag` : `bawat ${currentSize} bag`}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div
                        className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          id={`qty-minus-${product.id}`}
                          onClick={(e) => handleUpdateQuantity(product.id, -1, e)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-black text-xs text-[#111827]">
                          {qty}
                        </span>
                        <button
                          id={`qty-plus-${product.id}`}
                          onClick={(e) => handleUpdateQuantity(product.id, 1, e)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Order Now Button */}
                    <button
                      id={`order-now-btn-${product.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickOrder(product, qty, currentSize);
                      }}
                      className="w-full py-3.5 px-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider text-white bg-[#111827] hover:bg-black active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {language === 'en'
                          ? `Order ${qty}× ${currentSize} (₱${subtotal.toLocaleString()})`
                          : `Order Na: ${qty}× ${currentSize} (₱${subtotal.toLocaleString()})`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
