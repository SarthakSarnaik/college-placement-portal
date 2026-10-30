import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/criteria")({
  head: () => ({ meta: [{ title: "Eligibility Criteria — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="Eligibility Criteria"
      description="Define academic eligibility cut-offs (10th %, 12th %, CGPA, backlogs, branches) per company and drive year. Add a new row for each drive year to preserve historical audit records."
      table="eligibility_criteria"
      order={{ column: "year", ascending: false }}
      searchKeys={["branches", "notes"]}
      fields={[
        { name: "company_id", label: "Company", type: "company", required: true },
        {
          name: "year",
          label: "Drive Year",
          type: "number",
          required: true,
          min: 2000,
          max: 2100,
          hint: "Campus recruitment drive year (e.g. 2026)",
        },
        {
          name: "min_10th_percentage",
          label: "10th Min. Percentage (%)",
          type: "number",
          min: 0,
          max: 100,
          hint: "Minimum 10th Standard / SSC percentage (0.00% - 100.00%). Decimals accepted.",
          render: (r) =>
            r.min_10th_percentage != null ? `${r.min_10th_percentage}%` : "Not specified",
        },
        {
          name: "min_12th_percentage",
          label: "12th Min. Percentage (%)",
          type: "number",
          min: 0,
          max: 100,
          hint: "Minimum 12th Standard / HSC / Diploma percentage (0.00% - 100.00%). Decimals accepted.",
          render: (r) =>
            r.min_12th_percentage != null ? `${r.min_12th_percentage}%` : "Not specified",
        },
        {
          name: "min_cgpa",
          label: "Min. CGPA",
          type: "number",
          min: 0,
          max: 10,
          hint: "Minimum cumulative grade point average cut-off (0.00 - 10.00 scale).",
          render: (r) => (r.min_cgpa != null ? r.min_cgpa : "Not specified"),
        },
        {
          name: "max_backlogs",
          label: "Max Backlogs",
          type: "number",
          min: 0,
          hint: "Maximum active backlogs allowed (enter 0 for zero backlogs policy).",
          render: (r) =>
            r.max_backlogs != null
              ? r.max_backlogs === 0
                ? "0 permitted"
                : r.max_backlogs
              : "Not specified",
        },
        {
          name: "branches",
          label: "Eligible Branches",
          required: true,
          hint: "Eligible degree specializations (e.g. Computer Engineering, IT, E&TC, AI&DS)",
        },
        {
          name: "notes",
          label: "Special Conditions & Notes",
          type: "textarea",
          hint: "Any service bond clauses, gap-year stipulations, or academic restrictions.",
        },
        {
          name: "is_current",
          label: "Active Drive Criteria",
          type: "boolean",
          hint: "Mark as active to enforce these cut-offs on the company profile and student dashboard.",
        },
      ]}
    />
  ),
});
