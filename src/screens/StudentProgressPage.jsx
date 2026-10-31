import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleDashed, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { api } from "@/lib/api";
import { useCurrentStudentId } from "@/lib/useCurrentStudentId";
import PageHeader from "@/components/common/PageHeader";
import ProgressMeter from "@/components/common/ProgressMeter";
import { EmptyState, ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";
import SubjectArt from "@/components/common/SubjectArt";

const TYPE_LABEL = { quiz: "Quiz", match: "Matching", fill: "Fill in the blanks" };

export default function StudentProgressPage() {
  const studentId = useCurrentStudentId();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getStudentProgress(studentId));
    } catch (e) {
      setError(e.message || "We could not load your progress.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <>
        <PageHeader eyebrow="My progress" title="Working out where you are" />
        <LoadingState label="Counting your finished work" rows={2} />
      </>
    );
  }
  if (error) {
    return (
      <>
        <PageHeader eyebrow="My progress" title="My progress" />
        <ErrorState description={error} onRetry={load} />
      </>
    );
  }
  if (!data) return null;

  const { student, className, courses, totals } = data;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={className}
        title={`${student.name.split(" ")[0]}’s progress`}
        description="Everything you have finished, course by course. No points, no leaderboards — just your own learning."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Activities finished", value: `${totals.completed} of ${totals.total}`, art: "sparkle.webp" },
          { label: "Lessons completed", value: `${totals.lessonsDone} of ${totals.lessonsTotal}`, art: "sprout.webp" },
          { label: "Courses on the go", value: `${courses.length}`, art: "sun.webp" },
        ].map((stat) => (
          <div key={stat.label} className="lg-card flex items-center justify-between gap-3 p-5">
            <div>
              <p className="font-display text-3xl font-bold text-ink">{stat.value}</p>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-inkMuted">{stat.label}</p>
            </div>
            <Image
              src={`/learning-art/${stat.art}`}
              alt=""
              aria-hidden="true"
              fittingType="fit"
              className="h-12 w-12 shrink-0 object-contain"
            />
          </div>
        ))}
      </section>

      {courses.length ? (
        <div className="space-y-5">
          {courses.map((entry) => (
            <section key={entry.course.id} className="lg-card space-y-5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <SubjectArt artKey={entry.course.art} className="h-24 w-full sm:w-32" imageClassName="p-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="navy">{entry.course.subject}</StatusPill>
                    <span className="text-xs font-semibold text-inkMuted">{entry.course.title}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {entry.nextLesson ? `Next: ${entry.nextLesson.title}` : "Every lesson finished"}
                  </h2>
                  <ProgressMeter
                    value={entry.progress}
                    label={`${entry.completedActivities} of ${entry.totalActivities} activities`}
                    tone="navy"
                    pattern="dots"
                    compact
                  />
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button asChild className="gap-2">
                    <Link href={`/student/course/${entry.course.id}`}>
                      Open course
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  {entry.nextActivity ? (
                    <Button asChild variant="outline" className="gap-2">
                      <Link href={`/student/activity/${entry.nextActivity.id}`}>Next activity</Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              <ul className="grid gap-2 md:grid-cols-2">
                {entry.activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-paper px-3.5 py-3"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        activity.attempt ? "bg-leaf-100 text-leaf-600" : "bg-cream text-inkMuted"
                      }`}
                      aria-hidden="true"
                    >
                      {activity.attempt ? <Check className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{activity.title}</p>
                      <p className="text-xs font-semibold text-inkMuted">
                        {TYPE_LABEL[activity.type] || "Activity"}
                        {activity.attempt
                          ? ` · ${activity.attempt.score} of ${activity.attempt.total} · ${activity.attempt.completedAt}`
                          : " · not started"}
                      </p>
                    </div>
                    {activity.attempt ? (
                      <Link
                        href={`/student/activity/${activity.id}/result`}
                        className="shrink-0 text-xs font-bold text-navy-600 hover:underline"
                      >
                        Result
                      </Link>
                    ) : (
                      <Link
                        href={`/student/activity/${activity.id}`}
                        className="shrink-0 text-xs font-bold text-navy-600 hover:underline"
                      >
                        Start
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No progress to show yet"
          description="Once your teacher assigns a course, your finished activities will be listed here."
          action={
            <Button asChild variant="outline" className="gap-2">
              <Link href="/student">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Back to today
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
