import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/companies" });
  },
  component: () => null,
});
