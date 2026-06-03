// Stub serverless webhook handler for future Pix payment automation.
// This file is a placeholder and should be wired to a serverless endpoint
// or backend function to receive payment webhooks and update user access records.

type PixWebhookRequest = {
  body?: any;
};

type PixWebhookResponse = {
  status: (code: number) => {
    json: (body: { ok: boolean; error?: string }) => void;
  };
};

export async function handlePixWebhook(req: PixWebhookRequest, res: PixWebhookResponse) {
  try {
    // Validate incoming event and signature here (provider specific)
    const event = req.body;
    console.log('Received Pix webhook event:', event?.type ?? 'unknown');

    // Minimal implementation: try to use Firebase Admin SDK to update Firestore
    let admin: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      admin = require('firebase-admin');
    } catch (err) {
      console.warn('firebase-admin not available. Webhook cannot update Firestore in this environment.');
    }

    if (admin) {
      if (!admin.apps || admin.apps.length === 0) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountJson) {
          console.error('FIREBASE_SERVICE_ACCOUNT_JSON not set. Cannot initialize firebase-admin.');
          return res.status(500).json({ ok: false, error: 'Server misconfigured: missing credentials' });
        }
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      }

      const db = admin.firestore();

      // Expect webhook to provide either uid or email to identify the user
      const uid = event?.uid as string | undefined;
      const email = (event?.email as string | undefined)?.toLowerCase();

      if (uid) {
        const ref = db.collection('userAccess').doc(uid);
        await ref.set({ paymentStatus: 'active', updatedAt: new Date().toISOString() }, { merge: true });
        return res.status(200).json({ ok: true });
      }

      if (email) {
        const snapshot = await db.collection('userAccess').where('email', '==', email).get();
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.forEach((d: any) => batch.update(d.ref, { paymentStatus: 'active', updatedAt: new Date().toISOString() }));
          await batch.commit();
          return res.status(200).json({ ok: true });
        }
        // if user not found, create a record with pending active status
        const newRef = db.collection('userAccess').doc();
        await newRef.set({ uid: newRef.id, email, paymentStatus: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: 'Missing uid or email in webhook payload' });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook processing error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}

export default handlePixWebhook;
