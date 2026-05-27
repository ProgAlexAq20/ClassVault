import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/services/supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getAppUrl() {
  return import.meta.env.VITE_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
}

export function getEmailRedirectTo() {
  const base = getAppUrl();
  return base.endsWith("/") ? base : `${base}/`;
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;
