import React, { useEffect, useState } from "react";
import { LogOut, Mail, Pencil, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initialsOf(name) {
  if (!name) return "LG";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function UserMenu() {
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [subject, setSubject] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const name = user?.full_name || "Signed in";
  const roleLabel = user?.role === "admin" ? "Teacher account" : "Student account";

  useEffect(() => {
    if (!profileOpen) return;
    setFullName(user?.full_name || "");
    setSubject(user?.subject || "");
    setSchool(user?.school || "");
    setError("");
  }, [profileOpen, user]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const details = { full_name: fullName };
      if (user?.role === "admin") Object.assign(details, { subject, school });
      await updateProfile(details);
      setProfileOpen(false);
    } catch (cause) {
      setError(cause.message || "We could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-full border border-border bg-card px-1.5 py-1.5 pr-3 text-left transition hover:bg-white"
          aria-label="Account menu"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
            {initialsOf(name)}
          </span>
          <span className="hidden text-xs font-semibold text-ink sm:block">{name.split(" ")[0]}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <span className="block text-sm font-bold text-ink">{name}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-inkMuted">
              <Mail className="h-3 w-3" aria-hidden="true" />
              {user?.email || "sample account"}
            </span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-navy-500">
              {roleLabel}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-sm font-semibold" onSelect={() => setProfileOpen(true)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-sm font-semibold"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update the details shown in your LittleGenius account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </div>
            {user?.role === "admin" && <>
              <div className="space-y-2">
                <Label htmlFor="profile-subject">Teaching subjects</Label>
                <Input id="profile-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-school">School</Label>
                <Input id="profile-school" value={school} onChange={(event) => setSchool(event.target.value)} />
              </div>
            </>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Save profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
