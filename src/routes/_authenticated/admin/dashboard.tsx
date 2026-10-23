import { createFileRoute } from "@tanstack/react-router";
import { AdminHome } from "./index";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Placement Portal" }] }),
  component: AdminHome,
});
