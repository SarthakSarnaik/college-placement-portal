import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Building2, ChevronRight, ShieldCheck } from "lucide-react";
import { announcementsQuery, fmtDate } from "@/lib/queries";
import { PageHeader } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Placement Notices & Alerts — Placement Portal" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const q = useQuery(announcementsQuery);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Official Placement Notices & Circulars"
        description="Official circulars, pre-placement talk notices, test links, and schedule updates issued directly by the Training & Placement Office."
      />

      {q.isLoading ? (
        <LoadingState label="Loading notices archive…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          title="No active notices published"
          body="The Training & Placement Office has not broadcast any public circulars yet."
        />
      ) : (
        <div className="space-y-4">
          {q.data.map((a) => (
            <article
              key={a.id}
              className="rounded-xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium font-mono text-foreground">
                    <Calendar className="size-3.5 text-muted-foreground" />{" "}
                    {fmtDate(a.published_at)}
                  </span>
                  <span className="rounded-[4px] border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Official Notice
                  </span>
                </div>

                {(() => {
                  const company = Array.isArray(a.companies) ? a.companies[0] : a.companies;
                  if (!company?.id) return null;
                  return (
                    <Link
                      to="/companies/$id"
                      params={{ id: company.id }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-muted/40 transition-colors shadow-2xs"
                    >
                      <Building2 className="size-3 text-primary" /> {company.name}{" "}
                      <ChevronRight className="size-3 opacity-60" />
                    </Link>
                  );
                })()}
              </div>

              <h2 className="mt-3.5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {a.title}
              </h2>

              <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {a.body}
              </p>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" /> Issued
                  by Training & Placement Cell
                </span>
              </div>
            </article>
          ))}

          <div className="p-3 text-center text-xs font-medium text-muted-foreground">
            Displaying {q.data.length} official placement circular(s).
          </div>
        </div>
      )}
    </div>
  );
}
