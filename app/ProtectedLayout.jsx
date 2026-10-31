"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export default function ProtectedLayout({ children }) {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isStudentRoute = pathname.startsWith("/student");
  const hasWrongRole = isTeacherRoute
    ? user?.role !== "admin"
    : isStudentRoute && user?.role !== "user";
  const destination = !isAuthenticated
    ? "/login"
    : hasWrongRole
      ? user?.role === "admin" ? "/teacher" : "/student"
      : null;

  useEffect(() => {
    if (!isLoadingAuth && destination) router.replace(destination);
  }, [destination, isLoadingAuth, router]);

  if (isLoadingAuth || destination) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </div>
    );
  }

  return children;
}
