import React, { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import ClassSummaryCard from "@/components/teacher/ClassSummaryCard";
import CreateClassDialog from "@/components/teacher/CreateClassDialog";

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClasses(await api.listClasses());
    } catch (e) {
      setError(e.message || "We could not load your classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        eyebrow="Classes"
        title="Your classes"
        description="Open a class to see the roster, each learner’s progress and who needs a hand."
        actions={
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create class
          </Button>
        }
      />
      {loading ? <LoadingState label="Loading your classes" rows={3} /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}
      {!loading && !error && classes?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((entry) => (
            <ClassSummaryCard key={entry.kelas.id} entry={entry} />
          ))}
        </div>
      ) : null}
      {!loading && !error && classes && !classes.length ? (
        <EmptyState
          title="No classes yet"
          description="Create your first class, then share its join code with your learners."
          action={<Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus aria-hidden="true" />Create your first class</Button>}
        />
      ) : null}
      <CreateClassDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
    </div>
  );
}
