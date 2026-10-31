import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Circle, LifeBuoy } from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/common/PageHeader";
import ProgressMeter from "@/components/common/ProgressMeter";
import SubjectArt from "@/components/common/SubjectArt";
import { EmptyState, ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";
import { cn } from "@/lib/utils";

const LESSON_STATE = {
  complete: { label: "Done", className: "bg-leaf-100 text-leaf-600" },
  current: { label: "In progress", className: "bg-navy-600 text-white" },
  upcoming: { label: "Not started", className: "bg-cream text-inkMuted" },
};

export default function TeacherStudentPage() {
  const { classId, studentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getClassStudent(classId, studentId));
    } catch (e) {
      setError(e.message || "We could not open that learner.");
    } finally {
      setLoading(false);
    }
  }, [classId, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Opening the learner’s progress" rows={2} />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!data) return null;

  const { student, kelas, courses, help, avgProgress } = data;

  return (
    <div className="space-y-7">
      <Link
        href={`/teacher/classes/${kelas.id}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-navy-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {kelas.name} · {kelas.nickname}
      </Link>

      <PageHeader
        eyebrow={`${kelas.grade} · last active ${student.lastActive}`}
        title={student.name}
        description="Course progress, lesson by lesson, with every finished activity and score."
        actions={<StatusPill tone={avgProgress >= 0.8 ? "leaf" : avgProgress >= 0.5 ? "sun" : "coral"}>
          {Math.round(avgProgress * 100)}% overall
        </StatusPill>}
      />

      {help ? (
        <p className="flex items-start gap-2 rounded-3xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
          <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Flagged for help: {help}
        </p>
      ) : null}

      {courses.length ? (
        <div className="space-y-5">
          {courses.map((entry) => (
            <section key={entry.course.id} className="lg-card space-y-5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <SubjectArt artKey={entry.course.art} className="h-24 w-full sm:w-32" imageClassName="p-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="navy">{entry.course.subject}</StatusPill>
                    <h3 className="font-display text-xl font-bold text-ink">{entry.course.title}</h3>
                  </div>
                  <ProgressMeter
                    value={entry.progress}
                    label={`${entry.completedLessons} of ${entry.totalLessons} lessons · ${entry.completedActivities} of ${entry.totalActivities} activities`}
                    tone="navy"
                    pattern="dots"
                    compact
                  />
                </div>
                <Link
                  href={`/teacher/courses/${entry.course.id}/edit`}
                  className="text-sm font-bold text-navy-600 hover:underline"
                >
                  Open course
                </Link>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">Lessons</p>
                  <ul className="space-y-2">
                    {entry.lessons.map((lesson) => {
                      const meta = LESSON_STATE[lesson.state] || LESSON_STATE.upcoming;
                      return (
                        <li key={lesson.id} className="flex items-center gap-3 rounded-2xl bg-paper px-3.5 py-2.5">
                          <span
                            className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", meta.className)}
                            aria-hidden="true"
                          >
                            {lesson.state === "complete" ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                          </span>
                          <span className="flex-1 text-sm font-semibold text-ink">{lesson.title}</span>
                          <span className="text-xs font-bold uppercase tracking-wide text-inkMuted">{meta.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">Activities</p>
                  <ul className="space-y-2">
                    {entry.activities.map((activity) => (
                      <li key={activity.id} className="flex items-center gap-3 rounded-2xl bg-paper px-3.5 py-2.5">
                        <span className="flex-1 text-sm font-semibold text-ink">{activity.title}</span>
                        {activity.attempt ? (
                          <StatusPill
                            tone={
                              activity.attempt.score / activity.attempt.total >= 0.8
                                ? "leaf"
                                : activity.attempt.score / activity.attempt.total >= 0.5
                                ? "sun"
                                : "coral"
                            }
                          >
                            {activity.attempt.score}/{activity.attempt.total} · {activity.attempt.completedAt}
                          </StatusPill>
                        ) : (
                          <StatusPill tone="plain">Not started</StatusPill>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No courses assigned to this class yet"
          description="Assign a course to the class and this learner’s progress will appear here."
        />
      )}
    </div>
  );
}