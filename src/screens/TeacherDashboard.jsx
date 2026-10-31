import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import { ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";
import ClassSummaryCard from "@/components/teacher/ClassSummaryCard";
import NeedsHelpList from "@/components/teacher/NeedsHelpList";

const EVENT_ICON = {
  complete: { label: "Completed", tone: "leaf" },
  help: { label: "Needs help", tone: "coral" },
  draft: { label: "Draft", tone: "plum" },
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getTeacherDashboard());
    } catch (e) {
      setError(e.message || "We could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <>
        <PageHeader eyebrow="Teacher workspace" title="Gathering today’s picture" />
        <LoadingState label="Reading classes and recent work" rows={2} />
      </>
    );
  }
  if (error) {
    return (
      <>
        <PageHeader eyebrow="Teacher workspace" title="Dashboard" />
        <ErrorState description={error} onRetry={load} />
      </>
    );
  }
  if (!data) return null;

  const { classes, events, needsHelp, counts, pendingDrafts, teacher } = data;
  const firstName = (user?.full_name || teacher.name).replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(" ")[0];

  return (
    <div className="space-y-8">
      <section className="lg-teacher-welcome flex flex-col gap-5 overflow-hidden rounded-3xl p-5 sm:p-6 md:flex-row md:items-center md:gap-6 md:p-7">
        <div className="min-w-0 flex-1">
          <p className="lg-page-kicker mb-3 uppercase">Teacher workspace</p>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-inkMuted">
            {counts.classes} classes · {counts.students} students · {counts.published} published courses. {counts.drafts ? `${counts.drafts} AI drafts are waiting for your review.` : "No drafts waiting."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/teacher/courses?new=1">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Create a course
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link href="/teacher/activities/new">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Draft an activity with AI
              </Link>
            </Button>
          </div>
        </div>
        <Image
          src="/learning-art/teacher-corner.webp"
          alt="Books, a pencil, and a growing sprout."
          fittingType="fit"
          className="hidden h-36 w-36 shrink-0 object-contain md:block lg:h-44 lg:w-44"
        />
      </section>

      {pendingDrafts.length ? (
        <section className="rounded-3xl border-2 border-sun-400 bg-sun-50 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <Sparkles className="h-5 w-5 text-sun-600" aria-hidden="true" />
                {pendingDrafts.length} {pendingDrafts.length === 1 ? "draft needs" : "drafts need"} your review
              </p>
              <p className="text-sm font-semibold text-inkMuted">
                Students cannot see these until you approve them. That check is what keeps the class content
                trustworthy.
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/teacher/drafts">
                Review drafts
                <Users className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-2">
            {pendingDrafts.map((draft) => (
              <li key={draft.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/70 px-4 py-2.5">
                <StatusPill tone="plum">{draft.type === "quiz" ? "Quiz" : draft.type === "match" ? "Matching" : "Fill in the blanks"}</StatusPill>
                <span className="flex-1 font-semibold text-ink">{draft.title}</span>
                <span className="text-xs font-semibold text-inkMuted">Drafted {draft.draftedOn}</span>
                <Link
                  href={`/teacher/activities/${draft.id}/review`}
                  className="text-sm font-bold text-navy-600 hover:underline"
                >
                  Open review
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-ink">Your classes</h2>
          <Link href="/teacher/classes" className="text-sm font-bold text-navy-600 hover:underline">
            All classes
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((entry) => (
            <ClassSummaryCard key={entry.kelas.id} entry={entry} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-ink">Students who may need help</h2>
          <NeedsHelpList items={needsHelp} />
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-ink">Recent activity</h2>
          <ul className="lg-card divide-y divide-border">
            {events.map((event) => {
              const meta = EVENT_ICON[event.kind] || EVENT_ICON.complete;
              return (
                <li key={event.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  <span className="flex-1 text-sm text-ink">
                    <span className="font-bold">{event.who}</span> {event.text}
                  </span>
                  <span className="text-xs font-semibold text-inkMuted">{event.when}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
