"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home as HomeIcon, Library, TrendingUp } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import UserMenu from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Today", href: "/student", icon: HomeIcon, end: true },
  { label: "My courses", href: "/student/courses", icon: Library },
  { label: "My progress", href: "/student/progress", icon: TrendingUp },
];

const isActive = (pathname, item) =>
  item.end ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

export default function StudentLayout({ children }) {
  const pathname = usePathname() || "/";

  return (
    <div className="lg-student-world min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 md:px-8">
          <Link href="/student" aria-label="LittleGenius student home"><BrandMark compact /></Link>
          <nav aria-label="Student" className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item);
              return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition", active ? "bg-sun-100 text-navy-800" : "text-inkMuted hover:bg-cream hover:text-ink")}><Icon className="h-4 w-4" aria-hidden="true" />{item.label}</Link>;
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2"><UserMenu /></div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10">{children}</main>
      <nav aria-label="Student sections" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);
            return <li key={item.href} className="flex-1"><Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-extrabold", active ? "bg-sun-100 text-navy-800" : "text-inkMuted")}><Icon className="h-5 w-5" aria-hidden="true" />{item.label}</Link></li>;
          })}
        </ul>
      </nav>
    </div>
  );
}
