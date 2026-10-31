import React from "react";
import { Image } from "@/components/ui/image";
import { artFor } from "@/lib/illustrations";

/** Lesson diagram: the artwork plus labelled steps, so labels stay editable text. */
export default function LessonDiagram({ diagram }) {
  if (!diagram) return null;
  const art = artFor(diagram.art);
  return (
    <figure className="lg-card overflow-hidden">
      <div className="bg-cream p-2">
        <Image
          src={art.url}
          alt={art.alt}
          fittingType="fit"
          className="h-56 w-full object-contain md:h-64"
        />
      </div>
      <figcaption className="space-y-3 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy-500">Step by step</p>
        <ol className="grid gap-2">
          {diagram.steps.map((step, index) => (
            <li key={step.label} className="flex items-start gap-3 rounded-2xl bg-paper px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-600 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span className="text-sm">
                <span className="font-bold text-ink">{step.label}. </span>
                <span className="text-inkMuted">{step.hint}</span>
              </span>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}