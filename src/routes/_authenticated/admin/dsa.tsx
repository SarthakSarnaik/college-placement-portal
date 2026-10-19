import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, difficultyOptions } from "@/components/resource-manager";
import { DifficultyTag } from "@/components/labels";

export const Route = createFileRoute("/_authenticated/admin/dsa")({
  head: () => ({ meta: [{ title: "DSA Topics — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="DSA Topics"
      table="dsa_topics"
      order={{ column: "priority", ascending: true }}
      searchKeys={["topic", "notes"]}
      defaults={{ priority: 2, difficulty: "medium" }}
      fields={[
        { name: "company_id", label: "Company", type: "company", required: true },
        { name: "topic", label: "Topic", required: true },
        { name: "difficulty", label: "Difficulty", type: "select", options: difficultyOptions, render: (r) => <DifficultyTag level={r.difficulty} /> },
        { name: "priority", label: "Priority", type: "select", options: [{ value: "1", label: "High" }, { value: "2", label: "Medium" }, { value: "3", label: "Low" }] },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  ),
});
