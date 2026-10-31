import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useCurrentStudentId } from "@/lib/useCurrentStudentId";
import SubjectArt from "@/components/common/SubjectArt";
import { ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";
import ActivityRunner from "@/components/activities/ActivityRunner";

export default function StudentActivityPage() {
  const { activityId } = useParams();
  const studentId = useCurrentStudentId();
  const router = useRouter();
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setActivity(await api.getActivityForStudent(activityId));
    } catch (e) {
      setError(e.message || "We could not open this activity.");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (answers) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.submitActivity(activityId, answers, studentId);
      router.push(`/student/activity/${activityId}/result`);
    } catch (e) {
      setError(e.message || "We could not send your answers. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <LoadingState label="Opening your activity" rows={1} />
        <p className="mt-4 flex items-center gap-2 text-sm text-inkMuted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Getting the questions ready
        </p>
      </>
    );
  }

  if (error && !activity) {
    return (
      <>
        <Link
          href="/student"
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-navy-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to today
        </Link>
        <ErrorState
          title="This activity is not open yet"
          description={error}
          onRetry={load}
          retryLabel="Check again"
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/student/lesson/${activity.lessonId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-navy-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {activity.lessonTitle}
        </Link>
        <p className="text-sm font-bold text-inkMuted">{activity.courseTitle}</p>
      </div>

      <header className="lg-card grid gap-4 p-5 md:grid-cols-[1fr_12rem] md:items-center">
        <div className="space-y-2">
          <StatusPill tone="navy">{activity.courseTitle}</StatusPill>
          <h1 className="font-display text-2xl font-bold leading-tight text-ink md:text-3xl">{activity.title}</h1>
          <p className="text-base text-inkMuted">{activity.instructions}</p>
        </div>
        <SubjectArt artKey={activity.art} className="h-28 w-full md:h-28" imageClassName="p-1" />
      </header>

      {error ? (
        <p role="alert" className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
          {error}
        </p>
      ) : null}

      <ActivityRunner activity={activity} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
