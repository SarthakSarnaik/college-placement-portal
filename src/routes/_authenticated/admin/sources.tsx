import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ResourceManager } from "@/components/resource-manager";
import { VerifyTag } from "@/components/labels";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/sources")({
  head: () => ({ meta: [{ title: "Source Verification — Placement Portal" }] }),
  component: Sources,
});

function Sources() {
  const qc = useQueryClient();
  async function setStatus(id: string, status: "verified" | "rejected") {
    const { error } = await supabase.from("sources").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    qc.invalidateQueries();
  }
  return (
    <ResourceManager
      title="Source Verification"
      description="Review where each question or criterion came from. Only mark a source verified after confirming it with the company or official placement records."
      table="sources"
      searchKeys={["title", "url"]}
      defaults={{ source_type: "student_report", status: "pending" }}
      rowActions={(r) => r.status === "pending" ? (
        <>
          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "verified")}>Verify</Button>
          <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "rejected")}>Reject</Button>
        </>
      ) : null}
      fields={[
        { name: "company_id", label: "Company", type: "company" },
        { name: "title", label: "Title", required: true },
        { name: "url", label: "URL / reference" },
        { name: "source_type", label: "Type", type: "select", options: [
          { value: "student_report", label: "Student report" }, { value: "tpo_debrief", label: "TPO debrief" },
          { value: "company_document", label: "Company document" }, { value: "public_web", label: "Public web page" },
        ] },
        { name: "status", label: "Status", type: "select", options: [{ value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }], render: (r) => <VerifyTag status={r.status} /> },
      ]}
    />
  );
}
