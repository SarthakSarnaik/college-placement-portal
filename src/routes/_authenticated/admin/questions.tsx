import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import { ResourceManager, difficultyOptions, type Field } from "@/components/resource-manager";
import { DifficultyTag } from "@/components/labels";
import { dsaDayOptions, questionTypeOptions } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/questions")({
  head: () => ({ meta: [{ title: "DSA Sheet & Questions — Placement Portal" }] }),
  component: AdminQuestionsPage,
});

function AdminQuestionsPage() {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");

  const togglePublish = useMutation({
    mutationFn: async ({ id, nextPublished }: { id: string; nextPublished: boolean }) => {
      const { error } = await supabase
        .from("questions")
        .update({ is_published: nextPublished })
        .eq("id", id);
      if (error) throw error;
      return nextPublished;
    },
    onSuccess: (nextPublished) => {
      toast.success(
        nextPublished
          ? "Problem published! Now visible to students."
          : "Problem hidden from students (Draft).",
      );
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      qc.invalidateQueries({ queryKey: ["questions_all"] });
    },
    onError: (err: Error) => {
      if (
        err.message.includes("is_published") ||
        err.message.includes("schema cache") ||
        err.message.includes("PGRST204")
      ) {
        toast.error(
          "Database migration required: 'is_published' column not found in Supabase. Run supabase/migrations/20261023_dsa_sheet_sync.sql in the Supabase Dashboard SQL Editor.",
          { duration: 8000 },
        );
      } else {
        toast.error(`Failed to update publication status: ${err.message}`);
      }
    },
  });

  const fields: Field[] = [
    {
      name: "question_type",
      label: "Question Type",
      type: "select",
      options: questionTypeOptions,
      render: (r) => (
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            r.question_type === "interview_question"
              ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
              : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20",
          )}
        >
          {r.question_type === "interview_question" ? "Campus Interview" : "DSA Sheet"}
        </span>
      ),
    },
    {
      name: "day_number",
      label: "Day / Section",
      type: "select",
      options: [{ value: "", label: "General / Campus Drive (No Day)" }, ...dsaDayOptions],
      render: (r) =>
        r.day_number ? (
          <span className="font-semibold text-xs text-primary">Day {r.day_number}</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
      hint: "Assign to a curated practice day (Day 1 to 5).",
    },
    {
      name: "order_index",
      label: "Order Index",
      type: "number",
      hint: "Display order within the day (e.g. 1, 2, 3...)",
      hideInTable: true,
    },
    {
      name: "question",
      label: "Problem Title / Question",
      type: "textarea",
      required: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-foreground text-xs leading-snug">{r.question}</div>
          {r.day_title && (
            <div className="text-[11px] text-muted-foreground mt-0.5">{r.day_title}</div>
          )}
          {r.practice_url && (
            <a
              href={r.practice_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1 font-medium"
            >
              Practice link <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      ),
    },
    {
      name: "topic",
      label: "Topic",
      type: "text",
      required: true,
      hint: "e.g. Arrays, Strings, Binary Search, Binary Trees, 1D DP, DBMS, Graphs",
    },
    {
      name: "difficulty",
      label: "Difficulty",
      type: "select",
      options: difficultyOptions,
      render: (r) => <DifficultyTag level={r.difficulty} />,
    },
    {
      name: "company_names",
      label: "Companies (Comma-separated)",
      type: "text",
      hint: "e.g. Google, Amazon, Microsoft, TCS",
      render: (r) => (
        <span className="text-xs text-muted-foreground font-medium">
          {r.company_names || (r.companies?.name ? r.companies.name : "—")}
        </span>
      ),
    },
    {
      name: "is_published",
      label: "Published to Students",
      type: "boolean",
      hint: "When checked, students can view and practice this problem in their DSA Sheet.",
      render: (r) => (
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border",
            r.is_published !== false
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
          )}
        >
          {r.is_published !== false ? "Published" : "Draft (Hidden)"}
        </span>
      ),
    },
    {
      name: "is_verified",
      label: "Verified by Placement Cell",
      type: "boolean",
      hint: "Indicates that this problem and resource links have been officially vetted.",
      hideInTable: true,
    },
    {
      name: "practice_url",
      label: "Practice URL (LeetCode / GFG)",
      type: "text",
      hideInTable: true,
      hint: "Direct link to the problem on LeetCode or GeeksforGeeks.",
    },
    {
      name: "article_url",
      label: "Article / Editorial URL",
      type: "text",
      hideInTable: true,
      hint: "Editorial guide (TakeUForward, GeeksforGeeks).",
    },
    {
      name: "video_url",
      label: "Video Solution URL",
      type: "text",
      hideInTable: true,
      hint: "YouTube video solution link.",
    },
    {
      name: "notes",
      label: "Approach Notes / Key Takeaways",
      type: "textarea",
      hideInTable: true,
      hint: "Important algorithms, space/time complexities, or corner cases.",
    },
    {
      name: "company_id",
      label: "Company (Campus Drive FK)",
      type: "company",
      required: false,
      hideInTable: true,
      hint: "Optional: map directly to an on-campus recruiting partner.",
    },
    {
      name: "round_id",
      label: "Round",
      type: "round",
      hideInTable: true,
    },
    {
      name: "source_id",
      label: "Source",
      type: "source",
      hideInTable: true,
    },
    {
      name: "asked_on",
      label: "Date asked",
      type: "date",
      hideInTable: true,
    },
    {
      name: "experience",
      label: "Candidate experience",
      type: "textarea",
      hideInTable: true,
    },
  ];

  return (
    <ResourceManager
      title="DSA Sheet & Questions"
      description="Manage day-wise DSA problems and authentic questions asked during campus drives in one unified database."
      table="questions"
      searchKeys={["question", "topic", "day_title", "company_names", "notes"]}
      defaults={{
        question_type: "dsa_sheet",
        difficulty: "medium",
        day_number: 1,
        day_title: "Day 01: Arrays & Two Pointers",
        order_index: 1,
        is_published: true,
        is_verified: true,
      }}
      transformPayload={(payload) => {
        const p = { ...payload };
        if (p.day_number) {
          const num = Number(p.day_number);
          p.day_number = num;
          const match = dsaDayOptions.find((d) => d.value === String(num));
          if (match) {
            p.day_title = match.label;
          }
        } else {
          p.day_number = null;
          p.day_title = null;
        }
        if (p.company_id === "") {
          p.company_id = null;
        }
        return p;
      }}
      fields={fields}
      customFilter={(r) => {
        if (selectedType && (r.question_type ?? "dsa_sheet") !== selectedType) {
          return false;
        }
        if (selectedDay) {
          if (String(r.day_number ?? "") !== selectedDay) return false;
        }
        return true;
      }}
      filterBarExtra={
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-medium"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by question type"
          >
            <option value="">All Question Types</option>
            <option value="dsa_sheet">DSA Practice Sheet</option>
            <option value="interview_question">Campus Interview Debriefs</option>
          </select>

          <select
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-medium"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            aria-label="Filter by practice day"
          >
            <option value="">All Days</option>
            {dsaDayOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      }
      rowActions={(r) => (
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 w-7 p-0 transition-colors",
            r.is_published !== false
              ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
              : "text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40",
          )}
          title={
            r.is_published !== false
              ? "Published: Click to unpublish/hide from students"
              : "Draft: Click to publish to students"
          }
          onClick={() =>
            togglePublish.mutate({
              id: r.id,
              nextPublished: r.is_published === false,
            })
          }
          disabled={togglePublish.isPending}
          aria-label={r.is_published !== false ? "Hide from students" : "Publish to students"}
        >
          {r.is_published !== false ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
        </Button>
      )}
    />
  );
}
