import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  GraduationCap,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/confirm")({
  validateSearch: z.object({
    code: z.string().optional(),
    token_hash: z.string().optional(),
    type: z.string().optional(),
    next: z.string().optional(),
    error: z.string().optional(),
    error_code: z.string().optional(),
    error_description: z.string().optional(),
    email: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Verifying Email — Placement Portal" },
      {
        name: "description",
        content: "Email confirmation verification for student placement portal.",
      },
    ],
  }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "idle">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState(search.email ?? "");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let isMounted = true;

    async function handleVerification() {
      // 1. Inspect URL hash for Supabase implicit-flow errors or tokens
      const hash =
        typeof window !== "undefined" && window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
      const hashParams = new URLSearchParams(hash);

      const hashError = hashParams.get("error");
      const hashErrorCode = hashParams.get("error_code");
      const hashErrorDesc = hashParams.get("error_description");

      const reportedError = hashErrorDesc || search.error_description || hashError || search.error;
      const reportedErrorCode = hashErrorCode || search.error_code;

      if (reportedError || reportedErrorCode) {
        if (!isMounted) return;
        setStatus("error");
        if (
          reportedErrorCode === "otp_expired" ||
          reportedError?.toLowerCase().includes("expired") ||
          reportedError?.toLowerCase().includes("invalid")
        ) {
          setErrorMessage(
            "This email confirmation link has expired or has already been used. Please request a fresh confirmation link below.",
          );
        } else {
          setErrorMessage(reportedError || "The verification link is invalid or has expired.");
        }
        return;
      }

      // 2. PKCE code exchange flow
      if (search.code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(search.code);
          if (error) throw error;
          if (data.user) {
            await verifyRoleAndRedirect(data.user.id);
            return;
          }
        } catch (err) {
          if (!isMounted) return;
          setStatus("error");
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Failed to exchange verification code. The confirmation link may be expired.",
          );
          return;
        }
      }

      // 3. Token hash verification flow
      if (search.token_hash) {
        try {
          const type = (search.type as "signup" | "email" | "recovery") || "signup";
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: search.token_hash,
            type,
          });
          if (error) throw error;
          if (data.user) {
            await verifyRoleAndRedirect(data.user.id);
            return;
          }
        } catch (err) {
          if (!isMounted) return;
          setStatus("error");
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "The verification token hash is invalid or expired.",
          );
          return;
        }
      }

      // 4. Session check (e.g. Supabase client already parsed hash access_token)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        await verifyRoleAndRedirect(sessionData.session.user.id);
        return;
      }

      // 5. If no tokens or parameters were present
      if (!isMounted) return;
      setStatus("idle");
    }

    async function verifyRoleAndRedirect(userId: string) {
      if (!isMounted) return;
      setStatus("success");

      // Verify user's actual database role from public.user_roles
      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (roleError) {
        await supabase.auth.signOut();
        setStatus("error");
        setErrorMessage("Unable to verify account authorization: " + roleError.message);
        return;
      }

      const isAdmin = !!roles?.some((r) => r.role === "admin");
      if (isAdmin) {
        // Enforce strict separation: admin must not be given student portal
        await supabase.auth.signOut();
        toast.error(
          "This is an administrator account. Please sign in through the TPO/Admin login page.",
        );
        navigate({ to: "/admin/login" });
        return;
      }

      toast.success("Email verified successfully! Welcome to your student dashboard.");
      navigate({ to: "/dashboard" });
    }

    handleVerification();

    return () => {
      isMounted = false;
    };
  }, [search, navigate]);

  async function handleResend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!resendEmail || !resendEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: resendEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Fresh confirmation email dispatched! Please check your inbox.");
      setResendCooldown(60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend confirmation email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm ring-1 ring-white/20">
              <GraduationCap className="size-6" />
            </div>
            <div className="text-left">
              <span className="font-serif text-lg font-bold tracking-tight text-foreground">
                Placement Portal
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                Training & Placement Office
              </span>
            </div>
          </Link>
        </div>

        {/* Main Card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          {status === "verifying" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:bg-teal-500/20">
                <Loader2 className="size-7 animate-spin" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Verifying Your Email
              </h1>
              <p className="text-xs text-muted-foreground">
                Confirming your credentials with the Supabase authentication server. Please wait…
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
                <CheckCircle2 className="size-7" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Email Verified Successfully!
              </h1>
              <p className="text-xs text-muted-foreground">
                Your student account is now active. Preparing your dashboard…
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-5">
              <div className="space-y-2 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20">
                  <AlertTriangle className="size-7" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Verification Link Expired or Invalid
                </h1>
                <p className="text-xs text-muted-foreground">
                  {errorMessage ||
                    "This confirmation link has expired or has already been used to verify an account."}
                </p>
              </div>

              {/* Resend Card */}
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Request a Fresh Confirmation Link
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="resend-email" className="sr-only">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="resend-email"
                        type="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="student@college.edu"
                        className="pl-9 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={resending || resendCooldown > 0}
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                        Sending Link…
                      </>
                    ) : resendCooldown > 0 ? (
                      `Resend available in ${resendCooldown}s`
                    ) : (
                      "Resend Confirmation Email"
                    )}
                  </Button>
                </form>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/auth"
                  className="inline-flex items-center text-xs text-primary hover:underline"
                >
                  <ArrowLeft className="size-3 mr-1" />
                  Back to Student Sign In
                </Link>
              </div>
            </div>
          )}

          {status === "idle" && (
            <div className="space-y-5">
              <div className="space-y-2 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:bg-teal-500/20">
                  <Mail className="size-7" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Confirm Your Student Email
                </h1>
                <p className="text-xs text-muted-foreground">
                  Enter your registered student email below to receive a new confirmation link.
                </p>
              </div>

              <form onSubmit={handleResend} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="idle-resend-email" className="text-xs text-muted-foreground">
                    Registered Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="idle-resend-email"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="pl-9 text-sm"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={resending || resendCooldown > 0}
                >
                  {resending ? (
                    <>
                      <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                      Dispatching Link…
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend available in ${resendCooldown}s`
                  ) : (
                    "Send Confirmation Email"
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  to="/auth"
                  className="inline-flex items-center text-xs text-primary hover:underline"
                >
                  <ArrowLeft className="size-3 mr-1" />
                  Back to Student Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
