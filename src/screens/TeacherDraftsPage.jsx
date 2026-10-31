import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import PageHeader from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";

const TYPE_LABEL = { quiz: "Quiz", match: "Matching", fill: "Fill in the blanks" };

function DraftRow({ row, approved }) {
  return (
    <li className="lg-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          approved ? "bg-leaf-100 text-leaf-600" : "bg-plum-100 text-plum-600"
        }`}
      >
        <Wand2 className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={approved ? "leaf" : "sun"}>
            {approved ? `Approved ${row.approvedOn || ""}` : "Waiting for review"}
          </StatusPill>
          <span className="text-xs font-semibold text-inkMuted">
            {TYPE_LABEL[row.type]} · {row.questionCount} questions
          </span>
        </div>
        <p className="font-bold text-ink">{row.title}</p>
        <p className="text-xs font-semibold text-inkMuted">
          {row.courseTitle} · {row.lessonTitle} · drafted {row.draftedOn}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant={approved ? "outline" : "default"} className="gap-2">
          <Link href={`/teacher/activities/${row.id}/review`}>{approved ? "Open" : "Review & approve"}</Link>
        </Button>
      </div>
    </li>
  );
}

export default function TeacherDraftsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.listDrafts());
    } catch (e) {
      setError(e.message || "We could not load the drafts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI drafts"
        title="Review before students see anything"
        description="AI-drafted activities wait here until you check the questions, answers and explanations and approve them."
        actions={
          <Button asChild className="gap-2">
            <Link href="/teacher/activities/new">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Draft a new activity
            </Link>
          </Button>
        }
      />

      {loading ? <LoadingState label="Loading your drafts" rows={2} /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {!loading && !error && data ? (
        <>
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">Waiting for your review</h2>
              <StatusPill tone={data.pending.length ? "sun" : "leaf"}>
                {data.pending.length ? `${data.pending.length} to check` : "Nothing waiting"}
              </StatusPill>
            </div>
            {data.pending.length ? (
              <ul className="space-y-3">
                {data.pending.map((row) => (
                  <DraftRow key={row.id} row={row} />
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No drafts waiting"
                description="Everything drafted so far has been reviewed. Students only ever see the activities you approved."
                action={
                  <Button asChild className="gap-2">
                    <Link href="/teacher/activities/new">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Draft an activity
                    </Link>
                  </Button>
                }
              />
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-ink">Approved AI activities</h2>
            {data.approved.length ? (
              <ul className="space-y-3">
                {data.approved.map((row) => (
                  <DraftRow key={row.id} row={row} approved />
                ))}
              </ul>
            ) : (
              <p className="rounded-3xl bg-cream px-4 py-4 text-sm text-inkMuted">
                No AI-drafted activities have been approved yet.
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}