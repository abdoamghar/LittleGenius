import React from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SubjectArt from "@/components/common/SubjectArt";
import { StatusPill } from "@/components/common/StateBlocks";

/** The student-facing view of a course, so a teacher can check it before publishing. */
export default function CoursePreviewDialog({ course, open, onOpenChange }) {
  if (!course) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: what students will see</DialogTitle>
          <DialogDescription>
            Sample learner view. Nothing here is saved by previewing.
          </DialogDescription>
        </DialogHeader>

        <section className="lg-card grid gap-5 p-5 sm:grid-cols-[1fr_10rem] sm:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={course.status === "published" ? "leaf" : "sun"}>
                {course.status === "published" ? "Published" : "Draft"}
              </StatusPill>
              <span className="text-xs font-semibold text-inkMuted">
                {course.subject} · {course.ageBand}
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold text-ink">{course.title}</h3>
            <p className="text-sm leading-relaxed text-inkMuted">{course.summary || "No description yet."}</p>
            {course.outcomes?.length ? (
              <ul className="space-y-1.5">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2 text-sm font-semibold text-ink">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-500" aria-hidden="true" />
                    {outcome}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <SubjectArt artKey={course.art} className="h-32 w-full" imageClassName="p-1" />
        </section>

        <div className="space-y-4">
          {(course.chapters || []).map((chapter) => (
            <section key={chapter.id} className="rounded-3xl border border-border bg-paper p-4">
              <h4 className="font-display text-base font-bold text-ink">{chapter.title}</h4>
              <ul className="mt-2 space-y-2">
                {chapter.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-card px-3.5 py-2.5">
                    <span className="flex-1 font-semibold text-ink">{lesson.title}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-inkMuted">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {lesson.minutes} min
                    </span>
                    <span className="text-xs font-semibold text-inkMuted">
                      {lesson.activities?.length
                        ? `${lesson.activities.length} ${lesson.activities.length > 1 ? "activities" : "activity"}`
                        : "reading only"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}