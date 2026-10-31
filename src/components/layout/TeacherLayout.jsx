"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, LayoutDashboard, Users, Wand2 } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import UserMenu from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/teacher", icon: LayoutDashboard, end: true },
  { label: "Classes", href: "/teacher/classes", icon: Users },
  { label: "Courses", href: "/teacher/courses", icon: BookOpen },
  { label: "AI drafts", href: "/teacher/drafts", icon: Wand2 },
  { label: "Progress", href: "/teacher/progress", icon: BarChart3 },
];

const isActive = (pathname, item) =>
  item.end ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

export default function TeacherLayout({ children }) {
  const pathname = usePathname() || "/";

  return (
    <div className="lg-teacher-world min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
          <Link href="/teacher" aria-label="LittleGenius teacher home"><BrandMark compact /></Link>
          <nav aria-label="Teacher" className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item);
              return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition", active ? "bg-navy-600 text-white shadow-paper" : "text-inkMuted hover:bg-cream hover:text-ink")}><Icon className="h-4 w-4" aria-hidden="true" />{item.label}</Link>;
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2"><UserMenu /></div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10">{children}</main>
      <nav aria-label="Teacher sections" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-1.5 py-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);
            return <li key={item.href} className="flex-1"><Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-bold", active ? "bg-navy-50 text-navy-700" : "text-inkMuted")}><Icon className="h-5 w-5" aria-hidden="true" />{item.label}</Link></li>;
          })}
        </ul>
      </nav>
    </div>
  );
}
