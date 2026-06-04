const projectId = process.env.FIREBASE_PROJECT || process.env.FIREBASE_PROJECT_ID || 'classvaulte';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const baseUrl = `http://${emulatorHost}/v1/projects/${projectId}/databases/(default)/documents`;

const fetch = global.fetch || require('node-fetch');

async function createDocument(collection, data) {
  const url = `${baseUrl}/${collection}`;
  const body = { fields: {} };
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string') body.fields[k] = { stringValue: v };
    else if (typeof v === 'number' && Number.isInteger(v)) body.fields[k] = { integerValue: String(v) };
    else if (typeof v === 'number') body.fields[k] = { doubleValue: v };
    else if (v === null) body.fields[k] = { nullValue: null };
    else if (v instanceof Date) body.fields[k] = { timestampValue: v.toISOString() };
    else body.fields[k] = { stringValue: String(v) };
  }

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  return json;
}

async function getDocuments(collection) {
  const url = `${baseUrl}/${collection}`;
  const res = await fetch(url);
  const json = await res.json();
  return json;
}

async function run() {
  console.log('Emulator test starting — project:', projectId, 'emulatorHost:', emulatorHost);

  const task = await createDocument('tasks', {
    userId: 'test-user-123',
    subjectId: 'test-subj-1',
    title: 'Emulator test task',
    status: 'todo',
    progress: 0,
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Created task:', task.name || JSON.stringify(task));

  const msg = await createDocument('aiMessages', {
    aiConversationId: 'conv-1',
    userId: 'test-user-123',
    role: 'user',
    content: 'Hello emulator',
    createdAt: new Date()
  });
  console.log('Created aiMessage:', msg.name || JSON.stringify(msg));

  const tasks = await getDocuments('tasks');
  const messages = await getDocuments('aiMessages');

  console.log('Tasks list response contains:', (tasks.documents || []).length, 'documents');
  console.log('AiMessages list response contains:', (messages.documents || []).length, 'documents');

  if ((tasks.documents || []).length > 0 && (messages.documents || []).length > 0) {
    console.log('EMULATOR TEST: SUCCESS');
    process.exit(0);
  }
  console.error('EMULATOR TEST: FAILED');
  process.exit(2);
}

run().catch((err) => { console.error(err); process.exit(2); });
