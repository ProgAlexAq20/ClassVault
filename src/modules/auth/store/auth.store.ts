import { create } from "zustand";
import { supabase, getEmailRedirectTo } from "@/shared/services/supabase.client";
import type { AuthState, PaymentStatus } from "@/modules/auth/types/auth.types";

type ProfileRecord = {
  id: string;
  payment_status: PaymentStatus;
};

const defaultPaymentStatus: PaymentStatus = "beta";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  paymentStatus: defaultPaymentStatus,
  init: async () => {
    if (!supabase) {
      set({ loading: false, error: "Supabase nao esta configurado.", paymentStatus: defaultPaymentStatus });
      return;
    }

    const { data } = await supabase.auth.getUser();
    set({ user: data.user, loading: false });
    if (data.user) void get().loadProfile(data.user.id);

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false, error: null });
      if (session?.user) void get().loadProfile(session.user.id);
    });
  },
  signIn: async (email, password) => {
    if (!supabase) throw new Error("Supabase nao esta configurado.");
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    set({ user: data.user, loading: false });
    if (data.user) void get().loadProfile(data.user.id);
  },
  signUp: async (email, password) => {
    if (!supabase) throw new Error("Supabase nao esta configurado.");
    set({ loading: true, error: null });
    const { data, error } = await (supabase.auth as any).signUp({ email, password, emailRedirectTo: getEmailRedirectTo() });
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    set({ user: data.user, loading: false, paymentStatus: defaultPaymentStatus });
    if (data.user) void get().initializeProfile(data.user.id, defaultPaymentStatus);
  },
  signInWithGoogle: async () => {
    if (!supabase) throw new Error("Supabase nao esta configurado.");
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getEmailRedirectTo()
      }
    });
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    // Note: User will be redirected to Google, so we don't set loading: false here
  },
  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null, loading: false, error: null, paymentStatus: defaultPaymentStatus });
  },
  requestPremiumReview: async () => {
    set({ paymentStatus: "pending" });
    const user = get().user;
    if (!supabase || !user) return;
    try {
      await (supabase.from("profiles") as any).upsert({ id: user.id, payment_status: "pending" });
    } catch {
      // Ignorar falha caso a tabela ainda não exista
    }
  },
  loadProfile: async (userId: string) => {
    if (!supabase) {
      set({ paymentStatus: defaultPaymentStatus });
      return;
    }

    try {
      const { data, error } = await (supabase.from("profiles") as any).select("payment_status").eq("id", userId).single();
      if (error || !data?.payment_status) {
        set({ paymentStatus: defaultPaymentStatus });
        return;
      }
      set({ paymentStatus: data.payment_status as PaymentStatus });
    } catch {
      set({ paymentStatus: defaultPaymentStatus });
    }
  },
  initializeProfile: async (userId: string, paymentStatus: PaymentStatus) => {
    if (!supabase) return;
    try {
      await (supabase.from("profiles") as any).upsert({ id: userId, payment_status: paymentStatus });
    } catch {
      // tabela de perfis pode nao existir ainda
    }
  }
}));
