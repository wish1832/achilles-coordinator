import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics'
import type { Analytics } from 'firebase/analytics'

// Firebase configuration - these values should be set in your environment variables
// For development, you can use the Firebase console to get these values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId is optional and may be undefined in some environments
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Connect to local emulators when VITE_FIREBASE_USE_EMULATOR is set to 'true'.
// This is configured via .env.emulator and activated by `pnpm dev:firebase`.
if (import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true') {
  const authHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? 'localhost'
  const authPort = Number(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT ?? 9099)
  const firestoreHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST ?? 'localhost'
  const firestorePort = Number(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT ?? 8080)

  connectAuthEmulator(auth, `http://${authHost}:${authPort}`, { disableWarnings: false })
  connectFirestoreEmulator(db, firestoreHost, firestorePort)

  console.info(`[Firebase] Connected to emulators — Auth: ${authHost}:${authPort}, Firestore: ${firestoreHost}:${firestorePort}`)
}

// Initialize Analytics only in supported browser environments and when measurementId is provided
let analytics: Analytics | null = null

async function initAnalytics() {
  // measurementId may be undefined during SSR or in CI
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  if (!measurementId) return

  // firebase/analytics may not be supported in some environments (e.g. older browsers)
  try {
    const supported = await analyticsIsSupported()
    if (supported && typeof window !== 'undefined') {
      analytics = getAnalytics(app)
    }
  } catch (e) {
    // ignore analytics initialization failures - keep rest of firebase working
    console.warn('Firebase analytics is not supported in this environment:', e)
  }
}

// Fire and forget analytics init (non-blocking)
void initAnalytics()

export { analytics }

export default app
