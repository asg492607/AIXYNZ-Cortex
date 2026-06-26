import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase config — values come from .env (VITE_ prefix) with real project as fallback.
// In production on Render, set these as environment variables for extra security.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyB-HSljeYL0SrMggSrlpyK0-zVTtohjYeI",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "cortex-c2a74.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "cortex-c2a74",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "cortex-c2a74.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "268599614056",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:268599614056:web:876ef5abb2807b6c2c39dd",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || "G-665FG49EVS",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
