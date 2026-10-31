import React from "react";
import BrandMark from "@/components/layout/BrandMark";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="lg-auth-world flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandMark withTagline />
        </div>
        <div className="mb-7 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-sun-200 bg-sun-100 text-navy-700 shadow-paper">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="lg-card p-6 sm:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
