import type { User } from "@supabase/supabase-js";

export type AuthMode = "signin" | "signup";
export type PaymentStatus = "beta" | "pending" | "active";

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  paymentStatus: PaymentStatus;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPremiumReview: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  initializeProfile: (userId: string, paymentStatus: PaymentStatus) => Promise<void>;
};
