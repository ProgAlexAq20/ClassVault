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
  return next;
}

export function updateStoredUserPaymentStatus(uid: string, paymentStatus: PaymentStatus): StoredUserAccess {
  const users = readStoredUsers();
  const existing = users.find((item) => item.uid === uid);
  if (!existing) throw new Error("Usuario nao encontrado no armazenamento local.");

  const next = { ...existing, paymentStatus, updatedAt: new Date().toISOString() };
  writeStoredUsers([next, ...users.filter((item) => item.uid !== uid)]);
  return next;
}

export function searchStoredUsersByEmail(email: string) {
  const query = email.trim().toLowerCase();
  if (!query) return [];
  return readStoredUsers().filter((user) => user.email?.includes(query));
}
