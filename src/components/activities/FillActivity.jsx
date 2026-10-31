import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A short passage with gaps. The learner taps a gap, then taps a word from the
 * bank to fill it — no dragging needed, so it works on a tablet or by keyboard.
 */
export default function FillActivity({ parts, wordBank, values, activeBlank, onBlankClick, onWordClick, result, locked }) {
  const usedWords = Object.values(values);
  const resultFor = (id) => result?.results?.find((r) => r.itemId === id) || null;

  return (
    <div className="space-y-6">
      <p className="rounded-3xl border border-border bg-paper px-5 py-6 text-lg leading-loose text-ink md:text-xl">
        {parts.map((part, index) => {
          if (!part.blankId) return <span key={index}>{part.text}</span>;
          const value = values[part.blankId];
          const res = resultFor(part.blankId);
          return (
            <span key={index} className="inline-flex flex-col items-start align-middle">
              <button
                type="button"
                aria-label={`Gap ${part.blankId.replace("b", "")}${value ? `, filled with ${value}` : ", empty"}`}
                aria-pressed={activeBlank === part.blankId}
                disabled={locked}
                onClick={() => onBlankClick(part.blankId)}
                className={cn(
                  "mx-1 inline-flex min-w-[7rem] items-center justify-center rounded-xl border-2 border-dashed px-3 py-1.5 text-base font-bold transition",
                  activeBlank === part.blankId
                    ? "border-navy-600 bg-navy-50 text-navy-700"
                    : "border-navy-300 bg-cream text-ink",
                  value ? "border-solid" : "",
                  res && res.correct && "border-solid border-leaf-500 bg-leaf-50 text-leaf-600",
                  res && !res.correct && "border-solid border-coral-400 bg-coral-50 text-coral-600",
                  "disabled:cursor-not-allowed"
                )}
              >
                {value || "choose a word"}
                {res ? (
                  res.correct ? (
                    <Check className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  ) : (
                    <X className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  )
                ) : null}
              </button>
              {res && !res.correct ? (
                <span className="px-1 text-sm font-bold text-leaf-600">Answer: {res.answer}</span>
              ) : null}
            </span>
          );
        })}
      </p>

      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-navy-500">Word bank</p>
        <div className="flex flex-wrap gap-2">
          {wordBank.map((word) => {
            const used = usedWords.includes(word);
            return (
              <button
                key={word}
                type="button"
                disabled={locked || used}
                aria-label={`${word}${used ? ", already used" : ""}`}
                onClick={() => onWordClick(word)}
                className={cn(
                  "rounded-2xl border-2 px-4 py-2.5 text-base font-bold transition",
                  used
                    ? "border-border bg-cream text-inkMuted/60"
                    : "border-navy-200 bg-navy-50 text-navy-700 hover:border-navy-400",
                  "disabled:cursor-not-allowed"
                )}
              >
                {word}
                {used ? <Check className="ml-2 inline h-3.5 w-3.5" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}