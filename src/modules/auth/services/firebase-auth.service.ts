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
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore/lite";
import { firebaseAuth, requireFirestore } from "@/shared/services/firebase.client";
import type { PaymentStatus } from "@/modules/auth/types/auth.types";

export type UserAccessRecord = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  paymentStatus: PaymentStatus;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

const userAccessCacheKey = "classvault.firebase.users";

function requireFirebaseAuth() {
  if (!firebaseAuth) throw new Error("Firebase nao esta configurado.");
  return firebaseAuth;
}

function nowIso() {
  return new Date().toISOString();
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === "beta" || value === "pending" || value === "active";
}

function isUserAccessRecord(value: unknown): value is UserAccessRecord {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.uid === "string" &&
    (typeof candidate.email === "string" || candidate.email === null) &&
    (typeof candidate.displayName === "string" || candidate.displayName === null) &&
    (typeof candidate.photoURL === "string" || candidate.photoURL === null) &&
    isPaymentStatus(candidate.paymentStatus) &&
    typeof candidate.isAdmin === "boolean" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

function readCachedUsers(): UserAccessRecord[] {
  const raw = localStorage.getItem(userAccessCacheKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isUserAccessRecord) : [];
  } catch {
    return [];
  }
}

function writeCachedUser(user: UserAccessRecord) {
  const users = readCachedUsers();
  localStorage.setItem(userAccessCacheKey, JSON.stringify([user, ...users.filter((item) => item.uid !== user.uid)]));
}

function cachedUser(uid: string) {
  return readCachedUsers().find((item) => item.uid === uid) ?? null;
}

async function hasAdminClaim(user: User) {
  const token = await user.getIdTokenResult();
  return token.claims.admin === true;
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

export async function loadUserAccess(user: User): Promise<UserAccessRecord> {
  const db = requireFirestore();
  const ref = doc(db, "userAccess", user.uid);
  const admin = await hasAdminClaim(user);
  const cached = cachedUser(user.uid);
  const snapshot = await getDoc(ref);
  const now = nowIso();

  if (snapshot.exists()) {
    const data = snapshot.data();
    const access: UserAccessRecord = {
      uid: user.uid,
      email: user.email?.toLowerCase() ?? null,
      displayName: user.displayName,
      photoURL: user.photoURL,
      paymentStatus: isPaymentStatus(data.paymentStatus) ? data.paymentStatus : cached?.paymentStatus ?? "beta",
      isAdmin: admin,
      createdAt: typeof data.createdAt === "string" ? data.createdAt : cached?.createdAt ?? now,
      updatedAt: now
    };

    await setDoc(
      ref,
      {
        uid: access.uid,
        email: access.email,
        displayName: access.displayName,
        photoURL: access.photoURL,
        isAdmin: admin,
        updatedAt: now,
        updatedAtServer: serverTimestamp()
      },
      { merge: true }
    );
    writeCachedUser(access);
    return access;
  }

  const access: UserAccessRecord = {
    uid: user.uid,
    email: user.email?.toLowerCase() ?? null,
    displayName: user.displayName,
    photoURL: user.photoURL,
    paymentStatus: "beta",
    isAdmin: admin,
    createdAt: cached?.createdAt ?? now,
    updatedAt: now
  };

  await setDoc(ref, {
    ...access,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp()
  });
  writeCachedUser(access);
  return access;
}

export async function requestPremiumReview(uid: string): Promise<UserAccessRecord> {
  const db = requireFirestore();
  const ref = doc(db, "userAccess", uid);
  const updatedAt = nowIso();
  await updateDoc(ref, {
    paymentStatus: "pending",
    updatedAt,
    updatedAtServer: serverTimestamp()
  });
  const cached = cachedUser(uid);
  const access: UserAccessRecord = {
    uid,
    email: cached?.email ?? null,
    displayName: cached?.displayName ?? null,
    photoURL: cached?.photoURL ?? null,
    paymentStatus: "pending",
    isAdmin: cached?.isAdmin ?? false,
    createdAt: cached?.createdAt ?? updatedAt,
    updatedAt
  };
  writeCachedUser(access);
  return access;
}

export async function updateUserPaymentStatus(uid: string, paymentStatus: PaymentStatus): Promise<UserAccessRecord> {
  const db = requireFirestore();
  const ref = doc(db, "userAccess", uid);
  const updatedAt = nowIso();
  await updateDoc(ref, {
    paymentStatus,
    updatedAt,
    updatedAtServer: serverTimestamp()
  });

  const cached = cachedUser(uid);
  const access: UserAccessRecord = {
    uid,
    email: cached?.email ?? null,
    displayName: cached?.displayName ?? null,
    photoURL: cached?.photoURL ?? null,
    paymentStatus,
    isAdmin: cached?.isAdmin ?? false,
    createdAt: cached?.createdAt ?? updatedAt,
    updatedAt
  };
  writeCachedUser(access);
  return access;
}

export async function searchUsersByEmail(email: string): Promise<UserAccessRecord[]> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return [];

  const db = requireFirestore();
  const snapshot = await getDocs(query(collection(db, "userAccess"), where("email", "==", normalizedEmail)));
  return snapshot.docs
    .map((item) => item.data())
    .filter(isUserAccessRecord);
}
