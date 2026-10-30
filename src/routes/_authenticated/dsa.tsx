import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Code2, Search, ArrowRight, Layers, Sparkles } from "lucide-react";
import { dsaQuery } from "@/lib/queries";
import { PageHeader, DemoTag, DifficultyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/dsa")({
  head: () => ({ meta: [{ title: "DSA Requirements — Placement Portal" }] }),
  component: DsaPage,
});

function DsaPage() {
  const q = useQuery(dsaQuery);
  const [diff, setDiff] = useState("");
  const [term, setTerm] = useState("");

  const grouped = useMemo(() => {
    const m = new Map<
      string,
      {
        topic: string;
        companies: { id: string; name: string; demo: boolean; difficulty: string }[];
      }
    >();
    for (const t of q.data ?? []) {
      if (diff && t.difficulty !== diff) continue;
      if (term && !t.topic.toLowerCase().includes(term.toLowerCase())) continue;
      const key = t.topic;
      if (!m.has(key)) m.set(key, { topic: key, companies: [] });
      if (t.companies) {
        m.get(key)!.companies.push({
          id: t.companies.id,
          name: t.companies.name,
          demo: t.companies.is_demo,
          difficulty: t.difficulty,
        });
      }
    }
    return [...m.values()].sort((a, b) => b.companies.length - a.companies.length);
  }, [q.data, diff, term]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="DSA Preparation Requirements"
        description="Data structures and algorithms topics expected by campus recruiters, aggregated by topic frequency. Prioritize topics tested by the highest number of companies."
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search algorithmic topics (e.g. Graphs, DP)…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="pl-9 text-xs"
            aria-label="Search topics"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground mr-1 text-[11px] font-semibold uppercase tracking-wider">
            Difficulty:
          </span>
          {["", "easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={`rounded-md px-3 py-1.5 text-xs capitalize transition-colors ${
                diff === d
                  ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                  : "border border-border bg-background font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {d || "All levels"}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <LoadingState label="Analyzing algorithms requirements…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !grouped.length ? (
        <EmptyState
          title="No algorithmic topics found"
          body="Try clearing your difficulty filter or search term."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 w-1/4">Topic Category</th>
                  <th className="px-5 py-3 w-32">Company Count</th>
                  <th className="px-5 py-3">Campus Recruiters Testing This Topic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grouped.map((g) => (
                  <tr key={g.topic} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Code2 className="size-4 text-primary shrink-0" />
                        <span>{g.topic}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-foreground">
                      <span className="inline-flex items-center rounded-[4px] border border-border bg-muted/50 px-2 py-0.5 text-xs font-mono font-semibold text-foreground">
                        {g.companies.length} {g.companies.length === 1 ? "Company" : "Companies"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        {g.companies.map((c) => (
                          <Link
                            key={c.id}
                            to="/companies/$id"
                            params={{ id: c.id }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-muted/40 shadow-2xs"
                          >
                            <span>{c.name}</span>
                            <DifficultyTag level={c.difficulty} />
                            {c.demo && <DemoTag />}
                          </Link>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-muted/20 px-5 py-2.5 text-xs font-medium text-muted-foreground">
            Displaying {grouped.length} topic categories across campus drives.
          </div>
        </div>
      )}
    </div>
  );
}
