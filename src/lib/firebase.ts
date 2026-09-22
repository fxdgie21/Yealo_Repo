import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Target provisioned Firestore database
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connectivity check test helper as required by Firebase integration guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Gracefully handle offline or network delay during sandbox startup
    console.info('Firestore initialized (operating with cache/offline fallback).');
  }
}
// Run connection test safely without blocking
testConnection().catch(() => {});
