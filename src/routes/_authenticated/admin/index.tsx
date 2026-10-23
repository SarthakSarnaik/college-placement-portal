import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Briefcase,
  ClipboardCheck,
  Code2,
  GraduationCap,
  ListChecks,
  FileCode2,
  FileCheck2,
  History,
  Megaphone,
  Users,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  CheckCircle,
  Shield,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/labels";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Placement Portal" }] }),
  component: AdminHome,
});

const tables = [
  {
    table: "companies",
    label: "Companies",
    to: "/admin/companies",
    icon: Building2,
    desc: "Recruiter profiles & publication visibility",
  },
  {
    table: "job_roles",
    label: "Job Roles",
    to: "/admin/roles",
    icon: Briefcase,
    desc: "Roles & packages offered per year",
  },
  {
    table: "eligibility_criteria",
    label: "Eligibility Criteria",
    to: "/admin/criteria",
    icon: ClipboardCheck,
    desc: "CGPA, backlogs & branch criteria",
  },
  {
    table: "dsa_topics",
    label: "DSA Topics",
    to: "/admin/dsa",
    icon: Code2,
    desc: "Coding requirements & priorities",
  },
  {
    table: "cs_fundamentals",
    label: "CS Fundamentals",
    to: "/admin/fundamentals",
    icon: GraduationCap,
    desc: "Core subjects: OS, DBMS, CN, OOP",
  },
  {
    table: "interview_rounds",
    label: "Interview Rounds",
    to: "/admin/rounds",
    icon: ListChecks,
    desc: "Ordered selection stages & guidelines",
  },
  {
    table: "questions",
    label: "DSA Sheet & Questions",
    to: "/admin/questions",
    icon: FileCode2,
    desc: "Day-wise DSA questions & campus drive records",
  },
  {
    table: "sources",
    label: "Source Verification",
    to: "/admin/sources",
    icon: FileCheck2,
    desc: "Debrief sources & authenticity review",
  },
  {
    table: "announcements",
    label: "Announcements",
    to: "/admin/announcements",
    icon: Megaphone,
    desc: "Circulars & placement drive alerts",
  },
  {
    table: "profiles",
    label: "User Management",
    to: "/admin/users",
    icon: Users,
    desc: "Student profiles & admin privileges",
  },
] as const;

export function AdminHome() {
  const q = useQuery({
    queryKey: ["admin", "dashboard_counts"],
    queryFn: async () => {
      const counts = await Promise.all(
        tables.map((t) => supabase.from(t.table).select("id", { count: "exact", head: true })),
      );
      const pending = await supabase
        .from("sources")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      const demo = await supabase
        .from("companies")
        .select("id", { count: "exact", head: true })
        .eq("is_demo", true);
      const unpub = await supabase
        .from("companies")
        .select("id", { count: "exact", head: true })
        .eq("is_published", false);
      const unverifiedQuestions = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .is("source_id", null);

      return {
        counts: counts.map((c) => c.count ?? 0),
        pending: pending.count ?? 0,
        demo: demo.count ?? 0,
        unpub: unpub.count ?? 0,
        unverifiedQuestions: unverifiedQuestions.count ?? 0,
      };
    },
  });

  return (
    <>
      <PageHeader
        title="TPO Administration Console"
        description="Centralized operational console for managing recruiter intelligence, academic cut-offs, algorithmic interview modules, and student access."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="font-semibold text-xs shadow-xs">
              <Link to="/admin/companies">
                <PlusCircle className="size-3.5 mr-1.5" /> Add Company
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/admin/announcements">
                <Megaphone className="size-3.5 mr-1.5" /> Post Notice
              </Link>
            </Button>
          </div>
        }
      />

      {q.isLoading ? (
        <LoadingState label="Loading database records…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        q.data && (
          <div className="space-y-8">
            {/* Moderation Queue Banner */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Action Required · Moderation & Quality Queue
                  </h2>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Updated in real-time from Supabase
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Link
                  to="/admin/sources"
                  className="group rounded-xl border border-border bg-slate-50/70 p-4 transition-all hover:border-amber-400 hover:bg-slate-100 dark:bg-slate-900/40"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Sources Pending Review
                  </p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                      {q.data.pending}
                    </span>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      Review queue{" "}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>

                <Link
                  to="/admin/companies"
                  className="group rounded-xl border border-border bg-slate-50/70 p-4 transition-all hover:border-primary/50 hover:bg-slate-100 dark:bg-slate-900/40"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Unpublished Drafts (Hidden)
                  </p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                      {q.data.unpub}
                    </span>
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      Manage visibility{" "}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>

                <Link
                  to="/admin/companies"
                  className="group rounded-xl border border-border bg-slate-50/70 p-4 transition-all hover:border-teal-500/50 hover:bg-slate-100 dark:bg-slate-900/40"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Sample / Demo Profiles
                  </p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                      {q.data.demo}
                    </span>
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                      Verify to publish{" "}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </div>
            </section>

            {/* Database Modules Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Placement Cell Database Tables
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Manage persistent records with Row-Level Security
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Shield className="size-3.5" />
                  <span>RLS Enforced</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((item, i) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <item.icon className="size-4" />
                        </div>
                        <span className="font-serif text-2xl font-bold tabular-nums text-foreground">
                          {q.data.counts[i]}
                        </span>
                      </div>
                      <h3 className="mt-3.5 font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.label}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center text-xs font-semibold text-primary pt-3 border-t border-border/40">
                      <span>Manage records</span>
                      <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )
      )}
    </>
  );
}
