import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const applyUserAccess = useCallback(async (currentUser: User) => {
    setPaymentStatusLoading(true);
    try {
      const access = await loadUserAccess(currentUser);
      setPaymentStatus(access.paymentStatus);
      setIsAdmin(access.isAdmin);
      setError(null);
      return access;
    } catch (authError) {
      logAppError("auth.loadUserAccess", authError, { userId: currentUser.uid });
      setPaymentStatus(defaultPaymentStatus);
      setIsAdmin(false);
      setError(getErrorMessage(authError));
      throw authError;
    } finally {
      setPaymentStatusLoading(false);
    }
  }, []);

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
        setPaymentStatusLoading(false);
        setIsAdmin(false);
        clearVaultData();
        return;
      }

      void applyUserAccess(currentUser)
        .then((access) => {
          if (!active) return;
          setUser(currentUser);
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
  }, [applyUserAccess]);

  useEffect(() => {
    if (!user) return;

    function refreshWhenVisible() {
      if (document.visibilityState === "visible" && user) {
        void applyUserAccess(user).catch(() => {
          // applyUserAccess already exposes the error in context.
        });
      }
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [applyUserAccess, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      paymentStatusLoading,
      error,
      paymentStatus,
      isAdmin,
      signInWithGoogle: async () => {
        setLoading(true);
        setError(null);
        try {
          const signedInUser = await signInWithGooglePopup();
          const access = await applyUserAccess(signedInUser);
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
          setPaymentStatusLoading(false);
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
          setPaymentStatusLoading(true);
          const access = await requestPremiumReviewForUser(user);
          setPaymentStatus(access.paymentStatus);
          setError(null);
        } catch (authError) {
          logAppError("auth.requestPremiumReview", authError, { userId: user.uid });
          setError(getErrorMessage(authError));
          throw authError;
        } finally {
          setPaymentStatusLoading(false);
        }
      },
      refreshAccess: async () => {
        if (!user) throw new Error("Sessao expirada.");
        await applyUserAccess(user);
      }
    }),
    [applyUserAccess, error, isAdmin, loading, paymentStatus, paymentStatusLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
