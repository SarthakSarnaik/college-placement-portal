import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { announcementsQuery, fmtDate } from "@/lib/queries";
import { PageHeader, DemoTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Placement Portal" }] }),
  component: Ann,
});

function Ann() {
  const q = useQuery(announcementsQuery);
  return (
    <>
      <PageHeader title="Announcements" description="Notices from the Training & Placement Office." />
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} /> : !q.data?.length ? <EmptyState title="No announcements yet" /> : (
        <ul className="divide-y border">
          {q.data.map((a) => (
            <li key={a.id} className="p-5">
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{fmtDate(a.published_at)}{a.is_demo && <DemoTag />}
                {a.companies && <Link to="/companies/$id" params={{ id: a.companies.id }} className="text-primary hover:underline">{a.companies.name}</Link>}</p>
              <h2 className="mt-1 text-lg font-semibold">{a.title}</h2>
              <p className="mt-1 whitespace-pre-line text-sm">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
