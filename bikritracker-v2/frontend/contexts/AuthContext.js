import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signup(email, password, storeName) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // save display name on the Firebase auth profile
    await updateProfile(credential.user, { displayName: storeName });
    // create user document in Firestore
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      storeName,
      city: '',
      createdAt: serverTimestamp(),
    });
    return credential.user;
  }

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }

  async function logout() {
    await signOut(auth);
  }

  async function updateUserEmail(newEmail) {
    if (user) await updateEmail(user, newEmail);
  }

  async function updateUserPassword(newPassword) {
    if (user) await updatePassword(user, newPassword);
  }

  async function updateUserProfile(data) {
    if (!user) return;
    // Update Firebase Auth Display Name if provided
    if (data.displayName) {
      await updateProfile(user, { displayName: data.displayName });
    }
    // Update Firestore document
    await setDoc(doc(db, 'users', user.uid), data, { merge: true });
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signup, 
      login, 
      logout,
      updateUserEmail,
      updateUserPassword,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}