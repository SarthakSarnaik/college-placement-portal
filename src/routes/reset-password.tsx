import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — Placement Portal" },
      { name: "description", content: "Choose a new password for your placement portal account." },
      { property: "og:title", content: "Set new password — Placement Portal" },
      { property: "og:description", content: "Password recovery for the placement portal." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("password"));
    if (pw.length < 8) return setErr("Password must be at least 8 characters");
    if (pw !== f.get("confirm")) return setErr("Passwords do not match");
    setErr("");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <div className="space-y-1.5"><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" /></div>
        <div className="space-y-1.5"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" name="confirm" type="password" /></div>
        {err && <p className="text-xs text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
      </form>
    </div>
  );
}
