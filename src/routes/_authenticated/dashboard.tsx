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
  ChevronDown,
  Megaphone,
  Briefcase,
  Filter,
  Search,
  Sparkles,
  MapPin,
  AlertCircle,
  HelpCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { useMe } from "@/lib/auth";
import { announcementsQuery, companiesQuery, fmtDate } from "@/lib/queries";
import { PageHeader, DifficultyTag, VerifyTag } from "@/components/labels";
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

function isBranchEligible(studentBranch: string, allowedBranches: string): boolean {
  if (
    !allowedBranches ||
    !allowedBranches.trim() ||
    allowedBranches.toLowerCase().includes("all") ||
    allowedBranches.toLowerCase().includes("any")
  ) {
    return true;
  }
  const allowed = allowedBranches.toUpperCase();
  const b = studentBranch.toUpperCase().trim();

  if (
    b === "CSE" &&
    (allowed.includes("CSE") ||
      allowed.includes("COMP") ||
      allowed.includes("COMPUTER") ||
      allowed.includes("CS"))
  )
    return true;
  if (b === "IT" && (allowed.includes("IT") || allowed.includes("INFORMATION TECHNOLOGY")))
    return true;
  if (
    (b === "AIDS" || b === "AI&DS") &&
    (allowed.includes("AIDS") ||
      allowed.includes("AI&DS") ||
      allowed.includes("AI") ||
      allowed.includes("DATA SCIENCE"))
  )
    return true;
  if (
    b === "ECE" &&
    (allowed.includes("ECE") ||
      allowed.includes("E&TC") ||
      allowed.includes("ENTC") ||
      allowed.includes("ELECTRONICS"))
  )
    return true;
  if (b === "EEE" && (allowed.includes("EEE") || allowed.includes("ELECTRICAL"))) return true;
  if (b === "MECH" && (allowed.includes("MECH") || allowed.includes("MECHANICAL"))) return true;
  if (b === "CIVIL" && allowed.includes("CIVIL")) return true;

  return allowed.includes(b);
}

function Dashboard() {
  const { data: me } = useMe();
  const companies = useQuery(companiesQuery);
  const companiesList = companies.data;
  const ann = useQuery(announcementsQuery);

  // Eligibility Calculator States
  const [myBranch, setMyBranch] = useState(me?.branch || "");
  const [myCgpa, setMyCgpa] = useState("");
  const [my10th, setMy10th] = useState("");
  const [my12th, setMy12th] = useState("");
  const [myBacklogs, setMyBacklogs] = useState("");
  const [showAdvancedScores, setShowAdvancedScores] = useState(false);

  // Calculation Results State
  const [hasCheckedEligibility, setHasCheckedEligibility] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalRolesCount = useMemo(() => {
    if (!companiesList) return 0;
    return companiesList.reduce((acc, c) => acc + (c.job_roles?.length ?? 0), 0);
  }, [companiesList]);

  // Evaluated Eligibility Results
  const evaluationResults = useMemo(() => {
    if (!hasCheckedEligibility || !companiesList || !myBranch || !myCgpa) {
      return { eligible: [], missingInfo: [] };
    }

    const studentCgpaNum = Number(myCgpa);
    const student10thNum = my10th !== "" ? Number(my10th) : null;
    const student12thNum = my12th !== "" ? Number(my12th) : null;
    const studentBacklogsNum = myBacklogs !== "" ? Number(myBacklogs) : null;

    type MatchedItem = {
      company: (typeof companies.data)[number];
      criteria: NonNullable<(typeof companies.data)[number]["eligibility_criteria"]>[number];
      roles: NonNullable<(typeof companies.data)[number]["job_roles"]>;
    };

    type MissingInfoItem = {
      company: (typeof companies.data)[number];
      criteria: NonNullable<(typeof companies.data)[number]["eligibility_criteria"]>[number];
      missingReasons: string[];
    };

    const eligibleList: MatchedItem[] = [];
    const missingInfoList: MissingInfoItem[] = [];

    for (const c of companies.data) {
      // Must be published company
      if (!c.is_published) continue;

      const curCriteria =
        c.eligibility_criteria?.find((e) => e.is_current) ?? c.eligibility_criteria?.[0];

      // If no criteria specified, company is open
      if (!curCriteria) {
        eligibleList.push({
          company: c,
          criteria: {
            id: "none",
            year: c.first_visit_year || new Date().getFullYear(),
            min_cgpa: null,
            min_10th_percentage: null,
            min_12th_percentage: null,
            max_backlogs: null,
            branches: "All branches",
            notes: null,
            is_current: true,
          },
          roles: c.job_roles || [],
        });
        continue;
      }

      // 1. Branch Check
      if (!isBranchEligible(myBranch, curCriteria.branches)) {
        continue;
      }

      // 2. CGPA Check
      if (curCriteria.min_cgpa != null && studentCgpaNum < Number(curCriteria.min_cgpa)) {
        continue;
      }

      // 3. 10th Percentage Check & Missing Info Detection
      const missingFields: string[] = [];
      if (curCriteria.min_10th_percentage != null) {
        if (student10thNum == null) {
          missingFields.push(`10th Min. % required: ${curCriteria.min_10th_percentage}%`);
        } else if (student10thNum < Number(curCriteria.min_10th_percentage)) {
          continue; // Student does not qualify on 10th
        }
      }

      // 4. 12th Percentage Check & Missing Info Detection
      if (curCriteria.min_12th_percentage != null) {
        if (student12thNum == null) {
          missingFields.push(`12th Min. % required: ${curCriteria.min_12th_percentage}%`);
        } else if (student12thNum < Number(curCriteria.min_12th_percentage)) {
          continue; // Student does not qualify on 12th
        }
      }

      // 5. Backlogs Check
      if (curCriteria.max_backlogs != null && studentBacklogsNum != null) {
        if (studentBacklogsNum > Number(curCriteria.max_backlogs)) {
          continue; // Student has more backlogs than permitted
        }
      }

      // If missing mandatory percentage cut-offs, don't incorrectly mark eligible
      if (missingFields.length > 0) {
        missingInfoList.push({
          company: c,
          criteria: curCriteria,
          missingReasons: missingFields,
        });
        continue;
      }

      // All verified: Student is eligible!
      eligibleList.push({
        company: c,
        criteria: curCriteria,
        roles: c.job_roles || [],
      });
    }

    return {
      eligible: eligibleList,
      missingInfo: missingInfoList,
    };
  }, [hasCheckedEligibility, companies, companiesList, myBranch, myCgpa, my10th, my12th, myBacklogs]);

  const handleCheckEligibility = () => {
    if (!myBranch.trim() || !myCgpa.trim()) {
      setValidationError(
        "Please select your academic branch and enter your current CGPA to check eligibility.",
      );
      setHasCheckedEligibility(false);
      return;
    }
    const cgpaNum = Number(myCgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setValidationError("Please enter a valid CGPA between 0.00 and 10.00.");
      setHasCheckedEligibility(false);
      return;
    }

    setValidationError(null);
    setHasCheckedEligibility(true);
  };

  const handleResetEligibility = () => {
    setHasCheckedEligibility(false);
    setValidationError(null);
  };

  const firstName = me?.fullName ? me.fullName.split(" ")[0] : "Student";

  return (
    <div className="space-y-8">
      {/* Welcome Banner with Integrated Interactive Quick Calculator */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="space-y-2 lg:max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-[4px] border border-blue-500/20 bg-blue-500/8 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
              <Calendar className="size-3.5" />
              <span>Drive Season 2025–2026</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome, {firstName}
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Prepare systematically for campus placements. Check live eligibility for visiting
              recruiters, master tested DSA topics, and review round-by-round selection guidelines.
            </p>
          </div>

          {/* Interactive Quick Eligibility Calculator Tool */}
          <div className="rounded-xl border border-border bg-slate-50/80 p-4 sm:p-5 shadow-2xs dark:bg-slate-900/60 lg:w-96">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Eligibility Calculator
                </p>
              </div>
              <span className="font-mono text-[10px] text-blue-700 dark:text-blue-400 font-semibold">
                Live Supabase Matching
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">
                    Branch *
                  </label>
                  <select
                    className="h-8.5 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                    value={myBranch}
                    onChange={(e) => {
                      setMyBranch(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    aria-label="Select your engineering branch"
                  >
                    <option value="">Select Branch</option>
                    <option value="CSE">CSE (Computer)</option>
                    <option value="IT">IT (Info Tech)</option>
                    <option value="AIDS">AI & Data Science</option>
                    <option value="ECE">ECE / E&TC</option>
                    <option value="EEE">EEE (Electrical)</option>
                    <option value="MECH">Mechanical</option>
                    <option value="CIVIL">Civil</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">
                    Current CGPA *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 7.85"
                    value={myCgpa}
                    onChange={(e) => {
                      setMyCgpa(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="h-8.5 text-xs shadow-2xs"
                    aria-label="Your CGPA"
                  />
                </div>
              </div>

              {/* Advanced optional inputs toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedScores(!showAdvancedScores)}
                  className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                >
                  {showAdvancedScores ? (
                    <>
                      <ChevronDown className="size-3" /> Hide 10th / 12th / Backlogs
                    </>
                  ) : (
                    <>
                      <ChevronRight className="size-3" /> Add 10th, 12th & Backlogs (Optional)
                    </>
                  )}
                </button>

                {showAdvancedScores && (
                  <div className="mt-2 grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground block mb-0.5">
                        10th %
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g. 80"
                        value={my10th}
                        onChange={(e) => setMy10th(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground block mb-0.5">
                        12th %
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g. 75"
                        value={my12th}
                        onChange={(e) => setMy12th(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-muted-foreground block mb-0.5">
                        Backlogs
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g. 0"
                        value={myBacklogs}
                        onChange={(e) => setMyBacklogs(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {validationError && (
                <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-2 text-[11px] text-rose-700 dark:text-rose-400">
                  {validationError}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <Button
                  onClick={handleCheckEligibility}
                  size="sm"
                  className="w-full text-xs font-semibold rounded-md shadow-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  <Sparkles className="size-3.5 mr-1.5" /> Check Eligibility
                </Button>
                {hasCheckedEligibility && (
                  <Button
                    onClick={handleResetEligibility}
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-md"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Real Data Metrics Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/70 pt-6 sm:grid-cols-4">
          <div className="rounded-lg border border-border/60 bg-background/60 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Recruiters
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {companies.data?.length ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Campus Job Roles
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {totalRolesCount}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Preparation Modules
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">4</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Placement Notices
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {ann.data?.length ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INTERACTIVE ELIGIBILITY RESULTS PANEL                                */}
      {/* ===================================================================== */}
      {hasCheckedEligibility && (
        <section
          aria-labelledby="eligibility-results-heading"
          className="rounded-xl border border-slate-800/30 bg-card p-5 sm:p-6 shadow-sm transition-all animate-in fade-in-50 duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2
                  id="eligibility-results-heading"
                  className="text-base font-bold text-foreground"
                >
                  Live Eligibility Results: {evaluationResults.eligible.length} Recruiter(s) Match
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluation calculated against active published cut-offs for branch:{" "}
                <strong className="text-foreground">{myBranch}</strong> · CGPA:{" "}
                <strong className="text-foreground">{myCgpa}</strong>
                {my10th && ` · 10th: ${my10th}%`}
                {my12th && ` · 12th: ${my12th}%`}
                {myBacklogs !== "" && ` · Backlogs: ${myBacklogs}`}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetEligibility}
              className="text-xs rounded-md self-start sm:self-center"
            >
              Close Results
            </Button>
          </div>

          {/* Missing info notice banner if any company requires 10th/12th that wasn't entered */}
          {evaluationResults.missingInfo.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex items-start gap-2.5">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Additional Academic Information Needed for {evaluationResults.missingInfo.length}{" "}
                  Company/Companies
                </p>
                <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed mt-0.5">
                  Some recruiters mandate specific 10th/12th standard percentage cut-offs. To avoid
                  incorrectly marking you eligible, enter your 10th and 12th percentages in the
                  calculator above:
                </p>
                <ul className="mt-1.5 space-y-1 list-disc list-inside text-[11px] text-amber-800 dark:text-amber-300">
                  {evaluationResults.missingInfo.map((m) => (
                    <li key={m.company.id}>
                      <strong>{m.company.name}</strong>: {m.missingReasons.join(" · ")}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Qualified Companies Grid */}
          {evaluationResults.eligible.length === 0 ? (
            <div className="py-10 text-center">
              <AlertCircle className="size-8 text-muted-foreground mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-foreground">No matching companies found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                No active campus recruiters currently match your branch ({myBranch}) and CGPA (
                {myCgpa}). Check back as more recruitment drives are published throughout the
                season.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4 text-xs rounded-md">
                <Link to="/companies">Browse Full Recruiter Directory</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {evaluationResults.eligible.map(({ company: c, criteria: crit, roles }) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-slate-50/50 p-4 shadow-2xs dark:bg-slate-900/40 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to="/companies/$id"
                          params={{ id: c.id }}
                          className="font-bold text-sm sm:text-base text-primary hover:underline flex items-center gap-1.5"
                        >
                          <span>{c.name}</span>
                          <ExternalLink className="size-3" />
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          {c.sector && <span>{c.sector}</span>}
                          {c.headquarters && <span>· {c.headquarters}</span>}
                          <DifficultyTag level={c.dsa_difficulty} />
                        </div>
                      </div>

                      <span className="inline-flex items-center rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="size-3 mr-1" /> Eligible
                      </span>
                    </div>

                    {/* Criteria Snapshot */}
                    <div className="rounded-md border border-border/60 bg-background/60 p-2.5 text-xs space-y-1">
                      <div className="text-[11px] font-mono text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>
                          Min CGPA:{" "}
                          <strong className="text-foreground">{crit.min_cgpa ?? "None"}</strong>
                        </span>
                        <span>
                          10th:{" "}
                          <strong className="text-foreground">
                            {crit.min_10th_percentage != null
                              ? `${crit.min_10th_percentage}%`
                              : "Not specified"}
                          </strong>
                        </span>
                        <span>
                          12th:{" "}
                          <strong className="text-foreground">
                            {crit.min_12th_percentage != null
                              ? `${crit.min_12th_percentage}%`
                              : "Not specified"}
                          </strong>
                        </span>
                        <span>
                          Backlogs:{" "}
                          <strong className="text-foreground">
                            {crit.max_backlogs != null
                              ? crit.max_backlogs === 0
                                ? "0 permitted"
                                : `${crit.max_backlogs} max`
                              : "Any"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Eligible Job Roles Under Company */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                        <Briefcase className="size-3 text-primary" /> Eligible Job Roles (
                        {roles.length})
                      </h4>
                      {roles.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic">
                          Campus engineering positions offered during active drive.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {roles.map((r) => (
                            <div
                              key={r.id}
                              className="rounded-md border border-border/70 bg-card p-2 text-xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <span className="font-semibold text-foreground text-xs block truncate">
                                  {r.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono">{r.hiring_year} Batch</span>
                                  {r.location && <span>· {r.location}</span>}
                                </span>
                              </div>
                              {r.ctc_note && (
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary shrink-0">
                                  {r.ctc_note}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile link */}
                  <div className="mt-4 pt-3 border-t border-border flex justify-end">
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-md">
                      <Link to="/companies/$id" params={{ id: c.id }}>
                        View Recruiter Overview & Roadmap →
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4-Step Placement Roadmap */}
      <section aria-labelledby="roadmap-heading">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2
              id="roadmap-heading"
              className="text-base font-bold tracking-tight text-foreground sm:text-lg"
            >
              Your Placement Journey
            </h2>
            <p className="text-xs text-muted-foreground">
              Follow this four-step strategy to maximize your campus placement offers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs font-medium">
              <Link to="/questions">
                <FileCode2 className="size-3.5 mr-1 text-primary" /> DSA Sheet
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-medium">
              <Link to="/prep">Year Guide →</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((j) => (
            <Link
              key={j.to}
              to={j.to}
              className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    STEP {j.step}
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-foreground dark:bg-slate-800 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <j.icon className="size-4" strokeWidth={1.8} />
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {j.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{j.body}</p>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
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
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Recruiting Companies
              </h2>
              <p className="text-xs text-muted-foreground">
                Recruiters registered with the campus placement office
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
              <Link to="/companies">Directory →</Link>
            </Button>
          </div>

          {companies.isLoading ? (
            <LoadingState label="Loading company records…" />
          ) : companies.error ? (
            <ErrorState error={companies.error} onRetry={() => companies.refetch()} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
                    <tr>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Sector</th>
                      <th className="px-4 py-3">DSA Level</th>
                      <th className="px-4 py-3">Cut-off (CGPA)</th>
                      <th className="px-4 py-3">10th / 12th %</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(companies.data ?? []).slice(0, 7).map((c) => {
                      const cur =
                        c.eligibility_criteria?.find((e) => e.is_current) ??
                        c.eligibility_criteria?.[0];

                      return (
                        <tr
                          key={c.id}
                          className="group transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            <Link
                              to="/companies/$id"
                              params={{ id: c.id }}
                              className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5"
                            >
                              <span>{c.name}</span>
                              <ChevronRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{c.sector || "—"}</td>
                          <td className="px-4 py-3">
                            <DifficultyTag level={c.dsa_difficulty} />
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-foreground">
                            {cur?.min_cgpa != null ? cur.min_cgpa : "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                            {cur?.min_10th_percentage != null || cur?.min_12th_percentage != null
                              ? `${cur?.min_10th_percentage != null ? `${cur.min_10th_percentage}%` : "—"} / ${cur?.min_12th_percentage != null ? `${cur.min_12th_percentage}%` : "—"}`
                              : "Not specified"}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-semibold text-primary hover:text-primary"
                            >
                              <Link to="/companies/$id" params={{ id: c.id }}>
                                View Details
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

        {/* Announcements Sidebar */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Notice Board
              </h2>
              <p className="text-xs text-muted-foreground">Official placement cell updates</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
              <Link to="/announcements">All →</Link>
            </Button>
          </div>

          {ann.isLoading ? (
            <LoadingState label="Loading notices…" />
          ) : ann.error ? (
            <ErrorState error={ann.error} onRetry={() => ann.refetch()} />
          ) : (ann.data ?? []).length === 0 ? (
            <EmptyState
              title="No announcements"
              description="Check back later for placement drive circulars."
            />
          ) : (
            <div className="space-y-3">
              {(ann.data ?? []).slice(0, 4).map((a) => {
                const companyName = Array.isArray(a.companies)
                  ? a.companies[0]?.name
                  : a.companies?.name;

                return (
                  <div
                    key={a.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-mono text-muted-foreground">
                        {fmtDate(a.published_at)}
                      </span>
                      {a.is_priority && (
                        <span className="rounded-[4px] bg-rose-500/10 px-1.5 py-0.5 font-semibold text-rose-700 dark:text-rose-400">
                          Priority Notice
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-xs font-bold text-foreground line-clamp-1">
                      {a.title}
                    </h3>
                    {companyName && (
                      <span className="mt-0.5 inline-block text-[10px] font-semibold text-primary">
                        Recruiter: {companyName}
                      </span>
                    )}
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {a.body}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
