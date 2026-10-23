import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    redirect: z.string().optional(),
    mode: z.enum(["signin", "register", "forgot", "verify"]).optional(),
    email: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }),
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
      { title: "Student Sign In & Registration — Placement Portal" },
      {
        name: "description",
        content: "Sign in or register for the college placement and career information portal.",
      },
      { property: "og:title", content: "Student Sign In — Placement Portal" },
      {
        property: "og:description",
        content: "Student access to recruiter requirements, DSA topics, and placement rounds.",
      },
    ],
  }),
  component: StudentAuthPage,
});

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid college or personal email address")
  .max(255);
const pwSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function StudentAuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "register" | "forgot" | "verify">(
    search.mode ?? "signin",
  );
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationEmail, setVerificationEmail] = useState(search.email ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function onResendConfirmation() {
    if (!verificationEmail || !verificationEmail.includes("@")) {
      toast.error("Please provide a valid email address to resend confirmation.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: verificationEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) throw error;
      toast.success("Confirmation email resent! Please check your inbox and spam folder.");
      setResendCooldown(60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend confirmation email.");
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(f.get("email"));
    const errs: Record<string, string> = {};

    if (!email.success) errs["email"] = email.error.issues[0]!.message;

    let password = "";
    if (mode === "signin" || mode === "register") {
      const pw = pwSchema.safeParse(f.get("password"));
      if (!pw.success) errs["password"] = pw.error.issues[0]!.message;
      else password = pw.data;
    }

    const name = String(f.get("name") ?? "").trim();
    if (mode === "register" && (name.length < 2 || name.length > 100)) {
      errs["name"] = "Enter your full student name";
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
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setVerificationEmail(email.data);
            setMode("verify");
            toast.info("Please verify your email address to complete sign in.");
            return;
          }
          throw error;
        }

        if (!signInData.user) throw new Error("Authentication failed.");

        // Check user role strictly from database
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", signInData.user.id);

        if (roleError) {
          await supabase.auth.signOut();
          throw new Error("Unable to verify account authorization: " + roleError.message);
        }

        const isAdmin = !!roles?.some((r) => r.role === "admin");
        if (isAdmin) {
          // Immediately sign out newly created session and reject admin sign-in on student auth
          await supabase.auth.signOut();
          toast.error(
            "This is an administrator account. Please sign in through the TPO/Admin login page.",
          );
          return;
        }

        const isStudent = !!roles?.some((r) => r.role === "student");
        if (!isStudent && (!roles || roles.length === 0)) {
          await supabase.auth.signOut();
          toast.error("No account role found. Please contact the administrator.");
          return;
        }

        toast.success("Welcome back! Signed in as student.");

        // Redirect based on role and search query (ensure student never gets redirected to admin area)
        const redirectPath = search.redirect;
        if (
          redirectPath &&
          redirectPath.startsWith("/") &&
          !redirectPath.startsWith("//") &&
          !redirectPath.startsWith("/admin")
        ) {
          navigate({ to: redirectPath as never });
          return;
        }

        navigate({ to: "/dashboard" });
      } else if (mode === "register") {
        // Strict student registration: No role parameter accepted, defaulted to student in backend
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.data,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        // If session was immediately established (auto-confirm enabled)
        if (signUpData.session) {
          toast.success("Student account created successfully!");
          navigate({ to: "/dashboard" });
          return;
        }

        setVerificationEmail(email.data);
        setDoneMessage("A confirmation email has been dispatched to " + email.data + ".");
        setMode("verify");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setDoneMessage(
          "If an account exists for that email, a password recovery link has been sent.",
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      toast.error("Please enter the 6-digit confirmation code.");
      return;
    }

    setBusy(true);
    try {
      let otpRes = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: otpCode.trim(),
        type: "signup",
      });

      if (otpRes.error) {
        // Try recovery or magiclink type as fallback
        const otpRes2 = await supabase.auth.verifyOtp({
          email: verificationEmail,
          token: otpCode.trim(),
          type: "email",
        });
        if (otpRes2.error) throw otpRes2.error;
        otpRes = otpRes2;
      }

      const verifiedUser = otpRes.data?.user;
      if (verifiedUser) {
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", verifiedUser.id);

        if (roleError) {
          await supabase.auth.signOut();
          throw new Error("Unable to verify account authorization: " + roleError.message);
        }

        const isAdmin = !!roles?.some((r) => r.role === "admin");
        if (isAdmin) {
          await supabase.auth.signOut();
          toast.error(
            "This is an administrator account. Please sign in through the TPO/Admin login page.",
          );
          return;
        }
      }

      toast.success("Email verified successfully! Welcome to the portal.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired verification code.");
    } finally {
      setBusy(false);
    }
  }

  const titles = {
    signin: "Student Sign In",
    register: "Create Student Account",
    forgot: "Reset Your Password",
    verify: "Verify Email Address",
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      {/* Left panel - Student Hero */}
      <div className="hidden flex-col justify-between border-r border-border bg-gradient-to-b from-slate-900 to-slate-950 p-12 text-white lg:flex">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm ring-1 ring-white/20">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                Placement Portal
              </span>
              <span className="block text-xs uppercase tracking-widest text-slate-400">
                Training & Placement Office
              </span>
            </div>
          </Link>

          <div className="mt-20 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300">
              Student Career Network
            </div>
            <h2 className="mt-5 font-serif text-3xl font-semibold leading-snug tracking-tight text-white">
              Prepare for campus recruitment drives from day one.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Access verified eligibility cut-offs, company-specific DSA roadmaps, ordered interview
              round structures, and genuine interview questions from previous campus drives.
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-800/80 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5">
              <p className="text-xs text-slate-400">Company Requirements</p>
              <p className="mt-1 font-serif text-lg font-semibold text-white">Curated by TPO</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5">
              <p className="text-xs text-slate-400">Previous Questions</p>
              <p className="mt-1 font-serif text-lg font-semibold text-white">
                Verified Past 3 Years
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            All records marked “Verified” have been cross-checked with official placement debriefs.
          </p>
        </div>
      </div>

      {/* Right panel - Student Form */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          {/* Top Brand Link on Mobile */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="size-6 text-primary" />
              <span className="font-serif text-lg font-bold">Placement Portal</span>
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{titles[mode]}</h1>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {mode === "signin"
                  ? "Access your student placement dashboard and company profiles."
                  : mode === "register"
                    ? "Register as an enrolled college student using your email."
                    : mode === "verify"
                      ? "Check your inbox to confirm your email address or enter your code below."
                      : "Enter your registered email to receive a password reset link."}
              </p>
            </div>

            {/* Verification / OTP Mode */}
            {mode === "verify" ? (
              <div className="space-y-4">
                {/* Primary Card: Confirmation Email Link */}
                <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-4 text-xs text-teal-950 dark:text-teal-200 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Mail className="size-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-teal-900 dark:text-teal-100">
                        Check your inbox at{" "}
                        <span className="font-mono underline">
                          {verificationEmail || "your email"}
                        </span>
                      </p>
                      <p className="text-teal-800 dark:text-teal-300 leading-relaxed">
                        We sent a secure activation link to your email address. Click the
                        confirmation link in the email to activate your student account.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onResendConfirmation}
                      disabled={resending || resendCooldown > 0}
                      className="w-full border-teal-500/40 bg-white/70 hover:bg-white text-teal-900 dark:bg-slate-900/80 dark:hover:bg-slate-900 dark:text-teal-200"
                    >
                      {resending ? (
                        <>
                          <RefreshCw className="size-3 mr-1.5 animate-spin" />
                          Sending Email…
                        </>
                      ) : resendCooldown > 0 ? (
                        `Resend email available in ${resendCooldown}s`
                      ) : (
                        <>
                          <RefreshCw className="size-3 mr-1.5" />
                          Resend Confirmation Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Secondary Option: 6-digit OTP code */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <KeyRound className="size-3.5 text-muted-foreground" />
                    <span>Or enter 6-digit confirmation code</span>
                  </div>

                  <form onSubmit={onVerifyOtp} className="space-y-3">
                    <div className="relative">
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        maxLength={8}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="text-base tracking-widest font-mono text-center"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={busy || !otpCode}>
                      {busy ? "Verifying Code…" : "Verify Code & Continue"}
                    </Button>
                  </form>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => {
                    setMode("signin");
                    setDoneMessage(null);
                  }}
                >
                  <ArrowLeft className="size-3 mr-1" /> Back to Sign In
                </Button>
              </div>
            ) : doneMessage ? (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200">
                <p className="font-medium">Request Sent</p>
                <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">{doneMessage}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setDoneMessage(null);
                    setMode("signin");
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                {mode === "register" && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="student-name"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="student-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="e.g. Sarthak Sarnaik"
                        className="pl-9 text-sm"
                      />
                    </div>
                    {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="student-email"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    College or Personal Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="student-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="student@college.edu"
                      className="pl-9 text-sm"
                    />
                  </div>
                  {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="student-password"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Password
                      </Label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="student-password"
                        name="password"
                        type="password"
                        autoComplete={mode === "register" ? "new-password" : "current-password"}
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
                    ? "Processing…"
                    : mode === "signin"
                      ? "Sign In as Student"
                      : mode === "register"
                        ? "Register Student Account"
                        : "Send Recovery Email"}
                </Button>
              </form>
            )}

            {/* Toggle Modes */}
            <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground space-y-2">
              {mode === "signin" && (
                <p>
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={() => setMode("register")}
                  >
                    Register as student
                  </button>
                </p>
              )}
              {mode === "register" && (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={() => setMode("signin")}
                  >
                    Sign in to your account
                  </button>
                </p>
              )}
              {mode === "forgot" && (
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => setMode("signin")}
                >
                  <ArrowLeft className="size-3 inline mr-1" /> Back to student sign in
                </button>
              )}
            </div>
          </div>

          {/* Discreet Admin Portal Link */}
          <div className="mt-8 rounded-lg border border-border/80 bg-slate-50 dark:bg-slate-900/40 p-3.5 text-center text-xs text-muted-foreground">
            <span>Training & Placement Officer or Faculty Coordinator?</span>{" "}
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline ml-1"
            >
              <Shield className="size-3" /> Admin Portal Sign In <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
