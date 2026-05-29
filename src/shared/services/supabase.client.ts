import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/services/supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Use dynamic redirect URL based on environment
        detectSessionInUrl: true,
        flowType: "pkce"
      }
    })
  : null;
