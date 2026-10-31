import React, { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

export default function AssignCourseDialog({ entry, open, onOpenChange, onAssigned }) {
  const classes = entry?.classes || [];
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setSelected(classes.filter((c) => c.assigned).map((c) => c.id));
      setError(null);
    }
  }, [open, entry]);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.assignCourse(entry.course.id, selected);
      onAssigned?.();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || "We could not assign this course.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign “{entry?.course.title}”</DialogTitle>
          <DialogDescription>
            Choose which classes should see this course. Students see it as soon as it is published.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {classes.length ? (
            classes.map((klass) => (
              <label
                key={klass.id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-paper px-4 py-3"
              >
                <Checkbox
                  checked={selected.includes(klass.id)}
                  onCheckedChange={() => toggle(klass.id)}
                  aria-label={`Assign to ${klass.name}`}
                />
                <span className="flex-1">
                  <span className="block font-bold text-ink">
                    {klass.name} <span className="text-inkMuted">· {klass.nickname}</span>
                  </span>
                  <span className="block text-xs font-semibold text-inkMuted">
                    {klass.studentCount} students
                  </span>
                </span>
              </label>
            ))
          ) : (
            <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-inkMuted">
              You have no classes yet. Create a class first, then assign this course.
            </p>
          )}
        </div>

        {error ? (
          <p role="alert" className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={submit} disabled={saving || !selected.length}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Users className="h-4 w-4" aria-hidden="true" />}
            Assign to {selected.length || 0} {selected.length === 1 ? "class" : "classes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}