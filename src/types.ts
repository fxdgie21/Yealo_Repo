export interface ProductBagOption {
  size: '1kg' | '5kg' | '10kg';
  weightKg: number;
  price: number;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Cubes' | 'Tubes' | 'Cube Ice' | 'Tube Ice';
  description: string;
  longDescription: string;
  price: number; // default base price (e.g. 5kg)
  unit: string;
  image: string;
  badge?: string;
  temperature: string;
  meltRate: string;
  bestFor: string;
  packaging: string;
  inStock: boolean;
  bagOptions: ProductBagOption[];
}

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  highlights: string[];
  badge: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  role: string;
  location?: string;
  avatar?: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  productOrdered?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  additionalNotes?: string;
  createdAt: string;
  status: 'Pending' | 'Confirmed' | 'Out for Delivery' | 'Delivered';
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
}
