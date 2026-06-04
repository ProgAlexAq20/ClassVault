import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getErrorMessage, logAppError } from "@/shared/services/app-error";
import {
  loadUserAccess,
  requestPremiumReview as requestPremiumReviewForUser,
  signInWithGooglePopup,
  signOutOfFirebase,
  watchFirebaseAuth
} from "@/modules/auth/services/firebase-auth.service";
import type { AuthContextValue, PaymentStatus } from "@/modules/auth/types/auth.types";
import type { User } from "firebase/auth";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

export const AuthContext = createContext<AuthContextValue | null>(null);

const defaultPaymentStatus: PaymentStatus = "beta";

function clearVaultData() {
  useVaultDataStore.getState().clearUserData();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(defaultPaymentStatus);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = watchFirebaseAuth((currentUser) => {
      setLoading(true);

      if (!currentUser) {
        if (!active) return;
        setUser(null);
        setLoading(false);
        setError(null);
        setPaymentStatus(defaultPaymentStatus);
        setIsAdmin(false);
        clearVaultData();
        return;
      }

      void loadUserAccess(currentUser)
        .then((access) => {
          if (!active) return;
          setUser(currentUser);
          setPaymentStatus(access.paymentStatus);
          setIsAdmin(access.isAdmin);
          setError(null);
        })
        .catch((authError) => {
          if (!active) return;
          logAppError("auth.restoreSession", authError, { userId: currentUser.uid });
          setUser(currentUser);
          setPaymentStatus(defaultPaymentStatus);
          setIsAdmin(false);
          setError(getErrorMessage(authError));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      paymentStatus,
      isAdmin,
      signInWithGoogle: async () => {
        setLoading(true);
        setError(null);
        try {
          const signedInUser = await signInWithGooglePopup();
          const access = await loadUserAccess(signedInUser);
          setUser(signedInUser);
          setPaymentStatus(access.paymentStatus);
          setIsAdmin(access.isAdmin);
        } catch (authError) {
          logAppError("auth.signInWithGoogle", authError);
          setError(getErrorMessage(authError));
          throw authError;
        } finally {
          setLoading(false);
        }
      },
      signOut: async () => {
        try {
          await signOutOfFirebase();
          clearVaultData();
          setUser(null);
          setPaymentStatus(defaultPaymentStatus);
          setIsAdmin(false);
          setError(null);
        } catch (authError) {
          logAppError("auth.signOut", authError);
          setError(getErrorMessage(authError));
          throw authError;
        }
      },
      requestPremiumReview: async () => {
        if (!user) throw new Error("Sessao expirada.");
        try {
          // execute reCAPTCHA v3 and verify on server before marking pending
          const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LfKegstAAAAAJXG5ltSfVptrYAenRm22Pwmgqgx';
          // attempt to get token
          let token: string | null = null;
          try {
            // @ts-ignore
            if (typeof grecaptcha !== 'undefined' && grecaptcha.execute) {
              // @ts-ignore
              token = await grecaptcha.execute(siteKey, { action: 'request_premium' });
            }
          } catch (err) {
            // ignore and proceed — server will reject if required
          }

          const functionsBase = import.meta.env.VITE_FUNCTIONS_BASE_URL || '';
          if (!token) throw new Error('reCAPTCHA token unavailable.');

          const verifyUrl = functionsBase ? `${functionsBase}/verifyRecaptcha` : `/functions/verifyRecaptcha`;
          const resp = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, uid: user.uid })
          });

          if (!resp.ok) {
            const payload = await resp.json().catch(() => ({}));
            throw new Error(payload?.error || 'reCAPTCHA verification failed.');
          }

          const access = await requestPremiumReviewForUser(user.uid);
          setPaymentStatus(access.paymentStatus);
          setError(null);
        } catch (authError) {
          logAppError("auth.requestPremiumReview", authError, { userId: user.uid });
          setError(getErrorMessage(authError));
          throw authError;
        }
      }
    }),
    [error, isAdmin, loading, paymentStatus, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
