import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/criteria")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/companies" });
  },
  component: () => null,
});
