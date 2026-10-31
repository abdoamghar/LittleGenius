import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";

export default function AddStudentDialog({ classId, className, open, onOpenChange, onCreated }) {
  const { createStudent } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const account = await createStudent({ classId, name, email, password, dateOfBirth });
      setCreated(account);
      onCreated();
      setName("");
      setEmail("");
      setPassword("");
    } catch (cause) {
      setError(cause.message || "We could not create this learner account.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    onOpenChange(false);
    setCreated(null);
    setError("");
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{created ? "Learner account created" : "Add a learner"}</DialogTitle>
          <DialogDescription>
            {created ? `Share these sign-in details with ${created.student.full_name}.` : `Create a learner account for ${className}.`}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-3 rounded-2xl border border-leaf-200 bg-leaf-50 p-4 text-sm">
            <p><span className="font-bold">Email:</span> {created.student.email}</p>
            <p><span className="font-bold">Password:</span> {created.password}</p>
            <p className="text-xs text-inkMuted">The account is saved securely by the backend and added to this class.</p>
            <DialogFooter><Button onClick={close}>Done</Button></DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="student-name">Learner name</Label>
              <Input id="student-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">Sign-in email</Label>
              <Input id="student-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-birth-date">Date of birth</Label>
              <Input id="student-birth-date" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} required />
              <p className="text-xs text-inkMuted">Student accounts are for ages 6–12.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-password">Temporary password</Label>
              <Input id="student-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" className="gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
                Create learner account
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
