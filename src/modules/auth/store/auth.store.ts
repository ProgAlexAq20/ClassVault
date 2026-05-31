import { create } from "zustand";
import { getEmailRedirectTo, requireSupabaseClient, supabase, supabaseConfigError } from "@/shared/services/supabase.client";
import { getErrorMessage, logAppError } from "@/shared/services/app-error";
import type { AuthState, PaymentStatus } from "@/modules/auth/types/auth.types";

const defaultPaymentStatus: PaymentStatus = "beta";
let authListenerReady = false;

async function clearVaultData() {
  const { useVaultDataStore } = await import("@/shared/store/vault-data.store");
  useVaultDataStore.getState().clearUserData();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  paymentStatus: defaultPaymentStatus,
  isAdmin: false,
  init: async () => {
    if (!supabase) {
      set({ loading: false, error: supabaseConfigError ?? "Supabase nao esta configurado.", paymentStatus: defaultPaymentStatus, isAdmin: false });
      return;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      logAppError("auth.init", error);
      set({ user: null, loading: false, error: error.message, paymentStatus: defaultPaymentStatus, isAdmin: false });
      return;
    }

    set({ user: data.user, loading: false, error: null });
    if (data.user) await get().loadProfile(data.user.id);

    if (!authListenerReady) {
      authListenerReady = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null, loading: false, error: null });
        if (session?.user) void get().loadProfile(session.user.id);
        if (!session?.user) void clearVaultData();
      });
    }
  },
  signIn: async (email, password) => {
    const client = requireSupabaseClient();
    set({ loading: true, error: null });
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) {
      logAppError("auth.signIn", error);
      set({ loading: false, error: error.message });
      throw error;
    }
    set({ user: data.user, loading: false });
    if (data.user) await get().loadProfile(data.user.id);
  },
  signUp: async (email, password) => {
    const client = requireSupabaseClient();
    set({ loading: true, error: null });
    const { data, error } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: getEmailRedirectTo()
      }
    });
    if (error) {
      logAppError("auth.signUp", error);
      set({ loading: false, error: error.message });
      throw error;
    }
    set({ user: data.user, loading: false, paymentStatus: defaultPaymentStatus, isAdmin: false });
    if (data.user) await get().initializeProfile(data.user.id, defaultPaymentStatus);
  },
  signInWithGoogle: async () => {
    const client = requireSupabaseClient();
    set({ loading: true, error: null });
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getEmailRedirectTo()
      }
    });
    if (error) {
      logAppError("auth.signInWithGoogle", error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },
  signOut: async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) logAppError("auth.signOut", error);
    await clearVaultData();
    set({ user: null, loading: false, error: null, paymentStatus: defaultPaymentStatus, isAdmin: false });
  },
  requestPremiumReview: async () => {
    const user = get().user;
    if (!supabase || !user) throw new Error("Sessao expirada.");
    try {
      const { error } = await supabase.from("profiles").update({ payment_status: "pending" }).eq("id", user.id);
      if (error) throw error;
      set({ paymentStatus: "pending", error: null });
    } catch (error) {
      logAppError("auth.requestPremiumReview", error, { userId: user.id });
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },
  loadProfile: async (userId: string) => {
    if (!supabase) {
      set({ paymentStatus: defaultPaymentStatus });
      return;
    }

    try {
      const { data, error } = await supabase.from("profiles").select("payment_status,is_admin").eq("id", userId).single();
      if (error || !data?.payment_status) {
        if (error) logAppError("auth.loadProfile", error, { userId });
        set({ paymentStatus: defaultPaymentStatus, isAdmin: false });
        return;
      }
      set({ paymentStatus: data.payment_status as PaymentStatus, isAdmin: Boolean(data.is_admin) });
    } catch (error) {
      logAppError("auth.loadProfile", error, { userId });
      set({ paymentStatus: defaultPaymentStatus, isAdmin: false });
    }
  },
  initializeProfile: async (userId: string, paymentStatus: PaymentStatus) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("profiles").upsert({ id: userId, payment_status: paymentStatus });
      if (error) throw error;
    } catch (error) {
      logAppError("auth.initializeProfile", error, { userId });
    }
  }
}));
