import React from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { Image } from "@/components/ui/image";
import ProgressMeter from "@/components/common/ProgressMeter";
import { EmptyState } from "@/components/common/StateBlocks";

/** The students a teacher should look at first, with the reason stated in words. */
export default function NeedsHelpList({ items, emptyTitle = "Everyone is keeping up" }) {
  if (!items?.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description="No learners are flagged right now. Progress is recalculated as activities are finished."
        illustration={
          <Image
            src="/learning-art/pip-help.webp"
            alt="Pip the fox encouraging a student."
            fittingType="fit"
            className="h-full w-full object-contain p-1"
          />
        }
      />
    );
  }

  return (
    <ul className="grid gap-3">
      {items.map((row) => (
        <li key={row.student.id} className="lg-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-sm font-bold text-coral-600">
            {row.student.initials}
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-ink">{row.student.name}</p>
              <span className="text-xs font-semibold text-inkMuted">{row.className}</span>
            </div>
            <p className="flex items-start gap-1.5 text-sm font-semibold text-coral-600">
              <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {row.reason}
            </p>
            <ProgressMeter value={row.progress} label="Class completion" tone="coral" pattern="dots" compact />
          </div>
          <Link
            href={`/teacher/classes/${row.student.classId}/students/${row.student.id}`}
            className="shrink-0 text-sm font-bold text-navy-600 hover:underline"
          >
            Open learner
          </Link>
        </li>
      ))}
    </ul>
  );
}
