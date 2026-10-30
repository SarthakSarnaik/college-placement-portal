import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Building2,
  Globe,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ExternalLink,
  HelpCircle,
  GraduationCap,
  ListOrdered,
  Briefcase,
  Code2,
  History as HistoryIcon,
  FileCode2,
  Clock,
  ShieldCheck,
  Award,
} from "lucide-react";
import { companyQuery, fmtDate } from "@/lib/queries";
import { DifficultyTag, VerifyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoundSteps } from "@/components/round-steps";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/companies/$id")({
  head: () => ({ meta: [{ title: "Company Profile — Placement Portal" }] }),
  component: Profile,
});

function Profile() {
  const { id } = Route.useParams();
  const q = useQuery(companyQuery(id));

  if (q.isLoading) return <LoadingState label="Loading recruiter profile…" />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const c = q.data;
  if (!c) {
    return (
      <EmptyState
        title="Company not found"
        body="This recruiter profile may have been archived, unpublished, or removed by the Placement Office."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/companies">Return to Directory</Link>
          </Button>
        }
      />
    );
  }

  const criteria = [...(c.eligibility_criteria ?? [])].sort((a, b) => b.year - a.year);
  const cur = criteria.find((e) => e.is_current) ?? criteria[0];
  const rounds = [...(c.interview_rounds ?? [])].sort((a, b) => a.round_order - b.round_order);
  const topics = [...(c.dsa_topics ?? [])].sort((a, b) => a.priority - b.priority);
  const fundamentals = [...(c.cs_fundamentals ?? [])].sort((a, b) => a.priority - b.priority);
  const questions = [...(c.questions ?? [])].sort((a, b) =>
    (b.asked_on ?? "").localeCompare(a.asked_on ?? ""),
  );

  const topicsByCategory = (["basic", "intermediate", "advanced"] as const)
    .map((cat) => ({ cat, items: topics.filter((t) => t.category === cat) }))
    .filter((g) => g.items.length);
  const uncategorised = topics.filter(
    (t) => !["basic", "intermediate", "advanced"].includes(t.category),
  );

  const yearMap = new Map<number, typeof questions>();
  for (const x of questions) {
    const y = x.asked_on ? new Date(x.asked_on).getFullYear() : 0;
    yearMap.set(y, [...(yearMap.get(y) ?? []), x]);
  }
  const questionsByYear = [...yearMap.entries()].sort((a, b) => b[0] - a[0]);

  const initials = c.name
    ? c.name
        .replace(/\(.*?\)/g, "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "CO";

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/companies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />{" "}
          Back to Recruiter Directory
        </Link>
      </div>

      {/* Recruiter Header Card */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-border bg-slate-100 font-mono text-xl font-bold text-slate-800 shadow-2xs dark:bg-slate-800 dark:text-slate-100">
              {initials}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <VerifyTag status={c.verification_status} />
                <span className="rounded-[4px] border border-border bg-slate-100/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-800">
                  {c.sector || "Recruiter"}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {c.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                {c.headquarters && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" /> {c.headquarters}
                  </span>
                )}
                {c.first_visit_year && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-muted-foreground" /> Recruiting since{" "}
                    {c.first_visit_year}
                  </span>
                )}
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <Globe className="size-3.5" /> Career Site <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Strip */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 lg:w-80">
            <div className="rounded-lg border border-border/80 bg-slate-50/70 p-3 text-center dark:bg-slate-900/40">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                DSA Difficulty
              </span>
              <div className="mt-1 flex justify-center">
                <DifficultyTag level={c.dsa_difficulty} />
              </div>
            </div>
            <div className="rounded-lg border border-border/80 bg-slate-50/70 p-3 text-center dark:bg-slate-900/40">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Min. CGPA
              </span>
              <span className="mt-1 block font-mono text-xs font-bold text-foreground">
                {cur?.min_cgpa != null ? cur.min_cgpa : "No cut-off"}
              </span>
            </div>
            <div className="rounded-lg border border-border/80 bg-slate-50/70 p-3 text-center dark:bg-slate-900/40">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Interview Stages
              </span>
              <span className="mt-1 block font-mono text-xs font-bold text-foreground">
                {rounds.length} Rounds
              </span>
            </div>
            <div className="rounded-lg border border-border/80 bg-slate-50/70 p-3 text-center dark:bg-slate-900/40">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Logged Roles
              </span>
              <span className="mt-1 block font-mono text-xs font-bold text-foreground">
                {c.job_roles?.length ?? 0} Roles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border bg-card p-1.5 shadow-2xs">
          {[
            { id: "overview", label: "Overview & Roles", icon: Briefcase },
            { id: "eligibility", label: "Eligibility", icon: ShieldCheck },
            { id: "dsa", label: "DSA Topics", icon: Code2 },
            { id: "fundamentals", label: "CS Fundamentals", icon: GraduationCap },
            { id: "rounds", label: "Selection Rounds", icon: ListOrdered },
            { id: "questions", label: "DSA Sheet & Questions", icon: FileCode2 },
            { id: "history", label: "Criteria History", icon: HistoryIcon },
          ].map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white data-[state=active]:shadow-2xs data-[state=active]:font-semibold"
            >
              <t.icon className="size-3.5" />
              <span>{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                About the Recruiter
              </h2>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {c.overview || "No detailed overview recorded by the placement office."}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Campus Job Roles
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Engineering positions offered during campus placement drives
                  </p>
                </div>
                <span className="rounded-[4px] border border-border bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {c.job_roles?.length ?? 0} {c.job_roles?.length === 1 ? "Role" : "Roles"}
                </span>
              </div>

              {c.job_roles?.length ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
                      <tr>
                        <th className="px-4 py-3">Role Title</th>
                        <th className="px-4 py-3">Hiring Year</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Compensation / Package Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {c.job_roles.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-foreground">{r.title}</td>
                          <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                            {r.hiring_year}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {r.location || "Multiple Locations"}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                            {r.ctc_note || "As per placement cell policy"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    title="No job roles recorded"
                    body="The placement cell has not listed specific job profiles for this company yet."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quick Snapshot Card */}
          <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Award className="size-3.5 text-primary" /> Drive At A Glance
            </h3>
            <dl className="mt-4 divide-y divide-border/60 text-xs">
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Min. CGPA Cut-off</dt>
                <dd className="font-mono font-bold text-foreground">
                  {cur?.min_cgpa ?? "Not Specified"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Max Active Backlogs</dt>
                <dd className="font-semibold text-foreground">
                  {cur?.max_backlogs ?? "0 permitted"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Eligible Branches</dt>
                <dd className="text-right font-medium text-foreground max-w-36 truncate">
                  {cur?.branches || "All branches"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Coding Difficulty</dt>
                <dd>
                  <DifficultyTag level={c.dsa_difficulty} />
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Selection Stages</dt>
                <dd className="font-mono font-bold text-foreground">{rounds.length} Rounds</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Verification</dt>
                <dd>
                  <VerifyTag status={c.verification_status} />
                </dd>
              </div>
            </dl>
          </aside>
        </TabsContent>

        {/* Eligibility Tab */}
        <TabsContent value="eligibility" className="mt-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Current Drive Eligibility Criteria
            </h2>
            <p className="text-xs text-muted-foreground">
              Official academic cut-offs enforced for the active campus recruitment drive
            </p>

            {cur ? (
              <div className="mt-5 max-w-2xl overflow-hidden rounded-xl border border-border">
                <div className="border-b border-border bg-slate-50/80 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60 flex items-center justify-between">
                  <span>Drive Year: {cur.year}</span>
                  {cur.is_current && (
                    <span className="rounded-[4px] border border-emerald-500/25 bg-emerald-500/8 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                      Active Criteria
                    </span>
                  )}
                </div>
                <dl className="divide-y divide-border/60 text-xs sm:text-sm">
                  <Row
                    k="Minimum CGPA Cut-off"
                    v={
                      <span className="font-mono font-bold text-foreground">
                        {cur.min_cgpa ?? "No cut-off specified"}
                      </span>
                    }
                  />
                  <Row
                    k="Maximum Backlogs"
                    v={
                      <span className="font-semibold text-foreground">
                        {cur.max_backlogs ?? "0 backlogs permitted"}
                      </span>
                    }
                  />
                  <Row
                    k="Eligible Branches"
                    v={
                      <span className="font-medium text-foreground">
                        {cur.branches || "All branches eligible"}
                      </span>
                    }
                  />
                  <Row
                    k="Special Conditions & Notes"
                    v={
                      <span className="text-muted-foreground leading-relaxed">
                        {cur.notes || "No special conditions recorded."}
                      </span>
                    }
                  />
                </dl>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState title="Eligibility rules not published yet" />
              </div>
            )}
          </div>
        </TabsContent>

        {/* DSA Requirements Tab */}
        <TabsContent value="dsa" className="mt-0 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Data Structures & Algorithms Scope
                </h2>
                <p className="text-xs text-muted-foreground">
                  Algorithmic topics emphasized during coding tests and technical interviews
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Overall Difficulty:</span>
                <DifficultyTag level={c.dsa_difficulty} />
              </div>
            </div>

            {topics.length ? (
              <div className="mt-6 space-y-6">
                {[
                  ...topicsByCategory,
                  ...(uncategorised.length
                    ? [{ cat: "other" as const, items: uncategorised }]
                    : []),
                ].map((g) => (
                  <div key={g.cat} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {g.cat === "basic"
                        ? "Basic Fundamentals"
                        : g.cat === "intermediate"
                          ? "Intermediate Topics"
                          : g.cat === "advanced"
                            ? "Advanced Algorithms"
                            : "General Topics"}
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
                          <tr>
                            <th className="px-4 py-2.5 w-32">Priority</th>
                            <th className="px-4 py-2.5 w-1/3">Topic</th>
                            <th className="px-4 py-2.5 w-28">Difficulty</th>
                            <th className="px-4 py-2.5">Preparation Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {g.items.map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                            >
                              <td className="px-4 py-2.5">
                                <span
                                  className={`rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                                    t.priority === 1
                                      ? "border-rose-500/25 bg-rose-500/8 text-rose-700 dark:border-rose-400/30 dark:bg-rose-950/40 dark:text-rose-300"
                                      : t.priority === 2
                                        ? "border-amber-500/25 bg-amber-500/8 text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-300"
                                        : "border-border bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                  }`}
                                >
                                  {t.priority === 1
                                    ? "High Priority"
                                    : t.priority === 2
                                      ? "Medium"
                                      : "Low"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-foreground">
                                {t.topic}
                              </td>
                              <td className="px-4 py-2.5">
                                <DifficultyTag level={t.difficulty} />
                              </td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                {t.notes || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="No DSA topics recorded"
                  body="Specific algorithms requirements have not been logged for this recruiter."
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* CS Fundamentals Tab */}
        <TabsContent value="fundamentals" className="mt-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div className="border-b border-border/80 pb-4">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Core Computer Science Fundamentals
              </h2>
              <p className="text-xs text-muted-foreground">
                Subjects tested in technical assessments and face-to-face interviews
              </p>
            </div>

            {fundamentals.length ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
                    <tr>
                      <th className="px-4 py-2.5 w-28">Priority</th>
                      <th className="px-4 py-2.5 w-1/4">Subject</th>
                      <th className="px-4 py-2.5">Subtopics & Focus Areas</th>
                      <th className="px-4 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {fundamentals.map((f) => (
                      <tr
                        key={f.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                              f.priority === 1
                                ? "border-rose-500/25 bg-rose-500/8 text-rose-700 dark:border-rose-400/30 dark:bg-rose-950/40 dark:text-rose-300"
                                : f.priority === 2
                                  ? "border-amber-500/25 bg-amber-500/8 text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-300"
                                  : "border-border bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {f.priority === 1 ? "High" : f.priority === 2 ? "Med" : "Low"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-foreground">{f.subject}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {f.subtopics || "General core concepts"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {f.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="No CS fundamentals listed"
                  body="The placement cell has not listed specific subject requirements for this company."
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Selection Rounds Tab */}
        <TabsContent value="rounds" className="mt-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div className="mb-6 border-b border-border/80 pb-4">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Ordered Selection Stages
              </h2>
              <p className="text-xs text-muted-foreground">
                Follow each round in sequence with dedicated preparation strategies
              </p>
            </div>

            {rounds.length ? (
              <RoundSteps rounds={rounds} />
            ) : (
              <EmptyState
                title="Selection rounds not published"
                body="The exact round schedule has not been finalized by the placement cell."
              />
            )}
          </div>
        </TabsContent>

        {/* DSA Sheet & Questions Tab */}
        <TabsContent value="questions" className="mt-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-border/80 pb-4">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Company Questions & DSA Problems
                </h2>
                <p className="text-xs text-muted-foreground">
                  Authentic questions asked during recent recruitment drives
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs font-medium">
                <Link to="/questions">
                  <FileCode2 className="size-3.5 mr-1.5 text-primary" /> Open Day-Wise DSA Sheet
                </Link>
              </Button>
            </div>

            {questions.length ? (
              <div className="space-y-6">
                {questionsByYear.map(([year, items]) => (
                  <div key={year} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {year ? `${year} Campus Drive` : "Drive Date Unrecorded"}
                    </h3>
                    <div className="space-y-3">
                      {items.map((x) => (
                        <div
                          key={x.id}
                          className="rounded-lg border border-border bg-card p-4 shadow-2xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {x.interview_rounds?.name ?? "Technical Round"}
                            </span>
                            <span>·</span>
                            <span>{x.topic || "Problem Solving"}</span>
                            <span>·</span>
                            <DifficultyTag level={x.difficulty} />
                            {x.asked_on && <span>· Asked {fmtDate(x.asked_on)}</span>}
                          </div>

                          <p className="mt-2 text-sm font-semibold text-foreground">{x.question}</p>

                          {x.experience && (
                            <p className="mt-2 text-xs text-muted-foreground leading-relaxed bg-slate-50/70 p-3 rounded-md border border-border/60 dark:bg-slate-900/40">
                              <span className="font-semibold text-foreground">
                                Candidate debrief:
                              </span>{" "}
                              {x.experience}
                            </p>
                          )}

                          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                            <span>Source: {x.sources?.title ?? "Student experience report"}</span>
                            {x.sources && <VerifyTag status={x.sources.status} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No questions recorded yet"
                body="Questions from past drives have not been submitted or verified for this company."
              />
            )}
          </div>
        </TabsContent>

        {/* Criteria History Tab */}
        <TabsContent value="history" className="mt-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div className="border-b border-border/80 pb-4">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Historical Criteria Evolution
              </h2>
              <p className="text-xs text-muted-foreground">
                Audit trail of cut-offs and backlog allowances across past recruitment seasons
              </p>
            </div>

            {criteria.length ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
                    <tr>
                      <th className="px-4 py-2.5">Drive Year</th>
                      <th className="px-4 py-2.5">Min. CGPA</th>
                      <th className="px-4 py-2.5">Max Backlogs</th>
                      <th className="px-4 py-2.5">Eligible Branches</th>
                      <th className="px-4 py-2.5">Policy Changes & Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {criteria.map((e) => (
                      <tr
                        key={e.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-semibold text-foreground">
                          {e.year}{" "}
                          {e.is_current && (
                            <span className="ml-1 rounded-[4px] border border-blue-500/20 bg-blue-500/8 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700 dark:text-blue-300">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono font-bold tabular-nums text-foreground">
                          {e.min_cgpa ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 font-mono tabular-nums text-foreground">
                          {e.max_backlogs ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{e.branches}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {e.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState title="No historical criteria available" />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] px-5 py-3 sm:grid-cols-[220px_1fr]">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
