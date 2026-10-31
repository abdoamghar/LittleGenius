"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

/** Sends the signed-in user to the workspace for their account role. */
export default function Home() {
  const { user, isLoadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoadingAuth) return;
    router.replace(!user ? "/login" : user.role === "admin" ? "/teacher" : "/student");
  }, [isLoadingAuth, user, router]);

  return null;
}
