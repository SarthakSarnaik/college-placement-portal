import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { fmtDate } from "@/lib/queries";
import { PageHeader } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "User Management — Placement Portal" }] }),
  component: Users,
});

function Users() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (p.error) throw p.error;
      const admins = new Set((r.data ?? []).filter((x) => x.role === "admin").map((x) => x.user_id));
      return (p.data ?? []).map((u) => ({ ...u, isAdmin: admins.has(u.id) }));
    },
  });

  async function toggle(id: string, makeAdmin: boolean) {
    const { error } = await supabase.rpc("set_admin", { _user_id: id, _make_admin: makeAdmin });
    if (error) return toast.error(error.message);
    toast.success(makeAdmin ? "Admin access granted" : "Admin access removed");
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  const rows = (q.data ?? []).filter((u) => !term || `${u.full_name} ${u.email}`.toLowerCase().includes(term.toLowerCase()));
  return (
    <>
      <PageHeader title="User Management" description="Everyone registers as a student. Grant TPO / Admin access only to placement office staff." />
      <Input className="mb-4 max-w-sm" placeholder="Search name or email" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Search users" />
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} /> : !rows.length ? <EmptyState title="No users found" /> : (
        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2.5">Name</th><th className="px-3 py-2.5">Email</th><th className="px-3 py-2.5">Joined</th><th className="px-3 py-2.5">Role</th><th className="px-3 py-2.5 text-right">Action</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2.5">{u.full_name || "—"}</td>
                  <td className="px-3 py-2.5">{u.email}</td>
                  <td className="px-3 py-2.5">{fmtDate(u.created_at)}</td>
                  <td className="px-3 py-2.5">{u.isAdmin ? "TPO / Admin" : "Student"}</td>
                  <td className="px-3 py-2 text-right">
                    {u.id === me?.id ? <span className="text-xs text-muted-foreground">You</span> : u.isAdmin
                      ? <Button size="sm" variant="outline" onClick={() => toggle(u.id, false)}>Remove admin</Button>
                      : <Button size="sm" variant="outline" onClick={() => toggle(u.id, true)}>Make admin</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
