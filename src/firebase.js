import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyB-qohjJeY1O_gBBpQ6iYYvLxMVwoJbsig",
  authDomain:        "your-dixit.firebaseapp.com",
  databaseURL:       "https://your-dixit-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "your-dixit",
  storageBucket:     "your-dixit.firebasestorage.app",
  messagingSenderId: "272658691889",
  appId:             "1:272658691889:web:329925cdd8003a9c0fe210",
};

export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
}

// Prevent duplicate-app error during HMR
const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db   = getDatabase(app);
export const auth = getAuth(app);

export async function signInAnon() {
  const { user } = await signInAnonymously(auth);
  return user.uid;
}
