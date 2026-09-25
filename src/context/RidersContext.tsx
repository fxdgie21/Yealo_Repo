import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Rider } from '../types';
import initialRidersData from '../data/riders.json';

interface RidersContextType {
  riders: Rider[];
  isLoading: boolean;
  addRider: (newRider: Rider) => Promise<{ success: boolean; error?: string }>;
  updateRider: (updated: Rider) => Promise<{ success: boolean; error?: string }>;
  deleteRider: (riderId: string) => Promise<{ success: boolean; error?: string }>;
  recordRiderFeedback: (
    riderIdOrName: string,
    rating: number,
    comment: string,
    reviewerName?: string,
    compliments?: string[],
    orderNumber?: string
  ) => Promise<{ success: boolean; riderName?: string }>;
  resetRidersToDefaults: () => Promise<void>;
}

const RidersContext = createContext<RidersContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'yealo_managed_riders';

export const RidersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [riders, setRiders] = useState<Rider[]>(() => {
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
    return initialRidersData as Rider[];
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync with Firestore real-time collection 'riders'
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const colRef = collection(db, 'riders');

        // Check if remote collection is empty on first boot. If so, seed defaults
        try {
          const snapshot = await getDocs(colRef);
          if (snapshot.empty) {
            for (const item of (initialRidersData as Rider[])) {
              await setDoc(doc(db, 'riders', item.id), item);
            }
          }
        } catch (seedErr) {
          console.warn('Initial rider check or seed notice:', seedErr);
        }

        unsubscribe = onSnapshot(
          colRef,
          (snap) => {
            if (!snap.empty) {
              const remoteRiders: Rider[] = [];
              snap.forEach((d) => {
                remoteRiders.push({ ...(d.data() as Rider), id: d.id });
              });
              setRiders(remoteRiders);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteRiders));
              } catch {
                // ignore
              }
            } else {
              setRiders(initialRidersData as Rider[]);
            }
            setIsLoading(false);
          },
          (err) => {
            console.warn('Firestore riders onSnapshot warning, falling back to local state:', err);
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.warn('Could not attach Firestore riders listener:', err);
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addRider = async (newRider: Rider): Promise<{ success: boolean; error?: string }> => {
    const updatedList = [...riders, newRider];
    setRiders(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    try {
      await setDoc(doc(db, 'riders', newRider.id), newRider);
      return { success: true };
    } catch (err: any) {
      console.warn('Failed to add rider to Firestore:', err);
      return { success: true }; // Local state updated optimistically
    }
  };

  const updateRider = async (updated: Rider): Promise<{ success: boolean; error?: string }> => {
    const updatedList = riders.map((r) => (r.id === updated.id ? updated : r));
    setRiders(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    try {
      await setDoc(doc(db, 'riders', updated.id), updated, { merge: true });
      return { success: true };
    } catch (err: any) {
      console.warn('Failed to update rider in Firestore:', err);
      return { success: true };
    }
  };

  const deleteRider = async (riderId: string): Promise<{ success: boolean; error?: string }> => {
    const updatedList = riders.filter((r) => r.id !== riderId);
    setRiders(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    try {
      await deleteDoc(doc(db, 'riders', riderId));
      return { success: true };
    } catch (err: any) {
      console.warn('Failed to delete rider from Firestore:', err);
      return { success: true };
    }
  };

  const recordRiderFeedback = async (
    riderIdOrName: string,
    rating: number,
    comment: string,
    reviewerName?: string,
    compliments: string[] = [],
    orderNumber?: string
  ): Promise<{ success: boolean; riderName?: string }> => {
    const queryTerm = riderIdOrName.trim().toLowerCase();
    const matchedRider = riders.find(
      (r) =>
        r.id.toLowerCase() === queryTerm ||
        r.name.toLowerCase() === queryTerm ||
        queryTerm.includes(r.name.toLowerCase()) ||
        r.name.toLowerCase().includes(queryTerm)
    ) || riders[0]; // fallback to lead dispatcher if unspecified

    if (!matchedRider) {
      return { success: false };
    }

    const currentTotalRatings = (matchedRider.totalRatings || 0) + rating;
    const currentReviewsCount = (matchedRider.reviewsCount || 0) + 1;
    const newRating = Number((currentTotalRatings / currentReviewsCount).toFixed(2));

    const updatedCompliments = { ...(matchedRider.compliments || {}) };
    compliments.forEach((comp) => {
      updatedCompliments[comp] = (updatedCompliments[comp] || 0) + 1;
    });

    const updatedRider: Rider = {
      ...matchedRider,
      rating: newRating,
      totalRatings: currentTotalRatings,
      reviewsCount: currentReviewsCount,
      compliments: updatedCompliments,
    };

    // Store feedback entry for admin inspection
    try {
      const feedbackEntry = {
        id: `rf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        riderId: matchedRider.id,
        riderName: matchedRider.name,
        orderNumber: orderNumber || 'Direct Order',
        rating,
        comment: comment.trim(),
        reviewerName: reviewerName?.trim() || 'Verified Suki',
        compliments,
        submittedAt: new Date().toISOString(),
      };

      const existingFeedbackStr = localStorage.getItem('yealo_rider_feedbacks');
      let feedbackList: any[] = [];
      if (existingFeedbackStr) {
        try {
          feedbackList = JSON.parse(existingFeedbackStr);
        } catch {
          feedbackList = [];
        }
      }
      feedbackList.unshift(feedbackEntry);
      localStorage.setItem('yealo_rider_feedbacks', JSON.stringify(feedbackList));
    } catch (saveErr) {
      console.warn('Rider feedback log notice:', saveErr);
    }

    await updateRider(updatedRider);
    return { success: true, riderName: matchedRider.name };
  };

  const resetRidersToDefaults = async () => {
    const defaults = initialRidersData as Rider[];
    setRiders(defaults);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // ignore
    }
    for (const item of defaults) {
      try {
        await setDoc(doc(db, 'riders', item.id), item);
      } catch {
        // ignore
      }
    }
  };

  return (
    <RidersContext.Provider
      value={{
        riders,
        isLoading,
        addRider,
        updateRider,
        deleteRider,
        recordRiderFeedback,
        resetRidersToDefaults,
      }}
    >
      {children}
    </RidersContext.Provider>
  );
};

export const useRiders = (): RidersContextType => {
  const context = useContext(RidersContext);
  if (!context) {
    throw new Error('useRiders must be used within a RidersProvider');
  }
  return context;
};
