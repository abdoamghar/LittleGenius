import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading…", rows = 3 }) {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <p className="flex items-center gap-2 text-sm font-semibold text-inkMuted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-200 border-t-navy-600" />
        {label}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="lg-card h-32 animate-pulse bg-card/70" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action, illustration }) {
  return (
    <div className="lg-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      {illustration ? (
        <div className="h-28 w-40 overflow-hidden rounded-2xl bg-cream">{illustration}</div>
      ) : (
        <Image
          src="/learning-art/pip-think.webp"
          alt="Pip the fox is ready to help."
          fittingType="fit"
          className="h-24 w-24 object-contain"
        />
      )}
      <h3 className="text-xl font-bold text-ink">{title}</h3>
      {description ? <p className="max-w-md text-sm text-inkMuted">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ title = "We hit a snag", description, onRetry, retryLabel = "Try again" }) {
  return (
    <div role="alert" className="rounded-3xl border border-coral-200 bg-coral-50 px-6 py-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          {description ? <p className="text-sm text-inkMuted">{description}</p> : null}
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-1 gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {retryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const PILL_TONES = {
  navy: "bg-navy-50 text-navy-700 border-navy-200",
  sun: "bg-sun-100 text-sun-600 border-sun-200",
  leaf: "bg-leaf-100 text-leaf-600 border-leaf-200",
  coral: "bg-coral-100 text-coral-600 border-coral-200",
  plum: "bg-plum-100 text-plum-600 border-plum-200",
  plain: "bg-cream text-inkMuted border-border",
};

export function StatusPill({ tone = "plain", icon: Icon, children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
        PILL_TONES[tone] || PILL_TONES.plain,
        className
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
