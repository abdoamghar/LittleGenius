import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, CheckCircle2, Clock, Lightbulb, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useCurrentStudentId } from "@/lib/useCurrentStudentId";
import SubjectArt from "@/components/common/SubjectArt";
import { ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";
import LessonDiagram from "@/components/student/LessonDiagram";
import { cn } from "@/lib/utils";

const TYPE_LABEL = { quiz: "Multiple choice quiz", match: "Matching exercise", fill: "Fill in the blanks" };
const PATH_LABEL = { complete: "Done", current: "Here", upcoming: "Later" };
const PATH_TONE = {
  complete: "bg-leaf-100 text-leaf-600 border-leaf-200",
  current: "bg-navy-600 text-white border-navy-600",
  upcoming: "bg-cream text-inkMuted border-border",
};

export default function StudentLessonPage() {
  const { lessonId } = useParams();
  const studentId = useCurrentStudentId();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getLessonForStudent(lessonId, studentId));
    } catch (e) {
      setError(e.message || "We could not open this lesson.");
    } finally {
      setLoading(false);
    }
  }, [lessonId, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Opening your lesson" rows={2} />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!data) return null;

  const { lesson, course, chapterTitle, position, prevLessonId, nextLessonId, activity, attempt, path } = data;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/student/course/${course.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-navy-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {course.title}
        </Link>
        <p className="text-sm font-bold text-inkMuted">
          Lesson {position.index} of {position.total} · {chapterTitle}
        </p>
      </div>

      {/* keep the student's place in the course visible */}
      <ol className="hidden flex-wrap items-center gap-2 md:flex" aria-label="Your place in this course">
        {path.map((step) => (
          <li key={step.id}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
                PATH_TONE[step.state]
              )}
            >
              {step.state === "complete" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {PATH_LABEL[step.state]}: {step.title}
            </span>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <article className="space-y-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="navy">{course.subject}</StatusPill>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-inkMuted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {lesson.minutes} minute read
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">{lesson.title}</h1>
            <p className="text-lg font-semibold text-inkMuted">{lesson.summary}</p>
          </header>

          <div className="space-y-4 text-lg leading-relaxed text-ink">
            <p className="font-semibold">{lesson.intro}</p>
            {lesson.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {lesson.examples?.length ? (
            <section className="rounded-3xl border-2 border-dashed border-navy-200 bg-navy-50/60 p-5">
              <h2 className="mb-3 font-display text-lg font-bold text-navy-800">For example</h2>
              <ul className="space-y-2">
                {lesson.examples.map((example) => (
                  <li key={example} className="flex items-start gap-2 text-base text-ink">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sun-400" aria-hidden="true" />
                    {example}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-3xl bg-sun-50 p-5">
            <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Lightbulb className="h-5 w-5 text-sun-600" aria-hidden="true" />
              The big idea
            </h2>
            <p className="text-base font-semibold text-ink">{lesson.keyIdea}</p>
          </section>

          {lesson.keyWords?.length ? (
            <section className="lg-card p-5">
              <h2 className="mb-3 font-display text-lg font-bold text-ink">Words to know</h2>
              <dl className="grid gap-2 sm:grid-cols-2">
                {lesson.keyWords.map((entry) => (
                  <div key={entry.word} className="rounded-2xl bg-paper px-3 py-2.5">
                    <dt className="text-sm font-bold text-navy-700">{entry.word}</dt>
                    <dd className="text-sm text-inkMuted">{entry.hint}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </article>

        <aside className="space-y-4">
          {lesson.diagram ? (
            <LessonDiagram diagram={lesson.diagram} />
          ) : (
            <figure className="lg-card overflow-hidden">
              <div className="bg-cream p-2">
                <SubjectArt artKey={lesson.art || course.art} className="h-56 w-full" imageClassName="p-2" />
              </div>
              <figcaption className="px-4 py-3 text-xs font-semibold text-inkMuted">
                Picture this while you read — it shows the idea in {lesson.title.toLowerCase()}.
              </figcaption>
            </figure>
          )}

          {activity ? (
            <section className="lg-card space-y-3 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy-500">
                {attempt ? "Activity finished" : "Practise what you read"}
              </p>
              <h2 className="font-display text-lg font-bold text-ink">{activity.title}</h2>
              <p className="text-sm text-inkMuted">{TYPE_LABEL[activity.type] || "Activity"} · about 5 minutes</p>
              {attempt ? (
                <>
                  <p className="rounded-2xl bg-leaf-50 px-3 py-2 text-sm font-bold text-leaf-600">
                    You scored {attempt.score} of {attempt.total}.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="gap-2">
                      <Link href={`/student/activity/${activity.id}/result`}>See my result</Link>
                    </Button>
                    <Button asChild variant="ghost" className="gap-2">
                      <Link href={`/student/activity/${activity.id}`}>Try it again</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <Button asChild size="lg" className="w-full gap-2">
                  <Link href={`/student/activity/${activity.id}`}>
                    <PlayCircle className="h-5 w-5" aria-hidden="true" />
                    Start the activity
                  </Link>
                </Button>
              )}
            </section>
          ) : (
            <section className="lg-card space-y-2 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy-500">No activity here</p>
              <p className="text-sm text-inkMuted">
                This lesson is reading only. Carry on to the next lesson when you are ready.
              </p>
            </section>
          )}

          <section className="lg-card space-y-3 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy-500">Keep going</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start gap-2"
                disabled={!prevLessonId}
                onClick={() => prevLessonId && router.push(`/student/lesson/${prevLessonId}`)}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Previous lesson
              </Button>
              <Button
                className="justify-start gap-2"
                disabled={!nextLessonId}
                onClick={() => nextLessonId && router.push(`/student/lesson/${nextLessonId}`)}
              >
                Next lesson
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button asChild variant="ghost" className="justify-start gap-2">
                <Link href={`/student/course/${course.id}`}>
                  <BookOpenText className="h-4 w-4" aria-hidden="true" />
                  Back to the course
                </Link>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
