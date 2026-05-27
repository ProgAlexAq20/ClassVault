import type { User } from "@supabase/supabase-js";

export type AuthMode = "signin" | "signup";

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
