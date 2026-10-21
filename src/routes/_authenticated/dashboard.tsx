import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Code2, ListOrdered, MessageSquareText } from "lucide-react";
import { useMe } from "@/lib/auth";
import { announcementsQuery, companiesQuery, fmtDate } from "@/lib/queries";
import { PageHeader, DemoTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Placement Portal" }] }),
  component: Dashboard,
});

const journey = [
  { to: "/companies", icon: Building2, title: "Explore companies", body: "Browse recruiters and filter by branch, CGPA or difficulty." },
  { to: "/dsa", icon: Code2, title: "Understand DSA requirements", body: "See which topics each company emphasises." },
  { to: "/rounds", icon: ListOrdered, title: "Follow interview rounds", body: "Step through each round in the order it is conducted." },
  { to: "/questions", icon: MessageSquareText, title: "Study previous questions", body: "Questions reported by past candidates, with source and date." },
] as const;

function Dashboard() {
  const { data: me } = useMe();
  const companies = useQuery(companiesQuery);
  const ann = useQuery(announcementsQuery);

  return (
    <>
      <PageHeader title={`Welcome${me?.fullName ? `, ${me.fullName.split(" ")[0]}` : ""}`} description="Start from first year: learn what recruiters expect, then prepare round by round." />
      <section aria-labelledby="journey">
        <h2 id="journey" className="mb-3 text-lg font-semibold">Your preparation path</h2>
        <ol className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((j, i) => (
            <li key={j.to} className="bg-background">
              <Link to={j.to} className="group flex h-full flex-col p-5 hover:bg-muted">
                <span className="text-xs font-semibold text-teal">STEP {i + 1}</span>
                <j.icon className="mt-3 size-5 text-primary" strokeWidth={1.5} />
                <span className="mt-2 font-medium">{j.title}</span>
                <span className="mt-1 text-sm text-muted-foreground">{j.body}</span>
                <ArrowRight className="mt-auto size-4 pt-3 text-primary opacity-0 transition-opacity group-hover:opacity-100 box-content" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Recruiting companies</h2>
            <Link to="/companies" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {companies.isLoading ? <LoadingState /> : companies.error ? <ErrorState error={companies.error} onRetry={() => companies.refetch()} /> : !companies.data?.length ? (
            <EmptyState title="No companies published yet" body="The placement office has not published any company profiles." />
          ) : (
            <div className="divide-y border">
              {companies.data.slice(0, 5).map((c) => (
                <Link key={c.id} to="/companies/$id" params={{ id: c.id }} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted">
                  <div>
                    <p className="font-medium">{c.name} {c.is_demo && <DemoTag className="ml-1 align-middle" />}</p>
                    <p className="text-sm text-muted-foreground">{c.sector}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Announcements</h2>
            <Link to="/announcements" className="text-sm text-primary hover:underline">All</Link>
          </div>
          {ann.isLoading ? <LoadingState /> : ann.error ? <ErrorState error={ann.error} /> : !ann.data?.length ? (
            <EmptyState title="No announcements" />
          ) : (
            <ul className="divide-y border">
              {ann.data.slice(0, 4).map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <p className="text-xs text-muted-foreground">{fmtDate(a.published_at)} {a.is_demo && <DemoTag className="ml-1" />}</p>
                  <p className="mt-1 text-sm font-medium">{a.title}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
