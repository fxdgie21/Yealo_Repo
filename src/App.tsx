import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Stats } from './components/Stats';
import { ServicesSection } from './components/ServicesSection';
import { AboutUsSection } from './components/AboutUsSection';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductModal } from './components/ProductModal';
import { OrderModal } from './components/OrderModal';
import { RecentOrdersModal } from './components/RecentOrdersModal';
import { AdminDispatchModal } from './components/AdminDispatchModal';
import { OrderStatusTracker } from './components/OrderStatusTracker';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactSection } from './components/ContactSection';
import { LocationMapSection } from './components/LocationMapSection';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { ToastContainer } from './components/Toast';
import { Product, OrderRecord, ToastNotification } from './types';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { language } = useLanguage();
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalInitialProductId, setOrderModalInitialProductId] = useState<string | undefined>(undefined);
  const [orderModalInitialQuantity, setOrderModalInitialQuantity] = useState<number>(1);
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('YLO-94821');
  const [savedOrders, setSavedOrders] = useState<OrderRecord[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [contactSubjectPrefill, setContactSubjectPrefill] = useState('');

  // Auto-detect #admin in URL or pathname
  useEffect(() => {
    const checkAdminHash = () => {
      if (window.location.hash === '#admin' || window.location.pathname.endsWith('/admin')) {
        setIsAdminOpen(true);
      }
    };
    checkAdminHash();
    window.addEventListener('hashchange', checkAdminHash);
    return () => window.removeEventListener('hashchange', checkAdminHash);
  }, []);

  // Load saved orders from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yealo_orders') || localStorage.getItem('glacierpure_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedOrders(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load stored orders', e);
    }
  }, []);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenOrderModal = (productId?: string, quantity: number = 1) => {
    setOrderModalInitialProductId(productId);
    setOrderModalInitialQuantity(quantity);
    setIsOrderModalOpen(true);
  };

  const handleExploreProducts = () => {
    const element = document.getElementById('products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRequestQuote = (serviceTitle?: string) => {
    if (serviceTitle) {
      setContactSubjectPrefill(`Inquiry: ${serviceTitle}`);
    }
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderSuccess = (order: OrderRecord) => {
    setSavedOrders((prev) => [order, ...prev]);
    setTrackingOrderId(order.orderNumber);
    addToast(
      language === 'en' ? 'Order Request Submitted' : 'Naitala ang Order',
      language === 'en'
        ? `Order #${order.orderNumber} for ${order.productName} has been recorded. We will call you shortly.`
        : `Ang Order #${order.orderNumber} para sa ${order.productName} ay naitago na. Tatawag kami sa lalong madaling panahon.`
    );
  };

  const handleClearOrders = () => {
    try {
      localStorage.removeItem('yealo_orders');
      localStorage.removeItem('glacierpure_orders');
      setSavedOrders([]);
      addToast(
        language === 'en' ? 'History Cleared' : 'Nalinis ang Listahan',
        language === 'en' ? 'Your saved order records have been cleared.' : 'Nalinis na ang inyong listahan ng order.',
        'info'
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex flex-col selection:bg-[#FDD023]/40 selection:text-[#111827]">
      {/* Sticky navigation */}
      <Navbar
        onOpenOrderModal={handleOpenOrderModal}
        onOpenOrdersDrawer={() => setIsRecentOrdersOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        orderCount={savedOrders.length}
      />

      {/* Main Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero
          onOpenOrderModal={() => handleOpenOrderModal()}
          onExploreProducts={handleExploreProducts}
        />

        {/* 2. About Us & 5-Stage Reverse Osmosis Journey */}
        <AboutUsSection />

        {/* 3. Products Catalog (Tube Ice & Cube Ice Only) */}
        <ProductCatalog
          onSelectProduct={(product) => setSelectedProductForDetail(product)}
          onQuickOrder={(product, qty) => handleOpenOrderModal(product.id, qty)}
        />

        {/* 4. Core Services */}
        <ServicesSection onRequestQuote={handleRequestQuote} />

        {/* 5. Business Stats & Quality Indicators */}
        <Stats />

        {/* 6. Live Order Status Tracking (Simulated & Local Orders) */}
        <OrderStatusTracker
          onOpenOrderModal={() => handleOpenOrderModal()}
          externalTrackingId={trackingOrderId}
        />

        {/* 7. Customer Reviews & 5.0 Rating Breakdown */}
        <ReviewsSection onShowToast={(title, msg) => addToast(title, msg, 'success')} />

        {/* 8. Contact Section */}
        <ContactSection
          onShowToast={(title, msg) => addToast(title, msg, 'success')}
          prefillSubject={contactSubjectPrefill}
        />

        {/* 9. Delivery Service Territory (Muñoz & San Jose City) */}
        <LocationMapSection />
      </main>

      {/* Footer */}
      <Footer
        onScrollToSection={handleScrollToSection}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Floating Back-To-Top Button */}
      <BackToTop />

      {/* Modals */}
      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onOrderProduct={(product, qty, size) => {
          setSelectedProductForDetail(null);
          handleOpenOrderModal(product.id, qty);
        }}
      />

      {/* Interactive Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        initialProductId={orderModalInitialProductId}
        initialQuantity={orderModalInitialQuantity}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Saved Orders Drawer / Receipt Viewer */}
      <RecentOrdersModal
        isOpen={isRecentOrdersOpen}
        onClose={() => setIsRecentOrdersOpen(false)}
        orders={savedOrders}
        onClearOrders={handleClearOrders}
        onNewOrder={() => {
          setIsRecentOrdersOpen(false);
          handleOpenOrderModal();
        }}
        onTrackOrder={(id) => {
          setTrackingOrderId(id);
          handleScrollToSection('track');
        }}
      />

      {/* Store Owner Dispatch & Live Order Management Portal */}
      <AdminDispatchModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        language={language}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
