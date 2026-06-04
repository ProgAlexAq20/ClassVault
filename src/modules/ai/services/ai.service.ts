import { getFirestore, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseApp } from "@/shared/services/firebase.client";

const db = getFirestore(firebaseApp!);

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
