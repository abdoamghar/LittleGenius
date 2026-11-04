import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, BookOpenText, CircleCheck, GraduationCap, Loader2, Lock, Mail, PencilLine, Sparkles, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrandMark from "@/components/layout/BrandMark";
import { safeReturnTo } from "@/lib/authReturnTo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const ROLES = [
  {
    id: "student",
    label: "I’m a student",
    icon: BookOpenText,
    blurb: "Use the email and password your teacher gave you.",
  },
  {
    id: "teacher",
    label: "I’m a teacher",
    icon: GraduationCap,
    blurb: "Use your school email address.",
  },
];

export default function Login() {
  const { login } = useAuth();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const onTeacherEntry = pathname.startsWith("/teacher");
  const [role, setRole] = useState(onTeacherEntry ? "teacher" : "student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Enter your email so we know who is signing in.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "That email looks incomplete — check for a typo.";
    if (!password) next.password = "Enter your password.";
    else if (password.length < 8) next.password = "Passwords are at least 8 characters long.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(email.trim(), password, role);
      const accountHome = user?.role === "admin" ? "/teacher" : "/student";
      router.replace(returnTo !== "/" ? returnTo : accountHome);
    } catch (err) {
      setError(err.message || "That email and password do not match. Please try again.");
      setLoading(false);
    }
  };

  const active = ROLES.find((r) => r.id === role);

  return (
    <div className="lg-auth-world lg-login-page grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* learning story panel */}
      <section className="lg-login-story relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-border/80 px-8 py-7 text-ink lg:flex xl:px-12">
        <div className="pointer-events-none absolute -left-20 top-28 h-64 w-64 rounded-full bg-sun-200/40 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 right-8 h-72 w-72 rounded-full bg-leaf-100/60 blur-3xl" aria-hidden="true" />
        <div className="relative z-10">
          <BrandMark withTagline />
        </div>

        <div className="lg-login-story-content relative z-10 mx-auto w-full max-w-xl py-8">
          <p className="lg-page-kicker mb-4 gap-2 border-leaf-200 bg-leaf-50 text-leaf-600">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            A place to learn and grow
          </p>
          <h1 className="max-w-lg font-display text-4xl font-extrabold leading-[1.08] text-navy-800 xl:text-5xl">
            Little steps can lead to big discoveries.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-inkMuted">
            Read a lesson, try a fun activity, and see how much you have learned. Teachers are here to help every step of the way.
          </p>

          <div className="lg-login-journey relative mt-7 overflow-hidden rounded-[2rem] border border-border bg-card/90 px-5 py-5 shadow-paper sm:px-6">
            <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.16em] text-navy-600">Your learning trail</p>
            <svg className="pointer-events-none absolute left-10 top-[4.4rem] h-[7.25rem] w-16 text-sun-400/80" viewBox="0 0 48 116" fill="none" aria-hidden="true">
              <path d="M24 4C48 22 2 34 24 55C46 76 2 89 24 112" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" />
            </svg>
            <ol className="relative z-10 space-y-3">
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-100 text-navy-700 ring-4 ring-card"><BookOpenText className="h-4 w-4" aria-hidden="true" /></span>
                <span className="text-sm font-bold text-ink">Read something new</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sun-100 text-sun-600 ring-4 ring-card"><PencilLine className="h-4 w-4" aria-hidden="true" /></span>
                <span className="text-sm font-bold text-ink">Try it for yourself</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-100 text-leaf-700 ring-4 ring-card"><Sprout className="h-4 w-4" aria-hidden="true" /></span>
                <span className="text-sm font-bold text-ink">Watch your knowledge grow</span>
              </li>
            </ol>
            <Image
              src="/learning-art/student-corner.webp"
              alt="Pip the fox helping a little plant grow."
              fittingType="fit"
              className="pointer-events-none absolute -bottom-2 -right-4 hidden h-44 w-44 object-contain sm:block xl:h-48 xl:w-48"
            />
            <div className="mt-4 flex items-center gap-2 border-t border-border/80 pt-3 text-xs font-semibold text-inkMuted sm:max-w-[60%]">
              <CircleCheck className="h-4 w-4 shrink-0 text-leaf-600" aria-hidden="true" />
              Teachers check activities before learners see them.
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs font-semibold text-navy-700/70">
          For curious learners, ages 6–12, and the teachers who guide them.
        </p>
      </section>

      {/* sign-in panel */}
      <section className="lg-login-form flex items-center justify-center px-4 py-10 md:px-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <BrandMark withTagline />
          </div>

          <div className="lg-card space-y-6 p-6 md:p-7">
            <header className="space-y-1.5">
              <h2 className="font-display text-2xl font-bold text-ink">Sign in to LittleGenius</h2>
              <p className="text-sm text-inkMuted">Pick your side of the classroom to start.</p>
            </header>

            <div role="group" aria-label="Who is signing in" className="grid gap-2 sm:grid-cols-2">
              {ROLES.map((option) => {
                const Icon = option.icon;
                const isActive = role === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setRole(option.id);
                      setFieldErrors({});
                      setError("");
                    }}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-2xl border-2 px-4 py-3 text-left transition",
                      isActive ? "border-navy-600 bg-navy-50 shadow-paper" : "border-border bg-paper hover:border-navy-300"
                    )}
                  >
                    <span className="flex items-center gap-2 font-bold text-ink">
                      <Icon className={cn("h-4 w-4", isActive ? "text-navy-600" : "text-inkMuted")} aria-hidden="true" />
                      {option.label}
                    </span>
                    <span className="text-xs font-semibold text-inkMuted">{option.blurb}</span>
                  </button>
                );
              })}
            </div>

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  {role === "teacher" ? "School email" : "Email"}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkMuted" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder={role === "teacher" ? "you@school.example" : "you@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-10"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  />
                </div>
                {fieldErrors.email ? (
                  <p id="email-error" role="alert" className="text-sm font-semibold text-coral-600">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkMuted" aria-hidden="true" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  />
                </div>
                {fieldErrors.password ? (
                  <p id="password-error" role="alert" className="text-sm font-semibold text-coral-600">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Signing you in…
                  </>
                ) : (
                  <>
                    {active?.id === "teacher" ? (
                      <GraduationCap className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <BookOpenText className="h-5 w-5" aria-hidden="true" />
                    )}
                    Sign in as {active?.id === "teacher" ? "a teacher" : "a student"}
                  </>
                )}
              </Button>
            </form>

            <p className="text-sm text-inkMuted">
              New to LittleGenius?{" "}
              <Link
                href={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
                className="font-bold text-navy-600 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
