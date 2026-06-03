import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getErrorMessage, logAppError } from "@/shared/services/app-error";
import {
  ensureStoredUser,
  signInWithGooglePopup,
  signOutOfFirebase,
  updateStoredUserPaymentStatus,
  watchFirebaseAuth
} from "@/modules/auth/services/firebase-auth.service";
import type { AuthContextValue, PaymentStatus } from "@/modules/auth/types/auth.types";
import type { User } from "firebase/auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

const defaultPaymentStatus: PaymentStatus = "beta";

async function clearVaultData() {
  const { useVaultDataStore } = await import("@/shared/store/vault-data.store");
  useVaultDataStore.getState().clearUserData();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(defaultPaymentStatus);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = watchFirebaseAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setError(null);

      if (!currentUser) {
        setPaymentStatus(defaultPaymentStatus);
        setIsAdmin(false);
        void clearVaultData();
        return;
      }

      const storedUser = ensureStoredUser(currentUser);
      setPaymentStatus(storedUser.paymentStatus);
      setIsAdmin(storedUser.isAdmin);
    });

    return unsubscribe;
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
          const storedUser = ensureStoredUser(signedInUser);
          setUser(signedInUser);
          setPaymentStatus(storedUser.paymentStatus);
          setIsAdmin(storedUser.isAdmin);
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
          await clearVaultData();
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
          const storedUser = updateStoredUserPaymentStatus(user.uid, "pending");
          setPaymentStatus(storedUser.paymentStatus);
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
