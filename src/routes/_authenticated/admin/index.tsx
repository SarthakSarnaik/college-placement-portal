import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Briefcase,
  Code2,
  GraduationCap,
  ListChecks,
  FileCode2,
  FileCheck2,
  History,
  Megaphone,
  Users,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PageHeader, VerifyTag, DifficultyTag, DemoTag } from "@/components/labels";
import { LoadingState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Placement Portal" }] }),
  component: AdminHome,
});

type UpcomingCriteria = {
  year: number;
  min_cgpa: number | null;
  min_10th_percentage: number | null;
  min_12th_percentage: number | null;
  branches: string;
  is_current: boolean;
};

type UpcomingCompany = {
  id: string;
  name: string;
  sector: string;
  headquarters: string;
  first_visit_year: number | null;
  dsa_difficulty: Database["public"]["Enums"]["difficulty"];
  is_published: boolean;
  eligibility_criteria: UpcomingCriteria[];
};

type RelationalCompany = { id?: string; name: string; sector?: string };

type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  published_at: string;
  category: string;
  is_priority: boolean;
  companies: RelationalCompany | RelationalCompany[] | null;
};

type CriteriaActivityItem = {
  id: string;
  year: number;
  min_cgpa: number | null;
  min_10th_percentage: number | null;
  min_12th_percentage: number | null;
  max_backlogs: number | null;
  branches: string;
  is_current: boolean;
  created_at: string;
  companies: RelationalCompany | RelationalCompany[] | null;
};

type RecentJobRoleItem = {
  id: string;
  title: string;
  hiring_year: number;
  location: string | null;
  ctc_note: string | null;
  created_at: string;
  companies: RelationalCompany | RelationalCompany[] | null;
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getCompanyName(
  companies: RelationalCompany | RelationalCompany[] | null | undefined,
): string | null {
  if (!companies) return null;
  if (Array.isArray(companies)) {
    return companies[0]?.name ?? null;
  }
  return companies.name ?? null;
}

export function AdminHome() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "dashboard_data"],
    queryFn: async () => {
      // 1. Top Overview Metric Counts (Real Supabase Data)
      const [
        studentsRes,
        profilesRes,
        companiesRes,
        rolesRes,
        publishedCompaniesRes,
        pendingSourcesRes,
      ] = await Promise.all([
        supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("job_roles").select("id", { count: "exact", head: true }),
        supabase
          .from("companies")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),
        supabase
          .from("sources")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      const totalStudents =
        (studentsRes.count ?? 0) > 0 ? studentsRes.count! : (profilesRes.count ?? 0);
      const totalCompanies = companiesRes.count ?? 0;
      const activeJobRoles = rolesRes.count ?? 0;
      const activeDrives = publishedCompaniesRes.count ?? 0;
      const pendingSources = pendingSourcesRes.count ?? 0;

      // 2. Recent Company Registrations (Latest 5)
      const { data: recentCompanies } = await supabase
        .from("companies")
        .select(
          "id, name, sector, headquarters, first_visit_year, is_published, verification_status, is_demo, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(5);

      // 3. Upcoming Recruitment Drives (Published Recruiters)
      const { data: upcomingDrives } = await supabase
        .from("companies")
        .select(
          "id, name, sector, headquarters, first_visit_year, dsa_difficulty, is_published, eligibility_criteria(year, min_cgpa, min_10th_percentage, min_12th_percentage, branches, is_current)",
        )
        .eq("is_published", true)
        .order("name", { ascending: true })
        .limit(5);

      // 4. Recently Added Job Roles (Latest 5)
      const { data: recentRoles } = await supabase
        .from("job_roles")
        .select(
          "id, title, hiring_year, location, ctc_note, created_at, companies(id, name, sector)",
        )
        .order("created_at", { ascending: false })
        .limit(5);

      // 5. Recent Admin Activity / Criteria Updates (Latest 5 criteria records)
      const { data: recentCriteria } = await supabase
        .from("eligibility_criteria")
        .select(
          "id, year, min_cgpa, min_10th_percentage, min_12th_percentage, max_backlogs, branches, is_current, created_at, companies(name)",
        )
        .order("created_at", { ascending: false })
        .limit(5);

      // 6. Latest Placement Announcements (Latest 4)
      const { data: latestAnnouncements } = await supabase
        .from("announcements")
        .select("id, title, body, published_at, category, is_priority, companies(name)")
        .order("published_at", { ascending: false })
        .limit(4);

      // 7. Pending Source Verifications (Latest 5 pending)
      const { data: pendingSourcesList } = await supabase
        .from("sources")
        .select("id, title, source_type, author_name, created_at, status")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      // 8. Table counts for all database modules
      const moduleTables = [
        { key: "companies", label: "Companies & Roles", to: "/admin/companies", icon: Building2 },
        { key: "dsa_topics", label: "DSA Topics", to: "/admin/dsa", icon: Code2 },
        {
          key: "cs_fundamentals",
          label: "CS Fundamentals",
          to: "/admin/fundamentals",
          icon: GraduationCap,
        },
        {
          key: "interview_rounds",
          label: "Interview Rounds",
          to: "/admin/rounds",
          icon: ListChecks,
        },
        {
          key: "questions",
          label: "DSA Sheet Questions",
          to: "/admin/questions",
          icon: FileCode2,
        },
        { key: "sources", label: "Sources", to: "/admin/sources", icon: FileCheck2 },
        {
          key: "announcements",
          label: "Announcements",
          to: "/admin/announcements",
          icon: Megaphone,
        },
        { key: "profiles", label: "User Profiles", to: "/admin/users", icon: Users },
      ];

      const moduleCounts = await Promise.all(
        moduleTables.map((m) => supabase.from(m.key).select("id", { count: "exact", head: true })),
      );

      return {
        metrics: {
          totalStudents,
          totalCompanies,
          activeJobRoles,
          activeDrives,
          pendingSources,
        },
        recentCompanies: recentCompanies || [],
        upcomingDrives: (upcomingDrives as unknown as UpcomingCompany[]) || [],
        recentRoles: (recentRoles as unknown as RecentJobRoleItem[]) || [],
        recentCriteria: (recentCriteria as unknown as CriteriaActivityItem[]) || [],
        latestAnnouncements: (latestAnnouncements as unknown as AnnouncementItem[]) || [],
        pendingSourcesList: pendingSourcesList || [],
        moduleCounts: moduleTables.map((m, idx) => ({
          ...m,
          count: moduleCounts[idx]?.count ?? 0,
        })),
      };
    },
  });

  return (
    <>
      <PageHeader
        title="Training & Placement Office Management"
        description="Official administrative console for campus recruitment operations, recruiter verification, multi-year academic cut-offs, student intelligence, and drive notices."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="font-semibold text-xs rounded-md shadow-xs">
              <Link to="/admin/companies">
                <Plus className="size-3.5 mr-1.5" /> Add New Company
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs rounded-md border-border"
            >
              <Link to="/admin/announcements">
                <Megaphone className="size-3.5 mr-1.5" /> Publish Announcement
              </Link>
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading Placement Cell operational dashboard…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data ? (
        <div className="space-y-8">
          {/* ================================================================= */}
          {/* 1. TOP OVERVIEW METRICS CARDS                                    */}
          {/* ================================================================= */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {/* Card 1: Total Registered Students */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Students
                </span>
                <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  <Users className="size-3.5" />
                </div>
              </div>
              <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                {data.metrics.totalStudents}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Total registered students</p>
            </div>

            {/* Card 2: Total Companies */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Companies
                </span>
                <div className="flex size-7 items-center justify-center rounded-md bg-slate-900/10 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  <Building2 className="size-3.5" />
                </div>
              </div>
              <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                {data.metrics.totalCompanies}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Recruiter database profiles</p>
            </div>

            {/* Card 3: Active Job Roles */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Job Roles
                </span>
                <div className="flex size-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
                  <Briefcase className="size-3.5" />
                </div>
              </div>
              <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                {data.metrics.activeJobRoles}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Campus roles configured</p>
            </div>

            {/* Card 4: Active Placement Drives */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Drives
                </span>
                <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                </div>
              </div>
              <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                {data.metrics.activeDrives}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Published recruiters visible</p>
            </div>

            {/* Card 5: Pending Source Verifications */}
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Verification
                </span>
                <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <FileCheck2 className="size-3.5" />
                </div>
              </div>
              <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                {data.metrics.pendingSources}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Pending debrief sources</p>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 2. QUICK ACTIONS BAR                                             */}
          {/* ================================================================= */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              TPO Administrative Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <Link
                to="/admin/companies"
                className="group flex flex-col justify-between rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:border-slate-800 hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <span className="font-semibold text-foreground text-xs">Add New Company</span>
                </div>
                <span className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                  Register recruiter
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                to="/admin/companies"
                className="group flex flex-col justify-between rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:border-slate-800 hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="size-4 text-primary" />
                  <span className="font-semibold text-foreground text-xs">
                    Manage Companies & Roles
                  </span>
                </div>
                <span className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                  Integrated view
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                to="/admin/dsa"
                className="group flex flex-col justify-between rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:border-slate-800 hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="size-4 text-primary" />
                  <span className="font-semibold text-foreground text-xs">Manage DSA Topics</span>
                </div>
                <span className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                  Coding syllabus
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                to="/admin/announcements"
                className="group flex flex-col justify-between rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:border-slate-800 hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <Megaphone className="size-4 text-primary" />
                  <span className="font-semibold text-foreground text-xs">Publish Notice</span>
                </div>
                <span className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                  Broadcast alert
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                to="/admin/companies"
                className="group flex flex-col justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 transition-colors hover:border-primary/60 hover:bg-primary/10"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-primary" />
                  <span className="font-semibold text-foreground text-xs">
                    Eligibility Cut-offs
                  </span>
                </div>
                <span className="mt-2 text-[10px] text-primary font-medium flex items-center justify-between">
                  Inside Companies
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 3. ROW 1: RECENT COMPANIES & UPCOMING DRIVES                     */}
          {/* ================================================================= */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* SECTION A: RECENT COMPANY REGISTRATIONS */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">
                      Recent Company Registrations
                    </h2>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-semibold px-2"
                  >
                    <Link to="/admin/companies">
                      View All <ChevronRight className="size-3 ml-0.5" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-3 divide-y divide-border/60">
                  {data.recentCompanies.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No companies registered yet.
                    </p>
                  ) : (
                    data.recentCompanies.map((c) => (
                      <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-xs truncate">
                              {c.name}
                            </span>
                            {c.is_demo && <DemoTag />}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {c.sector || "General"} · {c.headquarters || "Location N/A"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[9px] font-semibold ${
                              c.is_published
                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {c.is_published ? "Published" : "Draft"}
                          </span>
                          <VerifyTag status={c.verification_status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border mt-3">
                <Link
                  to="/admin/companies"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Manage all companies and drive criteria cut-offs <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* SECTION B: UPCOMING RECRUITMENT DRIVES */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-foreground">
                      Upcoming Recruitment Drives
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {data.upcomingDrives.length} active published
                  </span>
                </div>

                <div className="mt-3 divide-y divide-border/60">
                  {data.upcomingDrives.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No active published recruitment drives.
                    </p>
                  ) : (
                    data.upcomingDrives.map((d) => {
                      const curCrit =
                        d.eligibility_criteria.find((e) => e.is_current) ??
                        d.eligibility_criteria[0];

                      return (
                        <div key={d.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground text-xs truncate">
                                {d.name}
                              </span>
                              <DifficultyTag level={d.dsa_difficulty} />
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground truncate">
                              {curCrit ? (
                                <>
                                  <span className="font-bold text-foreground">
                                    {curCrit.year} Drive:
                                  </span>{" "}
                                  Min CGPA: {curCrit.min_cgpa ?? "N/A"} · 10th:{" "}
                                  {curCrit.min_10th_percentage != null
                                    ? `${curCrit.min_10th_percentage}%`
                                    : "N/A"}{" "}
                                  · 12th:{" "}
                                  {curCrit.min_12th_percentage != null
                                    ? `${curCrit.min_12th_percentage}%`
                                    : "N/A"}
                                </>
                              ) : (
                                "No academic criteria set"
                              )}
                            </div>
                          </div>

                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] rounded-md px-2 shrink-0"
                          >
                            <Link to="/admin/companies">Manage</Link>
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border mt-3">
                <Link
                  to="/admin/companies"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Configure active drive criteria in Manage Companies{" "}
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 4. ROW 2: RECENTLY ADDED JOB ROLES & RECENT CRITERIA UPDATES     */}
          {/* ================================================================= */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* SECTION C: RECENTLY ADDED JOB ROLES */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-4 text-indigo-600" />
                    <h2 className="text-sm font-bold text-foreground">Recently Added Job Roles</h2>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-semibold px-2"
                  >
                    <Link to="/admin/companies">
                      View In Companies <ChevronRight className="size-3 ml-0.5" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-3 divide-y divide-border/60">
                  {data.recentRoles.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No job roles recorded yet.
                    </p>
                  ) : (
                    data.recentRoles.map((role) => {
                      const compName = getCompanyName(role.companies) || "Recruiter";

                      return (
                        <div
                          key={role.id}
                          className="py-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-xs truncate">
                                {role.title}
                              </span>
                              <span className="font-mono rounded bg-muted/60 px-1.5 py-0.2 text-[10px] text-muted-foreground">
                                {role.hiring_year} Batch
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              <strong className="text-primary font-medium">{compName}</strong>
                              {role.location && ` · ${role.location}`}
                              {role.ctc_note && ` · ${role.ctc_note}`}
                            </p>
                          </div>

                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {formatDate(role.created_at)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border mt-3">
                <Link
                  to="/admin/companies"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Manage all recruiter roles inside Manage Companies{" "}
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* SECTION D: RECENT CRITERIA UPDATES */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">
                      Recent Eligibility Criteria Updates
                    </h2>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-semibold px-2"
                  >
                    <Link to="/admin/history">Audit Trail</Link>
                  </Button>
                </div>

                <div className="mt-3 divide-y divide-border/60">
                  {data.recentCriteria.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No criteria activity recorded yet.
                    </p>
                  ) : (
                    data.recentCriteria.map((crit) => {
                      const compName = getCompanyName(crit.companies) || "Recruiter";

                      return (
                        <div
                          key={crit.id}
                          className="py-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-xs truncate">
                                {compName}
                              </span>
                              <span className="font-mono rounded bg-muted/60 px-1.5 py-0.2 text-[10px] text-muted-foreground">
                                {crit.year} Drive
                              </span>
                              {crit.is_current && (
                                <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground truncate">
                              Min CGPA: {crit.min_cgpa ?? "N/A"} · 10th:{" "}
                              {crit.min_10th_percentage != null
                                ? `${crit.min_10th_percentage}%`
                                : "N/A"}{" "}
                              · 12th:{" "}
                              {crit.min_12th_percentage != null
                                ? `${crit.min_12th_percentage}%`
                                : "N/A"}
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {formatDate(crit.created_at)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border mt-3">
                <Link
                  to="/admin/companies"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Edit company criteria cut-offs <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 5. ROW 3: ANNOUNCEMENTS & PENDING VERIFICATION QUEUE             */}
          {/* ================================================================= */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* COLUMN 1: LATEST PLACEMENT ANNOUNCEMENTS */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Megaphone className="size-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Latest Placement Notices</h2>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-semibold px-2"
                  >
                    <Link to="/admin/announcements">All Notices</Link>
                  </Button>
                </div>

                <div className="mt-3 space-y-2.5">
                  {data.latestAnnouncements.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">
                      No notices published yet.
                    </p>
                  ) : (
                    data.latestAnnouncements.map((a) => {
                      const companyName = getCompanyName(a.companies);

                      return (
                        <div
                          key={a.id}
                          className="rounded-lg border border-border/70 bg-muted/20 p-2.5 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            <span className="font-mono text-muted-foreground">
                              {formatDate(a.published_at)}
                            </span>
                            {a.is_priority && (
                              <span className="rounded-[3px] bg-rose-500/15 px-1.5 py-0.2 font-semibold text-rose-700 dark:text-rose-400">
                                Urgent
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-foreground text-xs line-clamp-1">
                            {a.title}
                          </h4>
                          {companyName && (
                            <span className="text-[10px] text-primary font-medium block">
                              Recruiter: {companyName}
                            </span>
                          )}
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {a.body}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border mt-3">
                <Button asChild variant="outline" size="sm" className="w-full text-xs rounded-md">
                  <Link to="/admin/announcements">
                    <Plus className="size-3 mr-1" /> Post New Announcement
                  </Link>
                </Button>
              </div>
            </div>

            {/* COLUMN 2: PENDING SOURCE VERIFICATION QUEUE */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="size-4 text-amber-600" />
                    <h2 className="text-sm font-bold text-foreground">
                      Pending Source Verifications
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                    {data.metrics.pendingSources} pending
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {data.pendingSourcesList.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center my-2">
                      <CheckCircle2 className="size-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-foreground">
                        All Debrief Sources Verified
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        No student submission pending administrative review.
                      </p>
                    </div>
                  ) : (
                    data.pendingSourcesList.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-amber-800 dark:text-amber-300">
                            {s.source_type || "Debrief"}
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {formatDate(s.created_at)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground text-xs line-clamp-1">
                          {s.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Submitted by: {s.author_name || "Anonymous Candidate"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border mt-3">
                <Button asChild variant="outline" size="sm" className="w-full text-xs rounded-md">
                  <Link to="/admin/sources">
                    <FileCheck2 className="size-3 mr-1" /> Open Verification Queue
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 6. DATABASE REPOSITORY MODULES GRID                              */}
          {/* ================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">
                  Placement Cell Database Repositories
                </h2>
                <p className="text-xs text-muted-foreground">
                  Direct table management modules with Row-Level Security
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" />
                <span>RLS Active</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.moduleCounts.map((m) => (
                <Link
                  key={m.to}
                  to={m.to}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:border-slate-800 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                      <m.icon className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-xs">
                        {m.label}
                      </h3>
                      <span className="text-[11px] text-muted-foreground">Database records</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold tabular-nums text-foreground">
                      {m.count}
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
