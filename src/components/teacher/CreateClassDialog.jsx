import { useState } from "react";
import { Check, Clipboard, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

const GRADES = [
  { value: "6-7", label: "Ages 6–7" },
  { value: "8-9", label: "Ages 8–9" },
  { value: "10-12", label: "Ages 10–12" },
];

export default function CreateClassDialog({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gradeLevel, setGradeLevel] = useState("8-9");
  const [createdClass, setCreatedClass] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function close() {
    onOpenChange(false);
    setCreatedClass(null);
    setName("");
    setDescription("");
    setGradeLevel("8-9");
    setCopied(false);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.createClass({ name, description, gradeLevel });
      setCreatedClass(result);
      await onCreated?.(result);
    } catch (cause) {
      setError(cause.message || "We could not create this class.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(createdClass.classCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Your browser could not copy the code. Select and copy it instead.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{createdClass ? "Your class is ready" : "Create a class"}</DialogTitle>
          <DialogDescription>
            {createdClass
              ? `Share this join code with learners so they can join ${createdClass.name}.`
              : "Set up a classroom first. You can invite learners and assign courses after it is created."}
          </DialogDescription>
        </DialogHeader>

        {createdClass ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-cream p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">Student join code</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-[0.12em] text-ink">{createdClass.classCode}</p>
              <p className="mt-2 text-sm text-inkMuted">Students enter this code when they create their account.</p>
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button variant="outline" onClick={close}>Done</Button>
              <Button onClick={copyCode} className="gap-2">
                {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
                {copied ? "Copied" : "Copy join code"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error ? <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="class-name">Class name</Label>
              <Input id="class-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="For example, Garden Explorers" minLength={3} maxLength={50} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-description">Short description</Label>
              <Input id="class-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A little about this learning group" maxLength={500} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-grade">Age group</Label>
              <select
                id="class-grade"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={gradeLevel}
                onChange={(event) => setGradeLevel(event.target.value)}
              >
                {GRADES.map((grade) => <option key={grade.value} value={grade.value}>{grade.label}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" className="gap-2" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                Create class
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
