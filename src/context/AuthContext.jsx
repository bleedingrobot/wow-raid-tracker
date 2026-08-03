import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, hasFirebaseConfig } from "../services/firebase";

const AuthContext = createContext(null);
const ADMIN_EMAIL = "giantjamez@gmail.com";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      return;
    }
    await signInWithPopup(auth, googleProvider);
  };

  const signOutUser = async () => {
    if (!auth) {
      return;
    }
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      isAdmin: normalizeEmail(user?.email) === ADMIN_EMAIL,
      loading,
      hasFirebaseConfig,
      signInWithGoogle,
      signOutUser
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
