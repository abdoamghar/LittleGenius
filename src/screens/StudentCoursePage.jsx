import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, PlayCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useCurrentStudentId } from "@/lib/useCurrentStudentId";
import SubjectArt from "@/components/common/SubjectArt";
import ProgressMeter from "@/components/common/ProgressMeter";
import { ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";
import LessonPath from "@/components/student/LessonPath";

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const studentId = useCurrentStudentId();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getCourseForStudent(courseId, studentId));
    } catch (e) {
      setError(e.message || "We could not open this course.");
    } finally {
      setLoading(false);
    }
  }, [courseId, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const chapters = useMemo(() => {
    if (!data) return [];
    const stateById = new Map(data.lessons.map((l) => [l.id, l]));
    return data.course.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => ({ ...lesson, ...(stateById.get(lesson.id) || {}) })),
    }));
  }, [data]);

  if (loading) {
    return <LoadingState label="Opening your course" rows={2} />;
  }
  if (error) {
    return <ErrorState description={error} onRetry={load} />;
  }
  if (!data) return null;

  const { course, progress, completedActivities, totalActivities, completedLessons, totalLessons } = data;

  return (
    <div className="space-y-8">
      <Link href="/student/courses" className="inline-flex items-center gap-2 text-sm font-bold text-navy-600 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        My courses
      </Link>

      <section className="lg-card grid gap-6 p-5 md:grid-cols-[1fr_18rem] md:p-7">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="navy">{course.subject}</StatusPill>
            <span className="text-xs font-semibold text-inkMuted">{course.ageBand}</span>
            <span className="text-xs font-semibold text-inkMuted">Teacher: {course.teacherName}</span>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">{course.title}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-inkMuted">{course.summary}</p>

          <div className="rounded-3xl border border-border bg-paper p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-navy-500">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              What you will learn
            </p>
            <ul className="grid gap-1.5">
              {course.outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-2 text-sm font-semibold text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-500" aria-hidden="true" />
                  {outcome}
                </li>
              ))}
            </ul>
          </div>

          <ProgressMeter
            value={progress}
            label={`${completedLessons} of ${totalLessons} lessons · ${completedActivities} of ${totalActivities} activities`}
            tone="navy"
            pattern="dots"
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {data.resumeLessonId ? (
              <Button asChild size="lg" className="gap-2">
                <Link href={`/student/lesson/${data.resumeLessonId}`}>
                  <PlayCircle className="h-5 w-5" aria-hidden="true" />
                  {progress > 0 ? "Resume where I stopped" : "Start the first lesson"}
                </Link>
              </Button>
            ) : null}
            {data.nextActivity ? (
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href={`/student/activity/${data.nextActivity.id}`}>Go to the activity</Link>
              </Button>
            ) : null}
          </div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-inkMuted">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {data.nextLesson ? `Next up: ${data.nextLesson.title}` : "Every lesson in this course is finished."}
          </p>
        </div>

        <SubjectArt artKey={course.art} className="h-52 w-full md:h-full" imageClassName="p-2" />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-ink">Lessons in this course</h2>
        <LessonPath chapters={chapters} resumeLessonId={data.resumeLessonId} />
      </section>
    </div>
  );
}
