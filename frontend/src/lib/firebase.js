import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config — all values MUST come from environment variables.
// For local development: create frontend/.env and add VITE_FIREBASE_* keys.
// For Render: add these as Environment Variables in the Render dashboard.
// NEVER hardcode credentials here.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('undefined')) {
  console.error(
    "🚨 CRITICAL ERROR: Firebase API Key is missing!\n" +
    "Because we removed hardcoded keys from GitHub, Vite must see the VITE_FIREBASE_API_KEY environment variable DURING the build step.\n" +
    "If you are on Render: Go to Environment tab, add the VITE_ variables, then click 'Manual Deploy -> Clear build cache & deploy'."
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
