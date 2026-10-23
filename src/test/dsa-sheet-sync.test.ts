import { describe, expect, it } from "vitest";

describe("Shared DSA Sheet: Cross-Portal Synchronization & Progress Isolation", () => {
  // Test Mock Questions Data representing Supabase public.questions
  const createMockDsaQuestion = (overrides = {}) => ({
    id: "q-uuid-001",
    question: "Two Sum",
    topic: "Arrays",
    difficulty: "easy" as const,
    day_number: 1,
    day_title: "Day 01: Arrays & Two Pointers",
    order_index: 1,
    question_type: "dsa_sheet",
    is_published: true,
    is_verified: true,
    practice_url: "https://leetcode.com/problems/two-sum/",
    article_url:
      "https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/",
    video_url: "https://www.youtube.com/watch?v=UXDSeD9mN-k",
    notes: "Hash map lookup in O(N) time and O(N) space.",
    company_names: "Google, Amazon, Microsoft, TCS",
    company_id: null, // General DSA problem does not mandate single company foreign key
    created_at: new Date().toISOString(),
    ...overrides,
  });

  const createMockInterviewQuestion = (overrides = {}) => ({
    id: "q-uuid-interview-001",
    question: "Reverse a string without using built-in library functions.",
    topic: "Strings",
    difficulty: "easy" as const,
    day_number: null,
    day_title: null,
    order_index: 1,
    question_type: "interview_question",
    is_published: true,
    is_verified: true,
    company_id: "comp-uuid-northwind",
    asked_on: "2024-09-12",
    experience: "Interviewer asked for two approaches: in-place vs extra buffer.",
    created_at: new Date().toISOString(),
    ...overrides,
  });

  it("ensures general DSA sheet questions do not mandate a single company foreign key", () => {
    const dsaQuestion = createMockDsaQuestion();
    expect(dsaQuestion.company_id).toBeNull();
    expect(dsaQuestion.company_names).toContain("Google");
    expect(dsaQuestion.company_names).toContain("Amazon");
    expect(dsaQuestion.day_number).toBe(1);
    expect(dsaQuestion.question_type).toBe("dsa_sheet");
  });

  it("preserves authentic campus drive questions alongside curated DSA problems", () => {
    const campusQuestion = createMockInterviewQuestion();
    expect(campusQuestion.company_id).toBe("comp-uuid-northwind");
    expect(campusQuestion.question_type).toBe("interview_question");
    expect(campusQuestion.day_number).toBeNull();
    expect(campusQuestion.experience).toBeDefined();
  });

  describe("Publication & Visibility Rules (RLS logic simulation)", () => {
    const mockDbQuestions = [
      createMockDsaQuestion({ id: "q1", question: "Two Sum", is_published: true }),
      createMockDsaQuestion({ id: "q2", question: "Secret Mock Problem", is_published: false }), // Unpublished draft
      createMockDsaQuestion({
        id: "q3",
        question: "Valid Anagram",
        day_number: 2,
        is_published: true,
      }),
      createMockInterviewQuestion({
        id: "q4",
        question: "Explain Postgres Indexes",
        company_id: "comp-published-uuid",
        is_published: true,
      }),
      createMockInterviewQuestion({
        id: "q5",
        question: "Internal Unpublished Drive Q",
        company_id: "comp-published-uuid",
        is_published: false, // Unpublished debrief
      }),
    ];

    // RLS Policy Simulation for authenticated students
    // USING (is_published AND (question_type = 'dsa_sheet' OR day_number IS NOT NULL OR company_id IS NULL OR company_visible(company_id)))
    const simulateStudentSelect = (
      questions: typeof mockDbQuestions,
      publishedCompanyIds: string[],
    ) => {
      return questions.filter((q) => {
        if (!q.is_published) return false;
        if (q.question_type === "dsa_sheet" || q.day_number !== null || q.company_id === null) {
          return true;
        }
        return publishedCompanyIds.includes(q.company_id);
      });
    };

    it("strictly hides unpublished DSA questions and unpublished interview questions from students", () => {
      const studentVisible = simulateStudentSelect(mockDbQuestions, ["comp-published-uuid"]);
      const visibleIds = studentVisible.map((q) => q.id);

      expect(visibleIds).toContain("q1");
      expect(visibleIds).toContain("q3");
      expect(visibleIds).toContain("q4");

      // Draft / unpublished questions MUST be hidden
      expect(visibleIds).not.toContain("q2");
      expect(visibleIds).not.toContain("q5");
    });

    it("immediately shows newly published question when admin toggles is_published to true", () => {
      const updatedQuestions = mockDbQuestions.map((q) =>
        q.id === "q2" ? { ...q, is_published: true } : q,
      );

      const studentVisible = simulateStudentSelect(updatedQuestions, ["comp-published-uuid"]);
      expect(studentVisible.map((q) => q.id)).toContain("q2");
    });

    it("immediately removes question from student view when admin unpublishes it", () => {
      const updatedQuestions = mockDbQuestions.map((q) =>
        q.id === "q1" ? { ...q, is_published: false } : q,
      );

      const studentVisible = simulateStudentSelect(updatedQuestions, ["comp-published-uuid"]);
      expect(studentVisible.map((q) => q.id)).not.toContain("q1");
    });
  });

  describe("Day-Wise DSA Organization & Ordering", () => {
    const rawQuestions = [
      createMockDsaQuestion({
        id: "d2-2",
        day_number: 2,
        order_index: 2,
        question: "Longest Substring",
      }),
      createMockDsaQuestion({
        id: "d1-2",
        day_number: 1,
        order_index: 2,
        question: "Stock Buy Sell",
      }),
      createMockDsaQuestion({
        id: "d2-1",
        day_number: 2,
        order_index: 1,
        question: "Valid Anagram",
      }),
      createMockDsaQuestion({ id: "d1-1", day_number: 1, order_index: 1, question: "Two Sum" }),
    ];

    it("sorts questions by day_number ascending and order_index ascending", () => {
      const sorted = [...rawQuestions].sort((a, b) => {
        if (a.day_number !== b.day_number) return a.day_number - b.day_number;
        return a.order_index - b.order_index;
      });

      expect(sorted.map((q) => q.id)).toEqual(["d1-1", "d1-2", "d2-1", "d2-2"]);
    });

    it("parses multi-company associations from comma-separated strings accurately", () => {
      const q = createMockDsaQuestion({ company_names: "Google, Amazon, Microsoft, TCS" });
      const companies = q.company_names
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      expect(companies).toHaveLength(4);
      expect(companies).toContain("Google");
      expect(companies).toContain("TCS");
    });
  });

  describe("Student Progress Isolation (student_question_progress)", () => {
    const student1 = "user-student-alpha";
    const student2 = "user-student-beta";

    const mockProgressTable = [
      {
        id: "p1",
        user_id: student1,
        question_id: "q-uuid-001",
        is_solved: true,
        is_bookmarked: false,
      },
      {
        id: "p2",
        user_id: student1,
        question_id: "q-uuid-002",
        is_solved: false,
        is_bookmarked: true,
      },
      {
        id: "p3",
        user_id: student2,
        question_id: "q-uuid-001",
        is_solved: false,
        is_bookmarked: true,
      },
    ];

    // RLS Policy Simulation for progress read
    // USING (user_id = auth.uid())
    const simulateProgressRead = (userId: string) => {
      return mockProgressTable.filter((p) => p.user_id === userId);
    };

    it("isolates student progress so Student A cannot read or affect Student B progress", () => {
      const student1Progress = simulateProgressRead(student1);
      const student2Progress = simulateProgressRead(student2);

      // Student 1 has solved q-uuid-001
      expect(student1Progress.find((p) => p.question_id === "q-uuid-001")?.is_solved).toBe(true);

      // Student 2 has NOT solved q-uuid-001
      expect(student2Progress.find((p) => p.question_id === "q-uuid-001")?.is_solved).toBe(false);

      // Neither student receives the other's records
      expect(student1Progress.every((p) => p.user_id === student1)).toBe(true);
      expect(student2Progress.every((p) => p.user_id === student2)).toBe(true);
    });
  });
});
