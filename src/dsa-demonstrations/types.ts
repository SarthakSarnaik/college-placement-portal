/**
 * DSA Demonstrations — Type Definitions & Sample Dataset
 *
 * Standalone domain models and sample records used strictly for
 * algorithmic demonstrations. These are decoupled from live database
 * tables to maintain complete isolation from production operations.
 */

export type DsaDifficulty = "easy" | "medium" | "hard";

export interface PlacementCompanyRecord {
  id: string;
  name: string;
  sector: string;
  dsaDifficulty: DsaDifficulty;
  minCgpa: number;
}

export type RoundCategory =
  "Online Assessment" | "Technical Interview" | "System Design" | "HR & Leadership";

export interface InterviewRoundNode {
  id: string;
  roundNumber: number;
  name: string;
  category: RoundCategory;
  durationMinutes: number;
  companyId: string;
}

export interface InterviewQuestionRecord {
  id: string;
  title: string;
  topic: string;
  difficulty: DsaDifficulty;
  companyNames: string[];
  practiceUrl?: string;
}

/**
 * Realistic sample dataset mirroring campus drive recruiting partners.
 * Used exclusively for algorithmic testing and verification.
 */
export const SAMPLE_COMPANIES: readonly PlacementCompanyRecord[] = [
  {
    id: "comp-goog-01",
    name: "Google",
    sector: "Big Tech / Search",
    dsaDifficulty: "hard",
    minCgpa: 8.5,
  },
  {
    id: "comp-amzn-02",
    name: "Amazon",
    sector: "E-Commerce / Cloud",
    dsaDifficulty: "medium",
    minCgpa: 7.5,
  },
  {
    id: "comp-msft-03",
    name: "Microsoft",
    sector: "Cloud / Enterprise",
    dsaDifficulty: "medium",
    minCgpa: 8.0,
  },
  {
    id: "comp-tcs-04",
    name: "TCS Digital",
    sector: "IT Services & Consulting",
    dsaDifficulty: "easy",
    minCgpa: 7.0,
  },
  {
    id: "comp-payu-05",
    name: "PayU Payments",
    sector: "Fintech & Payments",
    dsaDifficulty: "medium",
    minCgpa: 7.5,
  },
  {
    id: "comp-gs-06",
    name: "Goldman Sachs",
    sector: "Investment Banking",
    dsaDifficulty: "hard",
    minCgpa: 8.5,
  },
  {
    id: "comp-inf-07",
    name: "Infosys DSE",
    sector: "Enterprise Software",
    dsaDifficulty: "easy",
    minCgpa: 6.5,
  },
  {
    id: "comp-uber-08",
    name: "Uber Technologies",
    sector: "Mobility & Logistics",
    dsaDifficulty: "hard",
    minCgpa: 8.0,
  },
  {
    id: "comp-adobe-09",
    name: "Adobe Systems",
    sector: "Creative Software",
    dsaDifficulty: "medium",
    minCgpa: 8.0,
  },
  {
    id: "comp-wipro-10",
    name: "Wipro Turbo",
    sector: "IT & Digital Services",
    dsaDifficulty: "easy",
    minCgpa: 6.5,
  },
] as const;

/**
 * Realistic sample interview rounds representing selection stages for a Big Tech recruiter.
 */
export const SAMPLE_ROUNDS: readonly InterviewRoundNode[] = [
  {
    id: "rnd-oa-1",
    roundNumber: 1,
    name: "Online Coding Assessment",
    category: "Online Assessment",
    durationMinutes: 90,
    companyId: "comp-goog-01",
  },
  {
    id: "rnd-tech-1",
    roundNumber: 2,
    name: "Technical Screening: Data Structures",
    category: "Technical Interview",
    durationMinutes: 45,
    companyId: "comp-goog-01",
  },
  {
    id: "rnd-tech-2",
    roundNumber: 3,
    name: "Advanced Problem Solving: Graphs & DP",
    category: "Technical Interview",
    durationMinutes: 60,
    companyId: "comp-goog-01",
  },
  {
    id: "rnd-sys-design",
    roundNumber: 4,
    name: "System Design & Architecture",
    category: "System Design",
    durationMinutes: 60,
    companyId: "comp-goog-01",
  },
  {
    id: "rnd-hr-final",
    roundNumber: 5,
    name: "Values, Leadership & Behavioral HR",
    category: "HR & Leadership",
    durationMinutes: 30,
    companyId: "comp-goog-01",
  },
] as const;

/**
 * Realistic sample questions commonly tested during campus placements.
 */
export const SAMPLE_QUESTIONS: readonly InterviewQuestionRecord[] = [
  {
    id: "q-001",
    title: "Best Time to Buy and Sell Stock",
    topic: "Arrays",
    difficulty: "easy",
    companyNames: ["Amazon", "Microsoft", "Infosys"],
    practiceUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
  },
  {
    id: "q-002",
    title: "Binary Tree Maximum Path Sum",
    topic: "Binary Trees",
    difficulty: "hard",
    companyNames: ["Google", "Amazon", "Uber"],
    practiceUrl: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
  },
  {
    id: "q-003",
    title: "Climbing Stairs",
    topic: "1D DP",
    difficulty: "easy",
    companyNames: ["TCS Digital", "Infosys", "Wipro"],
    practiceUrl: "https://leetcode.com/problems/climbing-stairs/",
  },
  {
    id: "q-004",
    title: "Coin Change (Fewest Coins)",
    topic: "1D DP",
    difficulty: "medium",
    companyNames: ["Amazon", "Microsoft", "PayU"],
    practiceUrl: "https://leetcode.com/problems/coin-change/",
  },
  {
    id: "q-005",
    title: "Group Anagrams",
    topic: "Strings",
    difficulty: "medium",
    companyNames: ["Amazon", "Google", "Uber"],
    practiceUrl: "https://leetcode.com/problems/group-anagrams/",
  },
  {
    id: "q-006",
    title: "Lowest Common Ancestor",
    topic: "Binary Trees",
    difficulty: "medium",
    companyNames: ["Google", "Microsoft", "Adobe"],
    practiceUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
  },
  {
    id: "q-007",
    title: "Maximum Subarray (Kadane's Algorithm)",
    topic: "Arrays",
    difficulty: "medium",
    companyNames: ["Google", "Amazon", "Microsoft"],
    practiceUrl: "https://leetcode.com/problems/maximum-subarray/",
  },
  {
    id: "q-008",
    title: "Search in Rotated Sorted Array",
    topic: "Binary Search",
    difficulty: "medium",
    companyNames: ["Google", "Microsoft", "PayU"],
    practiceUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
  },
  {
    id: "q-009",
    title: "Trapping Rain Water",
    topic: "Arrays",
    difficulty: "hard",
    companyNames: ["Google", "Amazon", "Goldman Sachs"],
    practiceUrl: "https://leetcode.com/problems/trapping-rain-water/",
  },
  {
    id: "q-010",
    title: "Two Sum",
    topic: "Arrays",
    difficulty: "easy",
    companyNames: ["Google", "Amazon", "Microsoft", "TCS"],
    practiceUrl: "https://leetcode.com/problems/two-sum/",
  },
] as const;
