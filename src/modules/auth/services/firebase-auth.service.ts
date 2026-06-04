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
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, type DocumentData } from "firebase/firestore/lite";
import type { PaymentStatus } from "@/modules/auth/types/auth.types";
import { firebaseAuth, requireFirestore } from "@/shared/services/firebase.client";

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

type UserProfileRecord = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  premiumReviewStatus?: "pending";
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

function paymentStatusFromFirestore(data: DocumentData | null): PaymentStatus {
  return data && isPaymentStatus(data.paymentStatus) ? data.paymentStatus : "beta";
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

function profileFromData(id: string, data: DocumentData): UserProfileRecord {
  const now = nowIso();
  return {
    uid: typeof data.uid === "string" ? data.uid : id,
    email: typeof data.email === "string" ? data.email : null,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
    premiumReviewStatus: data.premiumReviewStatus === "pending" ? "pending" : undefined,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : now,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : now
  };
}

async function syncUserProfile(user: User): Promise<UserProfileRecord> {
  const db = requireFirestore();
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  const existing = snapshot.exists() ? snapshot.data() : null;
  const now = nowIso();
  const profile: UserProfileRecord = {
    uid: user.uid,
    email: user.email?.toLowerCase() ?? null,
    displayName: user.displayName,
    photoURL: user.photoURL,
    premiumReviewStatus: existing?.premiumReviewStatus === "pending" ? "pending" : undefined,
    createdAt: existing && typeof existing.createdAt === "string" ? existing.createdAt : now,
    updatedAt: now
  };

  await setDoc(
    ref,
    {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      createdAtServer: snapshot.exists() ? existing?.createdAtServer ?? serverTimestamp() : serverTimestamp(),
      updatedAtServer: serverTimestamp()
    },
    { merge: true }
  );

  return profile;
}

async function loadUserProfile(uid: string): Promise<UserProfileRecord | null> {
  const snapshot = await getDoc(doc(requireFirestore(), "users", uid));
  return snapshot.exists() ? profileFromData(snapshot.id, snapshot.data()) : null;
}

async function readUserAccess(uid: string): Promise<DocumentData | null> {
  const snapshot = await getDoc(doc(requireFirestore(), "userAccess", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

function accessFromData(uid: string, profile: UserProfileRecord | null, data: DocumentData | null, adminClaim = false): UserAccessRecord {
  const cached = cachedUser(uid);
  const now = nowIso();
  return {
    uid,
    email: profile?.email ?? (typeof data?.email === "string" ? data.email : cached?.email ?? null),
    displayName: profile?.displayName ?? (typeof data?.displayName === "string" ? data.displayName : cached?.displayName ?? null),
    photoURL: profile?.photoURL ?? (typeof data?.photoURL === "string" ? data.photoURL : cached?.photoURL ?? null),
    paymentStatus: paymentStatusFromFirestore(data),
    isAdmin: adminClaim || data?.isAdmin === true,
    createdAt: typeof data?.createdAt === "string" ? data.createdAt : profile?.createdAt ?? cached?.createdAt ?? now,
    updatedAt: now
  };
}

async function writePremiumReviewRequest(user: User) {
  const db = requireFirestore();
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  const existing = snapshot.exists() ? snapshot.data() : null;
  const now = nowIso();

  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email?.toLowerCase() ?? null,
      displayName: user.displayName,
      photoURL: user.photoURL,
      premiumReviewStatus: "pending",
      premiumReviewRequestedAt: now,
      createdAt: existing && typeof existing.createdAt === "string" ? existing.createdAt : now,
      updatedAt: now,
      createdAtServer: snapshot.exists() ? existing?.createdAtServer ?? serverTimestamp() : serverTimestamp(),
      updatedAtServer: serverTimestamp()
    },
    { merge: true }
  );
}

async function requireCurrentAdmin() {
  const user = requireFirebaseAuth().currentUser;
  if (!user) throw new Error("Sessao expirada.");
  if (!(await hasAdminClaim(user))) throw new Error("Apenas administradores podem alterar acesso premium.");
  return user;
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
  const [profile, accessData, adminClaim] = await Promise.all([
    syncUserProfile(user),
    readUserAccess(user.uid),
    hasAdminClaim(user)
  ]);
  const access = accessFromData(user.uid, profile, accessData, adminClaim);
  writeCachedUser(access);
  return access;
}

export async function requestPremiumReview(user: User): Promise<UserAccessRecord> {
  await writePremiumReviewRequest(user);
  const [profile, accessData, adminClaim] = await Promise.all([
    loadUserProfile(user.uid),
    readUserAccess(user.uid),
    hasAdminClaim(user)
  ]);
  const access = accessFromData(user.uid, profile, accessData, adminClaim);
  writeCachedUser(access);
  return access;
}

export async function updateUserPaymentStatus(uid: string, paymentStatus: PaymentStatus): Promise<UserAccessRecord> {
  const admin = await requireCurrentAdmin();
  const db = requireFirestore();
  const profile = await loadUserProfile(uid);
  const currentAccess = await readUserAccess(uid);
  const now = nowIso();

  await setDoc(
    doc(db, "userAccess", uid),
    {
      uid,
      email: profile?.email ?? (typeof currentAccess?.email === "string" ? currentAccess.email : null),
      displayName: profile?.displayName ?? (typeof currentAccess?.displayName === "string" ? currentAccess.displayName : null),
      photoURL: profile?.photoURL ?? (typeof currentAccess?.photoURL === "string" ? currentAccess.photoURL : null),
      paymentStatus,
      isAdmin: currentAccess?.isAdmin === true,
      updatedBy: admin.uid,
      createdAt: typeof currentAccess?.createdAt === "string" ? currentAccess.createdAt : now,
      updatedAt: now,
      createdAtServer: currentAccess ? currentAccess.createdAtServer ?? serverTimestamp() : serverTimestamp(),
      updatedAtServer: serverTimestamp()
    },
    { merge: true }
  );

  const access = accessFromData(uid, profile, { ...currentAccess, paymentStatus, updatedAt: now }, false);
  writeCachedUser(access);
  return access;
}

export async function searchUsersByEmail(email: string): Promise<UserAccessRecord[]> {
  await requireCurrentAdmin();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return [];

  const db = requireFirestore();
  const profileSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", normalizedEmail)));
  const profileResults = await Promise.all(
    profileSnapshot.docs.map(async (item) => {
      const profile = profileFromData(item.id, item.data());
      return accessFromData(profile.uid, profile, await readUserAccess(profile.uid));
    })
  );

  if (profileResults.length) return profileResults;

  const legacySnapshot = await getDocs(query(collection(db, "userAccess"), where("email", "==", normalizedEmail)));
  return legacySnapshot.docs.map((item) => accessFromData(item.id, null, item.data()));
}
