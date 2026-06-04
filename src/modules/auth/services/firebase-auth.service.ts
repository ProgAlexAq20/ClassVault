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
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, type DocumentData } from "firebase/firestore/lite";
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

function paymentStatusFromFirestore(data: DocumentData): PaymentStatus {
  return isPaymentStatus(data.paymentStatus) ? data.paymentStatus : "beta";
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

function accessRecordFromFirestore(user: User, data: DocumentData, admin: boolean, now: string): UserAccessRecord {
  return {
    uid: user.uid,
    email: user.email?.toLowerCase() ?? (typeof data.email === "string" ? data.email : null),
    displayName: user.displayName ?? (typeof data.displayName === "string" ? data.displayName : null),
    photoURL: user.photoURL ?? (typeof data.photoURL === "string" ? data.photoURL : null),
    paymentStatus: paymentStatusFromFirestore(data),
    isAdmin: admin,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : now,
    updatedAt: now
  };
}

async function syncUserAccessMetadata(user: User, access: UserAccessRecord) {
  const db = requireFirestore();
  const ref = doc(db, "userAccess", user.uid);

  try {
    await setDoc(
      ref,
      {
        uid: access.uid,
        email: access.email,
        displayName: access.displayName,
        photoURL: access.photoURL,
        isAdmin: access.isAdmin,
        updatedAt: access.updatedAt,
        updatedAtServer: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("[ClassVault] userAccess metadata sync failed", error);
  }
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
  const snapshot = await getDoc(ref);
  const now = nowIso();

  if (snapshot.exists()) {
    const access = accessRecordFromFirestore(user, snapshot.data(), admin, now);
    await syncUserAccessMetadata(user, access);
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
    createdAt: now,
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

export async function requestPremiumReview(user: User): Promise<UserAccessRecord> {
  const db = requireFirestore();
  const ref = doc(db, "userAccess", user.uid);
  const updatedAt = nowIso();
  const admin = await hasAdminClaim(user);

  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    const data = snapshot.data();
    if (data.paymentStatus === "active") {
      const cached = cachedUser(user.uid);
      const activeAccess: UserAccessRecord = {
        uid: user.uid,
        email: typeof data.email === "string" ? data.email : cached?.email ?? null,
        displayName: typeof data.displayName === "string" ? data.displayName : cached?.displayName ?? null,
        photoURL: typeof data.photoURL === "string" ? data.photoURL : cached?.photoURL ?? null,
        paymentStatus: "active",
        isAdmin: typeof data.isAdmin === "boolean" ? data.isAdmin : cached?.isAdmin ?? false,
        createdAt: typeof data.createdAt === "string" ? data.createdAt : cached?.createdAt ?? updatedAt,
        updatedAt
      };
      writeCachedUser(activeAccess);
      return activeAccess;
    }
  } else {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email?.toLowerCase() ?? null,
      displayName: user.displayName,
      photoURL: user.photoURL,
      paymentStatus: "beta",
      isAdmin: admin,
      createdAt: updatedAt,
      updatedAt,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp()
    });
  }

  await updateDoc(ref, {
    paymentStatus: "pending",
    updatedAt,
    updatedAtServer: serverTimestamp()
  });
  const cached = cachedUser(user.uid);
  const access: UserAccessRecord = {
    uid: user.uid,
    email: user.email?.toLowerCase() ?? cached?.email ?? null,
    displayName: user.displayName ?? cached?.displayName ?? null,
    photoURL: user.photoURL ?? cached?.photoURL ?? null,
    paymentStatus: "pending",
    isAdmin: admin,
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
