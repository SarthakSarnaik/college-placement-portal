import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GraduationCap, Search, BookOpen } from "lucide-react";
import { csQuery } from "@/lib/queries";
import { PageHeader, DemoTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/fundamentals")({
  head: () => ({ meta: [{ title: "CS Fundamentals — Placement Portal" }] }),
  component: FundamentalsPage,
});

function FundamentalsPage() {
  const q = useQuery(csQuery);
  const [priority, setPriority] = useState("");
  const [term, setTerm] = useState("");

  const grouped = useMemo(() => {
    const m = new Map<
      string,
      {
        subject: string;
        companies: {
          id: string;
          name: string;
          demo: boolean;
          priority: number;
          subtopics: string;
        }[];
      }
    >();
    for (const f of q.data ?? []) {
      if (priority && String(f.priority) !== priority) continue;
      if (
        term &&
        !f.subject.toLowerCase().includes(term.toLowerCase()) &&
        !f.subtopics.toLowerCase().includes(term.toLowerCase())
      )
        continue;
      if (!m.has(f.subject)) m.set(f.subject, { subject: f.subject, companies: [] });
      if (f.companies) {
        m.get(f.subject)!.companies.push({
          id: f.companies.id,
          name: f.companies.name,
          demo: f.companies.is_demo,
          priority: f.priority,
          subtopics: f.subtopics,
        });
      }
    }
    return [...m.values()].sort((a, b) => b.companies.length - a.companies.length);
  }, [q.data, priority, term]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Core Computer Science Fundamentals"
        description="Core technical subjects evaluated during written screenings and technical interview rounds. Focus on DBMS, Operating Systems, Computer Networks, and Object-Oriented Programming."
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects or subtopics (e.g. Indexing, Semaphores)…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="pl-9 text-xs"
            aria-label="Search fundamentals"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground mr-1 text-[11px] font-semibold uppercase tracking-wider">
            Priority:
          </span>
          {[
            { val: "", label: "All Priorities" },
            { val: "1", label: "High Priority" },
            { val: "2", label: "Medium" },
            { val: "3", label: "Low" },
          ].map((p) => (
            <button
              key={p.val}
              onClick={() => setPriority(p.val)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                priority === p.val
                  ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                  : "border border-border bg-background font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <LoadingState label="Loading computer science fundamentals…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !grouped.length ? (
        <EmptyState
          title="No CS subjects found"
          body="The Placement Office has not logged specific subject requirements matching your filter."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
                <tr>
                  <th className="px-5 py-3 w-1/4">Core Subject</th>
                  <th className="px-5 py-3 w-32">Company Count</th>
                  <th className="px-5 py-3">Recruiters Testing Subject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grouped.map((g) => (
                  <tr
                    key={g.subject}
                    className="align-top transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{g.subject}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-foreground">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
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
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
                            title={c.subtopics ? `Focus: ${c.subtopics}` : undefined}
                          >
                            <span>{c.name}</span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                                c.priority === 1
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : c.priority === 2
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {c.priority === 1 ? "High" : c.priority === 2 ? "Med" : "Low"}
                            </span>
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
          <div className="border-t border-border bg-slate-50/50 px-5 py-2.5 text-xs font-medium text-muted-foreground dark:bg-slate-900/40">
            Displaying {grouped.length} core subject areas across campus recruiters.
          </div>
        </div>
      )}
    </div>
  );
}
