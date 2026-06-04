import { initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore/lite";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

function isConfigured(config: FirebaseOptions): boolean {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId
  );
}

function parseEnvList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function originFromUrl(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

function currentOrigin(): string | null {
  try {
    return typeof window !== "undefined" ? window.location.origin : null;
  } catch {
    return null;
  }
}

const allowedOrigins = parseEnvList(import.meta.env.VITE_ALLOWED_ORIGINS);
if (import.meta.env.VITE_APP_URL) allowedOrigins.push(originFromUrl(import.meta.env.VITE_APP_URL));
allowedOrigins.push("http://localhost:5173", "http://localhost:5174");

const origin = currentOrigin();
const originAllowed = !origin || allowedOrigins.includes(origin);
const appCheckEnabled = import.meta.env.VITE_FIREBASE_APP_CHECK_ENABLED === "true";
const appCheckDebugToken = import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN;

export const firebaseConfigError = isConfigured(firebaseConfig) && originAllowed
  ? null
  : `Firebase nao esta configurado corretamente. Verifique VITE_FIREBASE_* e VITE_ALLOWED_ORIGINS. Current origin: ${origin ?? "unknown"}`;

export const firebaseApp: FirebaseApp | null = firebaseConfigError ? null : initializeApp(firebaseConfig);

if (
  firebaseApp &&
  appCheckEnabled &&
  typeof window !== "undefined" &&
  import.meta.env.DEV &&
  appCheckDebugToken
) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = appCheckDebugToken === "true" ? true : appCheckDebugToken;
}

export const firebaseAppCheck: AppCheck | null =
  firebaseApp && appCheckEnabled && typeof window !== "undefined" && import.meta.env.VITE_RECAPTCHA_SITE_KEY
    ? initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      })
    : null;

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

export const firebaseFirestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

export const firebaseStorage: FirebaseStorage | null = firebaseApp ? getStorage(firebaseApp) : null;

export const firebaseAnalytics: Promise<Analytics | null> =
  firebaseApp && firebaseConfig.measurementId
    ? isSupported()
        .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
        .catch(() => null)
    : Promise.resolve(null);

export function requireFirestore() {
  if (!firebaseFirestore) throw new Error(firebaseConfigError ?? "Firestore nao esta configurado.");
  return firebaseFirestore;
}

export function requireStorage() {
  if (!firebaseStorage) throw new Error(firebaseConfigError ?? "Firebase Storage nao esta configurado.");
  return firebaseStorage;
}
