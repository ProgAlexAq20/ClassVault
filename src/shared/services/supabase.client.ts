import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/services/supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Gets the application base URL.
 * Priority: VITE_APP_URL env var > window.location.origin
 * 
 * IMPORTANT: Set VITE_APP_URL in your .env file for production deployments.
 * Example: VITE_APP_URL=https://yourdomain.com
 */
export function getAppUrl(): string {
  // First try environment variable (for production)
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  // Fallback to current window origin (for development)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/**
 * Gets the email redirect URL for Supabase auth.
 * This is where users are redirected after email confirmation.
 */
export function getEmailRedirectTo(): string {
  const base = getAppUrl();
  if (!base) return "/";
  return base.endsWith("/") ? base : `${base}/`;
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
