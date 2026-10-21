import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { companyQuery, fmtDate } from "@/lib/queries";
import { DemoTag, DifficultyTag, VerifyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoundSteps } from "@/components/round-steps";

export const Route = createFileRoute("/_authenticated/companies/$id")({
  head: () => ({ meta: [{ title: "Company Profile — Placement Portal" }] }),
  component: Profile,
});

function Profile() {
  const { id } = Route.useParams();
  const q = useQuery(companyQuery(id));
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const c = q.data;
  if (!c) return <EmptyState title="Company not found" body="It may have been unpublished or removed." action={<Link to="/companies" className="text-primary hover:underline">Back to directory</Link>} />;

  const criteria = [...(c.eligibility_criteria ?? [])].sort((a, b) => b.year - a.year);
  const cur = criteria.find((e) => e.is_current) ?? criteria[0];
  const rounds = [...(c.interview_rounds ?? [])].sort((a, b) => a.round_order - b.round_order);
  const topics = [...(c.dsa_topics ?? [])].sort((a, b) => a.priority - b.priority);
  const fundamentals = [...(c.cs_fundamentals ?? [])].sort((a, b) => a.priority - b.priority);
  const questions = [...(c.questions ?? [])].sort((a, b) => (b.asked_on ?? "").localeCompare(a.asked_on ?? ""));
  const topicsByCategory = (["basic", "intermediate", "advanced"] as const)
    .map((cat) => ({ cat, items: topics.filter((t) => t.category === cat) }))
    .filter((g) => g.items.length);
  const uncategorised = topics.filter((t) => !["basic", "intermediate", "advanced"].includes(t.category));
  const questionsByYear = [...Map.groupBy(questions, (x) => (x.asked_on ? new Date(x.asked_on).getFullYear() : 0)).entries()].sort((a, b) => b[0] - a[0]);

  return (
    <>
      <Link to="/companies" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" />Company Directory</Link>
      <div className="border-b pb-5">
        <div className="flex flex-wrap items-center gap-2">{c.is_demo && <DemoTag />}<VerifyTag status={c.verification_status} /></div>
        <h1 className="mt-2 text-3xl font-semibold">{c.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{c.sector} · {c.headquarters}{c.first_visit_year ? ` · Visiting campus since ${c.first_visit_year}` : ""}</p>
        {c.is_demo && <p className="mt-3 border-l-2 border-demo-foreground/40 bg-demo/50 px-3 py-2 text-sm text-demo-foreground">This profile is sample data to demonstrate the portal. Criteria, rounds and questions shown here are not real.</p>}
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="h-auto flex-wrap justify-start rounded-none border-b bg-transparent p-0">
          {["overview", "eligibility", "dsa", "fundamentals", "rounds", "questions", "history"].map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-none border-b-2 border-transparent px-4 py-2 capitalize data-[state=active]:border-primary data-[state=active]:shadow-none">
              {t === "dsa" ? "DSA" : t === "fundamentals" ? "CS Fundamentals" : t === "rounds" ? "Selection rounds" : t === "history" ? "Year-wise changes" : t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <h2 className="text-lg font-semibold">About</h2>
            <p className="mt-2 leading-relaxed">{c.overview || "No overview provided."}</p>
            <h2 className="mt-8 text-lg font-semibold">Roles offered</h2>
            {c.job_roles?.length ? (
              <table className="mt-2 w-full border text-sm"><thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Role</th><th className="px-3 py-2">Hiring year</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Compensation</th></tr></thead>
                <tbody className="divide-y">{c.job_roles.map((r) => <tr key={r.id}><td className="px-3 py-2">{r.title}</td><td className="px-3 py-2">{r.hiring_year}</td><td className="px-3 py-2">{r.location || "—"}</td><td className="px-3 py-2 text-muted-foreground">{r.ctc_note || "—"}</td></tr>)}</tbody></table>
            ) : <EmptyState title="No roles listed" />}
          </div>
          <aside className="h-fit border p-4 text-sm">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">At a glance</h3>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between"><dt>Min. CGPA</dt><dd className="font-medium">{cur?.min_cgpa ?? "—"}</dd></div>
              <div className="flex justify-between"><dt>Backlogs allowed</dt><dd className="font-medium">{cur?.max_backlogs ?? "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt>Branches</dt><dd className="text-right font-medium">{cur?.branches || "—"}</dd></div>
              <div className="flex justify-between"><dt>DSA difficulty</dt><dd><DifficultyTag level={c.dsa_difficulty} /></dd></div>
              <div className="flex justify-between"><dt>Rounds</dt><dd className="font-medium">{rounds.length}</dd></div>
            </dl>
          </aside>
        </TabsContent>

        <TabsContent value="eligibility" className="mt-6">
          {cur ? (
            <div className="max-w-xl border">
              <div className="border-b bg-muted px-4 py-2 text-sm font-medium">Criteria for {cur.year} drive</div>
              <dl className="divide-y text-sm">
                <Row k="Minimum CGPA" v={cur.min_cgpa ?? "Not specified"} />
                <Row k="Maximum active backlogs" v={cur.max_backlogs ?? "Not specified"} />
                <Row k="Eligible branches" v={cur.branches || "Not specified"} />
                <Row k="Notes" v={cur.notes || "—"} />
              </dl>
            </div>
          ) : <EmptyState title="Eligibility not published" />}
        </TabsContent>

        <TabsContent value="dsa" className="mt-6">
          <div className="mb-4 flex items-center gap-2 text-sm">Overall difficulty: <DifficultyTag level={c.dsa_difficulty} /></div>
          {topics.length ? (
            <div className="space-y-6">
              {[...topicsByCategory, ...(uncategorised.length ? [{ cat: "other" as const, items: uncategorised }] : [])].map((g) => (
                <section key={g.cat}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {g.cat === "basic" ? "Basic" : g.cat === "intermediate" ? "Intermediate" : g.cat === "advanced" ? "Advanced" : "Other"}
                  </h3>
                  <table className="w-full border text-sm"><thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Priority</th><th className="px-3 py-2">Topic</th><th className="px-3 py-2">Difficulty</th><th className="px-3 py-2">Notes</th></tr></thead>
                    <tbody className="divide-y">{g.items.map((t) => <tr key={t.id}><td className="px-3 py-2">{t.priority === 1 ? "High" : t.priority === 2 ? "Medium" : "Low"}</td><td className="px-3 py-2 font-medium">{t.topic}</td><td className="px-3 py-2"><DifficultyTag level={t.difficulty} /></td><td className="px-3 py-2 text-muted-foreground">{t.notes || "—"}</td></tr>)}</tbody></table>
                </section>
              ))}
            </div>
          ) : <EmptyState title="No DSA topics listed" />}
        </TabsContent>

        <TabsContent value="fundamentals" className="mt-6">
          {fundamentals.length ? (
            <table className="w-full border text-sm"><thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Priority</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Subtopics</th><th className="px-3 py-2">Notes</th></tr></thead>
              <tbody className="divide-y">{fundamentals.map((f) => <tr key={f.id}><td className="px-3 py-2">{f.priority === 1 ? "High" : f.priority === 2 ? "Medium" : "Low"}</td><td className="px-3 py-2 font-medium">{f.subject}</td><td className="px-3 py-2 text-muted-foreground">{f.subtopics || "—"}</td><td className="px-3 py-2 text-muted-foreground">{f.notes || "—"}</td></tr>)}</tbody></table>
          ) : <EmptyState title="No CS fundamentals listed" body="The placement office has not published core subject requirements for this company yet." />}
        </TabsContent>

        <TabsContent value="rounds" className="mt-6">
          {rounds.length ? <RoundSteps rounds={rounds} /> : <EmptyState title="Selection process not published" />}
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          {questions.length ? (
            <div className="space-y-8">
              {questionsByYear.map(([year, items]) => (
                <section key={year}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{year ? `${year} drive` : "Date not recorded"}</h3>
                  <ul className="divide-y border">
                    {items.map((x) => (
                      <li key={x.id} className="p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{x.interview_rounds?.name ?? "Round not specified"}</span>·<span>{x.topic}</span>·<DifficultyTag level={x.difficulty} />·<span>Asked {fmtDate(x.asked_on)}</span>
                        </div>
                        <p className="mt-1.5 font-medium">{x.question}</p>
                        {x.experience && <p className="mt-1 text-sm text-muted-foreground">{x.experience}</p>}
                        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">Source: {x.sources?.title ?? "No source recorded"} {x.sources && <VerifyTag status={x.sources.status} />}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : <EmptyState title="No previous questions recorded" />}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {criteria.length ? (
            <table className="w-full border text-sm"><thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Year</th><th className="px-3 py-2">Min. CGPA</th><th className="px-3 py-2">Backlogs</th><th className="px-3 py-2">Branches</th><th className="px-3 py-2">Notes</th></tr></thead>
              <tbody className="divide-y">{criteria.map((e) => <tr key={e.id}><td className="px-3 py-2 font-medium">{e.year}{e.is_current && <span className="ml-2 text-xs text-primary">current</span>}</td><td className="px-3 py-2">{e.min_cgpa ?? "—"}</td><td className="px-3 py-2">{e.max_backlogs ?? "—"}</td><td className="px-3 py-2">{e.branches}</td><td className="px-3 py-2 text-muted-foreground">{e.notes || "—"}</td></tr>)}</tbody></table>
          ) : <EmptyState title="No historical criteria" />}
        </TabsContent>
      </Tabs>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="grid grid-cols-[180px_1fr] px-4 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>;
}
