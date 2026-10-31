import React from "react";
import { cn } from "@/lib/utils";

// Progress is always stated three ways: a bar, a written label and a marker,
// so it never depends on colour alone.
const TONES = {
  navy: "bg-navy-600",
  leaf: "bg-leaf-500",
  sun: "bg-sun-400",
  coral: "bg-coral-400",
  plum: "bg-plum-400",
};

const PATTERNS = {
  stripes: "lg-stripes",
  dots: "lg-dots",
  none: "",
};

const MARKERS = {
  strong: "▮▮▮",
  "getting-there": "▮▮▯",
  "needs-support": "▮▯▯",
  started: "▮▯▯",
  none: "▯▯▯",
};

export default function ProgressMeter({
  value = 0,
  label,
  tone = "navy",
  pattern = "none",
  statusWord,
  marker,
  compact = false,
  className,
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const resolvedStatus =
    statusWord ||
    (pct >= 80 ? "Strong" : pct >= 50 ? "On track" : pct > 0 ? "Getting there" : "Not started");
  const resolvedMarker =
    marker || (pct >= 80 ? MARKERS.strong : pct >= 50 ? MARKERS["getting-there"] : MARKERS["needs-support"]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-3">
        {label ? <span className="text-sm font-semibold text-ink">{label}</span> : <span />}
        <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-inkMuted">
          <span aria-hidden="true" className="mr-1.5 font-mono text-[10px] tracking-normal">
            {resolvedMarker}
          </span>
          {pct}% · {resolvedStatus}
        </span>
      </div>
      <div
        className={cn(
          "relative mt-2 overflow-hidden rounded-full border border-border bg-cream",
          compact ? "h-2.5" : "h-3.5"
        )}
        role="img"
        aria-label={`${label || "Progress"}: ${pct}% — ${resolvedStatus}`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", TONES[tone] || TONES.navy)}
          style={{ width: `${pct}%` }}
        />
        <div className={cn("pointer-events-none absolute inset-0 opacity-40", PATTERNS[pattern] || "")} />
      </div>
    </div>
  );
}