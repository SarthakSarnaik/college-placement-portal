import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Shield, User, CheckCircle2, ShieldAlert, X } from "lucide-react";
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
      const admins = new Set(
        (r.data ?? []).filter((x) => x.role === "admin").map((x) => x.user_id),
      );
      return (p.data ?? []).map((u) => ({ ...u, isAdmin: admins.has(u.id) }));
    },
  });

  async function toggle(id: string, makeAdmin: boolean) {
    const { error } = await supabase.rpc("set_admin", { _user_id: id, _make_admin: makeAdmin });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      makeAdmin ? "Administrator privileges granted." : "Administrator privileges revoked.",
    );
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  const rows = (q.data ?? []).filter(
    (u) => !term || `${u.full_name} ${u.email}`.toLowerCase().includes(term.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Access Management"
        description="Every public account registers as a student. Only authorized administrators can grant or revoke TPO / Admin privileges."
      />

      {/* Security Advisory & Search Toolbar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or email…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="pl-9 pr-8 text-xs"
            aria-label="Search users"
          />
          {term && (
            <button
              onClick={() => setTerm("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="size-3.5 text-teal-600 dark:text-teal-400" />
          <span>Role updates enforced by PostgreSQL security definer procedures.</span>
        </div>
      </div>

      {q.isLoading ? (
        <LoadingState label="Loading registered users…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !rows.length ? (
        <EmptyState
          title="No registered users found"
          body="No user accounts match your search query."
          action={
            term ? (
              <Button variant="outline" size="sm" onClick={() => setTerm("")}>
                Clear Search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">User Profile</th>
                    <th className="px-5 py-3">Email Address</th>
                    <th className="px-5 py-3">Registered On</th>
                    <th className="px-5 py-3">Current Role</th>
                    <th className="px-5 py-3 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((u) => {
                    const initials = (u.full_name || u.email || "U").slice(0, 2).toUpperCase();

                    return (
                      <tr key={u.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold font-mono text-primary">
                              {initials}
                            </div>
                            <span className="font-semibold text-xs text-foreground">
                              {u.full_name || "Name not recorded"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {fmtDate(u.created_at)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              u.isAdmin
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/60 text-muted-foreground border-border"
                            }`}
                          >
                            {u.isAdmin ? (
                              <Shield className="size-3" />
                            ) : (
                              <User className="size-3" />
                            )}
                            {u.isAdmin ? "TPO Admin" : "Student"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {u.id === me?.id ? (
                            <span className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground bg-muted/30">
                              Current Active Account
                            </span>
                          ) : u.isAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggle(u.id, false)}
                              className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              Revoke Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggle(u.id, true)}
                              className="h-8 text-xs text-primary hover:bg-primary/10 font-semibold"
                            >
                              Grant Admin Access
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border bg-muted/20 px-5 py-2.5 text-xs font-medium text-muted-foreground">
              Total registered user accounts: {rows.length}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {rows.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold font-mono text-primary">
                      {(u.full_name || u.email || "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-foreground">
                        {u.full_name || "Name not recorded"}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">{u.email}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      u.isAdmin
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/60 text-muted-foreground border-border"
                    }`}
                  >
                    {u.isAdmin ? "TPO Admin" : "Student"}
                  </span>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px]">
                    Registered {fmtDate(u.created_at)}
                  </span>

                  {u.id === me?.id ? (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Active Session
                    </span>
                  ) : u.isAdmin ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggle(u.id, false)}
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Revoke Admin
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggle(u.id, true)}
                      className="h-7 text-xs text-primary font-semibold"
                    >
                      Grant Admin
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
