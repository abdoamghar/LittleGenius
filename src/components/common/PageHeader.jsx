import React from "react";
import { cn } from "@/lib/utils";

export default function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl space-y-2">
        {eyebrow ? (
          <p className="lg-page-kicker w-fit uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-bold leading-tight text-ink md:text-4xl">{title}</h1>
        {description ? <p className="text-base leading-relaxed text-inkMuted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
