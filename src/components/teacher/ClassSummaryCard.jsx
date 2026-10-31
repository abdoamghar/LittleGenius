import React from "react";
import Link from "next/link";
import { ArrowRight, DoorOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProgressMeter from "@/components/common/ProgressMeter";
import { StatusPill } from "@/components/common/StateBlocks";

/** One class at a glance: who is in it, how far along, who needs help. */
export default function ClassSummaryCard({ entry }) {
  const { kelas, studentCount, courseCount, avgProgress, needingHelp } = entry;
  return (
    <article className="lg-card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-bold text-ink">
            {kelas.name}{kelas.nickname ? <span className="text-inkMuted"> · {kelas.nickname}</span> : null}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-inkMuted">
            <span>{kelas.grade}</span>
            {kelas.room ? <span className="inline-flex items-center gap-1">
              <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {kelas.room}
            </span> : null}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {studentCount} {studentCount === 1 ? "student" : "students"}
            </span>
          </p>
        </div>
        {needingHelp ? (
          <StatusPill tone="coral" className="shrink-0 whitespace-nowrap">{needingHelp} need help</StatusPill>
        ) : studentCount ? (
          <StatusPill tone="leaf" className="shrink-0 whitespace-nowrap">On track</StatusPill>
        ) : (
          <StatusPill tone="plain" className="shrink-0 whitespace-nowrap">New class</StatusPill>
        )}
      </div>

      {studentCount ? (
        <ProgressMeter
          value={avgProgress}
          label={`${courseCount} ${courseCount === 1 ? "course" : "courses"} assigned`}
          tone="navy"
          pattern="stripes"
          compact
        />
      ) : (
        <p className="rounded-2xl bg-cream px-3 py-2.5 text-sm text-inkMuted">
          No students yet. Invite learners to this class to start assigning courses.
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <Button asChild className="gap-2">
          <Link href={`/teacher/classes/${kelas.id}`}>
            Open class
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/teacher/progress?class=${kelas.id}`}>Progress</Link>
        </Button>
      </div>
    </article>
  );
}
