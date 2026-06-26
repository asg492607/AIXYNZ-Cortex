import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Generate simple unique ID for org
const generateId = () => Math.random().toString(36).substring(2, 15);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cortex_token') || null);
  const [loading, setLoading] = useState(true);

  // ── Helper: fetch or auto-create user in Firestore ──
  const syncFirestoreUser = async (firebaseUser, defaultOrgName = null) => {
    const idToken = await firebaseUser.getIdToken(true);
    setToken(idToken);
    localStorage.setItem('cortex_token', idToken);

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUser(userSnap.data());
      } else {
        // First time sign-in (e.g. Google or new Email signup)
        const orgId = `org_${generateId()}`;
        const orgName = defaultOrgName || (firebaseUser.displayName ? `${firebaseUser.displayName.split(' ')[0]}'s Org` : 'My Organization');
        const now = new Date().toISOString();

        // 1. Create Organization doc
        const orgData = {
          id: orgId,
          name: orgName,
          created_at: now,
          updated_at: now,
        };
        await setDoc(doc(db, 'organizations', orgId), orgData);

        // 2. Create User doc
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          org_id: orgId,
          role: 'admin',
          created_at: now,
          updated_at: now,
        };
        await setDoc(userRef, userData);
        
        setUser(userData);
      }
    } catch (err) {
      console.error('Failed to sync user with Firestore:', err);
      throw new Error("Database error: Make sure you have created a Firestore Database in the Firebase Console. (" + err.message + ")");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncFirestoreUser(firebaseUser);
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
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await syncFirestoreUser(cred.user, orgName);
    return cred;
  };

  const registerWithGoogle = async (orgName) => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncFirestoreUser(cred.user, orgName);
    return cred;
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
