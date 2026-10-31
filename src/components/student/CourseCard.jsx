import React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubjectArt from "@/components/common/SubjectArt";
import ProgressMeter from "@/components/common/ProgressMeter";
import { StatusPill } from "@/components/common/StateBlocks";

const TONE_BY_SUBJECT = { Science: "leaf", Maths: "plum", Reading: "sky" };
const BAR_TONE = { Science: "leaf", Maths: "plum", Reading: "sun" };
const PATTERN = { Science: "dots", Maths: "stripes", Reading: "none" };

/** A learner's course card: what it is, how far they are, and what comes next. */
export default function CourseCard({ entry }) {
  const { course, progress, completedActivities, totalActivities, nextLesson, nextActivity } = entry;
  return (
    <article className="lg-card flex flex-col gap-4 p-4 transition hover:shadow-lift md:flex-row md:p-5">
      <SubjectArt
        artKey={course.art}
        className="h-40 w-full shrink-0 md:h-32 md:w-40"
        imageClassName="p-2"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={TONE_BY_SUBJECT[course.subject] || "plain"}>{course.subject}</StatusPill>
          <span className="text-xs font-semibold text-inkMuted">{course.ageBand}</span>
        </div>
        <div>
          <h3 className="font-display text-xl font-bold leading-tight text-ink">{course.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-inkMuted">{course.summary}</p>
        </div>
        <ProgressMeter
          value={progress}
          label={`${completedActivities} of ${totalActivities} activities done`}
          tone={BAR_TONE[course.subject] || "navy"}
          pattern={PATTERN[course.subject] || "none"}
          compact
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="gap-2">
            <Link href={`/student/course/${course.id}`}>
              {progress > 0 ? "Continue course" : "Start course"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          {nextLesson ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-inkMuted">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Next: {nextActivity ? nextActivity.title : nextLesson.title}
            </p>
          ) : (
            <p className="text-sm font-bold text-leaf-600">Course finished</p>
          )}
        </div>
      </div>
    </article>
  );
}