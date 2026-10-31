import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, BookOpenText, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useCurrentStudentId } from "@/lib/useCurrentStudentId";
import ProgressMeter from "@/components/common/ProgressMeter";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import GuidanceNote from "@/components/student/GuidanceNote";
import SubjectArt from "@/components/common/SubjectArt";
import { cn } from "@/lib/utils";

const TYPE_LABEL = { quiz: "Multiple choice quiz", match: "Matching exercise", fill: "Fill in the blanks" };

export default function StudentResultPage() {
  const { activityId } = useParams();
  const studentId = useCurrentStudentId();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getAttempt(activityId, studentId));
    } catch (e) {
      setError(e.message || "We could not open your result.");
    } finally {
      setLoading(false);
    }
  }, [activityId, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Getting your result" rows={1} />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!data) return null;

  const { attempt, activity, course, courseProgress, nextLessonId, nextActivity, studentName } = data;

  if (!attempt) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="Nothing to show here yet"
          description="You have not finished this activity, so there is no score yet. It only takes a few minutes."
          action={
            <Button asChild className="gap-2">
              <Link href={`/student/activity/${activity.id}`}>
                Start the activity
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/student">
            <BookOpenText className="h-4 w-4" aria-hidden="true" />
            Back to today
          </Link>
        </Button>
      </div>
    );
  }

  const pct = attempt.total ? attempt.score / attempt.total : 0;
  const perfect = attempt.score === attempt.total;
  const answerDetails = Array.isArray(attempt.perItem) ? attempt.perItem : [];
  const firstName = (studentName || "there").split(" ")[0];
  const ringLength = 2 * Math.PI * 52;

  return (
    <div className="space-y-7">
      <section className="lg-card grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-7">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy-500">
            {perfect ? "Activity complete" : "Activity finished"}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
            {perfect ? `Brilliant work, ${firstName}!` : `Well done for finishing, ${firstName}.`}
          </h1>
          <p className="text-base text-inkMuted">
            {activity.title} · {TYPE_LABEL[activity.type] || "Activity"}
          </p>
          <p className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-ink">
            {perfect
              ? "Every answer was right. Your teacher can see this result."
              : `You got ${attempt.score} of ${attempt.total}. Read the notes below — checking again is how the idea sticks.`}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {nextActivity ? (
              <Button asChild className="gap-2">
                <Link href={`/student/activity/${nextActivity.id}`}>
                  Next activity: {nextActivity.title}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : nextLessonId ? (
              <Button asChild className="gap-2">
                <Link href={`/student/lesson/${nextLessonId}`}>
                  Next lesson
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/student/course/${activity.courseId}`}>
                <BookOpenText className="h-4 w-4" aria-hidden="true" />
                Back to the course
              </Link>
            </Button>
            <Button asChild variant="ghost" className="gap-2">
              <Link href={`/student/activity/${activity.id}`}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try it again
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative h-36 w-36">
            <svg viewBox="0 0 120 120" className="h-36 w-36" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={perfect ? "hsl(141 22% 51%)" : "hsl(215 68% 33%)"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${ringLength * pct} ${ringLength}`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold text-ink">
                {attempt.score}/{attempt.total}
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-inkMuted">correct</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold text-ink">How each answer went</h2>
        {answerDetails.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {answerDetails.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "lg-card space-y-1.5 border-2 p-4",
                  item.correct ? "border-leaf-200" : "border-sun-200"
                )}
              >
                <p className="flex items-start gap-2 font-bold text-ink">
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      item.correct ? "bg-leaf-100 text-leaf-600" : "bg-sun-100 text-sun-600"
                    )}
                    aria-hidden="true"
                  >
                    {item.correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </span>
                  {item.prompt}
                </p>
                <p className="text-sm text-inkMuted">
                  {item.correct ? (
                    <>You chose: <span className="font-bold text-ink">{item.given}</span></>
                  ) : (
                    <>
                      You chose: <span className="font-bold text-ink">{item.given || "nothing yet"}</span> · Correct:{" "}
                      <span className="font-bold text-leaf-600">{item.answer}</span>
                    </>
                  )}
                </p>
                <p className="text-sm text-inkMuted">{item.explanation}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-inkMuted">
            This sample score was preloaded, so individual answer details are not available for it.
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="lg-card space-y-4 p-5">
          <div className="flex items-center gap-3">
            <SubjectArt artKey={course?.art} className="h-20 w-20" imageClassName="p-1" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy-500">Progress in this course</p>
              <h2 className="font-display text-xl font-bold text-ink">{course?.title}</h2>
            </div>
          </div>
          {courseProgress ? (
            <>
              <ProgressMeter
                value={courseProgress.progress}
                label={`${courseProgress.completedActivities} of ${courseProgress.totalActivities} activities`}
                tone="navy"
                pattern="dots"
              />
              <ProgressMeter
                value={courseProgress.totalLessons ? courseProgress.completedLessons / courseProgress.totalLessons : 0}
                label={`${courseProgress.completedLessons} of ${courseProgress.totalLessons} lessons`}
                tone="leaf"
                pattern="stripes"
              />
              <Button asChild variant="outline" className="gap-2">
                <Link href="/student/progress">
                  See all of my progress
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </>
          ) : null}
        </div>

        <GuidanceNote
          mood={perfect ? "celebrate" : "think"}
          message={
            perfect
              ? "A perfect score. You could carry on to the next lesson, or help a classmate with this one."
              : "Mistakes are the best clues. Read the ideas above once more, then try the next activity."
          }
        />
      </section>
    </div>
  );
}
