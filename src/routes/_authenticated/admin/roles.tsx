import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({ meta: [{ title: "Job Roles — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="Job Roles"
      description="Roles offered by each company per hiring year."
      table="job_roles"
      order={{ column: "hiring_year", ascending: false }}
      searchKeys={["title", "location"]}
      fields={[
        { name: "company_id", label: "Company", type: "company", required: true },
        { name: "title", label: "Role title", required: true },
        { name: "hiring_year", label: "Hiring year", type: "number", required: true },
        { name: "location", label: "Location" },
        { name: "ctc_note", label: "Compensation note" },
      ]}
    />
  ),
});
