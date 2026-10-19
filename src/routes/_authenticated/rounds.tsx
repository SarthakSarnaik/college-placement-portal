import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { companiesQuery, roundsQuery } from "@/lib/queries";
import { PageHeader, DemoTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { RoundSteps } from "@/components/round-steps";

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
  const selected = company ?? cq.data?.[0]?.id;
  const rounds = (rq.data ?? []).filter((r) => r.company_id === selected);
  const comp = cq.data?.find((c) => c.id === selected);

  return (
    <>
      <PageHeader title="Interview Rounds" description="Each company's selection process, in the order rounds are conducted, with the purpose of each round and how to prepare." />
      {cq.isLoading || rq.isLoading ? <LoadingState /> : cq.error || rq.error ? <ErrorState error={cq.error ?? rq.error} /> : !cq.data?.length ? <EmptyState title="No companies published" /> : (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="border">
            {cq.data.map((c) => (
              <button key={c.id} onClick={() => navigate({ search: { company: c.id } })} className={`block w-full border-b px-3 py-2.5 text-left text-sm last:border-b-0 ${c.id === selected ? "bg-accent font-medium text-accent-foreground" : "hover:bg-muted"}`}>{c.name}</button>
            ))}
          </div>
          <div>
            {comp && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{comp.name}</h2>{comp.is_demo && <DemoTag />}
                <Link to="/companies/$id" params={{ id: comp.id }} className="ml-auto text-sm text-primary hover:underline">Full profile</Link>
              </div>
            )}
            {rounds.length ? <RoundSteps rounds={rounds} /> : <EmptyState title="No rounds published for this company" />}
          </div>
        </div>
      )}
    </>
  );
}
