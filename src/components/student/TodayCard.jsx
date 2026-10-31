import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubjectArt from "@/components/common/SubjectArt";
import { StatusPill } from "@/components/common/StateBlocks";

const TYPE_LABEL = { quiz: "Multiple choice", match: "Matching", fill: "Fill in the blanks" };

/** Today's assigned work, with one obvious way to carry on. */
export default function TodayCard({ today }) {
  if (!today) {
    return (
      <section className="lg-card flex flex-col gap-3 p-6">
        <StatusPill tone="leaf">All clear</StatusPill>
        <h2 className="font-display text-2xl font-bold text-ink">Nothing due today</h2>
        <p className="text-sm text-inkMuted">
          You have finished everything your teacher assigned. Open a course to read ahead.
        </p>
        <div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/student/courses">
              <BookOpenText className="h-4 w-4" aria-hidden="true" />
              Browse my courses
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const { course, nextLesson, nextActivity } = today;
  const target = nextActivity
    ? `/student/activity/${nextActivity.id}`
    : nextLesson
    ? `/student/lesson/${nextLesson.id}`
    : `/student/course/${course.id}`;
  const actionLabel = nextActivity ? "Continue learning" : "Open the lesson";

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-navy-600 bg-navy-600 p-5 text-white shadow-lift md:p-7">
      <div className="relative z-10 grid gap-6 md:grid-cols-[1.4fr_auto] md:items-center">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Today’s work
            </span>
            <span className="text-xs font-semibold text-white/70">{course.subject}</span>
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold leading-tight md:text-3xl">{course.title}</h2>
            <p className="text-base font-semibold text-white/85">
              {nextLesson ? nextLesson.title : "Course complete"}
            </p>
          </div>

          {nextActivity ? (
            <div className="inline-flex flex-wrap items-center gap-3 rounded-2xl bg-white/12 px-4 py-3">
              <span className="rounded-full bg-sun-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-navy-800">
                {TYPE_LABEL[nextActivity.type] || "Activity"}
              </span>
              <span className="text-sm font-semibold text-white">{nextActivity.title}</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                about 5 minutes
              </span>
            </div>
          ) : (
            <p className="text-sm text-white/80">
              Your teacher has assigned this lesson. Read it, then check anything to practise.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button asChild size="lg" className="gap-2 bg-sun-400 text-navy-800 hover:bg-sun-300">
              <Link href={target}>
                {actionLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            {nextLesson ? (
              <Link
                href={`/student/lesson/${nextLesson.id}`}
                className="rounded-full border border-white/40 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Read the lesson first
              </Link>
            ) : null}
          </div>
        </div>

        <SubjectArt
          artKey={course.art}
          className="h-40 w-full md:h-44 md:w-56"
          tone="bg-white/12"
          imageClassName="p-2"
        />
      </div>
    </section>
  );
}