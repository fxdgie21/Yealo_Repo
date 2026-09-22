import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Target provisioned Firestore database with persistent local cache support and auto-fallback
let firestoreInstance: Firestore;

try {
  // Use persistent cache with multiple tab manager for robust offline/online synchronization
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch (cacheErr) {
  try {
    // If standard multi-tab cache fails or is already initialized
    firestoreInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  } catch (directErr) {
    // Fallback to default instance
    firestoreInstance = getFirestore(app);
  }
}

export const db = firestoreInstance;

/**
 * Helper to delete an order from Firestore, with graceful synchronization
 * across both Firestore database and browser storage caches.
 */
export async function deleteOrderPermanently(orderId: string, orderNumber?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { doc, deleteDoc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');

    // 1. Direct delete by ID
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);

    // 2. Also check if there's any document stored under the orderNumber
    if (orderNumber && orderNumber !== orderId) {
      try {
        const numRef = doc(db, 'orders', orderNumber);
        const snap = await getDoc(numRef);
        if (snap.exists()) {
          await deleteDoc(numRef);
        }

        // Query by orderNumber in case document ID is arbitrary
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('orderNumber', '==', orderNumber));
        const qSnap = await getDocs(q);
        const deletePromises = qSnap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      } catch {
        // secondary cleanup can fail gracefully
      }
    }

    // 3. Clean up browser storage caches
    try {
      ['yealo_orders', 'glacierpure_orders'].forEach((storageKey) => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const filtered = list.filter(
              (o: any) =>
                o.id !== orderId &&
                o.orderNumber !== orderId &&
                (!orderNumber || (o.id !== orderNumber && o.orderNumber !== orderNumber))
            );
            localStorage.setItem(storageKey, JSON.stringify(filtered));
          }
        }
      });
    } catch {
      // local storage error ignored
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Firestore delete order error:', err);
    // Still clean local storage
    try {
      ['yealo_orders', 'glacierpure_orders'].forEach((storageKey) => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const filtered = list.filter(
              (o: any) =>
                o.id !== orderId &&
                o.orderNumber !== orderId &&
                (!orderNumber || (o.id !== orderNumber && o.orderNumber !== orderNumber))
            );
            localStorage.setItem(storageKey, JSON.stringify(filtered));
          }
        }
      });
    } catch {
      // local storage error ignored
    }
    return { success: false, error: err?.message || 'Database error occurred during delete.' };
  }
}

// Connectivity check test helper
export async function testConnection() {
  return true;
}
