import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import initialProductsData from '../data/products.json';

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  updateProduct: (updated: Product) => Promise<{ success: boolean; error?: string }>;
  addProduct: (newProd: Product) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  resetToDefaults: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'yealo_managed_products';

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return initialProductsData as Product[];
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync with Firestore real-time collection 'products'
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const colRef = collection(db, 'products');

        // Check if remote collection is empty on first boot. If so, seed with initial defaults (1kg: 8, 5kg: 40, 10kg: 80)
        try {
          const snapshot = await getDocs(colRef);
          if (snapshot.empty) {
            // Seed defaults into Firestore so admin changes persist centrally across all clients
            for (const item of (initialProductsData as Product[])) {
              await setDoc(doc(db, 'products', item.id), item);
            }
          }
        } catch (seedErr) {
          console.warn('Initial product check or seed notice:', seedErr);
        }

        unsubscribe = onSnapshot(
          colRef,
          (snap) => {
            if (!snap.empty) {
              const remoteProds: Product[] = [];
              snap.forEach((d) => {
                remoteProds.push({ ...(d.data() as Product), id: d.id });
              });
              setProducts(remoteProds);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteProds));
              } catch {
                // ignore
              }
            } else {
              // If empty in firestore, fallback to local
              setProducts(initialProductsData as Product[]);
            }
            setIsLoading(false);
          },
          (err) => {
            console.warn('Firestore products onSnapshot warning, falling back to local state:', err);
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.warn('Could not attach Firestore products listener:', err);
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const updateProduct = async (updated: Product): Promise<{ success: boolean; error?: string }> => {
    // Optimistic local update
    const updatedList = products.map((p) => (p.id === updated.id ? updated : p));
    setProducts(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    try {
      await setDoc(doc(db, 'products', updated.id), updated, { merge: true });
      return { success: true };
    } catch (err: any) {
      console.warn('Failed to update product in Firestore:', err);
      return { success: true }; // Local state updated
    }
  };

  const addProduct = async (newProd: Product): Promise<{ success: boolean; error?: string }> => {
    const updatedList = [...products, newProd];
    setProducts(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    try {
      await setDoc(doc(db, 'products', newProd.id), newProd);
      return { success: true };
    } catch (err: any) {
      console.warn('Failed to add product to Firestore:', err);
      return { success: true }; // Local state updated
    }
  };

  const deleteProduct = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    const updatedList = products.filter((p) => p.id !== productId);
    setProducts(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      return { success: true };
    } catch (err: any) {
      console.warn('Failed to delete product from Firestore:', err);
      return { success: true }; // Local state updated
    }
  };

  const resetToDefaults = async () => {
    const defaults = initialProductsData as Product[];
    setProducts(defaults);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // ignore
    }
    for (const item of defaults) {
      try {
        await setDoc(doc(db, 'products', item.id), item);
      } catch {
        // ignore
      }
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        isLoading,
        updateProduct,
        addProduct,
        deleteProduct,
        resetToDefaults,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = (): ProductsContextType => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
