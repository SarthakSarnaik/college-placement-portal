import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { companiesQuery } from "@/lib/queries";
import { PageHeader, DemoTag, DifficultyTag, VerifyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/companies/")({
  head: () => ({ meta: [{ title: "Company Directory — Placement Portal" }] }),
  component: Directory,
});

const selectCls = "h-9 border border-input bg-background px-2 text-sm rounded-md";

function Directory() {
  const q = useQuery(companiesQuery);
  const [term, setTerm] = useState("");
  const [diff, setDiff] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");

  const rows = useMemo(() => {
    return (q.data ?? []).filter((c) => {
      const cur = c.eligibility_criteria?.find((e) => e.is_current) ?? c.eligibility_criteria?.[0];
      const hay = [c.name, c.sector, ...(c.job_roles ?? []).map((r) => r.title), ...(c.dsa_topics ?? []).map((t) => t.topic)].join(" ").toLowerCase();
      if (term && !hay.includes(term.toLowerCase())) return false;
      if (diff && c.dsa_difficulty !== diff) return false;
      if (branch && !(cur?.branches ?? "").toUpperCase().includes(branch)) return false;
      if (cgpa && cur?.min_cgpa != null && Number(cur.min_cgpa) > Number(cgpa)) return false;
      return true;
    });
  }, [q.data, term, diff, branch, cgpa]);

  const reset = () => { setTerm(""); setDiff(""); setBranch(""); setCgpa(""); };

  return (
    <>
      <PageHeader title="Company Directory" description="Recruiters published by the placement office. Filter by your branch and CGPA to see where you are currently eligible." />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search company, role or topic" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Search companies" />
        </div>
        <select className={selectCls} value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Branch">
          <option value="">All branches</option>
          {["CSE", "IT", "ECE", "EEE", "EIE", "MECH", "CIVIL"].map((b) => <option key={b}>{b}</option>)}
        </select>
        <select className={selectCls} value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="DSA difficulty">
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
        <Input type="number" step="0.1" min="0" max="10" placeholder="My CGPA" className="w-28" value={cgpa} onChange={(e) => setCgpa(e.target.value)} aria-label="My CGPA" />
        <Button variant="outline" onClick={reset}>Clear</Button>
      </div>

      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !rows.length ? (
        <EmptyState title="No companies match these filters" body="Try clearing a filter or searching a broader term." action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
      ) : (
        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-2.5">Company</th><th className="px-4 py-2.5">Roles</th><th className="px-4 py-2.5">Min. CGPA</th><th className="px-4 py-2.5">Branches</th><th className="px-4 py-2.5">DSA</th><th className="px-4 py-2.5">Status</th></tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((c) => {
                const cur = c.eligibility_criteria?.find((e) => e.is_current) ?? c.eligibility_criteria?.[0];
                return (
                  <tr key={c.id} className="hover:bg-muted/60">
                    <td className="px-4 py-3">
                      <Link to="/companies/$id" params={{ id: c.id }} className="font-medium text-primary hover:underline">{c.name}</Link>
                      <div className="text-xs text-muted-foreground">{c.sector}</div>
                    </td>
                    <td className="px-4 py-3">{(c.job_roles ?? []).map((r) => r.title).join(", ") || "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{cur?.min_cgpa ?? "—"}</td>
                    <td className="px-4 py-3">{cur?.branches || "—"}</td>
                    <td className="px-4 py-3"><DifficultyTag level={c.dsa_difficulty} /></td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{c.is_demo && <DemoTag />}<VerifyTag status={c.verification_status} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Showing {rows.length} of {q.data?.length ?? 0} companies.</p>
    </>
  );
}
