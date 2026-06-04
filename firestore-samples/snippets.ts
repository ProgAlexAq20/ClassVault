// Example Firestore snippets (modular SDK) for ClassVault
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { firebaseApp } from "../src/shared/services/firebase.client";

const db = getFirestore(firebaseApp!);

// createTask: creates a task document and updates subject's updatedAt in a batch
export async function createTask(userId: string, subjectId: string, taskData: any) {
  const taskRef = doc(collection(db, "tasks"));
  const subjectRef = doc(db, "subjects", subjectId);

  const batch = writeBatch(db);

  const now = serverTimestamp();

  batch.set(taskRef, {
    taskId: taskRef.id,
    userId,
    subjectId,
    subjectName: taskData.subjectName || null, // denormalized
    title: taskData.title,
    description: taskData.description || null,
    dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
    dueTime: taskData.dueTime || null,
    status: taskData.status || "todo",
    progress: typeof taskData.progress === "number" ? taskData.progress : 0,
    priority: taskData.priority || "normal",
    createdAt: now,
    updatedAt: now
  });

  // Update subject updatedAt to reflect change (optional)
  batch.update(subjectRef, { updatedAt: now });

  await batch.commit();
  return taskRef.id;
}

// createAiMessage: append-only message under aiMessages collection
export async function createAiMessage(userId: string, aiConversationId: string, role: string, content: string) {
  const messagesCol = collection(db, "aiMessages");
  const msgRef = doc(messagesCol);
  await setDoc(msgRef, {
    messageId: msgRef.id,
    aiConversationId,
    userId,
    role,
    content,
    createdAt: serverTimestamp()
  });
  return msgRef.id;
}

// Usage notes:
// - Ensure `firebaseApp` is initialized (see src/shared/services/firebase.client.ts).
// - These snippets use the full Firestore SDK (not firestore/lite).
// - If your app currently uses `firestore/lite`, install and import from `firebase/firestore` where needed.
