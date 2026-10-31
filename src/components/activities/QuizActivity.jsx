import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E"];

/** One multiple-choice question with selected, correct, incorrect and locked states. */
export default function QuizActivity({ question, index, total, selected, onSelect, result, locked }) {
  return (
    <fieldset className="space-y-4 border-0 p-0" disabled={locked}>
      <legend className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-navy-500">
        Question {index + 1} of {total}
      </legend>
      <p className="font-display text-xl font-bold leading-snug text-ink md:text-2xl">{question.prompt}</p>
      <div role="group" aria-label={question.prompt} className="grid gap-2.5">
        {question.options.map((option, i) => {
          const isSelected = selected === i;
          const isAnswer = Boolean(result) && result.answer === option;
          const isMissed = Boolean(result) && isSelected && !isAnswer;
          return (
            <button
              key={option + i}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(i)}
              disabled={locked}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3.5 text-left text-base font-semibold text-ink transition",
                "hover:border-navy-300 hover:bg-navy-50/60 disabled:cursor-not-allowed",
                isSelected && !result && "border-navy-600 bg-navy-50 shadow-paper",
                isAnswer && "border-leaf-500 bg-leaf-50",
                isMissed && "border-coral-400 bg-coral-50",
                !isSelected && !result && "border-border",
                result && !isAnswer && !isSelected && "border-border opacity-70"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-bold",
                  isAnswer
                    ? "border-leaf-500 bg-leaf-100 text-leaf-600"
                    : isMissed
                    ? "border-coral-400 bg-coral-100 text-coral-600"
                    : isSelected
                    ? "border-navy-600 bg-navy-600 text-white"
                    : "border-border bg-cream text-inkMuted"
                )}
              >
                {LETTERS[i]}
              </span>
              <span className="flex-1">{option}</span>
              {isAnswer ? (
                <span className="flex items-center gap-1 text-xs font-bold uppercase text-leaf-600">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Correct
                </span>
              ) : null}
              {isMissed ? (
                <span className="flex items-center gap-1 text-xs font-bold uppercase text-coral-600">
                  <X className="h-4 w-4" aria-hidden="true" />
                  Not quite
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {result ? `Checked. Correct answer: ${result.answer}.` : isSelectedHelper(selected)}
      </p>
    </fieldset>
  );
}

function isSelectedHelper(selected) {
  return typeof selected === "number" ? "An answer is selected." : "No answer selected yet.";
}