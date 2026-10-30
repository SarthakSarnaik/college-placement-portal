import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, RotateCcw, ChevronRight, Building2, LayoutGrid, List, MapPin } from "lucide-react";
import { companiesQuery } from "@/lib/queries";
import { PageHeader, DifficultyTag, VerifyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/companies/")({
  head: () => ({ meta: [{ title: "Company Directory — Placement Portal" }] }),
  component: Directory,
});

const selectCls =
  "h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-medium";

function Directory() {
  const q = useQuery(companiesQuery);
  const [term, setTerm] = useState("");
  const [diff, setDiff] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const rows = useMemo(() => {
    return (q.data ?? []).filter((c) => {
      const cur = c.eligibility_criteria?.find((e) => e.is_current) ?? c.eligibility_criteria?.[0];
      const hay = [
        c.name,
        c.sector,
        ...(c.job_roles ?? []).map((r) => r.title),
        ...(c.dsa_topics ?? []).map((t) => t.topic),
      ]
        .join(" ")
        .toLowerCase();

      if (term && !hay.includes(term.toLowerCase())) return false;
      if (diff && c.dsa_difficulty !== diff) return false;
      if (branch && !(cur?.branches ?? "").toUpperCase().includes(branch.toUpperCase()))
        return false;
      if (cgpa && cur?.min_cgpa != null && Number(cur.min_cgpa) > Number(cgpa)) return false;
      return true;
    });
  }, [q.data, term, diff, branch, cgpa]);

  const reset = () => {
    setTerm("");
    setDiff("");
    setBranch("");
    setCgpa("");
  };

  const hasFilter = Boolean(term || diff || branch || cgpa);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Recruiter Directory"
        description="Recruiters published by the college Training & Placement Office. Filter by eligible branch and CGPA cut-off to discover active opportunities."
      />

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-2.5 sm:grid-cols-[1fr_auto_auto_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-9 text-xs shadow-2xs"
                placeholder="Search by company name, job role, or DSA topic…"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                aria-label="Search companies"
              />
            </div>

            <select
              className={selectCls}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              aria-label="Filter by engineering branch"
            >
              <option value="">All Branches</option>
              {["CSE", "IT", "ECE", "EEE", "EIE", "MECH", "CIVIL"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              className={selectCls}
              value={diff}
              onChange={(e) => setDiff(e.target.value)}
              aria-label="Filter by DSA difficulty"
            >
              <option value="">Any DSA Level</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <Input
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="My CGPA"
              className="w-28 text-xs shadow-2xs"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              aria-label="My CGPA"
            />

            {hasFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                <RotateCcw className="size-3 mr-1" /> Reset
              </Button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-[11px] font-mono text-muted-foreground mr-1">
              {rows.length} {rows.length === 1 ? "recruiter" : "recruiters"}
            </span>
            <div className="flex items-center rounded-md border border-border bg-slate-50/80 p-0.5 dark:bg-slate-900/60 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex size-7 items-center justify-center rounded-[4px] transition-colors ${
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex size-7 items-center justify-center rounded-[4px] transition-colors ${
                  viewMode === "table"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Table view"
                aria-label="Table view"
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Directory: Desktop Table + Mobile Cards / Grid */}
      {q.isLoading ? (
        <LoadingState label="Loading recruiter directory…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !rows.length ? (
        <EmptyState
          title="No companies match the selected criteria"
          body="Try clearing your branch or CGPA filters to see all campus recruiters."
          action={
            <Button variant="outline" size="sm" onClick={reset}>
              Clear all filters
            </Button>
          }
        />
      ) : viewMode === "grid" ? (
        /* Grid View: Responsive cards across mobile, tablet, desktop */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => {
            const cur =
              c.eligibility_criteria?.find((e) => e.is_current) ?? c.eligibility_criteria?.[0];
            const words = c.name
              .replace(/\(.*?\)/g, "")
              .trim()
              .split(/\s+/);
            const initials =
              words.length >= 2
                ? `${words[0]![0]}${words[1]![0]}`.toUpperCase()
                : c.name.slice(0, 2).toUpperCase();
            return (
              <div
                key={c.id}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-slate-100 font-mono text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to="/companies/$id"
                          params={{ id: c.id }}
                          className="font-bold text-foreground hover:text-primary hover:underline tracking-tight text-sm sm:text-base line-clamp-1"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.sector || "Recruiter"}
                        </p>
                      </div>
                    </div>
                    <DifficultyTag level={c.dsa_difficulty} />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <VerifyTag status={c.verification_status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-slate-50/70 p-3 text-xs dark:bg-slate-900/40">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Min. CGPA
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {cur?.min_cgpa != null ? cur.min_cgpa : "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Eligible Branches
                      </span>
                      <span className="truncate text-foreground font-medium block">
                        {cur?.branches || "All branches"}
                      </span>
                    </div>
                  </div>

                  {(c.job_roles ?? []).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Roles: </span>
                      <span className="line-clamp-1">
                        {c.job_roles.map((r) => r.title).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-border/60">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-medium justify-between group-hover:border-slate-300 dark:group-hover:border-slate-600"
                  >
                    <Link to="/companies/$id" params={{ id: c.id }}>
                      <span>View Full Profile</span>
                      <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View: Dense, crisp enterprise table */
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3">Recruiter & Sector</th>
                  <th className="px-4 py-3">Roles Offered</th>
                  <th className="px-4 py-3">Min. CGPA</th>
                  <th className="px-4 py-3">Eligible Branches</th>
                  <th className="px-4 py-3">DSA Level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((c) => {
                  const cur =
                    c.eligibility_criteria?.find((e) => e.is_current) ??
                    c.eligibility_criteria?.[0];
                  const words = c.name
                    .replace(/\(.*?\)/g, "")
                    .trim()
                    .split(/\s+/);
                  const initials =
                    words.length >= 2
                      ? `${words[0]![0]}${words[1]![0]}`.toUpperCase()
                      : c.name.slice(0, 2).toUpperCase();
                  return (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-slate-100 font-mono text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to="/companies/$id"
                              params={{ id: c.id }}
                              className="font-bold text-foreground hover:text-primary hover:underline tracking-tight"
                            >
                              {c.name}
                            </Link>
                            <div className="text-[11px] text-muted-foreground">
                              {c.sector || "Recruiter"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        <span className="line-clamp-2 max-w-[200px]">
                          {(c.job_roles ?? []).map((r) => r.title).join(", ") || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold tabular-nums text-foreground">
                        {cur?.min_cgpa != null ? cur.min_cgpa : "—"}
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        <span className="line-clamp-1 max-w-[160px]">
                          {cur?.branches || "All branches"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <DifficultyTag level={c.dsa_difficulty} />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          <VerifyTag status={c.verification_status} />
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-medium text-primary hover:bg-primary/10"
                        >
                          <Link to="/companies/$id" params={{ id: c.id }}>
                            Profile <ChevronRight className="size-3 ml-0.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border bg-slate-50/50 px-4 py-2.5 text-xs text-muted-foreground dark:bg-slate-900/40">
            Showing {rows.length} of {q.data?.length ?? 0} published campus recruiters.
          </div>
        </div>
      )}
    </div>
  );
}
