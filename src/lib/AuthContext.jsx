"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { backendAuth } from "@/lib/backend-client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const checkUserAuth = useCallback(async () => {
    try {
      setUser(await backendAuth.currentUser());
    } catch {
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const login = useCallback(async (...args) => {
    const nextUser = await backendAuth.login(...args);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (details) => {
    const nextUser = await backendAuth.register(details);
    setUser(nextUser);
    return nextUser;
  }, []);

  const createStudent = useCallback((details) => backendAuth.createStudent(details), []);

  const updateProfile = useCallback(async (details) => {
    const nextUser = await backendAuth.updateProfile(details, user?.role);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await backendAuth.logout(user?.role).catch(() => {});
    setUser(null);
  }, [user?.role]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      authChecked: !isLoadingAuth,
      login,
      register,
      createStudent,
      updateProfile,
      logout,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
