import React from 'react';
import { X, ShoppingBag, Clock, MapPin, CheckCircle, Package, Trash2 } from 'lucide-react';
import { OrderRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface RecentOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onClearOrders: () => void;
  onNewOrder: () => void;
}

export const RecentOrdersModal: React.FC<RecentOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onClearOrders,
  onNewOrder,
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

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
                  ? 'Place an order for Tube Ice or Cube Ice to track dispatch details here.'
                  : 'Mag-order ng Tube Ice o Cube Ice para makita ang dispatch details dito.'}
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
            orders.map((ord) => (
              <div
                key={ord.id}
                id={`receipt-${ord.id}`}
                className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF0] border border-amber-200 hover:border-amber-400 transition-all space-y-3"
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

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-100">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>{ord.status}</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                  <div>
                    <h5 className="font-black text-sm text-[#111827]">
                      {ord.productName} × {ord.quantity}
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

                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-amber-100 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    {language === 'en' ? 'Scheduled:' : 'Schedule:'} {ord.deliveryDate} ({ord.deliveryTime})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {language === 'en' ? 'Saved in browser storage' : 'Naka-save sa browser storage'}
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
