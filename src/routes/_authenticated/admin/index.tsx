import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/labels";
import { ErrorState, LoadingState } from "@/components/states";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Placement Portal" }] }),
  component: AdminHome,
});

const tables = [
  ["companies", "Companies", "/admin/companies"],
  ["job_roles", "Job roles", "/admin/roles"],
  ["eligibility_criteria", "Criteria versions", "/admin/criteria"],
  ["dsa_topics", "DSA topics", "/admin/dsa"],
  ["interview_rounds", "Interview rounds", "/admin/rounds"],
  ["questions", "Questions", "/admin/questions"],
  ["announcements", "Announcements", "/admin/announcements"],
  ["profiles", "Users", "/admin/users"],
] as const;

function AdminHome() {
  const q = useQuery({
    queryKey: ["admin", "counts"],
    queryFn: async () => {
      const counts = await Promise.all(tables.map(([t]) => supabase.from(t).select("id", { count: "exact", head: true })));
      const pending = await supabase.from("sources").select("id", { count: "exact", head: true }).eq("status", "pending");
      const demo = await supabase.from("companies").select("id", { count: "exact", head: true }).eq("is_demo", true);
      const unpub = await supabase.from("companies").select("id", { count: "exact", head: true }).eq("is_published", false);
      return { counts: counts.map((c) => c.count ?? 0), pending: pending.count ?? 0, demo: demo.count ?? 0, unpub: unpub.count ?? 0 };
    },
  });
  return (
    <>
      <PageHeader title="TPO / Admin Dashboard" description="Record counts from the database and items that need attention." />
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} /> : q.data && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Needs attention</h2>
          <div className="mb-8 divide-y border text-sm">
            <Link to="/admin/sources" className="flex justify-between px-4 py-3 hover:bg-muted"><span>Sources pending verification</span><span className="font-semibold tabular-nums">{q.data.pending}</span></Link>
            <Link to="/admin/companies" className="flex justify-between px-4 py-3 hover:bg-muted"><span>Companies still marked as demo data</span><span className="font-semibold tabular-nums">{q.data.demo}</span></Link>
            <Link to="/admin/companies" className="flex justify-between px-4 py-3 hover:bg-muted"><span>Unpublished companies (hidden from students)</span><span className="font-semibold tabular-nums">{q.data.unpub}</span></Link>
          </div>
          <h2 className="mb-3 text-lg font-semibold">Records</h2>
          <div className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {tables.map(([, label, to], i) => (
              <Link key={to} to={to} className="bg-background p-4 hover:bg-muted">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">{q.data.counts[i]}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
