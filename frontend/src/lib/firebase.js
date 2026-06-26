import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config — all values MUST come from environment variables.
// For local development: create frontend/.env and add VITE_FIREBASE_* keys.
// For Render: add these as Environment Variables in the Render dashboard.
// NEVER hardcode credentials here.
// Get config from runtime injection (Render) or build-time env vars (local)
const injectedConfig = window.FIREBASE_CONFIG || {};

const firebaseConfig = {
  apiKey:            injectedConfig.apiKey            || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        injectedConfig.authDomain        || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         injectedConfig.projectId         || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     injectedConfig.storageBucket     || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: injectedConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             injectedConfig.appId             || import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     injectedConfig.measurementId     || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('undefined')) {
  console.error(
    "🚨 CRITICAL ERROR: Firebase API Key is missing!\n" +
    "If you are on Render: Go to the Environment tab, add the VITE_FIREBASE_ variables, and restart the server."
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
