import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/resource-manager";
import { DemoTag } from "@/components/labels";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  head: () => ({ meta: [{ title: "Manage Announcements — Placement Portal" }] }),
  component: () => (
    <ResourceManager
      title="Announcements"
      table="announcements"
      order={{ column: "published_at", ascending: false }}
      searchKeys={["title", "body"]}
      defaults={{ is_demo: false }}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "body", label: "Message", type: "textarea", required: true },
        { name: "company_id", label: "Related company", type: "company" },
        { name: "is_demo", label: "Demo data", type: "boolean", render: (r) => (r.is_demo ? <DemoTag /> : "No") },
      ]}
    />
  ),
});
