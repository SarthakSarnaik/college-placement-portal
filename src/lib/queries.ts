import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function run<T>(
  p: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const companiesQuery = queryOptions({
  queryKey: ["companies"],
  queryFn: () =>
    run(
      supabase
        .from("companies")
        .select(
          "*, job_roles(id, title, hiring_year, location, ctc_note), eligibility_criteria(id, min_cgpa, min_10th_percentage, min_12th_percentage, max_backlogs, branches, notes, is_current, year), dsa_topics(topic)",
        )
        .order("name"),
    ),
});

export const companyQuery = (id: string) =>
  queryOptions({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          "*, job_roles(*), eligibility_criteria(*), dsa_topics(*), cs_fundamentals(*), interview_rounds(*), questions(*, sources(title, status, source_type), interview_rounds(name))",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

export const dsaQuery = queryOptions({
  queryKey: ["dsa_all"],
  queryFn: () =>
    run(supabase.from("dsa_topics").select("*, companies(id, name, is_demo)").order("priority")),
});

export const csQuery = queryOptions({
  queryKey: ["cs_all"],
  queryFn: () =>
    run(
      supabase.from("cs_fundamentals").select("*, companies(id, name, is_demo)").order("priority"),
    ),
});

export const dsaCategoryOptions = [
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const roundsQuery = queryOptions({
  queryKey: ["rounds_all"],
  queryFn: () =>
    run(
      supabase
        .from("interview_rounds")
        .select("*, companies(id, name, is_demo)")
        .order("round_order"),
    ),
});

export const questionsQuery = queryOptions({
  queryKey: ["questions_all"],
  queryFn: () =>
    run(
      supabase
        .from("questions")
        .select(
          "*, companies(id, name, is_demo), sources(title, status, source_type), interview_rounds(name)",
        )
        .order("asked_on", { ascending: false }),
    ),
});

export const announcementsQuery = queryOptions({
  queryKey: ["announcements"],
  queryFn: () =>
    run(
      supabase
        .from("announcements")
        .select("*, companies(id, name)")
        .order("published_at", { ascending: false }),
    ),
});

export const dsaDayOptions = [
  { value: "1", label: "Day 01: Arrays & Two Pointers" },
  { value: "2", label: "Day 02: Strings & Hashing" },
  { value: "3", label: "Day 03: Binary Search" },
  { value: "4", label: "Day 04: Binary Trees" },
  { value: "5", label: "Day 05: 1D Dynamic Programming" },
];

export const questionTypeOptions = [
  { value: "dsa_sheet", label: "DSA Practice Sheet Problem" },
  { value: "interview_question", label: "Campus Interview Debrief" },
];

export const studentProgressQuery = (userId?: string | null) =>
  queryOptions({
    queryKey: ["student_progress", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];
      try {
        const { data, error } = await supabase
          .from("student_question_progress")
          .select("*")
          .eq("user_id", userId);
        if (error) {
          console.warn("student_question_progress query notice:", error.message);
          return [];
        }
        return (data ?? []) as Array<{
          id: string;
          user_id: string;
          question_id: string;
          is_solved: boolean;
          is_bookmarked: boolean;
        }>;
      } catch (e) {
        console.warn("student_question_progress lookup fallback:", e);
        return [];
      }
    },
  });

export const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
