import { useEffect } from "react";
import { supabase } from "@/shared/services/supabase.client";
import { useAuthStore } from "@/modules/auth/store/auth.store";

/**
 * AuthCallbackPage handles the OAuth redirect callback.
 * This page is rendered when the user is redirected back from the OAuth provider.
 */
export function AuthCallbackPage() {
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    async function handleCallback() {
      if (!supabase) return;

      try {
        // Exchange the code for a session (PKCE flow)
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
        } else if (data.session) {
          await init();
          // Clean URL after successful auth
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (err) {
        console.error("Error processing auth callback:", err);
      }
    }

    void handleCallback();
  }, [init]);

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-vault-mint border-t-transparent" />
        <p className="text-sm text-muted-foreground">Conectando sua conta...</p>
      </div>
    </div>
  );
}
