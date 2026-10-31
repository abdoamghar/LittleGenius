import React from "react";
import { Check, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Kind, specific feedback — a wrong answer is a next step, never a punishment. */
export default function FeedbackPanel({ result, onRetryStep }) {
  if (!result) return null;
  const perfect = result.score === result.total;
  const nothing = result.score === 0;

  const headline = perfect
    ? "That is exactly right."
    : nothing
    ? "Let’s look at these together."
    : `You got ${result.score} of ${result.total}. So close.`;

  const lead = perfect
    ? "You can move straight on to the next part."
    : "Read the ideas below — they will help with the next one.";

  return (
    <section
      aria-live="polite"
      className={cn(
        "animate-lg-rise rounded-3xl border-2 p-4 md:p-5",
        perfect ? "border-leaf-500 bg-leaf-50" : "border-sun-400 bg-sun-50"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
            perfect ? "bg-leaf-100 text-leaf-600" : "bg-sun-100 text-sun-600"
          )}
        >
          {perfect ? <Check className="h-5 w-5" aria-hidden="true" /> : <Lightbulb className="h-5 w-5" aria-hidden="true" />}
        </span>
        <div className="space-y-3">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">{headline}</h3>
            <p className="text-sm text-inkMuted">{lead}</p>
          </div>

          <ul className="space-y-2.5">
            {result.results?.map((item) => (
              <li key={item.itemId} className="rounded-2xl bg-white/70 px-3 py-2.5">
                <p className="text-sm font-bold text-ink">
                  {item.correct ? "Right" : "Not quite yet"} — {item.prompt || "missing word"}
                </p>
                {!item.correct ? (
                  <p className="mt-0.5 text-sm text-inkMuted">
                    Correct: <span className="font-bold text-ink">{item.answer}</span>
                  </p>
                ) : null}
                {item.explanation ? <p className="mt-0.5 text-sm text-inkMuted">{item.explanation}</p> : null}
              </li>
            ))}
            {!result.results ? (
              <li className="rounded-2xl bg-white/70 px-3 py-2.5">
                <p className="text-sm font-bold text-ink">
                  {result.correct ? "Right" : "Not quite yet"} — correct answer: {result.answer}
                </p>
                <p className="mt-0.5 text-sm text-inkMuted">{result.explanation}</p>
              </li>
            ) : null}
          </ul>

          {!perfect && onRetryStep ? (
            <button
              type="button"
              onClick={onRetryStep}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-700 underline decoration-2 underline-offset-4"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Try this part once more (your final score keeps your best check)
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}