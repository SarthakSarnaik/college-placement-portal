import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Search,
  RotateCcw,
  MessageSquareText,
  HelpCircle,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { fmtDate, questionsQuery } from "@/lib/queries";
import { PageHeader, DemoTag, DifficultyTag, VerifyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/questions")({
  head: () => ({ meta: [{ title: "Previous Questions — Placement Portal" }] }),
  component: QuestionsPage,
});

const sel =
  "h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-medium";

function QuestionsPage() {
  const q = useQuery(questionsQuery);
  const [term, setTerm] = useState("");
  const [company, setCompany] = useState("");
  const [diff, setDiff] = useState("");
  const [year, setYear] = useState("");

  const companies = useMemo(() => {
    return [
      ...new Map(
        (q.data ?? []).filter((x) => x.companies).map((x) => [x.companies!.id, x.companies!.name]),
      ).entries(),
    ];
  }, [q.data]);

  const years = useMemo(() => {
    return [
      ...new Set(
        (q.data ?? []).filter((x) => x.asked_on).map((x) => new Date(x.asked_on!).getFullYear()),
      ),
    ].sort((a, b) => b - a);
  }, [q.data]);

  const rows = (q.data ?? []).filter((x) => {
    if (
      term &&
      !`${x.question} ${x.topic} ${x.experience ?? ""}`.toLowerCase().includes(term.toLowerCase())
    )
      return false;
    if (company && x.company_id !== company) return false;
    if (diff && x.difficulty !== diff) return false;
    if (year && (!x.asked_on || new Date(x.asked_on).getFullYear() !== Number(year))) return false;
    return true;
  });

  const reset = () => {
    setTerm("");
    setCompany("");
    setDiff("");
    setYear("");
  };

  const hasFilter = Boolean(term || company || diff || year);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Previous Interview Questions Bank"
        description="Authentic technical and algorithmic questions reported from campus drives over the last three years. Cross-checked with student debriefs and placement cell records."
      />

      {/* Filter Card */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9 text-xs"
              placeholder="Search question text, algorithms, or concepts…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              aria-label="Search questions"
            />
          </div>

          <select
            className={sel}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            aria-label="Filter by company"
          >
            <option value="">All Companies</option>
            {companies.map(([id, n]) => (
              <option key={id} value={id}>
                {n}
              </option>
            ))}
          </select>

          <select
            className={sel}
            value={diff}
            onChange={(e) => setDiff(e.target.value)}
            aria-label="Filter by difficulty"
          >
            <option value="">Any Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className={sel}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            aria-label="Filter by drive year"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {hasFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3 mr-1.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Questions List */}
      {q.isLoading ? (
        <LoadingState label="Loading question archive…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !rows.length ? (
        <EmptyState
          title="No interview questions matched your query"
          body="Try clearing your filters or searching for broader algorithmic topics."
          action={
            <Button variant="outline" size="sm" onClick={reset}>
              Clear all filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {rows.map((x) => (
            <div
              key={x.id}
              className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  {x.companies && (
                    <Link
                      to="/companies/$id"
                      params={{ id: x.companies.id }}
                      className="font-bold text-foreground hover:text-primary hover:underline flex items-center gap-1.5"
                    >
                      <span className="flex size-5 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                        {x.companies.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span>{x.companies.name}</span>
                    </Link>
                  )}
                  {x.companies?.is_demo && <DemoTag />}
                  <span>·</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {x.interview_rounds?.name ?? "Technical Assessment"}
                  </span>
                  <span>·</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {x.topic || "Problem Solving"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DifficultyTag level={x.difficulty} />
                  {x.asked_on && <span>Asked {fmtDate(x.asked_on)}</span>}
                </div>
              </div>

              <div className="mt-3.5">
                <p className="text-base font-semibold leading-relaxed text-foreground">
                  {x.question}
                </p>

                {x.experience && (
                  <div className="mt-3 rounded-lg border border-border/50 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                    <span className="font-bold text-foreground">Candidate Debrief:</span>{" "}
                    {x.experience}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Source: {x.sources?.title ?? "Candidate debrief report"}</span>
                  {x.sources ? (
                    <VerifyTag status={x.sources.status} />
                  ) : (
                    <VerifyTag status="unverified" />
                  )}
                </div>

                {x.companies && (
                  <Link
                    to="/companies/$id"
                    params={{ id: x.companies.id }}
                    className="font-medium text-primary hover:underline text-xs inline-flex items-center gap-1"
                  >
                    View company details <ArrowUpRight className="size-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}

          <div className="p-3 text-center text-xs font-medium text-muted-foreground">
            Displaying {rows.length} verified and reported interview questions.
          </div>
        </div>
      )}
    </div>
  );
}
