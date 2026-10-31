import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import CourseSummaryCard from "@/components/teacher/CourseSummaryCard";
import CreateCourseDialog from "@/components/teacher/CreateCourseDialog";
import CoursePreviewDialog from "@/components/teacher/CoursePreviewDialog";
import AssignCourseDialog from "@/components/teacher/AssignCourseDialog";

export default function TeacherCoursesPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [entries, setEntries] = useState(null);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [previewCourse, setPreviewCourse] = useState(null);
  const [assignEntry, setAssignEntry] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [courses, classList] = await Promise.all([api.listTeacherCourses(), api.listClasses()]);
      setEntries(courses);
      setClasses(classList.map((row) => ({ ...row.kelas, studentCount: row.studentCount })));
    } catch (e) {
      setError(e.message || "We could not load your courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (params.get("new") === "1") setCreating(true);
  }, [params]);

  const closeCreate = (open) => {
    setCreating(open);
    if (!open && params.get("new")) {
      const nextParams = new URLSearchParams(params.toString());
      nextParams.delete("new");
      const query = nextParams.toString();
      router.replace(`/teacher/courses${query ? `?${query}` : ""}`, { scroll: false });
    }
  };

  const assignTarget = assignEntry
    ? {
        course: assignEntry.course,
        classes: classes.map((klass) => ({
          ...klass,
          assigned: assignEntry.classes.some((c) => c.id === klass.id),
        })),
      }
    : null;

  return (
    <div>
      <PageHeader
        eyebrow="Courses"
        title="Create and assign your courses"
        description="Build a course chapter by chapter, draft activities from the lesson text, then publish and assign it."
        actions={
          <>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/teacher/activities/new">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Draft an activity
              </Link>
            </Button>
            <Button className="gap-2" onClick={() => setCreating(true)}>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Create a course
            </Button>
          </>
        }
      />

      {loading ? <LoadingState label="Loading your courses" rows={2} /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}
      {!loading && !error && entries?.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {entries.map((entry) => (
            <CourseSummaryCard
              key={entry.course.id}
              entry={entry}
              onPreview={setPreviewCourse}
              onAssign={setAssignEntry}
            />
          ))}
        </div>
      ) : null}
      {!loading && !error && entries && !entries.length ? (
        <EmptyState
          title="No courses yet"
          description="Start with a title and a subject — you can add chapters and draft activities right after."
          action={
            <Button className="gap-2" onClick={() => setCreating(true)}>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Create your first course
            </Button>
          }
        />
      ) : null}

      <CreateCourseDialog
        open={creating}
        onOpenChange={closeCreate}
        onCreated={(course) => {
          toast({ title: "Draft course created", description: `“${course.title}” is ready to fill in.` });
          router.push(`/teacher/courses/${course.id}/edit`);
        }}
      />
      <CoursePreviewDialog
        course={previewCourse}
        open={Boolean(previewCourse)}
        onOpenChange={(open) => !open && setPreviewCourse(null)}
      />
      <AssignCourseDialog
        entry={assignTarget}
        open={Boolean(assignEntry)}
        onOpenChange={(open) => !open && setAssignEntry(null)}
        onAssigned={() => {
          toast({ title: "Course assigned", description: "Students in those classes can now open it." });
          load();
        }}
      />
    </div>
  );
}