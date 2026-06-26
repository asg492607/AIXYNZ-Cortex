import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        localStorage.setItem('cortex_token', idToken);
        
        // Fetch user profile from backend
        try {
          const res = await api.get('/me');
          setUser(res.data.data);
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          // If not registered in backend yet, we might have to wait for the register flow to finish
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('cortex_token');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const register = async (email, password, orgName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    
    setToken(idToken);
    localStorage.setItem('cortex_token', idToken);

    // Call backend to create organization and user profile
    const res = await api.post('/auth/register', {
      token: idToken,
      org_name: orgName
    });
    
    setUser(res.data.data.user);
    return userCredential;
  };

  const registerWithGoogle = async (orgName) => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const idToken = await userCredential.user.getIdToken();
    
    setToken(idToken);
    localStorage.setItem('cortex_token', idToken);

    const res = await api.post('/auth/register', {
      token: idToken,
      org_name: orgName
    });
    
    setUser(res.data.data.user);
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    localStorage.removeItem('cortex_token');
  };

  const value = {
    user,
    token,
    login,
    loginWithGoogle,
    register,
    registerWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
