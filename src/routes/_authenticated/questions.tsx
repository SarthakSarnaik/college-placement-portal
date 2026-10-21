import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { fmtDate, questionsQuery } from "@/lib/queries";
import { PageHeader, DemoTag, DifficultyTag, VerifyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/questions")({
  head: () => ({ meta: [{ title: "Previous Questions — Placement Portal" }] }),
  component: QuestionsPage,
});

const sel = "h-9 border border-input bg-background px-2 text-sm rounded-md";

function QuestionsPage() {
  const q = useQuery(questionsQuery);
  const [term, setTerm] = useState("");
  const [company, setCompany] = useState("");
  const [diff, setDiff] = useState("");
  const [year, setYear] = useState("");
  const companies = useMemo(() => [...new Map((q.data ?? []).filter((x) => x.companies).map((x) => [x.companies!.id, x.companies!.name])).entries()], [q.data]);
  const years = useMemo(() => [...new Set((q.data ?? []).filter((x) => x.asked_on).map((x) => new Date(x.asked_on!).getFullYear()))].sort((a, b) => b - a), [q.data]);
  const rows = (q.data ?? []).filter((x) =>
    (!term || `${x.question} ${x.topic}`.toLowerCase().includes(term.toLowerCase())) &&
    (!company || x.company_id === company) && (!diff || x.difficulty === diff) &&
    (!year || (x.asked_on && new Date(x.asked_on).getFullYear() === Number(year))));

  return (
    <>
      <PageHeader title="Previous Questions & Experiences" description="Questions reported from past drives. Each entry shows its source and review status — treat unverified entries with caution." />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search questions or topics" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Search questions" /></div>
        <select className={sel} value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Company"><option value="">All companies</option>{companies.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
        <select className={sel} value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Difficulty"><option value="">Any difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <select className={sel} value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year"><option value="">All years</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
      </div>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} /> : !rows.length ? <EmptyState title="No questions found" /> : (
        <ul className="divide-y border">
          {rows.map((x) => (
            <li key={x.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {x.companies && <Link to="/companies/$id" params={{ id: x.companies.id }} className="font-medium text-primary hover:underline">{x.companies.name}</Link>}
                {x.companies?.is_demo && <DemoTag />}·<span>{x.interview_rounds?.name ?? "Round not specified"}</span>·<span>{x.topic}</span><DifficultyTag level={x.difficulty} /><span>· {fmtDate(x.asked_on)}</span>
              </div>
              <p className="mt-1.5 font-medium">{x.question}</p>
              {x.experience && <p className="mt-1 text-sm text-muted-foreground">{x.experience}</p>}
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">Source: {x.sources?.title ?? "No source recorded"}{x.sources ? <VerifyTag status={x.sources.status} /> : <VerifyTag status="unverified" />}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
