'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    // Initialize Firestore with long-polling to avoid WebSocket issues on file:// iOS
    const sdks = {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: initializeFirestore(firebaseApp, { experimentalForceLongPolling: true })
    };

    // Ensure Auth uses in-memory persistence on platforms like iOS file:// where IndexedDB isn't reliable.
    if (typeof window !== 'undefined' && sdks.auth) {
      (async () => {
        try {
          await setPersistence(sdks.auth, inMemoryPersistence);
        } catch (e) {
          // Non-fatal: fallback to whatever persistence is available
          console.warn('Failed to set inMemoryPersistence for Firebase Auth:', e);
        }

        // Attempt to clear any existing IndexedDB persistence so Firestore remains memory-only.
        try {
          const firestoreMod = await import('firebase/firestore');
          if (typeof firestoreMod.clearIndexedDbPersistence === 'function') {
            await firestoreMod.clearIndexedDbPersistence(sdks.firestore);
          }
        } catch (e) {
          // If API not available or clearing fails, continue — Firestore will remain memory-only unless
          // enableIndexedDbPersistence() is explicitly called elsewhere.
          console.warn('Could not clear IndexedDB persistence for Firestore (may be unsupported):', e);
        }
      })();
    }

    return sdks;
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
