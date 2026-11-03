import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Clipboard, DoorOpen, Trash2, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import PageHeader from "@/components/common/PageHeader";
import ProgressMeter from "@/components/common/ProgressMeter";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import RosterTable from "@/components/teacher/RosterTable";
import AddStudentDialog from "@/components/teacher/AddStudentDialog";
import ConfirmActionDialog from "@/components/common/ConfirmActionDialog";
import { useToast } from "@/components/ui/use-toast";

export default function TeacherClassPage() {
  const { classId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [deleteClassOpen, setDeleteClassOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getClass(classId));
    } catch (e) {
      setError(e.message || "We could not open that class.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Opening the class" rows={3} />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!data) return null;

  const { kelas, courses, roster, avgProgress } = data;

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(kelas.classCode);
      setCopiedCode(true);
      setCopyError("");
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      setCopyError("Select and copy the code if your browser blocks clipboard access.");
    }
  }

  async function removeStudent() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.removeStudentFromClass(classId, removeTarget.id);
      toast({ title: "Learner removed", description: `${removeTarget.name} is no longer in this class.` });
      setRemoveTarget(null);
      await load();
    } catch (e) {
      toast({ title: "Could not remove learner", description: e.message || "Please try again." });
    } finally {
      setRemoving(false);
    }
  }

  async function deleteClass() {
    setDeletingClass(true);
    try {
      await api.deleteClass(classId);
      toast({ title: "Class deleted", description: `${kelas.name} was removed. Student accounts and results were kept.` });
      router.push("/teacher/classes");
    } catch (e) {
      toast({ title: "Could not delete class", description: e.message || "Please try again." });
    } finally {
      setDeletingClass(false);
      setDeleteClassOpen(false);
    }
  }

  return (
    <div className="space-y-7">
      <Link href="/teacher/classes" className="inline-flex items-center gap-2 text-sm font-bold text-navy-600 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All classes
      </Link>

      <PageHeader
        eyebrow={[kelas.grade, kelas.room].filter(Boolean).join(" · ")}
        title={kelas.nickname ? `${kelas.name} · ${kelas.nickname}` : kelas.name}
        description={`${roster.length} ${roster.length === 1 ? "student" : "students"} · ${courses.length} ${
          courses.length === 1 ? "course" : "courses"
        } assigned`}
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => setAddStudentOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add learner
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/teacher/progress?class=${kelas.id}`}>Class progress</Link>
            </Button>
            <Button asChild className="gap-2">
              <Link href="/teacher/courses">Assign a course</Link>
            </Button>
            <Button variant="ghost" className="gap-2 text-coral-600" onClick={() => setDeleteClassOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete class
            </Button>
          </>
        }
      />

      {kelas.classCode ? (
        <section className="lg-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">Student join code</p>
            <p className="mt-1 text-sm text-inkMuted">Share this code with learners so they can join this class.</p>
          </div>
          <div className="flex items-center gap-3">
            <code className="rounded-lg bg-cream px-3 py-2 font-mono text-lg font-bold tracking-wider text-ink">{kelas.classCode}</code>
            <Button variant="outline" className="gap-2" onClick={copyJoinCode}>
              {copiedCode ? <Check className="h-4 w-4" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
              {copiedCode ? "Copied" : "Copy code"}
            </Button>
          </div>
          {copyError ? <p className="text-sm text-destructive sm:basis-full sm:text-right">{copyError}</p> : null}
        </section>
      ) : null}

      {roster.length ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="lg-card space-y-3 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">Class completion</p>
              <ProgressMeter value={avgProgress} label="Average across all courses" tone="navy" pattern="stripes" />
              <p className="flex items-center gap-1.5 text-sm font-semibold text-inkMuted">
                <Users className="h-4 w-4" aria-hidden="true" />
                {roster.length} students
              </p>
            </div>
            {courses.map((course, index) => {
              const average =
                roster.reduce(
                  (acc, row) => acc + (row.courses.find((c) => c.courseId === course.id)?.progress || 0),
                  0
                ) / roster.length;
              return (
                <div key={course.id} className="lg-card space-y-3 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">
                    {course.subject} · {course.ageBand}
                  </p>
                  <h3 className="font-display text-lg font-bold text-ink">{course.title}</h3>
                  <ProgressMeter
                    value={average}
                    label="Class average"
                    tone={["plum", "leaf"][index % 2]}
                    pattern={index % 2 === 0 ? "dots" : "none"}
                    compact
                  />
                  <Link
                    href={`/teacher/courses/${course.id}/edit`}
                    className="text-sm font-bold text-navy-600 hover:underline"
                  >
                    Open course
                  </Link>
                </div>
              );
            })}
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-ink">Roster</h2>
            <RosterTable roster={roster} courses={courses} onRemove={setRemoveTarget} />
          </section>
        </>
      ) : (
        <EmptyState
          title="No students in this class yet"
          description="Once learners join this class you will see their progress course by course, and any topics the class finds hard."
          action={
            <Button asChild variant="outline" className="gap-2">
              <Link href="/teacher/courses">
                <DoorOpen className="h-4 w-4" aria-hidden="true" />
                Assign a course
              </Link>
            </Button>
          }
        />
      )}
      <AddStudentDialog
        classId={classId}
        className={`${kelas.name} · ${kelas.nickname}`}
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        onCreated={load}
      />
      <ConfirmActionDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove this learner from the class?"
        description={removeTarget ? `${removeTarget.name} will lose access to courses assigned through this class. Their account and saved results will remain.` : "This learner will be removed from the class."}
        confirmLabel="Remove learner"
        pending={removing}
        onConfirm={removeStudent}
      />
      <ConfirmActionDialog
        open={deleteClassOpen}
        onOpenChange={setDeleteClassOpen}
        title="Delete this class?"
        description={`“${kelas.name}” will be removed. Student accounts and saved learning results will be kept.`}
        confirmLabel="Delete class"
        pending={deletingClass}
        onConfirm={deleteClass}
      />
    </div>
  );
}
