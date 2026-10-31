import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { ACTIVITY_TYPES } from "@/lib/activity-types";
import { useToast } from "@/components/ui/use-toast";
import { ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";
import ActivityDraftEditor from "@/components/teacher/ActivityDraftEditor";
import DraftPreview from "@/components/teacher/DraftPreview";
import { cn } from "@/lib/utils";

const CONTENT_KEYS = ["questions", "pairs", "parts", "wordBank"];

export default function TeacherActivityStudioPage() {
  const { activityId } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const reviewMode = Boolean(activityId);

  const [lessons, setLessons] = useState(null);
  const [courseId, setCourseId] = useState(params.get("courseId") || "");
  const [lessonId, setLessonId] = useState(params.get("lessonId") || "");
  const [type, setType] = useState(params.get("type") || "quiz");
  const [draft, setDraft] = useState(null);
  const [meta, setMeta] = useState({ courseTitle: "", lessonTitle: "" });
  const [variant, setVariant] = useState(0);
  const [loading, setLoading] = useState(Boolean(reviewMode));
  const [loadError, setLoadError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadLessons = useCallback(async () => {
    try {
      const data = await api.lessonsForDrafting();
      setLessons(data);
      if (!courseId && data.length) setCourseId(data[0].id);
      if (!lessonId && data.length) setLessonId(data[0].lessons[0]?.id || "");
    } catch (e) {
      setLoadError(e.message || "We could not load your lessons.");
    }
  }, [courseId, lessonId]);

  const loadDraft = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await api.getDraftForReview(activityId);
      setDraft(result.activity);
      setMeta({ courseTitle: result.courseTitle, lessonTitle: result.lessonTitle });
      setType(result.activity.type);
      setCourseId(result.courseId);
      setLessonId(result.lessonId);
    } catch (e) {
      setLoadError(e.message || "We could not open that draft.");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (reviewMode) {
      loadDraft();
    } else {
      loadLessons();
    }
  }, [reviewMode, loadDraft, loadLessons]);

  const courseOptions = lessons || [];
  const activeCourse = useMemo(() => courseOptions.find((c) => c.id === courseId), [courseOptions, courseId]);
  const activeLesson = useMemo(
    () => activeCourse?.lessons.find((l) => l.id === lessonId),
    [activeCourse, lessonId]
  );
  const approved = draft?.status === "approved";

  // keep the course and lesson names in step with the chosen lesson, whatever
  // order the studio is opened and clicked in
  useEffect(() => {
    const course = courseOptions.find((c) => c.id === courseId);
    const lesson = course?.lessons.find((l) => l.id === lessonId);
    if (course || lesson) {
      setMeta({ courseTitle: course?.title || "", lessonTitle: lesson?.title || "" });
    }
  }, [courseOptions, courseId, lessonId]);

  const generate = async (nextVariant = 0) => {
    if (!lessonId) {
      setMessage({ tone: "coral", text: "Choose the lesson the activity should be drafted from." });
      return;
    }
    setGenerating(true);
    setMessage(null);
    try {
      const created = await api.generateDraft({ courseId, lessonId, type }, nextVariant);
      setDraft(created);
      setVariant(nextVariant);
      setMeta({ courseTitle: activeCourse?.title || "", lessonTitle: activeLesson?.title || "" });
      toast({
        title: "Draft ready for review",
        description: "Students cannot see it until you approve it.",
      });
    } catch (e) {
      setMessage({ tone: "coral", text: e.message || "The draft could not be written. Try again." });
    } finally {
      setGenerating(false);
    }
  };

  const regenerate = async () => {
    if (draft) {
      try {
        await api.discardDraft(draft.id);
      } catch {
        /* the new draft still stands on its own */
      }
    }
    setDraft(null);
    generate(variant + 1);
  };

  const saveDraft = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const patch = CONTENT_KEYS.reduce((acc, key) => (draft[key] ? { ...acc, [key]: draft[key] } : acc), {});
      const saved = await api.updateDraft(draft.id, { title: draft.title, instructions: draft.instructions, ...patch });
      setDraft(saved);
      setMessage({ tone: "leaf", text: "Saved as a draft. It is still hidden from students." });
      toast({ title: "Draft saved", description: "Still hidden from students until you approve it." });
    } catch (e) {
      setMessage({ tone: "coral", text: e.message || "We could not save the draft." });
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    setApproving(true);
    setMessage(null);
    try {
      let saved = draft;
      if (draft.status !== "approved") {
        const patch = CONTENT_KEYS.reduce((acc, key) => (draft[key] ? { ...acc, [key]: draft[key] } : acc), {});
        saved = await api.updateDraft(draft.id, { title: draft.title, instructions: draft.instructions, ...patch });
      }
      const released = await api.approveDraft(saved.id);
      setDraft(released);
      setConfirmOpen(false);
      toast({
        title: "Approved and released",
        description: `“${released.title}” is now part of the lesson for your students.`,
      });
    } catch (e) {
      setConfirmOpen(false);
      setMessage({ tone: "coral", text: e.message || "We could not approve this activity." });
    } finally {
      setApproving(false);
    }
  };

  const discard = async () => {
    try {
      await api.discardDraft(draft.id);
      toast({ title: "Draft discarded", description: "Nothing was shared with students." });
    } catch {
      /* leave it in the list if the removal fails */
    }
    router.push("/teacher/drafts");
  };

  if (loading) return <LoadingState label="Opening the draft" rows={1} />;
  if (loadError) return <ErrorState description={loadError} onRetry={reviewMode ? loadDraft : loadLessons} />;

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/drafts"
        className="inline-flex items-center gap-2 text-sm font-bold text-navy-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        AI drafts
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy-500">Activity studio</p>
        <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
          {draft ? "Check every answer before students see it" : "Draft an activity from a lesson"}
        </h1>
        <p className="max-w-3xl text-base text-inkMuted">
          Choose the activity type and the lesson text to work from. The draft arrives here for you to edit,
          regenerate, save or approve — and it stays hidden from students until you approve it.
        </p>
      </header>

      {!draft ? (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="lg-card space-y-5 p-5">
            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold text-ink">1. What should they practise?</h2>
              <div className="grid gap-3">
                {ACTIVITY_TYPES.map((option) => {
                  const active = type === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setType(option.id)}
                      className={cn(
                        "rounded-3xl border-2 px-4 py-3 text-left transition",
                        active ? "border-navy-600 bg-navy-50 shadow-paper" : "border-border bg-paper hover:border-navy-300"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-display text-base font-bold text-ink">{option.label}</span>
                        {active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-navy-700">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Chosen
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-sm text-inkMuted">{option.blurb}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-ink">2. Which lesson text?</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="studio-course">Course</Label>
                  <Select
                    value={courseId}
                    onValueChange={(value) => {
                      setCourseId(value);
                      const course = courseOptions.find((c) => c.id === value);
                      setLessonId(course?.lessons[0]?.id || "");
                    }}
                  >
                    <SelectTrigger id="studio-course">
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="studio-lesson">Lesson</Label>
                  <Select value={lessonId} onValueChange={setLessonId}>
                    <SelectTrigger id="studio-lesson">
                      <SelectValue placeholder="Choose a lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {(activeCourse?.lessons || []).map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeLesson ? (
                <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-inkMuted">
                  <span className="font-bold text-ink">Working from: </span>
                  {activeLesson.summary || activeLesson.title}
                  {activeLesson.keyIdea ? ` Big idea: ${activeLesson.keyIdea}` : ""}
                </p>
              ) : null}
            </div>

            {message ? (
              <p role="alert" className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
                {message.text}
              </p>
            ) : null}

            <Button size="lg" className="gap-2" onClick={() => generate(0)} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Writing the draft…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  Draft with AI
                </>
              )}
            </Button>
          </div>

          <aside className="space-y-4">
            <section className="lg-card space-y-3 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <ShieldCheck className="h-5 w-5 text-navy-600" aria-hidden="true" />
                How review works
              </h2>
              <ol className="space-y-2 text-sm text-inkMuted">
                <li className="flex gap-2">
                  <span className="font-bold text-ink">1.</span> A draft is written from the lesson text you choose.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-ink">2.</span> You edit the questions, answers and explanations.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-ink">3.</span> Nothing reaches students until you press approve.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-ink">4.</span> Approved activities join the lesson and count towards
                  progress.
                </li>
              </ol>
            </section>
            {generating ? (
              <section className="lg-card flex items-center gap-3 p-5" aria-live="polite">
                <Loader2 className="h-5 w-5 animate-spin text-navy-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-ink">
                  Reading “{activeLesson?.title}” and writing {type === "quiz" ? "questions" : type === "match" ? "pairs" : "gaps"}…
                </p>
              </section>
            ) : null}
          </aside>
        </section>
      ) : (
        <div className="space-y-6">
          <section
            className={cn(
              "rounded-3xl border-2 p-5",
              approved ? "border-leaf-500 bg-leaf-50" : "border-sun-400 bg-sun-50"
            )}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                  {approved ? (
                    <Check className="h-5 w-5 text-leaf-600" aria-hidden="true" />
                  ) : (
                    <Wand2 className="h-5 w-5 text-sun-600" aria-hidden="true" />
                  )}
                  {approved
                    ? "Approved — students can see this now"
                    : "Not visible to students yet — it is waiting for your approval"}
                </p>
                <p className="text-sm font-semibold text-inkMuted">
                  {approved
                    ? `It is part of “${meta.lessonTitle}” in ${meta.courseTitle}.`
                    : "Check each question, answer and explanation. Students only ever see approved activities."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Preview
                </Button>
                {approved ? (
                  <Button asChild className="gap-2">
                    <Link href={`/teacher/courses/${draft.courseId}/edit`}>Open the course</Link>
                  </Button>
                ) : (
                  <Button className="gap-2" onClick={() => setConfirmOpen(true)}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          </section>

          {message ? (
            <p
              role="status"
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm font-semibold",
                message.tone === "leaf"
                  ? "border-leaf-200 bg-leaf-50 text-leaf-600"
                  : "border-coral-200 bg-coral-50 text-coral-600"
              )}
            >
              {message.text}
            </p>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
            <div className="space-y-5">
              <section className="lg-card space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={approved ? "leaf" : "sun"}>
                    {approved ? "Approved" : "Draft · teachers only"}
                  </StatusPill>
                  <StatusPill tone="plum">AI drafted</StatusPill>
                  <span className="text-xs font-semibold text-inkMuted">Drafted from: {draft.draftedFrom}</span>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="draft-title">Activity title</Label>
                  <Input
                    id="draft-title"
                    value={draft.title}
                    disabled={approved}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="draft-instructions">Instructions students see</Label>
                  <Input
                    id="draft-instructions"
                    value={draft.instructions}
                    disabled={approved}
                    onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="font-display text-xl font-bold text-ink">Questions, answers and explanations</h2>
                <ActivityDraftEditor
                  activity={draft}
                  disabled={approved}
                  onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
                />
              </section>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
              <section className="lg-card space-y-3 p-5">
                <h2 className="font-display text-lg font-bold text-ink">Review actions</h2>
                <Button
                  className="w-full gap-2"
                  onClick={() => setConfirmOpen(true)}
                  disabled={approved || approving}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Approve for students
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={saveDraft} disabled={saving || approved}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                  Save as draft
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={regenerate} disabled={generating || approved}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  )}
                  Regenerate a fresh draft
                </Button>
                <Button variant="ghost" className="w-full gap-2 text-coral-600" onClick={discard} disabled={generating}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Discard draft
                </Button>
              </section>

              <section className="lg-card space-y-2 p-5">
                <h2 className="font-display text-lg font-bold text-ink">Where this goes</h2>
                <p className="text-sm text-inkMuted">
                  <span className="font-bold text-ink">{meta.courseTitle}</span>
                  <br />
                  Lesson: {meta.lessonTitle}
                </p>
                <p className="text-sm text-inkMuted">
                  Drafted {draft.draftedOn}
                  {draft.approvedOn ? ` · approved ${draft.approvedOn}` : ""}
                </p>
              </section>
            </aside>
          </div>
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student preview</DialogTitle>
            <DialogDescription>Exactly what a learner will see once this is approved.</DialogDescription>
          </DialogHeader>
          {draft ? <DraftPreview activity={draft} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Release this activity to students?</DialogTitle>
            <DialogDescription>
              “{draft?.title}” will join the lesson “{meta.lessonTitle}” in {meta.courseTitle}. Learners will see it
              the next time they open the course.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={approving}>
              Keep reviewing
            </Button>
            <Button className="gap-2" onClick={approve} disabled={approving}>
              {approving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
              Approve & release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
