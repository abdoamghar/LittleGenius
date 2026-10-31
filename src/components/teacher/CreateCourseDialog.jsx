import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const SUBJECTS = ["Science", "Maths", "Reading"];
const AGE_BANDS = ["Ages 6–8", "Ages 7–9", "Ages 8–10", "Ages 9–11", "Ages 10–12"];

export default function CreateCourseDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({ title: "", subject: "Science", ageBand: "Ages 8–10", summary: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Give the course a title so your students can recognise it.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const course = await api.createCourse(form);
      setForm({ title: "", subject: "Science", ageBand: "Ages 8–10", summary: "" });
      onOpenChange(false);
      onCreated(course);
    } catch (e) {
      setError(e.message || "We could not create the course.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a course</DialogTitle>
          <DialogDescription>
            It starts as a draft with one empty chapter. You choose when students can see it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="course-title">Course title</Label>
            <Input
              id="course-title"
              value={form.title}
              placeholder="e.g. Weather and Seasons"
              onChange={(e) => set({ title: e.target.value })}
              aria-invalid={Boolean(error) && !form.title.trim()}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="course-subject">Subject</Label>
              <Select value={form.subject} onValueChange={(value) => set({ subject: value })}>
                <SelectTrigger id="course-subject">
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
              <Label htmlFor="course-age">Age range</Label>
              <Select value={form.ageBand} onValueChange={(value) => set({ ageBand: value })}>
                <SelectTrigger id="course-age">
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
            <Label htmlFor="course-summary">Short description</Label>
            <Textarea
              id="course-summary"
              rows={3}
              value={form.summary}
              placeholder="One or two friendly sentences for the course card."
              onChange={(e) => set({ summary: e.target.value })}
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
              Create draft course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
