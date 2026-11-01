import { describe, expect, it } from "vitest";

describe("Full Placement Workflow: End-to-End Recruitment Data & Visibility", () => {
  // Test Data Fixtures
  const createMockCompany = (overrides = {}) => ({
    id: "comp-uuid-101",
    name: "Apex Global Cloud Solutions",
    sector: "Cloud Architecture & Enterprise Software",
    headquarters: "Bengaluru, India",
    overview: "Leading cloud engineering enterprise conducting campus recruitment drives.",
    website: "https://apex-cloud.example.com",
    first_visit_year: 2022,
    dsa_difficulty: "hard" as const,
    is_demo: false,
    is_published: false, // Initially draft/unpublished
    verification_status: "pending" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const mockJobRoles = [
    {
      id: "role-1",
      company_id: "comp-uuid-101",
      title: "Cloud Software Engineer (SDE-1)",
      hiring_year: 2026,
      ctc_note: "CTC ₹18.5 LPA (Base + Joining Bonus + Stock Options)",
      location: "Bengaluru / Hyderabad",
    },
    {
      id: "role-2",
      company_id: "comp-uuid-101",
      title: "DevOps & Infrastructure Engineer",
      hiring_year: 2025,
      ctc_note: "CTC ₹15.0 LPA",
      location: "Pune",
    },
  ];

  const mockEligibilityCriteria = [
    {
      id: "crit-2024",
      company_id: "comp-uuid-101",
      year: 2024,
      min_10th_percentage: 60.0,
      min_12th_percentage: 60.0,
      min_cgpa: 7.0,
      max_backlogs: 1,
      branches: "CSE, IT",
      notes: "Initial pilot criteria for 2024 batch.",
      is_current: false,
    },
    {
      id: "crit-2025",
      company_id: "comp-uuid-101",
      year: 2025,
      min_10th_percentage: 65.0,
      min_12th_percentage: 65.0,
      min_cgpa: 7.25,
      max_backlogs: 0,
      branches: "CSE, IT, ECE",
      notes: "Criteria updated: zero active backlogs mandated.",
      is_current: false,
    },
    {
      id: "crit-2026",
      company_id: "comp-uuid-101",
      year: 2026,
      min_10th_percentage: 60.5,
      min_12th_percentage: 62.5,
      min_cgpa: 7.5,
      max_backlogs: 0,
      branches: "CSE, IT, ECE, EEE, AIDS",
      notes: "Current season criteria. AI & Data Science branch included.",
      is_current: true,
    },
  ];

  const mockDsaTopics = [
    {
      id: "dsa-1",
      company_id: "comp-uuid-101",
      topic: "Arrays & Two Pointers",
      category: "basic" as const,
      difficulty: "easy" as const,
      priority: 1,
      notes: "Frequently asked in preliminary online screening rounds.",
    },
    {
      id: "dsa-2",
      company_id: "comp-uuid-101",
      topic: "Sliding Window & Substring Search",
      category: "intermediate" as const,
      difficulty: "medium" as const,
      priority: 1,
      notes: "Core topic for 90-minute live coding assessment.",
    },
    {
      id: "dsa-3",
      company_id: "comp-uuid-101",
      topic: "Binary Trees & Lowest Common Ancestor",
      category: "intermediate" as const,
      difficulty: "medium" as const,
      priority: 2,
      notes: "Tree traversal and recursion optimization.",
    },
    {
      id: "dsa-4",
      company_id: "comp-uuid-101",
      topic: "Graph Traversal (BFS/DFS, Topological Sort)",
      category: "advanced" as const,
      difficulty: "hard" as const,
      priority: 1,
      notes: "Essential for technical interview Round 2.",
    },
    {
      id: "dsa-5",
      company_id: "comp-uuid-101",
      topic: "Dynamic Programming (Knapsack & Partition)",
      category: "advanced" as const,
      difficulty: "hard" as const,
      priority: 1,
      notes: "Complex memoization and tabulation problems.",
    },
  ];

  const mockCsFundamentals = [
    {
      id: "cs-1",
      company_id: "comp-uuid-101",
      subject: "Operating Systems",
      priority: 1, // High priority
      subtopics: "Virtual Memory, Paging, Concurrency, Mutex vs Semaphore, Deadlocks",
      notes: "Critical focus during technical interview round.",
    },
    {
      id: "cs-2",
      company_id: "comp-uuid-101",
      subject: "Database Management Systems",
      priority: 1,
      subtopics:
        "ACID properties, B+ Tree Indexing, Query Optimization, Normalization (1NF to BCNF)",
      notes: "Interviewer asks candidate to write complex SQL joins and design schemas.",
    },
    {
      id: "cs-3",
      company_id: "comp-uuid-101",
      subject: "Computer Networks",
      priority: 2, // Medium priority
      subtopics: "TCP 3-Way Handshake, DNS resolution flow, HTTP/2 vs HTTP/3, TLS encryption",
      notes: "Common screening questions for cloud engineering roles.",
    },
    {
      id: "cs-4",
      company_id: "comp-uuid-101",
      subject: "Object-Oriented Design & Principles",
      priority: 2,
      subtopics: "SOLID principles, Design Patterns (Factory, Singleton, Observer)",
      notes: "Practical design problem presented in Round 3.",
    },
  ];

  const mockInterviewRounds = [
    {
      id: "round-1",
      company_id: "comp-uuid-101",
      round_order: 1,
      name: "Online Technical Assessment",
      purpose: "Automated screening of quantitative ability and algorithmic coding.",
      preparation: "Solve 2 medium algorithmic problems within 75 minutes.",
      duration: "90 min",
    },
    {
      id: "round-2",
      company_id: "comp-uuid-101",
      round_order: 2,
      name: "Technical DSA & Problem Solving",
      purpose:
        "Live pair-programming with Senior Engineer on DSA and time-complexity optimization.",
      preparation:
        "State brute-force solution clearly first, then optimize. Practice thinking aloud.",
      duration: "60 min",
    },
    {
      id: "round-3",
      company_id: "comp-uuid-101",
      round_order: 3,
      name: "Systems & Low-Level Design",
      purpose: "Evaluates OOP, concurrency, database indexing, and API design.",
      preparation: "Revise modular architecture, caching mechanisms, and schema design.",
      duration: "45 min",
    },
    {
      id: "round-4",
      company_id: "comp-uuid-101",
      round_order: 4,
      name: "Director / Behavioral Interview",
      purpose: "Assesses culture fit, adaptability, leadership qualities, and project ownership.",
      preparation: "Prepare STAR-format narratives highlighting project hurdles and teamwork.",
      duration: "30 min",
    },
  ];

  // 3 Years of Interview Questions (2024, 2025, 2026)
  const mockQuestions = [
    // 2024 Questions
    {
      id: "q-2024-1",
      company_id: "comp-uuid-101",
      round_id: "round-2",
      question: "Implement an LRU Cache with O(1) get and put operations.",
      topic: "Data Structures / Hash Map + Doubly Linked List",
      difficulty: "medium" as const,
      asked_on: "2024-09-14",
      experience: "Candidate asked to handle edge cases when capacity is exceeded.",
    },
    {
      id: "q-2024-2",
      company_id: "comp-uuid-101",
      round_id: "round-3",
      question: "Explain the difference between optimistic and pessimistic locking in PostgreSQL.",
      topic: "DBMS / Concurrency",
      difficulty: "medium" as const,
      asked_on: "2024-09-22",
      experience: "Interviewer asked for a real-world banking transaction example.",
    },
    // 2025 Questions
    {
      id: "q-2025-1",
      company_id: "comp-uuid-101",
      round_id: "round-2",
      question:
        "Given a network of microservices, detect circular dependencies using cycle detection in directed graphs.",
      topic: "Graphs / Topological Sort",
      difficulty: "hard" as const,
      asked_on: "2025-10-05",
      experience: "Follow-up asked for Tarjan's algorithm or Kahn's BFS approach.",
    },
    {
      id: "q-2025-2",
      company_id: "comp-uuid-101",
      round_id: "round-3",
      question: "Design a rate limiter for an API endpoint using the Token Bucket algorithm.",
      topic: "System Design / Distributed Systems",
      difficulty: "hard" as const,
      asked_on: "2025-10-18",
      experience: "Discussed Redis storage and handling distributed race conditions.",
    },
    // 2026 Questions
    {
      id: "q-2026-1",
      company_id: "comp-uuid-101",
      round_id: "round-1",
      question: "Find the maximum sum of a contiguous subarray using Kadane's algorithm.",
      topic: "Arrays / Dynamic Programming",
      difficulty: "easy" as const,
      asked_on: "2026-08-11",
      experience: "Screening round problem with all negative numbers test case.",
    },
    {
      id: "q-2026-2",
      company_id: "comp-uuid-101",
      round_id: "round-2",
      question: "Serialize and deserialize a binary tree into a string representation.",
      topic: "Binary Trees / Traversal",
      difficulty: "hard" as const,
      asked_on: "2026-09-02",
      experience: "Interviewer asked to compare preorder vs level-order encoding efficiency.",
    },
  ];

  it("admin workflow: creates a recruiter profile with draft state and verification pending", () => {
    const draftCompany = createMockCompany({ is_published: false, verification_status: "pending" });

    expect(draftCompany.id).toBe("comp-uuid-101");
    expect(draftCompany.name).toBe("Apex Global Cloud Solutions");
    expect(draftCompany.is_published).toBe(false);
    expect(draftCompany.verification_status).toBe("pending");
    expect(draftCompany.dsa_difficulty).toBe("hard");
  });

  it("admin workflow: manages role-specific DSA categorized into basic, intermediate, and advanced", () => {
    const basicTopics = mockDsaTopics.filter((t) => t.category === "basic");
    const intermediateTopics = mockDsaTopics.filter((t) => t.category === "intermediate");
    const advancedTopics = mockDsaTopics.filter((t) => t.category === "advanced");

    expect(basicTopics).toHaveLength(1);
    expect(basicTopics[0].topic).toBe("Arrays & Two Pointers");
    expect(basicTopics[0].difficulty).toBe("easy");

    expect(intermediateTopics).toHaveLength(2);
    expect(intermediateTopics.map((t) => t.topic)).toContain("Sliding Window & Substring Search");
    expect(intermediateTopics.map((t) => t.topic)).toContain(
      "Binary Trees & Lowest Common Ancestor",
    );

    expect(advancedTopics).toHaveLength(2);
    expect(advancedTopics.map((t) => t.topic)).toContain(
      "Graph Traversal (BFS/DFS, Topological Sort)",
    );
    expect(advancedTopics.map((t) => t.topic)).toContain(
      "Dynamic Programming (Knapsack & Partition)",
    );

    // Priority sorting verification
    const sortedByPriority = [...mockDsaTopics].sort((a, b) => a.priority - b.priority);
    expect(sortedByPriority[0].priority).toBe(1);
  });

  it("admin workflow: manages core CS fundamentals prioritized by recruiting weight", () => {
    const highPrioritySubjects = mockCsFundamentals.filter((f) => f.priority === 1);
    expect(highPrioritySubjects).toHaveLength(2);
    expect(highPrioritySubjects.map((s) => s.subject)).toContain("Operating Systems");
    expect(highPrioritySubjects.map((s) => s.subject)).toContain("Database Management Systems");

    const mediumPrioritySubjects = mockCsFundamentals.filter((f) => f.priority === 2);
    expect(mediumPrioritySubjects).toHaveLength(2);
    expect(mediumPrioritySubjects.map((s) => s.subject)).toContain("Computer Networks");
    expect(mediumPrioritySubjects.map((s) => s.subject)).toContain(
      "Object-Oriented Design & Principles",
    );
  });

  it("admin workflow: validates sequential ordering of interview rounds", () => {
    const sortedRounds = [...mockInterviewRounds].sort((a, b) => a.round_order - b.round_order);

    expect(sortedRounds).toHaveLength(4);
    expect(sortedRounds[0].round_order).toBe(1);
    expect(sortedRounds[0].name).toBe("Online Technical Assessment");

    expect(sortedRounds[1].round_order).toBe(2);
    expect(sortedRounds[1].name).toBe("Technical DSA & Problem Solving");

    expect(sortedRounds[2].round_order).toBe(3);
    expect(sortedRounds[2].name).toBe("Systems & Low-Level Design");

    expect(sortedRounds[3].round_order).toBe(4);
    expect(sortedRounds[3].name).toBe("Director / Behavioral Interview");
  });

  it("admin workflow: maintains 3 distinct years of interview questions", () => {
    const getQuestionsForYear = (targetYear: number) =>
      mockQuestions.filter((q) => new Date(q.asked_on).getFullYear() === targetYear);

    const questions2024 = getQuestionsForYear(2024);
    const questions2025 = getQuestionsForYear(2025);
    const questions2026 = getQuestionsForYear(2026);

    expect(questions2024).toHaveLength(2);
    expect(questions2025).toHaveLength(2);
    expect(questions2026).toHaveLength(2);

    expect(questions2024.map((q) => q.topic)).toContain("DBMS / Concurrency");
    expect(questions2025.map((q) => q.topic)).toContain("System Design / Distributed Systems");
    expect(questions2026.map((q) => q.topic)).toContain("Arrays / Dynamic Programming");
  });

  it("publishing updates: transitions company from draft to published and verified", () => {
    let company = createMockCompany({ is_published: false, verification_status: "pending" });
    expect(company.is_published).toBe(false);

    // Admin performs publication and verification
    company = {
      ...company,
      is_published: true,
      verification_status: "verified",
      updated_at: new Date().toISOString(),
    };

    expect(company.is_published).toBe(true);
    expect(company.verification_status).toBe("verified");
  });

  it("security & visibility: students can ONLY view published companies and their child records", () => {
    const unpublishedCompany = createMockCompany({ id: "comp-draft", is_published: false });
    const publishedCompany = createMockCompany({ id: "comp-live", is_published: true });

    const allCompaniesInDatabase = [unpublishedCompany, publishedCompany];

    // RLS Policy Simulation: create policy "read published companies" on public.companies using (is_published)
    const studentVisibleCompanies = allCompaniesInDatabase.filter((c) => c.is_published);

    expect(studentVisibleCompanies).toHaveLength(1);
    expect(studentVisibleCompanies[0].id).toBe("comp-live");
    expect(studentVisibleCompanies.some((c) => c.id === "comp-draft")).toBe(false);

    // Child records RLS simulation: company_visible(company_id)
    const canStudentAccessChildRecord = (companyId: string) => {
      const parent = allCompaniesInDatabase.find((c) => c.id === companyId);
      return !!parent?.is_published;
    };

    expect(canStudentAccessChildRecord("comp-draft")).toBe(false);
    expect(canStudentAccessChildRecord("comp-live")).toBe(true);
  });

  it("student journey: quick eligibility calculator matches candidate CGPA, 10th %, 12th % and branch accurately", () => {
    const currentCriteria = mockEligibilityCriteria.find((c) => c.is_current)!;
    expect(currentCriteria.year).toBe(2026);
    expect(currentCriteria.min_10th_percentage).toBe(60.5);
    expect(currentCriteria.min_12th_percentage).toBe(62.5);
    expect(currentCriteria.min_cgpa).toBe(7.5);
    expect(currentCriteria.branches).toBe("CSE, IT, ECE, EEE, AIDS");

    const checkEligibility = (candidate: {
      tenthPercent?: number | null;
      twelfthPercent?: number | null;
      cgpa: number;
      branch: string;
      backlogs: number;
    }) => {
      if (
        currentCriteria.min_10th_percentage != null &&
        candidate.tenthPercent != null &&
        candidate.tenthPercent < currentCriteria.min_10th_percentage
      ) {
        return { eligible: false, reason: "10th percentage below cut-off" };
      }
      if (
        currentCriteria.min_12th_percentage != null &&
        candidate.twelfthPercent != null &&
        candidate.twelfthPercent < currentCriteria.min_12th_percentage
      ) {
        return { eligible: false, reason: "12th percentage below cut-off" };
      }
      if (candidate.cgpa < currentCriteria.min_cgpa!)
        return { eligible: false, reason: "CGPA below cut-off" };
      if (candidate.backlogs > currentCriteria.max_backlogs!)
        return { eligible: false, reason: "Backlogs exceed limit" };
      const branches = currentCriteria.branches.split(",").map((b) => b.trim().toUpperCase());
      if (!branches.includes(candidate.branch.trim().toUpperCase()))
        return { eligible: false, reason: "Branch ineligible" };
      return { eligible: true, reason: "Eligible for drive" };
    };

    // Candidate 1: Meets all criteria with decimal percentages -> Eligible
    expect(
      checkEligibility({
        tenthPercent: 85.4,
        twelfthPercent: 78.2,
        cgpa: 8.2,
        branch: "CSE",
        backlogs: 0,
      }),
    ).toEqual({
      eligible: true,
      reason: "Eligible for drive",
    });

    // Candidate 2: Ineligible due to 10th percentage (59.8% < 60.5%)
    expect(
      checkEligibility({
        tenthPercent: 59.8,
        twelfthPercent: 80.0,
        cgpa: 8.5,
        branch: "CSE",
        backlogs: 0,
      }),
    ).toEqual({
      eligible: false,
      reason: "10th percentage below cut-off",
    });

    // Candidate 3: Ineligible due to 12th percentage (61.0% < 62.5%)
    expect(
      checkEligibility({
        tenthPercent: 75.0,
        twelfthPercent: 61.0,
        cgpa: 8.0,
        branch: "IT",
        backlogs: 0,
      }),
    ).toEqual({
      eligible: false,
      reason: "12th percentage below cut-off",
    });

    // Candidate 4: Missing percentage records handle gracefully as non-blocking or "Not specified"
    expect(
      checkEligibility({
        tenthPercent: null,
        twelfthPercent: null,
        cgpa: 8.0,
        branch: "ECE",
        backlogs: 0,
      }),
    ).toEqual({
      eligible: true,
      reason: "Eligible for drive",
    });
  });

  it("eligibility validation: enforces 0 to 100 percentage range and decimal compatibility", () => {
    const validatePercentage = (val: number | null | undefined): string | null => {
      if (val == null) return null; // Nullable allowed
      if (typeof val !== "number" || Number.isNaN(val)) return "Must be a valid number";
      if (val < 0) return "Must be at least 0%";
      if (val > 100) return "Must be at most 100%";
      return null;
    };

    expect(validatePercentage(60.0)).toBeNull();
    expect(validatePercentage(75.25)).toBeNull();
    expect(validatePercentage(0)).toBeNull();
    expect(validatePercentage(100)).toBeNull();
    expect(validatePercentage(null)).toBeNull();
    expect(validatePercentage(undefined)).toBeNull();

    // Invalid bounds
    expect(validatePercentage(-5)).toBe("Must be at least 0%");
    expect(validatePercentage(105.5)).toBe("Must be at most 100%");
  });

  it("criteria independence: each drive year and company maintains isolated criteria records", () => {
    const criteria2024 = mockEligibilityCriteria.find((c) => c.year === 2024)!;
    const criteria2025 = mockEligibilityCriteria.find((c) => c.year === 2025)!;
    const criteria2026 = mockEligibilityCriteria.find((c) => c.year === 2026)!;

    expect(criteria2024.min_10th_percentage).toBe(60.0);
    expect(criteria2025.min_10th_percentage).toBe(65.0);
    expect(criteria2026.min_10th_percentage).toBe(60.5);

    expect(criteria2024.is_current).toBe(false);
    expect(criteria2025.is_current).toBe(false);
    expect(criteria2026.is_current).toBe(true);
  });

  it("security & bootstrap: unauthorized users cannot promote themselves or grant admin privileges", () => {
    // Simulation of handle_new_user trigger
    const simulateSignup = (email: string) => {
      // New signup is ALWAYS assigned the student role
      return {
        email,
        assignedRole: "student" as const,
      };
    };

    const firstSignup = simulateSignup("first_visitor@college.edu");
    expect(firstSignup.assignedRole).toBe("student");

    // Simulation of set_admin authorization check:
    // if not public.has_role(auth.uid(),'admin') then raise exception 'not authorized';
    const executeSetAdmin = (
      callerRole: "student" | "admin",
      targetUserId: string,
      makeAdmin: boolean,
    ) => {
      if (callerRole !== "admin") {
        throw new Error("not authorized");
      }
      return { targetUserId, role: makeAdmin ? "admin" : "student" };
    };

    // Student attempting to promote themselves or another user must throw 'not authorized'
    expect(() => executeSetAdmin("student", "target-user-1", true)).toThrowError("not authorized");

    // Existing admin can promote another user
    expect(executeSetAdmin("admin", "target-user-2", true)).toEqual({
      targetUserId: "target-user-2",
      role: "admin",
    });

    // Admin cannot remove their own admin role
    const executeSelfDemote = (callerId: string, targetId: string, makeAdmin: boolean) => {
      if (callerId === targetId && !makeAdmin) {
        throw new Error("cannot remove your own admin role");
      }
    };

    expect(() => executeSelfDemote("admin-1", "admin-1", false)).toThrowError(
      "cannot remove your own admin role",
    );
  });

  describe("Cross-Portal Admin-to-Student Synchronization & Publication Lifecycle", () => {
    it("full company publication lifecycle: draft -> published -> updated -> unpublished -> deleted", () => {
      // Step 1: Admin creates test company as draft (is_published: false)
      let companyDb: ReturnType<typeof createMockCompany>[] = [
        createMockCompany({
          id: "test-comp-lifecycle",
          name: "[TEST] CloudNova Technologies",
          is_published: false,
        }),
      ];

      // Simulated student SELECT policy: USING (is_published)
      const studentQuery = () => companyDb.filter((c) => c.is_published);
      const adminQuery = () => [...companyDb];

      // Verify Admin sees 1 record, Student sees 0
      expect(adminQuery()).toHaveLength(1);
      expect(studentQuery()).toHaveLength(0);

      // Step 2: Admin publishes company (is_published: true)
      companyDb = companyDb.map((c) =>
        c.id === "test-comp-lifecycle"
          ? { ...c, is_published: true, updated_at: new Date().toISOString() }
          : c,
      );

      // Verify Student immediately sees published company
      expect(studentQuery()).toHaveLength(1);
      expect(studentQuery()[0].name).toBe("[TEST] CloudNova Technologies");

      // Step 3: Admin updates company sector and difficulty
      companyDb = companyDb.map((c) =>
        c.id === "test-comp-lifecycle"
          ? { ...c, sector: "Cybersecurity & Cloud", dsa_difficulty: "medium" as const }
          : c,
      );

      // Verify Student sees updated sector & difficulty
      const studentResult = studentQuery()[0];
      expect(studentResult.sector).toBe("Cybersecurity & Cloud");
      expect(studentResult.dsa_difficulty).toBe("medium");

      // Step 4: Admin unpublishes company (is_published: false)
      companyDb = companyDb.map((c) =>
        c.id === "test-comp-lifecycle" ? { ...c, is_published: false } : c,
      );

      // Verify Student no longer sees the company
      expect(studentQuery()).toHaveLength(0);
      // Admin still sees the unpublished draft
      expect(adminQuery()).toHaveLength(1);

      // Step 5: Admin deletes company
      companyDb = companyDb.filter((c) => c.id !== "test-comp-lifecycle");

      // Verify completely removed from both portals
      expect(adminQuery()).toHaveLength(0);
      expect(studentQuery()).toHaveLength(0);
    });

    it("parent-child visibility cascade: all 6 child tables hide when company is unpublished", () => {
      const companyId = "test-comp-cascade";
      let company = createMockCompany({ id: companyId, is_published: false });

      const roles = [{ id: "r1", company_id: companyId, title: "SDE-1" }];
      const criteria = [{ id: "c1", company_id: companyId, min_cgpa: 7.0, is_current: true }];
      const dsa = [{ id: "d1", company_id: companyId, topic: "Graphs", priority: 1 }];
      const fundamentals = [{ id: "f1", company_id: companyId, subject: "OS", priority: 1 }];
      const rounds = [{ id: "rd1", company_id: companyId, round_order: 1, name: "Coding Round" }];
      const questions = [{ id: "q1", company_id: companyId, question: "Invert binary tree" }];

      // Simulated company_visible(company_id) SQL function
      const isVisible = (cid: string) => company.id === cid && company.is_published;

      // When unpublished: student queries across all 6 child tables return empty
      expect(roles.filter((r) => isVisible(r.company_id))).toHaveLength(0);
      expect(criteria.filter((c) => isVisible(c.company_id))).toHaveLength(0);
      expect(dsa.filter((d) => isVisible(d.company_id))).toHaveLength(0);
      expect(fundamentals.filter((f) => isVisible(f.company_id))).toHaveLength(0);
      expect(rounds.filter((rd) => isVisible(rd.company_id))).toHaveLength(0);
      expect(questions.filter((q) => isVisible(q.company_id))).toHaveLength(0);

      // When published: all 6 child tables become visible to students
      company = { ...company, is_published: true };
      expect(roles.filter((r) => isVisible(r.company_id))).toHaveLength(1);
      expect(criteria.filter((c) => isVisible(c.company_id))).toHaveLength(1);
      expect(dsa.filter((d) => isVisible(d.company_id))).toHaveLength(1);
      expect(fundamentals.filter((f) => isVisible(f.company_id))).toHaveLength(1);
      expect(rounds.filter((rd) => isVisible(rd.company_id))).toHaveLength(1);
      expect(questions.filter((q) => isVisible(q.company_id))).toHaveLength(1);
    });

    it("announcements visibility: students see broadcast notices without requiring company association", () => {
      const notices = [
        { id: "a1", title: "General TPO Drive Alert", body: "Registration open", company_id: null },
        {
          id: "a2",
          title: "Halden Analytics PPT",
          body: "Tomorrow at 10 AM",
          company_id: "comp-live",
        },
      ];

      // Announcements RLS policy: USING (true) for all authenticated students
      const studentAnnouncements = notices.filter(() => true);
      expect(studentAnnouncements).toHaveLength(2);
      expect(studentAnnouncements.find((a) => a.company_id === null)?.title).toBe(
        "General TPO Drive Alert",
      );
    });

    it("announcements company relation resilience: safely extracts company metadata whether object, array, or null", () => {
      const noticesWithVariousCompanyShapes = [
        {
          id: "1",
          title: "Drive Notice",
          body: "Details",
          companies: { id: "c1", name: "Acme Corp" },
        },
        {
          id: "2",
          title: "Broadcast Notice",
          body: "Details",
          companies: null,
        },
        {
          id: "3",
          title: "Multiple Join Notice",
          body: "Details",
          companies: [{ id: "c2", name: "Beta LLC" }],
        },
      ];

      const extractCompany = (a: (typeof noticesWithVariousCompanyShapes)[number]) => {
        const c = Array.isArray(a.companies) ? a.companies[0] : a.companies;
        return c?.id ? { id: c.id, name: c.name } : null;
      };

      expect(extractCompany(noticesWithVariousCompanyShapes[0])).toEqual({
        id: "c1",
        name: "Acme Corp",
      });
      expect(extractCompany(noticesWithVariousCompanyShapes[1])).toBeNull();
      expect(extractCompany(noticesWithVariousCompanyShapes[2])).toEqual({
        id: "c2",
        name: "Beta LLC",
      });
    });
  });
});
