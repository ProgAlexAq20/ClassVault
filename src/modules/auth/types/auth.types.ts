import type { User } from "firebase/auth";

export type PaymentStatus = "beta" | "pending" | "active";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  paymentStatus: PaymentStatus;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  requestPremiumReview: () => Promise<void>;
};
