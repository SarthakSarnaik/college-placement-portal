import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/rounds")({
  head: () => ({ meta: [{ title: "Interview Rounds — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="Ordered Interview Rounds"
      description="The round number sets the order students see. Use 1 for the first round."
      table="interview_rounds"
      order={{ column: "round_order", ascending: true }}
      searchKeys={["name", "purpose"]}
      fields={[
        { name: "company_id", label: "Company", type: "company", required: true },
        { name: "round_order", label: "Round #", type: "number", required: true },
        { name: "name", label: "Round name", required: true },
        { name: "duration", label: "Duration" },
        { name: "purpose", label: "Purpose", type: "textarea" },
        { name: "preparation", label: "Preparation guidance", type: "textarea", hideInTable: true },
      ]}
    />
  ),
});
