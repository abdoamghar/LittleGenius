"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  const pathname = usePathname() || "/";
  const pageName = pathname.slice(1);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="max-w-md space-y-5 text-center">
        <p className="text-7xl font-light text-slate-300">404</p>
        <h1 className="text-2xl font-semibold text-slate-800">Page not found</h1>
        <p className="text-slate-600">The page “{pageName}” isn’t part of this LittleGenius prototype.</p>
        <Button asChild><Link href="/">Go to LittleGenius</Link></Button>
      </section>
    </main>
  );
}
