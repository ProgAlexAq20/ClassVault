const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

function initAdmin() {
  if (admin.apps && admin.apps.length > 0) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      return;
    } catch (err) {
      console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_JSON, falling back to default credentials');
    }
  }
  // Default credentials when deployed to the same Firebase project
  admin.initializeApp();
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/pixWebhook', async (req, res) => {
  try {
    initAdmin();
    const db = admin.firestore();
    // TODO: validate provider signature here (HMAC or similar)
    const event = req.body || {};
    const uid = event.uid;
    const email = (event.email || '').toLowerCase();

    if (uid) {
      await db.collection('userAccess').doc(uid).set({ paymentStatus: 'active', updatedAt: new Date().toISOString() }, { merge: true });
      return res.status(200).json({ ok: true });
    }

    if (email) {
      const snapshot = await db.collection('userAccess').where('email', '==', email).get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.forEach((d) => batch.update(d.ref, { paymentStatus: 'active', updatedAt: new Date().toISOString() }));
        await batch.commit();
        return res.status(200).json({ ok: true });
      }
      const newRef = db.collection('userAccess').doc();
      await newRef.set({ uid: newRef.id, email, paymentStatus: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: 'Missing uid or email' });
  } catch (err) {
    console.error('Webhook processing error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/verifyRecaptcha', async (req, res) => {
  try {
    const token = req.body?.token;
    const uid = req.body?.uid;
    const scoreThreshold = Number(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');

    if (!token) return res.status(400).json({ ok: false, error: 'Missing token' });
    if (!uid) return res.status(400).json({ ok: false, error: 'Missing uid' });

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return res.status(500).json({ ok: false, error: 'reCAPTCHA secret not configured' });

    // Verify token with Google
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`;
    const resp = await fetch(verifyUrl, { method: 'POST' });
    const data = await resp.json();
    if (!data.success) return res.status(400).json({ ok: false, error: 'reCAPTCHA verification failed', detail: data });

    const score = Number(data.score || 0);
    if (score < scoreThreshold) return res.status(400).json({ ok: false, error: 'Low reCAPTCHA score', score });

    initAdmin();
    const db = admin.firestore();
    // mark the user's request as pending for manual review
    await db.collection('userAccess').doc(uid).set({ paymentStatus: 'pending', updatedAt: new Date().toISOString() }, { merge: true });
    return res.status(200).json({ ok: true, score });
  } catch (err) {
    console.error('reCAPTCHA verification error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

exports.pixWebhook = functions.https.onRequest(app);
