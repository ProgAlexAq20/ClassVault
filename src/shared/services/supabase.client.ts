import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/services/supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isProduction = import.meta.env.PROD;

function isValidSupabaseUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function isSafePublicKey(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  const key = value.trim();
  return !key.startsWith("sb_secret_") && !key.toLowerCase().includes("service_role");
}

/**
 * Gets the application base URL.
 * Priority: VITE_APP_URL env var > window.location.origin + pathname
 * 
 * IMPORTANT: Set VITE_APP_URL in your .env file for production deployments.
 * Example: VITE_APP_URL=https://yourdomain.com/ClassVault
 */
export function getAppUrl(): string {
  // First try environment variable (for production)
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  // Fallback to current window origin + pathname (for development and GitHub Pages)
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    // Handle GitHub Pages subpath (e.g., /ClassVault/)
    const basePath = pathname.startsWith('/ClassVault/') ? '/ClassVault' : '';
    return `${origin}${basePath}`;
  }
  return "";
}

export function getSupabaseConfigError(): string | null {
  if (!isValidSupabaseUrl(supabaseUrl)) {
    return "VITE_SUPABASE_URL ausente ou invalida.";
  }

  if (!isSafePublicKey(supabaseAnonKey)) {
    return "VITE_SUPABASE_ANON_KEY ausente, invalida ou privada. Use apenas a anon/public key no frontend.";
  }

  return null;
}

/**
 * Gets the redirect URL for Supabase auth (OAuth and email).
 * Uses hash-based routing for PWA compatibility.
 */
export function getEmailRedirectTo(): string {
  const base = getAppUrl();
  if (!base) return "/";
  // Use hash-based callback for OAuth compatibility
  return `${base.endsWith("/") ? base.slice(0, -1) : base}/#auth-callback`;
}

/**
 * Gets the deep link redirect URL for mobile/PWA.
 */
export function getDeepLinkRedirectTo(): string | undefined {
  const base = getAppUrl();
  if (!base) return undefined;
  // For PWA, use the base URL with a hash route
  return `${base}/#auth-callback`;
}

export const supabaseConfigError = getSupabaseConfigError();

export const supabase = !supabaseConfigError
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "classvault.supabase.auth"
      },
      global: {
        headers: {
          "X-Client-Info": `classvault-web/${isProduction ? "prod" : "dev"}`
        }
      },
      db: {
        schema: "public"
      }
    })
  : null;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase nao esta configurado.");
  }

  return supabase;
}
