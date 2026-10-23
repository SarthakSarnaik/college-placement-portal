import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { LoadingState, UnauthorizedState } from "@/components/states";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/admin/login", search: { redirect: location.href } });
    }

    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    if (roleError || !roles) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login", search: { redirect: location.href } });
    }

    const isAdmin = roles.some((r) => r.role === "admin");
    if (!isAdmin) {
      // Strictly prevent students from accessing admin routes directly
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminGate,
});

// UI gate: every write is enforced by PostgreSQL Row-Level Security for admins.
function AdminGate() {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <LoadingState label="Verifying administrator credentials…" />;
  if (!me?.isAdmin) return <UnauthorizedState />;
  return <Outlet />;
}
