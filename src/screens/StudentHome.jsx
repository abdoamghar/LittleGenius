import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenText, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { api } from "@/lib/api";
import { useCurrentStudentId } from "@/lib/useCurrentStudentId";
import PageHeader from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import TodayCard from "@/components/student/TodayCard";
import CourseCard from "@/components/student/CourseCard";
import GuidanceNote from "@/components/student/GuidanceNote";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function StudentHome() {
  const studentId = useCurrentStudentId();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getStudentHome(studentId));
    } catch (e) {
      setError(e.message || "We could not load your work today.");
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
        <PageHeader eyebrow="Today" title="Getting your work ready…" />
        <LoadingState label="Opening your courses" rows={2} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader eyebrow="Today" title="Welcome back" />
        <ErrorState description={error} onRetry={load} />
      </>
    );
  }

  if (!data) return null;

  const { student, className, courses, today, totals, teacherName } = data;
  const firstName = student.name.split(" ")[0];
  const remaining = totals.totalActivities - totals.completedActivities;

  return (
    <div className="space-y-8">
      <section className="lg-student-welcome flex flex-col gap-4 overflow-hidden rounded-3xl p-5 sm:p-6 md:flex-row md:items-center md:gap-6 md:p-7">
        <div className="min-w-0 flex-1">
          <p className="lg-page-kicker mb-3 uppercase">{className}</p>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
            {greeting()}, {firstName}!
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-inkMuted">
            Here is what your teacher, {teacherName}, has set for you. {remaining > 0 ? `${remaining} activities to go.` : "You are all caught up."}
          </p>
          <Button asChild variant="outline" className="mt-4 gap-2">
            <Link href="/student/progress">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              See my progress
            </Link>
          </Button>
        </div>
        <Image
          src="/learning-art/student-corner.webp"
          alt="Pip the fox exploring a growing plant."
          fittingType="fit"
          className="hidden h-40 w-40 shrink-0 object-contain md:block lg:h-48 lg:w-48"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <TodayCard today={today} />
        <GuidanceNote
          mood={today?.nextActivity ? "read" : today ? "wave" : "celebrate"}
          message={
            today?.nextActivity
              ? `“${today.nextLesson?.title || today.course.title}” is next. Read the lesson, then the activity. I will be right here if the words get tricky.`
              : "You have finished everything assigned. Have a look ahead in one of your courses."
          }
          action={
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/student/courses">
                <BookOpenText className="h-4 w-4" aria-hidden="true" />
                My courses
              </Link>
            </Button>
          }
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-ink">Your courses</h2>
          <Link href="/student/courses" className="text-sm font-bold text-navy-600 hover:underline">
            See all
          </Link>
        </div>
        {courses.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {courses.map((entry) => (
              <CourseCard key={entry.course.id} entry={entry} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No courses yet"
            description="When your teacher assigns a course, it will appear right here."
          />
        )}
      </section>

      <section className="lg-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sun-100 text-sun-600">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-lg font-bold text-ink">This week’s tally</p>
            <p className="text-sm text-inkMuted">
              {totals.completedActivities} of {totals.totalActivities} activities finished across{" "}
              {courses.length} {courses.length === 1 ? "course" : "courses"}.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/student/progress">Open my progress</Link>
        </Button>
      </section>
    </div>
  );
}
