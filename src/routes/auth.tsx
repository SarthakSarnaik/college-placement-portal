import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — Placement Portal" },
      { name: "description", content: "Sign in or register for the college placement information portal." },
      { property: "og:title", content: "Sign in — Placement Portal" },
      { property: "og:description", content: "Student and TPO access to placement information." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const pwSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "register" | "forgot">("signin");
  const [portal, setPortal] = useState<"student" | "tpo">("student");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  const navigate = useNavigate();
  const search = Route.useSearch();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(f.get("email"));
    const errs: Record<string, string> = {};
    if (!email.success) errs["email"] = email.error.issues[0]!.message;
    let password = "";
    if (mode !== "forgot") {
      const pw = pwSchema.safeParse(f.get("password"));
      if (!pw.success) errs["password"] = pw.error.issues[0]!.message;
      else password = pw.data;
    }
    const name = String(f.get("name") ?? "").trim();
    if (mode === "register" && (name.length < 2 || name.length > 100)) errs["name"] = "Enter your full name";
    setErrors(errs);
    if (Object.keys(errs).length || !email.success) return;

    setBusy(true);
    try {
      if (mode === "signin") {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({ email: email.data, password });
        if (error) throw error;
        const r = search.redirect;
        if (r && r.startsWith("/") && !r.startsWith("//")) {
          navigate({ href: r });
          return;
        }
        if (portal === "tpo") {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", signInData.user.id);
          if (roles?.some((x) => x.role === "admin")) {
            navigate({ to: "/admin" });
          } else {
            toast.error("This account does not have TPO/Admin access. Signed in as a student.");
            navigate({ to: "/dashboard" });
          }
          return;
        }
        navigate({ to: "/dashboard" });
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: email.data,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        setDone("Check your inbox to confirm your email address, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setDone("If an account exists for that email, a password reset link has been sent.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  const titles = { signin: portal === "tpo" ? "TPO / Admin sign in" : "Student sign in", register: "Create student account", forgot: "Reset password" };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r bg-muted p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-7" />
          <span className="font-serif text-xl font-semibold">Placement Portal</span>
        </Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold">Know each recruiter before the drive.</h2>
          <p className="mt-3 text-muted-foreground">
            Eligibility rules, DSA topics, the order of selection rounds and previously asked questions — maintained by your Training & Placement Office.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Content marked “Demo” is sample data and has not been verified.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {mode === "signin" && (
            <div className="mb-6 grid grid-cols-2 gap-px border bg-border" role="tablist" aria-label="Sign in as">
              {(["student", "tpo"] as const).map((p) => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={portal === p}
                  onClick={() => setPortal(p)}
                  className={`px-3 py-2.5 text-sm font-medium ${portal === p ? "bg-background text-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {p === "student" ? "Student" : "TPO / Admin"}
                </button>
              ))}
            </div>
          )}
          <h1 className="text-2xl font-semibold">{titles[mode]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "register"
              ? "New accounts are created with student access. TPO access is granted by an administrator."
              : mode === "signin" && portal === "tpo"
                ? "For placement office staff. Admin access is granted by an existing administrator — it cannot be self-registered."
                : "Use your registered email address."}
          </p>
          {done ? (
            <div role="status" className="mt-6 border border-success/40 bg-success/5 p-4 text-sm">
              {done}
              <Button variant="link" className="mt-2 h-auto p-0" onClick={() => { setDone(null); setMode("signin"); }}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              {mode === "register" && (
                <Field id="name" label="Full name" error={errors["name"]}><Input id="name" name="name" autoComplete="name" /></Field>
              )}
              <Field id="email" label="Email" error={errors["email"]}><Input id="email" name="email" type="email" autoComplete="email" /></Field>
              {mode !== "forgot" && (
                <Field id="password" label="Password" error={errors["password"]}>
                  <Input id="password" name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} />
                </Field>
              )}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : titles[mode]}</Button>
            </form>
          )}
          <div className="mt-6 space-y-2 text-sm">
            {mode === "signin" && (
              <>
                <button className="text-primary hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>
                <p>No account? <button className="text-primary hover:underline" onClick={() => setMode("register")}>Register as a student</button></p>
              </>
            )}
            {mode !== "signin" && <button className="text-primary hover:underline" onClick={() => setMode("signin")}>Back to sign in</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
