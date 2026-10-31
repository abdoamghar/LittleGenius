import React from "react";
import { Check, Link2, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tap a word on the left, then the meaning that fits it on the right.
 * Every control is a button, so matching works with a mouse, a finger or a keyboard.
 */
export default function MatchActivity({ leftItems, rightItems, matches, pickedId, onPick, onUnmatch, result, locked }) {
  const resultFor = (id) => result?.results?.find((r) => r.itemId === id) || null;
  // matching stores the pair id as the value, so a used option is found by value
  const usedValues = Object.values(matches);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-500">Words</p>
        {leftItems.map((item) => {
          const matched = matches[item.id];
          const partner = rightItems.find((r) => r.value === matched);
          const res = resultFor(item.id);
          const isPicked = pickedId === item.id;
          return (
            <div key={item.id} className="space-y-1.5">
              <button
                type="button"
                aria-pressed={isPicked}
                aria-label={`${item.text}${matched ? ", matched" : ""}`}
                disabled={locked}
                onClick={() => onPick(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-left text-base font-bold text-ink transition hover:border-navy-300 disabled:cursor-not-allowed",
                  isPicked && "border-navy-600 bg-navy-50 shadow-paper",
                  res && res.correct && "border-leaf-500 bg-leaf-50",
                  res && !res.correct && "border-coral-400 bg-coral-50",
                  !isPicked && !res && "border-border"
                )}
              >
                <span className="flex-1">{item.text}</span>
                {isPicked ? <Link2 className="h-4 w-4 text-navy-600" aria-hidden="true" /> : null}
                {res ? (
                  res.correct ? (
                    <Check className="h-4 w-4 text-leaf-600" aria-hidden="true" />
                  ) : (
                    <X className="h-4 w-4 text-coral-600" aria-hidden="true" />
                  )
                ) : null}
              </button>
              {partner ? (
                <div className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2 text-sm text-inkMuted">
                  <span className="flex-1">{partner.text}</span>
                  {!locked ? (
                    <button
                      type="button"
                      onClick={() => onUnmatch(item.id)}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-navy-600 hover:bg-navy-50"
                    >
                      <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Undo
                    </button>
                  ) : null}
                </div>
              ) : null}
              {res && !res.correct ? (
                <p className="px-1 text-sm font-semibold text-leaf-600">Fits with: {res.answer}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-500">What it means</p>
        {rightItems.map((item) => {
          const used = usedValues.includes(item.value);
          return (
            <button
              key={item.id}
              type="button"
              disabled={locked || used}
              onClick={() => onPick(item.id)}
              className={cn(
                "w-full rounded-2xl border-2 bg-card px-4 py-3 text-left text-base font-semibold text-ink transition hover:border-navy-300 disabled:cursor-not-allowed",
                used ? "border-leaf-200 bg-leaf-50/60 text-inkMuted" : "border-border"
              )}
            >
              {item.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}