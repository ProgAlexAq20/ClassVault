const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT || process.env.FIREBASE_PROJECT_ID || 'classvaulte';

admin.initializeApp({ projectId });
const db = admin.firestore();

async function run() {
  console.log('Admin emulator test — project:', projectId);

  const taskRef = db.collection('tasks').doc();
  await taskRef.set({
    userId: 'admin-test-user',
    subjectId: 'admin-subj',
    title: 'Admin emulator task',
    status: 'todo',
    progress: 0,
    priority: 'low',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('Admin created task:', taskRef.id);

  const msgRef = db.collection('aiMessages').doc();
  await msgRef.set({
    aiConversationId: 'conv-admin',
    userId: 'admin-test-user',
    role: 'user',
    content: 'Admin hello',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('Admin created aiMessage:', msgRef.id);

  const tasksSnap = await db.collection('tasks').get();
  const msgsSnap = await db.collection('aiMessages').get();
  console.log('Tasks count:', tasksSnap.size, 'AiMessages count:', msgsSnap.size);
  if (tasksSnap.size > 0 && msgsSnap.size > 0) {
    console.log('ADMIN EMULATOR TEST: SUCCESS');
    process.exit(0);
  }
  console.error('ADMIN EMULATOR TEST: FAILED');
  process.exit(2);
}

run().catch((err) => { console.error(err); process.exit(2); });
