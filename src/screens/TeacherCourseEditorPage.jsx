import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check, Eye, Loader2, Save, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";
import CourseOutline from "@/components/teacher/CourseOutline";
import CoursePreviewDialog from "@/components/teacher/CoursePreviewDialog";
import AssignCourseDialog from "@/components/teacher/AssignCourseDialog";

const SUBJECTS = ["Science", "Maths", "Reading"];
const AGE_BANDS = ["Ages 6–8", "Ages 7–9", "Ages 8–10", "Ages 9–11", "Ages 10–12"];
const stripActivities = (chapters) =>
  chapters.map((chapter) => ({
    ...chapter,
    lessons: chapter.lessons.map(({ activities: _activities, ...lesson }) => lesson),
  }));

export default function TeacherCourseEditorPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getCourseEditor(courseId);
      setData(result);
      setDraft(JSON.parse(JSON.stringify(result.course)));
      setBaseline(JSON.stringify(result.course));
    } catch (e) {
      setError(e.message || "We could not open that course.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = draft ? JSON.stringify(draft) !== baseline : false;
  const approvedCount = (draft?.chapters || [])
    .flatMap((c) => c.lessons)
    .flatMap((l) => l.activities || [])
    .filter((a) => a.status === "approved").length;
  const draftCount = (draft?.chapters || [])
    .flatMap((c) => c.lessons)
    .flatMap((l) => l.activities || [])
    .filter((a) => a.status !== "approved").length;
  const assignedClasses = (data?.classes || []).filter((c) => c.assigned);

  const patch = (fields) => setDraft((prev) => ({ ...prev, ...fields }));

  const save = async () => {
    setSaving(true);
    setBanner(null);
    try {
      const saved = await api.saveCourseDraft(courseId, {
        title: draft.title,
        summary: draft.summary,
        subject: draft.subject,
        ageBand: draft.ageBand,
        outcomes: draft.outcomes,
        chapters: stripActivities(draft.chapters),
      });
      setBaseline(JSON.stringify({ ...draft, ...saved, chapters: draft.chapters }));
      toast({ title: "Draft saved", description: "Your changes are kept. Students still cannot see it until you publish." });
    } catch (e) {
      setBanner({ tone: "coral", text: e.message || "We could not save the draft." });
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setBanner(null);
    try {
      await api.publishCourse(courseId);
      toast({ title: "Course published", description: "Students in the assigned classes can open it now." });
      await load();
    } catch (e) {
      setBanner({ tone: "coral", text: e.message || "We could not publish the course." });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <LoadingState label="Opening the course editor" rows={2} />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!draft) return null;

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/courses"
        className="inline-flex items-center gap-2 text-sm font-bold text-navy-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All courses
      </Link>

      <header className="lg-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={draft.status === "published" ? "leaf" : "sun"}>
              {draft.status === "published" ? "Published" : "Draft"}
            </StatusPill>
            {dirty ? <StatusPill tone="coral">Unsaved changes</StatusPill> : null}
            <span className="text-xs font-semibold text-inkMuted">Last edited {draft.updated}</span>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink">{draft.title}</h1>
          <p className="text-sm text-inkMuted">
            {assignedClasses.length
              ? `Assigned to ${assignedClasses.map((c) => c.name).join(", ")}`
              : "Not assigned to any class yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" aria-hidden="true" />
            Preview
          </Button>
          <Button variant="outline" className="gap-2" onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Save draft
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setAssignOpen(true)}>
            <Users className="h-4 w-4" aria-hidden="true" />
            Assign
          </Button>
          <Button className="gap-2" onClick={publish} disabled={publishing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Publish
          </Button>
        </div>
      </header>

      {banner ? (
        <p
          role="alert"
          className={
            banner.tone === "leaf"
              ? "rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-sm font-semibold text-leaf-600"
              : "rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600"
          }
        >
          {banner.text}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="lg-card space-y-4 p-5">
            <h2 className="font-display text-xl font-bold text-ink">Course details</h2>
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-subject">Subject</Label>
                <Select value={draft.subject} onValueChange={(value) => patch({ subject: value })}>
                  <SelectTrigger id="edit-subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-age">Age range</Label>
                <Select value={draft.ageBand} onValueChange={(value) => patch({ ageBand: value })}>
                  <SelectTrigger id="edit-age">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_BANDS.map((band) => (
                      <SelectItem key={band} value={band}>
                        {band}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-summary">Description</Label>
              <Textarea
                id="edit-summary"
                rows={3}
                value={draft.summary}
                onChange={(e) => patch({ summary: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-outcomes">What students will learn (one per line)</Label>
              <Textarea
                id="edit-outcomes"
                rows={3}
                value={(draft.outcomes || []).join("\n")}
                onChange={(e) => patch({ outcomes: e.target.value.split("\n").filter(Boolean) })}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold text-ink">Chapters, lessons and activities</h2>
            <CourseOutline
              chapters={draft.chapters}
              onChange={(chapters) => patch({ chapters })}
              onDraftActivity={(lesson) =>
                router.push(`/teacher/activities/new?courseId=${courseId}&lessonId=${lesson.id}`)
              }
            />
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="lg-card space-y-3 p-5">
            <h2 className="font-display text-lg font-bold text-ink">Before you publish</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2 font-semibold text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-leaf-500" aria-hidden="true" />
                {draft.title.trim() ? "The course has a title." : "Add a title."}
              </li>
              <li className="flex items-start gap-2 font-semibold text-ink">
                <Check
                  className={`mt-0.5 h-4 w-4 shrink-0 ${approvedCount ? "text-leaf-500" : "text-inkMuted"}`}
                  aria-hidden="true"
                />
                {approvedCount
                  ? `${approvedCount} approved ${approvedCount === 1 ? "activity" : "activities"} ready for students.`
                  : "Approve at least one activity — a course needs something to practise."}
              </li>
              <li className="flex items-start gap-2 font-semibold text-ink">
                <Check
                  className={`mt-0.5 h-4 w-4 shrink-0 ${assignedClasses.length ? "text-leaf-500" : "text-inkMuted"}`}
                  aria-hidden="true"
                />
                {assignedClasses.length
                  ? `Assigned to ${assignedClasses.length} ${assignedClasses.length === 1 ? "class" : "classes"}.`
                  : "Assign it to a class so students can find it."}
              </li>
            </ul>
            {draftCount ? (
              <p className="rounded-2xl bg-sun-50 px-3 py-2.5 text-sm font-semibold text-ink">
                {draftCount} {draftCount === 1 ? "activity is" : "activities are"} still waiting for your review and
                hidden from students.
              </p>
            ) : null}
          </section>

          <section className="lg-card space-y-3 p-5">
            <h2 className="font-display text-lg font-bold text-ink">This course contains</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-paper px-3 py-2.5">
                <dt className="text-xs font-bold uppercase tracking-wide text-inkMuted">Chapters</dt>
                <dd className="font-display text-xl font-bold text-ink">{draft.chapters.length}</dd>
              </div>
              <div className="rounded-2xl bg-paper px-3 py-2.5">
                <dt className="text-xs font-bold uppercase tracking-wide text-inkMuted">Lessons</dt>
                <dd className="font-display text-xl font-bold text-ink">
                  {draft.chapters.reduce((acc, c) => acc + c.lessons.length, 0)}
                </dd>
              </div>
              <div className="rounded-2xl bg-paper px-3 py-2.5">
                <dt className="text-xs font-bold uppercase tracking-wide text-inkMuted">Approved</dt>
                <dd className="font-display text-xl font-bold text-leaf-600">{approvedCount}</dd>
              </div>
              <div className="rounded-2xl bg-paper px-3 py-2.5">
                <dt className="text-xs font-bold uppercase tracking-wide text-inkMuted">In review</dt>
                <dd className="font-display text-xl font-bold text-sun-600">{draftCount}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href={`/teacher/activities/new?courseId=${courseId}`}>Draft another activity</Link>
            </Button>
          </section>
        </aside>
      </div>

      <CoursePreviewDialog course={draft} open={previewOpen} onOpenChange={setPreviewOpen} />
      <AssignCourseDialog
        entry={{ course: draft, classes: data.classes }}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={() => {
          toast({ title: "Saved", description: "Class assignments updated." });
          load();
        }}
      />
    </div>
  );
}
