import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  Building2,
  Code2,
  ListOrdered,
  FileCode2,
  GraduationCap,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Megaphone,
  Briefcase,
  Filter,
  Search,
} from "lucide-react";
import { useMe } from "@/lib/auth";
import { announcementsQuery, companiesQuery, fmtDate } from "@/lib/queries";
import { PageHeader, DemoTag, DifficultyTag, VerifyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Student Dashboard — Placement Portal" }] }),
  component: Dashboard,
});

const journey = [
  {
    to: "/companies",
    icon: Building2,
    step: "01",
    title: "Explore Recruiters",
    body: "Browse campus recruiters and check CGPA, backlogs, and branch eligibility criteria.",
  },
  {
    to: "/dsa",
    icon: Code2,
    step: "02",
    title: "DSA Roadmaps",
    body: "Master algorithms and data structures prioritized by recruiting frequency.",
  },
  {
    to: "/fundamentals",
    icon: GraduationCap,
    step: "03",
    title: "CS Fundamentals",
    body: "Revise core concepts in DBMS, Operating Systems, Computer Networks & OOP.",
  },
  {
    to: "/rounds",
    icon: ListOrdered,
    step: "04",
    title: "Selection Rounds",
    body: "Step through ordered interview stages with purpose and actionable preparation tips.",
  },
] as const;

function Dashboard() {
  const { data: me } = useMe();
  const companies = useQuery(companiesQuery);
  const ann = useQuery(announcementsQuery);

  const [myBranch, setMyBranch] = useState("");
  const [myCgpa, setMyCgpa] = useState("");

  const eligibleCount = useMemo(() => {
    if (!companies.data) return 0;
    return companies.data.filter((c) => {
      const cur = c.eligibility_criteria?.find((e) => e.is_current) ?? c.eligibility_criteria?.[0];
      if (!cur) return true;
      if (myBranch && cur.branches && !cur.branches.toUpperCase().includes(myBranch.toUpperCase()))
        return false;
      if (myCgpa && cur.min_cgpa != null && Number(cur.min_cgpa) > Number(myCgpa)) return false;
      return true;
    }).length;
  }, [companies.data, myBranch, myCgpa]);

  const totalRolesCount = useMemo(() => {
    if (!companies.data) return 0;
    return companies.data.reduce((acc, c) => acc + (c.job_roles?.length ?? 0), 0);
  }, [companies.data]);

  const firstName = me?.fullName ? me.fullName.split(" ")[0] : "Student";

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold text-teal-800 dark:text-teal-300">
              <Calendar className="size-3.5" />
              <span>Drive Season 2025–2026</span>
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome, {firstName}
            </h1>
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Prepare systematically from your first semester onwards. Track recruiter expectations,
              master tested topics, and follow round-by-round selection guidelines.
            </p>
          </div>

          {/* Quick Eligibility Tool */}
          <div className="rounded-xl border border-border/80 bg-slate-50/70 p-4 shadow-xs dark:bg-slate-900/50 lg:w-84">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Eligibility Calculator
              </p>
              <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-medium">
                Live Matching
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={myBranch}
                onChange={(e) => setMyBranch(e.target.value)}
                aria-label="Select your engineering branch"
              >
                <option value="">Branch (All)</option>
                {["CSE", "IT", "ECE", "EEE", "EIE", "MECH", "CIVIL"].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="My CGPA (e.g. 7.5)"
                value={myCgpa}
                onChange={(e) => setMyCgpa(e.target.value)}
                className="h-9 text-xs"
                aria-label="Your CGPA"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
              <span className="text-muted-foreground">Eligible Opportunities:</span>
              <span className="font-mono text-sm font-bold text-teal-700 dark:text-teal-400">
                {eligibleCount} / {companies.data?.length ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Real Data Metrics Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/70 pt-6 sm:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-background/50 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Recruiters
            </span>
            <p className="mt-1 font-serif text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              {companies.data?.length ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Job Roles
            </span>
            <p className="mt-1 font-serif text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              {totalRolesCount}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Preparation Modules
            </span>
            <p className="mt-1 font-serif text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              4
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Circulars
            </span>
            <p className="mt-1 font-serif text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              {ann.data?.length ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* 4-Step Placement Roadmap */}
      <section aria-labelledby="roadmap-heading">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="roadmap-heading" className="text-lg font-bold tracking-tight text-foreground">
              Your Placement Journey
            </h2>
            <p className="text-xs text-muted-foreground">
              Follow this four-step strategy to maximize your campus placement offers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/questions">
                <FileCode2 className="size-3.5 mr-1 text-primary" /> DSA Sheet
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
              <Link to="/prep">Year Guide →</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((j) => (
            <Link
              key={j.to}
              to={j.to}
              className="group flex flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                    STEP {j.step}
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <j.icon className="size-4" strokeWidth={1.8} />
                  </div>
                </div>
                <h3 className="mt-3 font-semibold text-foreground group-hover:text-primary">
                  {j.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{j.body}</p>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                <span>View module</span>
                <ArrowRight className="size-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content Split: Companies Table + Announcements */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Recruiting Companies Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Recruiting Companies
              </h2>
              <p className="text-xs text-muted-foreground">
                Recruiters currently published by the Placement Office
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/companies">View all ({companies.data?.length ?? 0})</Link>
            </Button>
          </div>

          {companies.isLoading ? (
            <LoadingState label="Loading recruiter directory…" />
          ) : companies.error ? (
            <ErrorState error={companies.error} onRetry={() => companies.refetch()} />
          ) : !companies.data?.length ? (
            <EmptyState
              title="No companies published yet"
              body="The Placement Office has not published active company profiles for this season."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
                    <tr>
                      <th className="px-4 py-3">Recruiter</th>
                      <th className="px-4 py-3">Roles Offered</th>
                      <th className="px-4 py-3">Min. CGPA</th>
                      <th className="px-4 py-3">DSA Level</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {companies.data.slice(0, 6).map((c) => {
                      const cur =
                        c.eligibility_criteria?.find((e) => e.is_current) ??
                        c.eligibility_criteria?.[0];
                      const initials = c.name
                        .replace(/\(.*?\)/g, "")
                        .trim()
                        .split(/\s+/);
                      const initialText =
                        initials.length >= 2
                          ? `${initials[0]![0]}${initials[1]![0]}`.toUpperCase()
                          : c.name.slice(0, 2).toUpperCase();
                      return (
                        <tr
                          key={c.id}
                          className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-100 font-mono text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                {initialText}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  to="/companies/$id"
                                  params={{ id: c.id }}
                                  className="font-semibold text-foreground hover:text-primary hover:underline"
                                >
                                  {c.name}
                                </Link>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <span>{c.sector}</span>
                                  {c.is_demo && <DemoTag />}
                                  <VerifyTag status={c.verification_status} />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className="line-clamp-1 max-w-[180px]">
                              {(c.job_roles ?? []).map((r) => r.title).join(", ") || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-medium tabular-nums text-foreground">
                            {cur?.min_cgpa != null ? cur.min_cgpa : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <DifficultyTag level={c.dsa_difficulty} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-medium text-primary hover:bg-primary/10"
                            >
                              <Link to="/companies/$id" params={{ id: c.id }}>
                                View <ChevronRight className="size-3 ml-0.5" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Announcements & Placement Notices */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Notices & Alerts
              </h2>
              <p className="text-xs text-muted-foreground">Official TPO announcements</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-primary">
              <Link to="/announcements">All circulars →</Link>
            </Button>
          </div>

          {ann.isLoading ? (
            <LoadingState label="Loading notices…" />
          ) : ann.error ? (
            <ErrorState error={ann.error} onRetry={() => ann.refetch()} />
          ) : !ann.data?.length ? (
            <EmptyState title="No active announcements" />
          ) : (
            <div className="space-y-3">
              {ann.data.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono text-[10px]">{fmtDate(a.published_at)}</span>
                    {a.is_demo && <DemoTag />}
                  </div>
                  <h3 className="mt-1 font-serif text-sm font-semibold text-foreground">
                    {a.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {a.body}
                  </p>
                  {a.companies && (
                    <div className="mt-2.5 pt-2 border-t border-border/50 text-[11px]">
                      <Link
                        to="/companies/$id"
                        params={{ id: a.companies.id }}
                        className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                      >
                        Company: {a.companies.name} →
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
