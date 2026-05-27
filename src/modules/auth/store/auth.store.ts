import { create } from "zustand";
import { supabase } from "@/shared/services/supabase.client";
import type { AuthState } from "@/modules/auth/types/auth.types";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  init: async () => {
    if (!supabase) {
      set({ loading: false, error: "Supabase nao esta configurado." });
      return;
    }

    const { data } = await supabase.auth.getUser();
    set({ user: data.user, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false, error: null });
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
  },
  signUp: async (email, password) => {
    if (!supabase) throw new Error("Supabase nao esta configurado.");
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
    set({ user: data.user, loading: false });
  },
  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null, loading: false, error: null });
  }
}));
