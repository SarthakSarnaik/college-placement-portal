import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, difficultyOptions } from "@/components/resource-manager";
import { DifficultyTag } from "@/components/labels";

export const Route = createFileRoute("/_authenticated/admin/questions")({
  head: () => ({ meta: [{ title: "Interview Questions — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="Interview Questions"
      description="Link each question to a source so students can judge its reliability."
      table="questions"
      searchKeys={["question", "topic"]}
      defaults={{ difficulty: "medium" }}
      fields={[
        { name: "company_id", label: "Company", type: "company", required: true },
        { name: "round_id", label: "Round", type: "round" },
        { name: "question", label: "Question", type: "textarea", required: true },
        { name: "topic", label: "Topic" },
        {
          name: "difficulty",
          label: "Difficulty",
          type: "select",
          options: difficultyOptions,
          render: (r) => <DifficultyTag level={r.difficulty} />,
        },
        { name: "asked_on", label: "Date asked", type: "date" },
        { name: "source_id", label: "Source", type: "source" },
        { name: "experience", label: "Candidate experience", type: "textarea", hideInTable: true },
      ]}
    />
  ),
});
