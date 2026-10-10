import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Firebase web config is public by design; access is enforced by firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyDbFjf6keKc32LU7ObueHw7bGO353kOZrw',
  authDomain: 'dexter-8503d.firebaseapp.com',
  projectId: 'dexter-8503d',
  storageBucket: 'dexter-8503d.firebasestorage.app',
  messagingSenderId: '405408023908',
  appId: '1:405408023908:web:b234ae386e4c367d06a671',
};

export const ADMIN_EMAIL = 'omergilboapc@gmail.com';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  dbInstance = initializeFirestore(app, {});
}
export const db = dbInstance;
