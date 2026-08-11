import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * firebaseClient.js
 * 
 * Initialises the Firebase SDK client.
 * If VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY are configured in the .env file,
 * Uclear connects to your live Cloud Firestore database.
 * Otherwise, it falls back to sandbox mock data.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasKeys = import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY;

export const app = hasKeys ? initializeApp(firebaseConfig) : null;
export const db = hasKeys ? getFirestore(app) : null;
