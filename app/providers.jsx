"use client";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/AuthContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
