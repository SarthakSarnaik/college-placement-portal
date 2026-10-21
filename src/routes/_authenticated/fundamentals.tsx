import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { csQuery } from "@/lib/queries";
import { PageHeader, DemoTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

export const Route = createFileRoute("/_authenticated/fundamentals")({
  head: () => ({ meta: [{ title: "CS Fundamentals — Placement Portal" }] }),
  component: FundamentalsPage,
});

function FundamentalsPage() {
  const q = useQuery(csQuery);
  const [priority, setPriority] = useState("");
  const grouped = useMemo(() => {
    const m = new Map<string, { subject: string; companies: { id: string; name: string; demo: boolean; priority: number; subtopics: string }[] }>();
    for (const f of q.data ?? []) {
      if (priority && String(f.priority) !== priority) continue;
      if (!m.has(f.subject)) m.set(f.subject, { subject: f.subject, companies: [] });
      if (f.companies) m.get(f.subject)!.companies.push({ id: f.companies.id, name: f.companies.name, demo: f.companies.is_demo, priority: f.priority, subtopics: f.subtopics });
    }
    return [...m.values()].sort((a, b) => b.companies.length - a.companies.length);
  }, [q.data, priority]);

  return (
    <>
      <PageHeader title="Core CS Fundamentals" description="Core computer science subjects recruiters test in interviews, grouped by subject. Prioritise subjects required by the most companies." />
      <div className="mb-4 flex gap-2 text-sm">
        {["", "1", "2", "3"].map((p) => (
          <button key={p} onClick={() => setPriority(p)} className={`border px-3 py-1.5 ${priority === p ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted"}`}>{p === "" ? "All priorities" : p === "1" ? "High" : p === "2" ? "Medium" : "Low"}</button>
        ))}
      </div>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} /> : !grouped.length ? <EmptyState title="No subjects found" body="The placement office has not published CS fundamentals requirements yet." /> : (
        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-2.5">Subject</th><th className="px-4 py-2.5">Companies</th><th className="px-4 py-2.5">Required by</th></tr></thead>
            <tbody className="divide-y">
              {grouped.map((g) => (
                <tr key={g.subject} className="align-top">
                  <td className="px-4 py-3 font-medium">{g.subject}</td>
                  <td className="px-4 py-3 tabular-nums">{g.companies.length}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-2">{g.companies.map((c) => (
                    <Link key={c.id} to="/companies/$id" params={{ id: c.id }} className="inline-flex items-center gap-1.5 border px-2 py-1 hover:bg-muted" title={c.subtopics || undefined}>
                      {c.name}
                      <span className={`text-[11px] uppercase ${c.priority === 1 ? "text-destructive" : c.priority === 2 ? "text-warning-foreground" : "text-muted-foreground"}`}>{c.priority === 1 ? "High" : c.priority === 2 ? "Med" : "Low"}</span>
                      {c.demo && <DemoTag />}
                    </Link>
                  ))}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
