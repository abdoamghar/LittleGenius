import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Loader2, Lock, Mail, UserPlus, BookOpenText, UserRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";
import { cn } from "@/lib/utils";

const roles = [
  { id: "student", label: "Student", icon: BookOpenText },
  { id: "teacher", label: "Teacher", icon: GraduationCap },
];

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [classCode, setClassCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters for the password.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await register({ name, email, password, role, dateOfBirth, classCode });
      const returnTo = safeReturnTo(searchParams.get("returnTo"));
      router.replace(returnTo !== "/" ? returnTo : role === "teacher" ? "/teacher" : "/student");
    } catch (registrationError) {
      setError(registrationError.message || "We could not create that account.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create an account"
      subtitle="Create a secure LittleGenius account to access your teacher or student workspace."
      footer={<>Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      <div className="mb-5 grid grid-cols-2 gap-2" role="group" aria-label="Account type">
        {roles.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={role === id}
            onClick={() => setRole(id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition",
              role === id ? "border-navy-600 bg-navy-50 text-navy-700" : "border-border bg-card text-inkMuted hover:border-navy-300",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        {role !== "teacher" ? (
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input id="dateOfBirth" type="date" autoComplete="bday" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="h-12" required />
            <p className="text-xs text-muted-foreground">Student accounts are for ages 6–12.</p>
            <Label htmlFor="classCode">Class code <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="classCode" autoComplete="off" value={classCode} onChange={(event) => setClassCode(event.target.value.toUpperCase())} className="h-12" placeholder="CLS-1234" />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pl-10" minLength={8} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 pl-10" minLength={8} required />
          </div>
        </div>
        <Button type="submit" className="h-12 w-full gap-2" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Creating account…</> : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
