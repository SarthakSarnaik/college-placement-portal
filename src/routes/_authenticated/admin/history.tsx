import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/history")({
  head: () => ({ meta: [{ title: "Criteria History — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="Historical Criteria Versions"
      description="Read-only view of every eligibility version by year. Edit criteria from the Eligibility Criteria page."
      table="eligibility_criteria"
      readOnly
      order={{ column: "year", ascending: false }}
      searchKeys={["branches", "notes"]}
      fields={[
        { name: "company_id", label: "Company", type: "company" },
        { name: "year", label: "Year", type: "number" },
        { name: "min_cgpa", label: "Min. CGPA", type: "number" },
        { name: "max_backlogs", label: "Backlogs", type: "number" },
        { name: "branches", label: "Branches" },
        { name: "is_current", label: "Current", type: "boolean" },
        { name: "notes", label: "Notes" },
      ]}
    />
  ),
});
