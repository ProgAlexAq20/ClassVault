import type { PaymentStatus } from "@/modules/auth/types/auth.types";
import { initializeApp, applicationDefault, getApps, type AppOptions } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const supportedEvents = ["payment.approved", "payment.pending", "payment.rejected"] as const;

type PixWebhookBody = {
  uid?: string;
  email?: string;
  eventType?: (typeof supportedEvents)[number];
};

type PixWebhookRequest = {
  body?: PixWebhookBody;
};

type PixWebhookResponse = {
  status: (code: number) => {
    json: (body: { ok: boolean; paymentStatus?: PaymentStatus; target?: string; error?: string }) => void;
  };
};

function paymentStatusForEvent(eventType: PixWebhookBody["eventType"]): PaymentStatus {
  if (eventType === "payment.approved") return "active";
  if (eventType === "payment.pending") return "pending";
  return "beta";
}

function initAdminApp() {
  if (getApps().length) return getApps()[0];

  const options: AppOptions = {};

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    options.credential = applicationDefault();
  } else {
    options.credential = applicationDefault();
  }

  return initializeApp(options);
}

async function findUserUidByEmail(email: string) {
  const adminApp = initAdminApp();
  const db = getFirestore(adminApp);
  const normalizedEmail = email.toLowerCase();
  const usersSnapshot = await db.collection("users").where("email", "==", normalizedEmail).limit(1).get();
  return usersSnapshot.empty ? null : usersSnapshot.docs[0].id;
}

async function updatePremiumStatus(uid: string, paymentStatus: PaymentStatus, email?: string) {
  const adminApp = initAdminApp();
  const db = getFirestore(adminApp);
  const accessRef = db.collection("userAccess").doc(uid);
  const profileRef = db.collection("users").doc(uid);
  const profileSnapshot = await profileRef.get();
  const profileData = profileSnapshot.exists ? profileSnapshot.data() : null;
  const now = new Date().toISOString();

  await accessRef.set(
    {
      uid,
      email: profileData?.email ?? email ?? null,
      displayName: profileData?.displayName ?? null,
      photoURL: profileData?.photoURL ?? null,
      paymentStatus,
      isAdmin: profileData?.isAdmin === true ? true : false,
      updatedBy: "webhook",
      updatedAt: now,
      createdAt: profileData?.createdAt ?? now,
      createdAtServer: profileSnapshot.exists ? profileData?.createdAtServer ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      updatedAtServer: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function handlePixWebhook(req: PixWebhookRequest, res: PixWebhookResponse) {
  const event = req.body;

  if (!event?.eventType || !supportedEvents.includes(event.eventType)) {
    res.status(400).json({ ok: false, error: "Payload invalido ou evento nao suportado." });
    return;
  }

  const paymentStatus = paymentStatusForEvent(event.eventType);
  let uid = event.uid ?? null;
  let target = uid;

  if (!uid && event.email) {
    uid = await findUserUidByEmail(event.email);
    target = event.email.toLowerCase();
  }

  if (!uid) {
    res.status(404).json({ ok: false, error: "Usuario nao encontrado para o webhook." });
    return;
  }

  try {
    await updatePremiumStatus(uid, paymentStatus, event.email?.toLowerCase());
    res.status(202).json({ ok: true, paymentStatus, target: target ?? undefined });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erro ao atualizar status premium." });
  }
}

export default handlePixWebhook;
