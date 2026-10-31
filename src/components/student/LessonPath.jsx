import React from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const MARKER = {
  complete: (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-400 text-white" aria-hidden="true">
      <Check className="h-4 w-4" />
    </span>
  ),
  current: (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full bg-sun-400 text-navy-800 ring-4 ring-sun-100"
      aria-hidden="true"
    >
      <Circle className="h-3 w-3 fill-current" />
    </span>
  ),
  upcoming: (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-border bg-cream text-inkMuted"
      aria-hidden="true"
    >
      <Circle className="h-3 w-3" />
    </span>
  ),
};

const LABEL = {
  complete: { text: "Done", className: "text-leaf-600" },
  current: { text: "You are here", className: "text-navy-700" },
  upcoming: { text: "Later", className: "text-inkMuted" },
};

/** The lesson path: completed, current and upcoming lessons are easy to tell apart. */
export default function LessonPath({ chapters, resumeLessonId }) {
  return (
    <div className="space-y-8">
      {chapters.map((chapter) => (
        <section key={chapter.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg font-bold text-ink">{chapter.title}</h3>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
          <ol className="space-y-3">
            {chapter.lessons.map((lesson) => {
              const state = lesson.state || "upcoming";
              const label = LABEL[state];
              return (
                <li key={lesson.id}>
                  <div
                    className={cn(
                      "flex flex-col gap-3 rounded-3xl border-2 bg-card p-4 transition sm:flex-row sm:items-center",
                      state === "current" ? "border-navy-600 shadow-paper" : "border-border",
                      state === "upcoming" ? "bg-card/70" : ""
                    )}
                  >
                    {MARKER[state]}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-base font-bold text-ink">{lesson.title}</p>
                        <span className={cn("text-xs font-bold uppercase tracking-wide", label.className)}>
                          {label.text}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-inkMuted">
                        {lesson.minutes} min
                        {lesson.activities?.length
                          ? ` · ${lesson.activities.length} ${lesson.activities.length > 1 ? "activities" : "activity"}`
                          : " · reading only"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {state !== "upcoming" ? (
                        <Link
                          href={`/student/lesson/${lesson.id}`}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition",
                            state === "current"
                              ? "bg-navy-600 text-white hover:bg-navy-700"
                              : "border border-border text-ink hover:bg-cream"
                          )}
                        >
                          {state === "current" ? (lesson.id === resumeLessonId ? "Resume" : "Open") : "Revisit"}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="rounded-full border border-border px-4 py-2 text-sm font-bold text-inkMuted">
                          Later
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}