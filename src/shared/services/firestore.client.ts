import { firebaseApp } from "./firebase.client";
import { getFirestore, type Firestore } from "firebase/firestore";

export const firestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

export default firestore;
