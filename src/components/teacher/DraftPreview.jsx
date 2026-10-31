import React from "react";
import { Check, Eye, X } from "lucide-react";
import { StatusPill } from "@/components/common/StateBlocks";

const LETTERS = ["A", "B", "C", "D", "E"];

/** What students will see, with the answer key kept separate at the bottom. */
export default function DraftPreview({ activity }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sun-200 bg-sun-50 px-4 py-3 text-sm font-semibold text-ink">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-4 w-4 text-sun-600" aria-hidden="true" />
          Preview only — this is how the activity looks to a student once approved.
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-xl font-bold text-ink">{activity.title}</h3>
        <p className="text-sm text-inkMuted">{activity.instructions}</p>
      </div>

      {activity.type === "quiz"
        ? activity.questions.map((question, index) => (
            <fieldset key={question.id} className="rounded-3xl border border-border bg-paper p-4">
              <legend className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-navy-500">
                Question {index + 1}
              </legend>
              <p className="mt-2 font-bold text-ink">{question.prompt}</p>
              <ul className="mt-3 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <li
                    key={optionIndex}
                    className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-3.5 py-2.5 text-base text-ink"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl border-2 border-border text-xs font-bold text-inkMuted">
                      {LETTERS[optionIndex]}
                    </span>
                    {option}
                  </li>
                ))}
              </ul>
            </fieldset>
          ))
        : null}

      {activity.type === "match" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">Words</p>
            {activity.pairs.map((pair) => (
              <p key={pair.id} className="rounded-2xl border-2 border-border bg-card px-4 py-2.5 font-bold text-ink">
                {pair.left}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">What it means</p>
            {activity.pairs.map((pair) => (
              <p key={pair.id} className="rounded-2xl border-2 border-border bg-card px-4 py-2.5 text-ink">
                {pair.right}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {activity.type === "fill" ? (
        <div className="space-y-3">
          <p className="rounded-3xl border border-border bg-paper p-4 text-lg leading-loose text-ink">
            {activity.parts.map((part, index) =>
              part.blankId ? (
                <span
                  key={index}
                  className="mx-1 inline-flex min-w-[6rem] items-center justify-center rounded-xl border-2 border-dashed border-navy-300 bg-cream px-3 py-1 font-bold text-inkMuted"
                >
                  gap
                </span>
              ) : (
                <span key={index}>{part.text}</span>
              )
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {activity.wordBank.map((word) => (
              <span key={word} className="rounded-2xl border-2 border-navy-200 bg-navy-50 px-4 py-2 font-bold text-navy-700">
                {word}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl bg-cream p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-inkMuted">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Answer key (teachers only)
        </p>
        {activity.type === "quiz" ? (
          <ul className="space-y-1.5 text-sm text-ink">
            {activity.questions.map((question, index) => (
              <li key={question.id}>
                <span className="font-bold">Q{index + 1}: </span>
                {question.options[question.correctIndex]} — {question.explanation}
              </li>
            ))}
          </ul>
        ) : null}
        {activity.type === "match" ? (
          <ul className="space-y-1.5 text-sm text-ink">
            {activity.pairs.map((pair) => (
              <li key={pair.id}>
                <span className="font-bold">{pair.left}</span> → {pair.right}
              </li>
            ))}
          </ul>
        ) : null}
        {activity.type === "fill" ? (
          <ul className="space-y-1.5 text-sm text-ink">
            {activity.parts
              .filter((p) => p.blankId)
              .map((part) => (
                <li key={part.blankId}>
                  <span className="font-bold">{part.blankId}: </span>
                  {part.answer}
                </li>
              ))}
          </ul>
        ) : null}
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-inkMuted">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Students only see this after they check their own answers.
        </p>
      </div>

      <StatusPill tone="sun">{activity.status === "approved" ? "Approved" : "Draft · not visible to students"}</StatusPill>
    </div>
  );
}