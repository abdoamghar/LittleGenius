import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import PageHeader from "@/components/common/PageHeader";
import { ErrorState, LoadingState, StatusPill } from "@/components/common/StateBlocks";
import ProgressMatrix from "@/components/teacher/ProgressMatrix";
import StruggleList from "@/components/teacher/StruggleList";

export default function TeacherProgressPage() {
  const params = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(params.get("class") || "all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getTeacherProgress());
    } catch (e) {
      setError(e.message || "We could not load class progress.");
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
        <PageHeader eyebrow="Progress" title="Working out how your classes are doing" />
        <LoadingState label="Reading activity results" rows={2} />
      </>
    );
  }
  if (error) {
    return (
      <>
        <PageHeader eyebrow="Progress" title="Class progress" />
        <ErrorState description={error} onRetry={load} />
      </>
    );
  }
  if (!data) return null;

  const tabs = [{ id: "all", label: "All classes" }, ...data.classes.map((c) => ({ id: c.kelas.id, label: c.kelas.name }))];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Progress"
        title="Completion and where students get stuck"
        description="Every state is written out in words and marked with a pattern, so it reads without relying on colour."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/teacher/classes">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Class rosters
            </Link>
          </Button>
        }
      />

      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="flex h-auto flex-wrap gap-1 rounded-2xl bg-cream p-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="rounded-xl px-4 py-2 text-sm font-bold">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-7">
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-ink">Class and course completion</h2>
            <ProgressMatrix classes={data.classes} />
          </section>
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">Lessons that need a second look</h2>
              <StatusPill tone="coral">Lowest average scores</StatusPill>
            </div>
            <StruggleList struggles={data.struggles} />
          </section>
        </TabsContent>

        {data.classes.map((entry) => (
          <TabsContent key={entry.kelas.id} value={entry.kelas.id} className="mt-6 space-y-7">
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink">
                {entry.kelas.name} · {entry.kelas.nickname}
              </h2>
              <ProgressMatrix classes={[entry]} />
            </section>
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink">Where this class struggles</h2>
              <StruggleList struggles={entry.struggles.slice(0, 4)} />
            </section>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}