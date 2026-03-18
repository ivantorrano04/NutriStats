'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    const sdks = {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: initializeFirestore(firebaseApp, { experimentalForceLongPolling: true })
    };

    if (typeof window !== 'undefined' && sdks.auth) {
      (async () => {
        try {
          // Cambiado a browserLocalPersistence para que la sesión dure entre reinicios
          await setPersistence(sdks.auth, browserLocalPersistence);
        } catch (e) {
          console.warn('Failed to set browserLocalPersistence for Firebase Auth:', e);
        }

        try {
          const firestoreMod = await import('firebase/firestore');
          if (typeof firestoreMod.clearIndexedDbPersistence === 'function') {
            await firestoreMod.clearIndexedDbPersistence(sdks.firestore);
          }
        } catch (e) {
          console.warn('Could not clear IndexedDB persistence for Firestore:', e);
        }
      })();
    }

    return sdks;
  }

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
