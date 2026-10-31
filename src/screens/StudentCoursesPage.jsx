import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCurrentStudentId } from "@/lib/useCurrentStudentId";
import PageHeader from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import CourseCard from "@/components/student/CourseCard";

export default function StudentCoursesPage() {
  const studentId = useCurrentStudentId();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await api.getStudentCourses(studentId));
    } catch (e) {
      setError(e.message || "We could not open your courses.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        eyebrow="My courses"
        title="Everything you are learning"
        description="Open a course to carry on where you stopped, or to read ahead."
      />
      {loading ? <LoadingState label="Opening your courses" rows={2} /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}
      {!loading && !error && courses?.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {courses.map((entry) => (
            <CourseCard key={entry.course.id} entry={entry} />
          ))}
        </div>
      ) : null}
      {!loading && !error && courses && !courses.length ? (
        <EmptyState
          title="No courses yet"
          description="Your courses will show up here as soon as your teacher assigns them."
        />
      ) : null}
    </div>
  );
}
