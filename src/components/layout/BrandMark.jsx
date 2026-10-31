import React from "react";
import { cn } from "@/lib/utils";

/** LittleGenius wordmark: an original paper-cut sprig drawn in SVG, plus editable text. */
export default function BrandMark({ withTagline = false, compact = false, tone = "ink", className }) {
  const inkClass = tone === "light" ? "text-white" : "text-ink";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-navy-600 shadow-paper">
        <svg viewBox="0 0 32 32" className="h-6 w-6" role="presentation" aria-hidden="true">
          <path
            d="M16 27V13"
            stroke="#FBF6EC"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M16 20c-5.4 0-9-3.4-9-8.6 5.4 0 9 3.4 9 8.6z" fill="#8FB89A" />
          <path d="M16 17c0-5.4 3.6-8.8 9-8.8 0 5.4-3.6 8.8-9 8.8z" fill="#F7C948" />
          <circle cx="16" cy="8" r="2.6" fill="#EF8A6B" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-lg font-bold tracking-tight", inkClass, compact && "text-base")}>
          LittleGenius
        </span>
        {withTagline ? (
          <span className={cn("mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em]", tone === "light" ? "text-white/70" : "text-inkMuted")}>
            Learning that grows
          </span>
        ) : null}
      </span>
    </span>
  );
}