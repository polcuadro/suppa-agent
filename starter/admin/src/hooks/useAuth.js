// web/src/hooks/useAuth.js
// ───────────────────────────────────────────────────────
// Hook centralizing Google login + whitelist check.
// Returns { user, loading, authorized, login, logout }.
// `authorized` is null when loading, true when allowed,
// false when the email is not in authorizedUsers/.
// ───────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const authDoc = await getDoc(doc(db, 'authorizedUsers', u.email));
          if (authDoc.exists()) {
            setAuthorized(true);
            await setDoc(doc(db, 'users', u.uid), {
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              lastSeen: serverTimestamp()
            }, { merge: true });
          } else {
            setAuthorized(false);
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          setAuthorized(false);
        }
      } else {
        setAuthorized(null);
      }
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  return { user, loading, authorized, login, logout };
}
