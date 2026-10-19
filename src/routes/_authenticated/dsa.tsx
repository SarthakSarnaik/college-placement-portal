import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { dsaQuery } from "@/lib/queries";
import { PageHeader, DemoTag, DifficultyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

export const Route = createFileRoute("/_authenticated/dsa")({
  head: () => ({ meta: [{ title: "DSA Requirements — Placement Portal" }] }),
  component: DsaPage,
});

function DsaPage() {
  const q = useQuery(dsaQuery);
  const [diff, setDiff] = useState("");
  const grouped = useMemo(() => {
    const m = new Map<string, { topic: string; companies: { id: string; name: string; demo: boolean; difficulty: string }[] }>();
    for (const t of q.data ?? []) {
      if (diff && t.difficulty !== diff) continue;
      const key = t.topic;
      if (!m.has(key)) m.set(key, { topic: key, companies: [] });
      if (t.companies) m.get(key)!.companies.push({ id: t.companies.id, name: t.companies.name, demo: t.companies.is_demo, difficulty: t.difficulty });
    }
    return [...m.values()].sort((a, b) => b.companies.length - a.companies.length);
  }, [q.data, diff]);

  return (
    <>
      <PageHeader title="DSA Requirements" description="Data structures and algorithms topics expected by recruiters, grouped by topic. Start with topics required by the most companies." />
      <div className="mb-4 flex gap-2 text-sm">
        {["", "easy", "medium", "hard"].map((d) => (
          <button key={d} onClick={() => setDiff(d)} className={`border px-3 py-1.5 capitalize ${diff === d ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted"}`}>{d || "All levels"}</button>
        ))}
      </div>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} /> : !grouped.length ? <EmptyState title="No topics for this level" /> : (
        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-2.5">Topic</th><th className="px-4 py-2.5">Companies</th><th className="px-4 py-2.5">Required by</th></tr></thead>
            <tbody className="divide-y">
              {grouped.map((g) => (
                <tr key={g.topic}>
                  <td className="px-4 py-3 font-medium">{g.topic}</td>
                  <td className="px-4 py-3 tabular-nums">{g.companies.length}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-2">{g.companies.map((c) => (
                    <Link key={c.id} to="/companies/$id" params={{ id: c.id }} className="inline-flex items-center gap-1.5 border px-2 py-1 hover:bg-muted">{c.name}<DifficultyTag level={c.difficulty} />{c.demo && <DemoTag />}</Link>
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
