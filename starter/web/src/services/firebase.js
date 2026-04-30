// web/src/services/firebase.js
// ───────────────────────────────────────────────────────
// Central Firebase configuration.
//
// REPLACE the values in `firebaseConfig` below with the
// ones from Firebase Console → Project Settings → Your apps → Web.
// Don't commit your real values to a public repo (they're not
// strictly secret, but it's tidier).
// ───────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'europe-west1');
export const googleProvider = new GoogleAuthProvider();

// Force account picker (useful when users have multiple Google accounts)
googleProvider.setCustomParameters({ prompt: 'select_account' });
