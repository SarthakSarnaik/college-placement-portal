import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/fundamentals")({
  head: () => ({ meta: [{ title: "CS Fundamentals — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="CS Fundamentals"
      description="Core computer science subjects each company tests. Set priority so students know what to prepare first."
      table="cs_fundamentals"
      order={{ column: "priority", ascending: true }}
      searchKeys={["subject", "subtopics", "notes"]}
      defaults={{ priority: 2 }}
      fields={[
        { name: "company_id", label: "Company", type: "company", required: true },
        { name: "subject", label: "Subject", required: true },
        { name: "priority", label: "Priority", type: "select", options: [{ value: "1", label: "High" }, { value: "2", label: "Medium" }, { value: "3", label: "Low" }] },
        { name: "subtopics", label: "Subtopics", type: "textarea" },
        { name: "notes", label: "Notes", type: "textarea", hideInTable: true },
      ]}
    />
  ),
});
