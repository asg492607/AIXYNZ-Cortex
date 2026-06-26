import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import api from '../lib/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cortex_token') || null);
  const [loading, setLoading] = useState(true);

  // ── Helper: fetch or auto-create backend user profile ──
  const syncBackendUser = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken(/* forceRefresh */ true);
    setToken(idToken);
    localStorage.setItem('cortex_token', idToken);

    try {
      // Try fetching existing profile first
      const res = await api.get('/me');
      setUser(res.data.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        // First-time sign-in via Google — auto-register with a default org name
        try {
          const orgName = firebaseUser.displayName
            ? `${firebaseUser.displayName.split(' ')[0]}'s Org`
            : 'My Organization';
          const res = await api.post('/auth/register', {
            token: idToken,
            org_name: orgName,
          });
          setUser(res.data.data?.user || res.data.data);
        } catch (regErr) {
          console.error('Auto-register failed:', regErr);
        }
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncBackendUser(firebaseUser);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('cortex_token');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Auth actions ────────────────────────────────────────
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () =>
    signInWithPopup(auth, googleProvider);

  const register = async (email, password, orgName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    setToken(idToken);
    localStorage.setItem('cortex_token', idToken);

    const res = await api.post('/auth/register', { token: idToken, org_name: orgName });
    setUser(res.data.data?.user || res.data.data);
    return userCredential;
  };

  const registerWithGoogle = async (orgName) => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const idToken = await userCredential.user.getIdToken();
    setToken(idToken);
    localStorage.setItem('cortex_token', idToken);

    const res = await api.post('/auth/register', { token: idToken, org_name: orgName });
    setUser(res.data.data?.user || res.data.data);
    return userCredential;
  };

  const resetPassword = (email) =>
    sendPasswordResetEmail(auth, email);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    localStorage.removeItem('cortex_token');
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, loginWithGoogle,
      register, registerWithGoogle,
      resetPassword, logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
