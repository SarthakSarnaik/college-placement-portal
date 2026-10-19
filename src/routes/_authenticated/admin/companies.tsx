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
      defaults={{ is_demo: false, dsa_difficulty: "medium", verification_status: "unverified" }}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "sector", label: "Sector" },
        { name: "headquarters", label: "Headquarters", hideInTable: true },
        { name: "overview", label: "Overview", type: "textarea", hideInTable: true },
        { name: "website", label: "Website", hideInTable: true },
        { name: "first_visit_year", label: "First campus visit", type: "number", hideInTable: true },
        { name: "dsa_difficulty", label: "DSA difficulty", type: "select", options: difficultyOptions },
        { name: "verification_status", label: "Verification", type: "select", options: [{ value: "unverified", label: "Unverified" }, { value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }], render: (r) => <VerifyTag status={r.verification_status} /> },
        { name: "is_demo", label: "Demo data", type: "boolean", render: (r) => (r.is_demo ? <DemoTag /> : "No") },
        { name: "is_published", label: "Published", type: "boolean" },
      ]}
    />
  ),
});
