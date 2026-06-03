import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
  type NextOrObserver,
  type User
} from "firebase/auth";
import { firebaseAuth } from "@/shared/services/firebase.client";
import firestore from "@/shared/services/firestore.client";
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { PaymentStatus } from "@/modules/auth/types/auth.types";

type StoredUserAccess = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  paymentStatus: PaymentStatus;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

const userAccessKey = "classvault.firebase.users";

function requireFirebaseAuth() {
  if (!firebaseAuth) throw new Error("Firebase nao esta configurado.");
  return firebaseAuth;
}

function readStoredUsers(): StoredUserAccess[] {
  const raw = localStorage.getItem(userAccessKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredUserAccess) : [];
  } catch {
    return [];
  }
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === "beta" || value === "pending" || value === "active";
}

function isStoredUserAccess(value: unknown): value is StoredUserAccess {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.uid === "string" &&
    isPaymentStatus(candidate.paymentStatus) &&
    typeof candidate.isAdmin === "boolean" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

function writeStoredUsers(users: StoredUserAccess[]) {
  localStorage.setItem(userAccessKey, JSON.stringify(users));
}

async function writeUserToFirestore(user: StoredUserAccess) {
  if (!firestore) return;
  try {
    const ref = doc(firestore, "userAccess", user.uid);
    await setDoc(ref, user, { merge: true });
  } catch (err) {
    // don't block client if Firestore isn't writable/configured
    // keep localStorage as single source of truth for offline
    // logging silently
    // eslint-disable-next-line no-console
    console.warn("Failed to write user to Firestore:", err);
  }
}

function adminEmails(): string[] {
  return import.meta.env.VITE_FIREBASE_ADMIN_EMAILS
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function watchFirebaseAuth(observer: NextOrObserver<User>) {
  return onAuthStateChanged(requireFirebaseAuth(), observer);
}

export async function signInWithGooglePopup() {
  const auth = requireFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutOfFirebase() {
  await firebaseSignOut(requireFirebaseAuth());
}

export function ensureStoredUser(user: User): StoredUserAccess {
  const users = readStoredUsers();
  const now = new Date().toISOString();
  const email = user.email?.toLowerCase() ?? null;
  const existing = users.find((item) => item.uid === user.uid);
  const isAdmin = Boolean(email && adminEmails().includes(email));
  const next: StoredUserAccess = {
    uid: user.uid,
    email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    paymentStatus: existing?.paymentStatus ?? "beta",
    isAdmin: existing?.isAdmin || isAdmin,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  writeStoredUsers([next, ...users.filter((item) => item.uid !== user.uid)]);
  // attempt to persist to Firestore as a central store
  void writeUserToFirestore(next);
  return next;
}

export function updateStoredUserPaymentStatus(uid: string, paymentStatus: PaymentStatus): StoredUserAccess {
  const users = readStoredUsers();
  const existing = users.find((item) => item.uid === uid);
  if (!existing) throw new Error("Usuario nao encontrado no armazenamento local.");

  const next = { ...existing, paymentStatus, updatedAt: new Date().toISOString() };
  writeStoredUsers([next, ...users.filter((item) => item.uid !== uid)]);
  // try remote update as well
  if (firestore) {
    const ref = doc(firestore, "userAccess", uid);
    void updateDoc(ref, { paymentStatus: next.paymentStatus, updatedAt: next.updatedAt }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("Failed to update user payment status on Firestore:", err);
    });
  }
  return next;
}

export async function searchStoredUsersByEmail(email: string) {
  const q = email.trim().toLowerCase();
  if (!q) return [];

  // If Firestore available, try exact-match query
  if (firestore) {
    try {
      const col = collection(firestore, "userAccess");
      const firestoreQuery = queryFn(col, "email", q);
      const snapshot = await getDocs(firestoreQuery);
      const results: StoredUserAccess[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (isStoredUserAccess(data)) results.push(data as StoredUserAccess);
      });
      if (results.length > 0) return results;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Firestore search failed, falling back to localStorage:", err);
    }
  }

  return readStoredUsers().filter((user) => user.email?.includes(q));
}

// Helper to perform an equality query without importing Firestore query builder everywhere
function queryFn(col: any, field: string, value: string) {
  return query(col, where(field, "==", value));
}
