import React from "react";
import Link from "next/link";
import { ClipboardList, FileEdit, Layers, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProgressMeter from "@/components/common/ProgressMeter";
import { StatusPill } from "@/components/common/StateBlocks";
import SubjectArt from "@/components/common/SubjectArt";

/** A course as the teacher sees it: state, content counts and who is enrolled. */
export default function CourseSummaryCard({ entry, onAssign, onPreview }) {
  const { course, lessonCount, activityCount, draftCount, classes, studentCount, avgProgress } = entry;
  const published = course.status === "published";

  return (
    <article className="lg-card flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <SubjectArt artKey={course.art} className="h-24 w-full shrink-0 sm:w-32" imageClassName="p-1" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={published ? "leaf" : "sun"} icon={published ? undefined : FileEdit}>
              {published ? "Published" : "Draft"}
            </StatusPill>
            <span className="text-xs font-semibold text-inkMuted">
              {course.subject} · {course.ageBand}
            </span>
          </div>
          <h3 className="font-display text-xl font-bold leading-tight text-ink">{course.title}</h3>
          <p className="line-clamp-2 text-sm text-inkMuted">{course.summary}</p>
          <p className="flex flex-wrap items-center gap-3 text-xs font-semibold text-inkMuted">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              {lessonCount} lessons
            </span>
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              {activityCount} approved activities
            </span>
            {draftCount ? (
              <span className="inline-flex items-center gap-1 font-bold text-sun-600">
                <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                {draftCount} waiting for review
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {studentCount ? (
        <ProgressMeter
          value={avgProgress}
          label={`${studentCount} students across ${classes.length} ${classes.length === 1 ? "class" : "classes"}`}
          tone="navy"
          pattern="stripes"
          compact
        />
      ) : (
        <p className="rounded-2xl bg-cream px-3 py-2.5 text-sm text-inkMuted">
          Not assigned to a class yet. Assign it so students can open it.
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <Button asChild className="gap-2">
          <Link href={`/teacher/courses/${course.id}/edit`}>Edit course</Link>
        </Button>
        <Button variant="outline" onClick={() => onPreview(course)}>
          Preview
        </Button>
        <Button variant="outline" onClick={() => onAssign(entry)}>
          Assign
        </Button>
      </div>
    </article>
  );
}