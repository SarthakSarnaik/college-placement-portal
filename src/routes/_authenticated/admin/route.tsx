import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useMe } from "@/lib/auth";
import { LoadingState, UnauthorizedState } from "@/components/states";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminGate,
});

// UI gate only; every write is enforced by database access rules for admins.
function AdminGate() {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <LoadingState label="Checking access…" />;
  if (!me?.isAdmin) return <UnauthorizedState />;
  return <Outlet />;
}
