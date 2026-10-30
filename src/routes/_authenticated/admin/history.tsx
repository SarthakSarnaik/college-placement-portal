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
        {
          name: "min_10th_percentage",
          label: "10th Min. %",
          type: "number",
          render: (r) =>
            r.min_10th_percentage != null ? `${r.min_10th_percentage}%` : "Not specified",
        },
        {
          name: "min_12th_percentage",
          label: "12th Min. %",
          type: "number",
          render: (r) =>
            r.min_12th_percentage != null ? `${r.min_12th_percentage}%` : "Not specified",
        },
        {
          name: "min_cgpa",
          label: "Min. CGPA",
          type: "number",
          render: (r) => (r.min_cgpa != null ? r.min_cgpa : "Not specified"),
        },
        {
          name: "max_backlogs",
          label: "Backlogs",
          type: "number",
          render: (r) =>
            r.max_backlogs != null
              ? r.max_backlogs === 0
                ? "0 permitted"
                : r.max_backlogs
              : "Not specified",
        },
        { name: "branches", label: "Branches" },
        { name: "is_current", label: "Current", type: "boolean" },
        { name: "notes", label: "Notes" },
      ]}
    />
  ),
});
