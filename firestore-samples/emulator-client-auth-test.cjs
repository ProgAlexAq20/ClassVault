const fetch = require('node-fetch');
const projectId = process.env.FIREBASE_PROJECT || process.env.FIREBASE_PROJECT_ID || 'classvaulte';
const authHost = 'http://localhost:9099';
const firestoreHost = 'http://localhost:8085';

async function signUp(email, password) {
  const url = `${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=anyKey`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  return res.json();
}

async function createDocWithToken(collection, idToken, data, docId) {
  const url = `${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents/${collection}${docId ? '?documentId=' + docId : ''}`;
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === 'createdAt' || k === 'updatedAt') {
      fields[k] = { timestampValue: (v instanceof Date ? v : new Date()).toISOString() };
    } else if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number' && Number.isInteger(v)) fields[k] = { integerValue: String(v) };
    else if (typeof v === 'number') fields[k] = { doubleValue: v };
    else if (v === null) fields[k] = { nullValue: null };
    else fields[k] = { stringValue: String(v) };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields })
  });
  return res.json();
}

async function listDocsWithToken(collection, idToken) {
  const url = `${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  return res.json();
}

async function run() {
  console.log('Client-auth emulator test starting...');
  const email = `test-${Date.now()}@example.com`;
  const password = 'secret123';
  const sign = await signUp(email, password);
  if (!sign.idToken) {
    console.error('SignUp failed', sign);
    process.exit(2);
  }
  const idToken = sign.idToken;
  console.log('Signed up, idToken obtained.');

  const t = await createDocWithToken('tasks', idToken, {
    userId: sign.localId,
    subjectId: 'sub-1',
    title: 'Client-auth test task',
    status: 'todo',
    progress: 0,
    priority: 'low',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('create task response:', t);

  const m = await createDocWithToken('aiMessages', idToken, {
    aiConversationId: 'conv-client',
    userId: sign.localId,
    role: 'user',
    content: 'Hello from client auth'
    , createdAt: new Date()
  });
  console.log('create aiMessage response:', m);
  // Verify by fetching each created document directly (read rules are per-document)
  const taskDocPath = t.name; // full resource name
  const msgDocPath = m.name;
  async function getDocByResourceName(resourceName) {
    const url = `${firestoreHost}/v1/${resourceName}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
    return res.json();
  }

  const taskDoc = await getDocByResourceName(taskDocPath);
  const msgDoc = await getDocByResourceName(msgDocPath);
  const ok = taskDoc && !taskDoc.error && msgDoc && !msgDoc.error;
  console.log('taskDoc:', taskDoc && taskDoc.name ? 'exists' : JSON.stringify(taskDoc));
  console.log('msgDoc:', msgDoc && msgDoc.name ? 'exists' : JSON.stringify(msgDoc));
  if (ok) {
    console.log('CLIENT AUTH EMULATOR TEST: SUCCESS');
    process.exit(0);
  }
  console.error('CLIENT AUTH EMULATOR TEST: FAILED');
  process.exit(2);
}

run().catch((err) => { console.error(err); process.exit(2); });
