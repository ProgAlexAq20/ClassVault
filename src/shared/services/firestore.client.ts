import { firebaseFirestore } from "@/shared/services/firebase.client";
import type { Firestore } from "firebase/firestore/lite";

export const firestore: Firestore | null = firebaseFirestore;

export default firestore;
