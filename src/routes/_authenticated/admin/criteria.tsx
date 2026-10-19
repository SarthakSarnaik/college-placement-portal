import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/criteria")({
  head: () => ({ meta: [{ title: "Eligibility Criteria — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="Eligibility Criteria"
      description="Add a new row for each drive year instead of overwriting old criteria, so year-wise history is preserved. Mark one row per company as current."
      table="eligibility_criteria"
      order={{ column: "year", ascending: false }}
      searchKeys={["branches", "notes"]}
      fields={[
        { name: "company_id", label: "Company", type: "company", required: true },
        { name: "year", label: "Drive year", type: "number", required: true },
        { name: "min_cgpa", label: "Min. CGPA", type: "number" },
        { name: "max_backlogs", label: "Max backlogs", type: "number" },
        { name: "branches", label: "Branches (comma separated)", required: true },
        { name: "notes", label: "Notes", type: "textarea" },
        { name: "is_current", label: "Current criteria", type: "boolean" },
      ]}
    />
  ),
});
