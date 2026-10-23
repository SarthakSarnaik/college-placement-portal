import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, difficultyOptions } from "@/components/resource-manager";
import { DemoTag, VerifyTag } from "@/components/labels";

export const Route = createFileRoute("/_authenticated/admin/companies")({
  head: () => ({ meta: [{ title: "Manage Companies — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="Manage Companies"
      description="Only published companies are visible to students. Untick “Demo data” and set status to Verified only after checking official sources."
      table="companies"
      order={{ column: "name", ascending: true }}
      searchKeys={["name", "sector"]}
      defaults={{
        is_demo: false,
        is_published: false,
        dsa_difficulty: "medium",
        verification_status: "unverified",
      }}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "sector", label: "Sector" },
        { name: "headquarters", label: "Headquarters", hideInTable: true },
        { name: "overview", label: "Overview", type: "textarea", hideInTable: true },
        { name: "website", label: "Website", hideInTable: true },
        {
          name: "first_visit_year",
          label: "First campus visit",
          type: "number",
          hideInTable: true,
        },
        {
          name: "dsa_difficulty",
          label: "DSA difficulty",
          type: "select",
          options: difficultyOptions,
        },
        {
          name: "verification_status",
          label: "Verification",
          type: "select",
          options: [
            { value: "unverified", label: "Unverified" },
            { value: "pending", label: "Pending" },
            { value: "verified", label: "Verified" },
          ],
          render: (r) => <VerifyTag status={r.verification_status} />,
        },
        {
          name: "is_demo",
          label: "Demo data",
          type: "boolean",
          hint: "Mark as demo data if this is a sample profile rather than an active campus drive recruiter.",
          render: (r) => (r.is_demo ? <DemoTag /> : "No"),
        },
        {
          name: "is_published",
          label: "Published (Visible to Students)",
          type: "boolean",
          hint: "When checked, this recruiter and all associated interview rounds, DSA topics, CS fundamentals, and questions become visible to students in the directory and dashboard. When unchecked, it is kept as an unpublished draft hidden from students.",
          render: (r) =>
            r.is_published ? (
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Published
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                Draft (Hidden)
              </span>
            ),
        },
      ]}
    />
  ),
});
