import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { z } from "zod";
import { Search, Building2, ChevronRight, ListOrdered, ArrowUpRight } from "lucide-react";
import { companiesQuery, roundsQuery } from "@/lib/queries";
import { PageHeader, DifficultyTag, VerifyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoundSteps } from "@/components/round-steps";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/rounds")({
  validateSearch: z.object({ company: z.string().optional() }),
  head: () => ({ meta: [{ title: "Interview Rounds — Placement Portal" }] }),
  component: RoundsPage,
});

function RoundsPage() {
  const { company } = Route.useSearch();
  const navigate = useNavigate({ from: "/rounds" });
  const cq = useQuery(companiesQuery);
  const rq = useQuery(roundsQuery);

  const [searchFilter, setSearchFilter] = useState("");

  const filteredCompanies = useMemo(() => {
    return (cq.data ?? []).filter(
      (c) => !searchFilter || c.name.toLowerCase().includes(searchFilter.toLowerCase()),
    );
  }, [cq.data, searchFilter]);

  const selected = company ?? filteredCompanies[0]?.id ?? cq.data?.[0]?.id;
  const rounds = (rq.data ?? []).filter((r) => r.company_id === selected);
  const comp = cq.data?.find((c) => c.id === selected);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordered Selection Process & Rounds"
        description="Detailed round-by-round breakdown for campus recruiters. Understand what each round evaluates and prepare with targeted strategies."
      />

      {cq.isLoading || rq.isLoading ? (
        <LoadingState label="Loading selection schedules…" />
      ) : cq.error || rq.error ? (
        <ErrorState
          error={cq.error ?? rq.error}
          onRetry={() => {
            cq.refetch();
            rq.refetch();
          }}
        />
      ) : !cq.data?.length ? (
        <EmptyState title="No companies published" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Company Picker Sidebar */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs h-fit">
            <div className="mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Select Recruiter
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Find company…"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="h-8 pl-8 text-xs"
                  aria-label="Filter companies"
                />
              </div>
            </div>

            <div className="max-h-[580px] overflow-y-auto space-y-1 pr-1">
              {filteredCompanies.map((c) => {
                const isCur = c.id === selected;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate({ search: { company: c.id } })}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-all ${
                      isCur
                        ? "bg-slate-900 font-semibold text-white shadow-2xs dark:bg-slate-800"
                        : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-mono font-bold ${
                          isCur
                            ? "bg-white/20 text-white"
                            : "border border-border bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <ChevronRight
                      className={`size-3.5 shrink-0 transition-opacity ${
                        isCur ? "opacity-100" : "opacity-40"
                      }`}
                    />
                  </button>
                );
              })}
              {!filteredCompanies.length && (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  No matching recruiters found
                </p>
              )}
            </div>
          </div>

          {/* Rounds Main Timeline */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
            {comp && (
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {comp.name}
                    </h2>
                    <VerifyTag status={comp.verification_status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{comp.sector || "Campus Recruiter"}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      Overall DSA: <DifficultyTag level={comp.dsa_difficulty} />
                    </span>
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium self-start sm:self-auto"
                >
                  <Link to="/companies/$id" params={{ id: comp.id }}>
                    Company Profile <ArrowUpRight className="size-3 ml-1" />
                  </Link>
                </Button>
              </div>
            )}

            {rounds.length ? (
              <RoundSteps rounds={rounds} />
            ) : (
              <EmptyState
                title="No interview rounds published for this company"
                body="The placement cell has not logged the step-by-step interview rounds for this recruiter yet."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
