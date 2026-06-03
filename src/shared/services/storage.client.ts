import { firebaseStorage } from "@/shared/services/firebase.client";
import type { FirebaseStorage } from "firebase/storage";

export const storage: FirebaseStorage | null = firebaseStorage;

export default storage;
