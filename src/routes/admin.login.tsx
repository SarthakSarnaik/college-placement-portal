import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const isAdmin = !!roles?.some((r) => r.role === "admin");
      if (isAdmin) {
        throw redirect({ to: "/admin/dashboard" });
      } else {
        throw redirect({ to: "/dashboard" });
      }
    }
  },
  head: () => ({
    meta: [
      { title: "TPO / Admin Sign In — Placement Portal" },
      {
        name: "description",
        content: "Administrative sign-in for college Training & Placement Office staff.",
      },
      { property: "og:title", content: "TPO / Admin Sign In — Placement Portal" },
      {
        property: "og:description",
        content: "Authorized access for college placement administration.",
      },
    ],
  }),
  component: AdminLoginPage,
});

const emailSchema = z.string().trim().email("Enter a valid official email address").max(255);
const pwSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function AdminLoginPage() {
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetDone, setResetDone] = useState(false);
  const navigate = useNavigate();
  const search = Route.useSearch();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(f.get("email"));
    const errs: Record<string, string> = {};

    if (!email.success) errs["email"] = email.error.issues[0]!.message;

    let password = "";
    if (mode === "signin") {
      const pw = pwSchema.safeParse(f.get("password"));
      if (!pw.success) errs["password"] = pw.error.issues[0]!.message;
      else password = pw.data;
    }

    setErrors(errs);
    if (Object.keys(errs).length || !email.success) return;

    setBusy(true);
    try {
      if (mode === "signin") {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: email.data,
          password,
        });

        if (error) {
          throw error;
        }

        if (!signInData.user) {
          throw new Error("Unable to authenticate user.");
        }

        // Verify admin role strictly on the backend
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", signInData.user.id);

        if (roleError) {
          await supabase.auth.signOut();
          throw new Error("Error verifying administrative authorization: " + roleError.message);
        }

        const isAdmin = !!roles?.some((r) => r.role === "admin");
        if (!isAdmin) {
          // Strictly block student or unprivileged accounts from admin access
          await supabase.auth.signOut();
          toast.error("This account does not have administrator access. Please use Student Login.");
          return;
        }

        toast.success("Administrator access verified. Welcome to the Placement Cell console.");

        const target =
          search.redirect && search.redirect.startsWith("/admin")
            ? search.redirect
            : "/admin/dashboard";
        navigate({ to: target as never });
      } else {
        // Forgot password flow
        const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setResetDone(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      {/* Left panel - Institutional branding */}
      <div className="hidden flex-col justify-between border-r border-border bg-slate-900 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm ring-1 ring-white/20">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                Placement Portal
              </span>
              <span className="block text-xs uppercase tracking-widest text-slate-400">
                Training & Placement Office
              </span>
            </div>
          </div>

          <div className="mt-20 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300">
              <Lock className="size-3" /> Staff & Coordinator Console
            </div>
            <h2 className="mt-5 font-serif text-3xl font-semibold leading-snug tracking-tight text-white">
              Official Placement Administration & Recruiter Management
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Securely manage campus recruitment drives, publish verified eligibility criteria,
              maintain interview round structures, and track student placement data.
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-800 pt-6">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <CheckCircle2 className="size-4 text-teal-400" />
            <span>End-to-end Row Level Security & server-enforced role management</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <CheckCircle2 className="size-4 text-teal-400" />
            <span>Audit-ready historical criteria versions & verified question bank</span>
          </div>
          <p className="pt-2 text-[11px] text-slate-500">
            Unauthorized access attempts are logged and monitored. Only designated TPO faculty and
            administrators are permitted to proceed.
          </p>
        </div>
      </div>

      {/* Right panel - Administrative Login Form */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          {/* Back to Student Portal Link */}
          <Link
            to="/auth"
            className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to Student Portal
          </Link>

          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {mode === "signin" ? "TPO / Admin Sign In" : "Reset Admin Password"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {mode === "signin"
                    ? "Enter your official institutional credentials"
                    : "Enter your registered administrator email"}
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mb-6 rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-semibold">Restricted Access:</span> This portal is strictly
                for Placement Office administrators. Admin accounts cannot be self-registered and
                must be provisioned by a current administrator.
              </div>
            </div>

            {resetDone ? (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200">
                <p className="font-medium">Password reset email dispatched.</p>
                <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                  If an authorized admin account exists with that email address, check your inbox
                  for instructions to set a new password.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setResetDone(false);
                    setMode("signin");
                  }}
                >
                  Return to Admin Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="admin-email"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Official Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="admin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="admin@college.edu"
                      className="pl-9 text-sm"
                    />
                  </div>
                  {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
                </div>

                {mode === "signin" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="admin-password"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="admin-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        className="pl-9 text-sm"
                      />
                    </div>
                    {errors["password"] && (
                      <p className="text-xs text-destructive">{errors["password"]}</p>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full font-medium" disabled={busy}>
                  {busy
                    ? "Authenticating…"
                    : mode === "signin"
                      ? "Sign In as Administrator"
                      : "Send Reset Link"}
                </Button>

                {mode === "forgot" && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-xs text-muted-foreground"
                    onClick={() => setMode("signin")}
                  >
                    Cancel and return to sign in
                  </Button>
                )}
              </form>
            )}
          </div>

          {/* Student Portal Switcher Note */}
          <div className="mt-8 rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            <p>Are you a student preparing for placements?</p>
            <Link
              to="/auth"
              className="mt-1.5 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              Go to Student Sign In & Registration <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
