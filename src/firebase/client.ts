import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAnalytics, isSupported as analyticsIsSupported, type Analytics } from 'firebase/analytics'

type FirebaseClient = {
  app: FirebaseApp
  auth: Auth
  db: Firestore
  analytics: Analytics | null
}

let cached: FirebaseClient | null = null
let analyticsInitStarted = false

function buildFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  } as const
}

function assertFirebaseConfig(config: ReturnType<typeof buildFirebaseConfig>) {
  // If you want to allow “fake” config for emulators, keep this lenient.
  // But do guard against accidentally trying to use Firebase with nothing set.
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      'Firebase env vars are missing. Did you mean to run in mock mode, or set VITE_FIREBASE_* variables?',
    )
  }
}

async function initAnalyticsNonBlocking(app: FirebaseApp): Promise<Analytics | null> {
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  if (!measurementId) return null
  if (typeof window === 'undefined') return null

  try {
    const supported = await analyticsIsSupported()
    if (!supported) return null
    return getAnalytics(app)
  } catch (e) {
    console.warn('Firebase analytics is not supported in this environment:', e)
    return null
  }
}

/**
 * Returns the singleton Firebase client.
 * Initializes lazily on first call (no module side effects).
 */
export function getFirebase(): FirebaseClient {
  if (cached) return cached

  const config = buildFirebaseConfig()
  assertFirebaseConfig(config)

  // If you want multiple apps, pass a name here; for now default app is fine.
  const app = getApps().length ? getApps()[0]! : initializeApp(config)
  console.trace('firebase init (lazy)')

  const auth = getAuth(app)
  const db = getFirestore(app)

  cached = { app, auth, db, analytics: null }

  // Fire-and-forget analytics init (non-blocking) exactly like you had
  if (!analyticsInitStarted) {
    analyticsInitStarted = true
    void initAnalyticsNonBlocking(app).then((a) => {
      // Only set if we haven’t been reset / replaced
      if (cached && cached.app === app) cached.analytics = a
    })
  }

  return cached
}

/**
 * Optional convenience exports so call sites can stay similar to before,
 * but still won’t initialize until accessed.
 */
export function getFirebaseApp(): FirebaseApp {
  return getFirebase().app
}
export function getFirebaseAuth(): Auth {
  return getFirebase().auth
}
export function getFirebaseDb(): Firestore {
  return getFirebase().db
}
export function getFirebaseAnalytics(): Analytics | null {
  return getFirebase().analytics
}

/**
 * Useful for tests/dev hot-reload if you ever need to re-init with different env.
 * Don’t use in normal runtime.
 */
export function __resetFirebaseForTestsOnly() {
  cached = null
  analyticsInitStarted = false
}
