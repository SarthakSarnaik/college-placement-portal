import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import {
  Search,
  RotateCcw,
  FileCode2,
  ExternalLink,
  Video,
  Bookmark,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowUpRight,
  Filter,
  Check,
  Building2,
  AlertCircle,
  HelpCircle,
  Award,
  Flame,
} from "lucide-react";
import { fmtDate, questionsQuery, studentProgressQuery } from "@/lib/queries";
import { useMe } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, DifficultyTag, VerifyTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/questions")({
  head: () => ({ meta: [{ title: "DSA Sheet — Placement Portal" }] }),
  component: DsaSheetPage,
});

interface DsaQuestion {
  id: string;
  dayNumber: number;
  dayTitle: string;
  topic: "Arrays" | "Strings" | "Binary Search" | "Binary Trees" | "1D DP";
  title: string;
  difficulty: "easy" | "medium" | "hard";
  companies: string[];
  practiceUrl: string;
  articleUrl?: string;
  videoUrl?: string;
  verified: boolean;
  notes?: string;
}

const CURATED_DSA_SHEET: DsaQuestion[] = [
  // DAY 1: ARRAYS
  {
    id: "arr-1",
    dayNumber: 1,
    dayTitle: "Day 01: Arrays & Two Pointers",
    topic: "Arrays",
    title: "Two Sum",
    difficulty: "easy",
    companies: ["Google", "Amazon", "Microsoft", "TCS"],
    practiceUrl: "https://leetcode.com/problems/two-sum/",
    articleUrl:
      "https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/",
    videoUrl: "https://www.youtube.com/watch?v=UXDSeD9mN-k",
    verified: true,
    notes: "Hash map lookup in O(N) time and O(N) space.",
  },
  {
    id: "arr-2",
    dayNumber: 1,
    dayTitle: "Day 01: Arrays & Two Pointers",
    topic: "Arrays",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "easy",
    companies: ["Amazon", "Microsoft", "Infosys", "Wipro"],
    practiceUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    articleUrl: "https://takeuforward.org/data-structure/stock-buy-and-sell/",
    videoUrl: "https://www.youtube.com/watch?v=excAOvwF_Wk",
    verified: true,
    notes: "Track minimum buy price and maximum profit in a single pass.",
  },
  {
    id: "arr-3",
    dayNumber: 1,
    dayTitle: "Day 01: Arrays & Two Pointers",
    topic: "Arrays",
    title: "Maximum Subarray (Kadane's Algorithm)",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Microsoft", "Flipkart"],
    practiceUrl: "https://leetcode.com/problems/maximum-subarray/",
    articleUrl:
      "https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/",
    videoUrl: "https://www.youtube.com/watch?v=AHZpyENo7k4",
    verified: true,
    notes: "Classic DP / Kadane's single-pass running sum.",
  },
  {
    id: "arr-4",
    dayNumber: 1,
    dayTitle: "Day 01: Arrays & Two Pointers",
    topic: "Arrays",
    title: "Next Permutation",
    difficulty: "medium",
    companies: ["Google", "Amazon", "PayU"],
    practiceUrl: "https://leetcode.com/problems/next-permutation/",
    articleUrl:
      "https://takeuforward.org/data-structure/next_permutation-find-next-lexicographically-greater-permutation/",
    videoUrl: "https://www.youtube.com/watch?v=JDOXKqF60RQ",
    verified: true,
    notes: "Find break point from right, swap with next greater, reverse suffix.",
  },
  {
    id: "arr-5",
    dayNumber: 1,
    dayTitle: "Day 01: Arrays & Two Pointers",
    topic: "Arrays",
    title: "Merge Overlapping Intervals",
    difficulty: "medium",
    companies: ["Google", "Microsoft", "Amazon", "Adobe"],
    practiceUrl: "https://leetcode.com/problems/merge-intervals/",
    articleUrl: "https://takeuforward.org/data-structure/merge-overlapping-sub-intervals/",
    videoUrl: "https://www.youtube.com/watch?v=2JzRBPFYbKE",
    verified: true,
    notes: "Sort by start time and merge contiguous overlapping intervals.",
  },
  {
    id: "arr-6",
    dayNumber: 1,
    dayTitle: "Day 01: Arrays & Two Pointers",
    topic: "Arrays",
    title: "Trapping Rain Water",
    difficulty: "hard",
    companies: ["Google", "Amazon", "Microsoft", "Goldman Sachs"],
    practiceUrl: "https://leetcode.com/problems/trapping-rain-water/",
    articleUrl: "https://takeuforward.org/data-structure/trapping-rainwater/",
    videoUrl: "https://www.youtube.com/watch?v=m18Hntz4go8",
    verified: true,
    notes: "Two-pointer approach tracking leftMax and rightMax.",
  },

  // DAY 2: STRINGS
  {
    id: "str-1",
    dayNumber: 2,
    dayTitle: "Day 02: Strings & Hashing",
    topic: "Strings",
    title: "Valid Anagram",
    difficulty: "easy",
    companies: ["Amazon", "TCS", "Infosys", "Cognizant"],
    practiceUrl: "https://leetcode.com/problems/valid-anagram/",
    articleUrl:
      "https://takeuforward.org/data-structure/check-if-two-strings-are-anagrams-of-each-other/",
    videoUrl: "https://www.youtube.com/watch?v=9UtInBqnCgA",
    verified: true,
    notes: "Character frequency counter array of size 26.",
  },
  {
    id: "str-2",
    dayNumber: 2,
    dayTitle: "Day 02: Strings & Hashing",
    topic: "Strings",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    companies: ["Amazon", "Microsoft", "Google", "PayU"],
    practiceUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    articleUrl:
      "https://takeuforward.org/data-structure/length-of-longest-substring-without-any-repeating-character/",
    videoUrl: "https://www.youtube.com/watch?v=qtVh-XEpsEc",
    verified: true,
    notes: "Sliding window with hash set / map of last seen indices.",
  },
  {
    id: "str-3",
    dayNumber: 2,
    dayTitle: "Day 02: Strings & Hashing",
    topic: "Strings",
    title: "Longest Palindromic Substring",
    difficulty: "medium",
    companies: ["Microsoft", "Amazon", "Adobe", "Flipkart"],
    practiceUrl: "https://leetcode.com/problems/longest-palindromic-substring/",
    articleUrl: "https://www.geeksforgeeks.org/longest-palindromic-substring/",
    videoUrl: "https://www.youtube.com/watch?v=XYQecbcd6fY",
    verified: true,
    notes: "Expand around center for both odd and even length centers.",
  },
  {
    id: "str-4",
    dayNumber: 2,
    dayTitle: "Day 02: Strings & Hashing",
    topic: "Strings",
    title: "Group Anagrams",
    difficulty: "medium",
    companies: ["Amazon", "Google", "Uber", "Walmart"],
    practiceUrl: "https://leetcode.com/problems/group-anagrams/",
    articleUrl:
      "https://www.geeksforgeeks.org/given-a-sequence-of-words-print-all-anagrams-together/",
    videoUrl: "https://www.youtube.com/watch?v=vzdNOK2oB2E",
    verified: true,
    notes: "Sort each string or build frequency tuple as hash key.",
  },
  {
    id: "str-5",
    dayNumber: 2,
    dayTitle: "Day 02: Strings & Hashing",
    topic: "Strings",
    title: "Minimum Window Substring",
    difficulty: "hard",
    companies: ["Google", "Amazon", "Microsoft", "LinkedIn"],
    practiceUrl: "https://leetcode.com/problems/minimum-window-substring/",
    articleUrl:
      "https://www.geeksforgeeks.org/find-the-smallest-window-in-a-string-containing-all-characters-of-another-string/",
    videoUrl: "https://www.youtube.com/watch?v=jSto0O4AJbM",
    verified: true,
    notes: "Two-pointer variable sliding window with character frequency count.",
  },

  // DAY 3: BINARY SEARCH
  {
    id: "bs-1",
    dayNumber: 3,
    dayTitle: "Day 03: Binary Search",
    topic: "Binary Search",
    title: "Binary Search (Find Target in Sorted Array)",
    difficulty: "easy",
    companies: ["TCS", "Infosys", "Wipro", "Accenture"],
    practiceUrl: "https://leetcode.com/problems/binary-search/",
    articleUrl: "https://takeuforward.org/data-structure/binary-search-explained/",
    videoUrl: "https://www.youtube.com/watch?v=MHf6a41R6A4",
    verified: true,
    notes: "Divide and conquer search in O(log N) time.",
  },
  {
    id: "bs-2",
    dayNumber: 3,
    dayTitle: "Day 03: Binary Search",
    topic: "Binary Search",
    title: "Search in Rotated Sorted Array",
    difficulty: "medium",
    companies: ["Google", "Microsoft", "Amazon", "PayU"],
    practiceUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    articleUrl: "https://takeuforward.org/data-structure/search-element-in-a-rotated-sorted-array/",
    videoUrl: "https://www.youtube.com/watch?v=5qGrJbHhqFs",
    verified: true,
    notes: "Determine which half is sorted and narrow the search space.",
  },
  {
    id: "bs-3",
    dayNumber: 3,
    dayTitle: "Day 03: Binary Search",
    topic: "Binary Search",
    title: "Find First and Last Position of Element in Sorted Array",
    difficulty: "medium",
    companies: ["Microsoft", "Amazon", "Oracle"],
    practiceUrl:
      "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
    articleUrl: "https://takeuforward.org/data-structure/first-and-last-occurrences-in-array/",
    videoUrl: "https://www.youtube.com/watch?v=hjR1IYVx9lY",
    verified: true,
    notes: "Run two separate binary searches for lower and upper bound.",
  },
  {
    id: "bs-4",
    dayNumber: 3,
    dayTitle: "Day 03: Binary Search",
    topic: "Binary Search",
    title: "Find Minimum in Rotated Sorted Array",
    difficulty: "medium",
    companies: ["Amazon", "Microsoft", "Samsung"],
    practiceUrl: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    articleUrl: "https://takeuforward.org/data-structure/minimum-in-rotated-sorted-array/",
    videoUrl: "https://www.youtube.com/watch?v=nhEMDKMB44g",
    verified: true,
    notes: "Compare mid element with right boundary to locate inflection point.",
  },
  {
    id: "bs-5",
    dayNumber: 3,
    dayTitle: "Day 03: Binary Search",
    topic: "Binary Search",
    title: "Allocate Minimum Number of Pages (Book Allocation)",
    difficulty: "hard",
    companies: ["Google", "Amazon", "Flipkart", "Cisco"],
    practiceUrl: "https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1",
    articleUrl: "https://takeuforward.org/data-structure/allocate-minimum-number-of-pages/",
    videoUrl: "https://www.youtube.com/watch?v=Z0hwjftStI4",
    verified: true,
    notes: "Binary search on answer space: range [max(arr), sum(arr)].",
  },
  {
    id: "bs-6",
    dayNumber: 3,
    dayTitle: "Day 03: Binary Search",
    topic: "Binary Search",
    title: "Median of Two Sorted Arrays",
    difficulty: "hard",
    companies: ["Google", "Microsoft", "Amazon", "Apple"],
    practiceUrl: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    articleUrl:
      "https://takeuforward.org/data-structure/median-of-two-sorted-arrays-of-different-sizes/",
    videoUrl: "https://www.youtube.com/watch?v=C2rRzz-QkU4",
    verified: true,
    notes: "Binary search on partition point of smaller array in O(log(min(N, M))).",
  },

  // DAY 4: BINARY TREES
  {
    id: "bt-1",
    dayNumber: 4,
    dayTitle: "Day 04: Binary Trees",
    topic: "Binary Trees",
    title: "Maximum Depth of Binary Tree",
    difficulty: "easy",
    companies: ["Amazon", "Microsoft", "TCS", "Infosys"],
    practiceUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    articleUrl: "https://takeuforward.org/data-structure/maximum-depth-of-a-binary-tree/",
    videoUrl: "https://www.youtube.com/watch?v=eD3tm276A80",
    verified: true,
    notes: "Recursive DFS returning 1 + max(leftDepth, rightDepth).",
  },
  {
    id: "bt-2",
    dayNumber: 4,
    dayTitle: "Day 04: Binary Trees",
    topic: "Binary Trees",
    title: "Diameter of Binary Tree",
    difficulty: "easy",
    companies: ["Amazon", "Microsoft", "Oracle"],
    practiceUrl: "https://leetcode.com/problems/diameter-of-binary-tree/",
    articleUrl: "https://takeuforward.org/data-structure/calculate-the-diameter-of-a-binary-tree/",
    videoUrl: "https://www.youtube.com/watch?v=Rezetez59Nk",
    verified: true,
    notes: "Pass maximum height sum through any node while computing depths.",
  },
  {
    id: "bt-3",
    dayNumber: 4,
    dayTitle: "Day 04: Binary Trees",
    topic: "Binary Trees",
    title: "Binary Tree Level Order Traversal",
    difficulty: "medium",
    companies: ["Amazon", "Microsoft", "Google", "PayU"],
    practiceUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    articleUrl: "https://takeuforward.org/data-structure/level-order-traversal-of-a-binary-tree/",
    videoUrl: "https://www.youtube.com/watch?v=EoAsWbO7sqg",
    verified: true,
    notes: "Queue-based breadth-first search processing level by level.",
  },
  {
    id: "bt-4",
    dayNumber: 4,
    dayTitle: "Day 04: Binary Trees",
    topic: "Binary Trees",
    title: "Lowest Common Ancestor of a Binary Tree",
    difficulty: "medium",
    companies: ["Amazon", "Microsoft", "Google", "Adobe"],
    practiceUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
    articleUrl:
      "https://takeuforward.org/data-structure/lowest-common-ancestor-for-two-given-nodes/",
    videoUrl: "https://www.youtube.com/watch?v=_-QHfMDde90",
    verified: true,
    notes: "Post-order DFS returning non-null subtree when matching p or q.",
  },
  {
    id: "bt-5",
    dayNumber: 4,
    dayTitle: "Day 04: Binary Trees",
    topic: "Binary Trees",
    title: "Binary Tree Maximum Path Sum",
    difficulty: "hard",
    companies: ["Google", "Amazon", "Microsoft", "Uber"],
    practiceUrl: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
    articleUrl: "https://takeuforward.org/data-structure/maximum-sum-path-in-binary-tree/",
    videoUrl: "https://www.youtube.com/watch?v=WszrfSwMz58",
    verified: true,
    notes: "Compute maximum branch gain ignoring negative path sums.",
  },

  // DAY 5: 1D DYNAMIC PROGRAMMING
  {
    id: "dp-1",
    dayNumber: 5,
    dayTitle: "Day 05: 1D Dynamic Programming",
    topic: "1D DP",
    title: "Climbing Stairs",
    difficulty: "easy",
    companies: ["Amazon", "TCS", "Infosys", "Wipro"],
    practiceUrl: "https://leetcode.com/problems/climbing-stairs/",
    articleUrl: "https://takeuforward.org/data-structure/dynamic-programming-climbing-stairs/",
    videoUrl: "https://www.youtube.com/watch?v=mLfjzJsN8us",
    verified: true,
    notes: "Fibonacci recurrence relation dp[i] = dp[i-1] + dp[i-2].",
  },
  {
    id: "dp-2",
    dayNumber: 5,
    dayTitle: "Day 05: 1D Dynamic Programming",
    topic: "1D DP",
    title: "Frog Jump with K Steps",
    difficulty: "easy",
    companies: ["Google", "Amazon", "Flipkart"],
    practiceUrl: "https://www.geeksforgeeks.org/problems/geek-jump/1",
    articleUrl: "https://takeuforward.org/data-structure/dynamic-programming-frog-jump-dp-3/",
    videoUrl: "https://www.youtube.com/watch?v=EgG3jsGoPvQ",
    verified: true,
    notes: "Minimize step energy jump with memoized 1D array.",
  },
  {
    id: "dp-3",
    dayNumber: 5,
    dayTitle: "Day 05: 1D Dynamic Programming",
    topic: "1D DP",
    title: "House Robber (Max Non-Adjacent Sum)",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Microsoft", "PayU"],
    practiceUrl: "https://leetcode.com/problems/house-robber/",
    articleUrl:
      "https://takeuforward.org/data-structure/maximum-sum-of-non-adjacent-elements-dp-5/",
    videoUrl: "https://www.youtube.com/watch?v=GrMBfJNk_NY",
    verified: true,
    notes: "Choose max between robbing current house + prev2 vs skipping to prev1.",
  },
  {
    id: "dp-4",
    dayNumber: 5,
    dayTitle: "Day 05: 1D Dynamic Programming",
    topic: "1D DP",
    title: "Coin Change (Fewest Coins to Make Amount)",
    difficulty: "medium",
    companies: ["Amazon", "Microsoft", "PayU", "Adobe"],
    practiceUrl: "https://leetcode.com/problems/coin-change/",
    articleUrl: "https://takeuforward.org/data-structure/coin-change-2-dp-22/",
    videoUrl: "https://www.youtube.com/watch?v=HgyouEiC540",
    verified: true,
    notes: "Unbounded knapsack: dp[i] = min(dp[i], 1 + dp[i - coin]).",
  },
  {
    id: "dp-5",
    dayNumber: 5,
    dayTitle: "Day 05: 1D Dynamic Programming",
    topic: "1D DP",
    title: "Longest Increasing Subsequence (LIS)",
    difficulty: "medium",
    companies: ["Google", "Microsoft", "Amazon", "Goldman Sachs"],
    practiceUrl: "https://leetcode.com/problems/longest-increasing-subsequence/",
    articleUrl: "https://takeuforward.org/data-structure/longest-increasing-subsequence-dp-41/",
    videoUrl: "https://www.youtube.com/watch?v=ekcwMsSIzVc",
    verified: true,
    notes: "O(N^2) dynamic programming or O(N log N) binary search with patience sort.",
  },
  {
    id: "dp-6",
    dayNumber: 5,
    dayTitle: "Day 05: 1D Dynamic Programming",
    topic: "1D DP",
    title: "Word Break",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Uber"],
    practiceUrl: "https://leetcode.com/problems/word-break/",
    articleUrl: "https://www.geeksforgeeks.org/word-break-problem-dp-32/",
    videoUrl: "https://www.youtube.com/watch?v=Sx9NNgInc3A",
    verified: true,
    notes: "Boolean dp[i] representing whether prefix s[0..i] can be segmented.",
  },
];

const STORAGE_SOLVED_KEY = "placement_portal_dsa_solved";
const STORAGE_BOOKMARKS_KEY = "placement_portal_dsa_bookmarked";

// Branded company badge helpers
const COMPANY_STYLES: Record<string, { bg: string; text: string; initial: string }> = {
  Google: {
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    initial: "G",
  },
  Amazon: {
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-800 dark:text-amber-300",
    initial: "A",
  },
  Microsoft: {
    bg: "bg-sky-500/10 border-sky-500/30",
    text: "text-sky-700 dark:text-sky-300",
    initial: "MS",
  },
  TCS: {
    bg: "bg-indigo-500/10 border-indigo-500/30",
    text: "text-indigo-800 dark:text-indigo-300",
    initial: "TCS",
  },
  PayU: {
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-800 dark:text-emerald-300",
    initial: "PayU",
  },
  Infosys: {
    bg: "bg-blue-600/10 border-blue-600/30",
    text: "text-blue-800 dark:text-blue-300",
    initial: "INF",
  },
  Wipro: {
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-800 dark:text-purple-300",
    initial: "WIP",
  },
  Flipkart: {
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-800 dark:text-amber-300",
    initial: "FK",
  },
  Adobe: {
    bg: "bg-rose-500/10 border-rose-500/30",
    text: "text-rose-800 dark:text-rose-300",
    initial: "AD",
  },
  Uber: {
    bg: "bg-slate-500/10 border-slate-500/30",
    text: "text-slate-800 dark:text-slate-200",
    initial: "UB",
  },
  "Goldman Sachs": {
    bg: "bg-sky-600/10 border-sky-600/30",
    text: "text-sky-800 dark:text-sky-300",
    initial: "GS",
  },
  Oracle: {
    bg: "bg-red-500/10 border-red-500/30",
    text: "text-red-800 dark:text-red-300",
    initial: "ORC",
  },
  Samsung: {
    bg: "bg-blue-700/10 border-blue-700/30",
    text: "text-blue-800 dark:text-blue-300",
    initial: "SAM",
  },
  Cisco: {
    bg: "bg-cyan-500/10 border-cyan-500/30",
    text: "text-cyan-800 dark:text-cyan-300",
    initial: "CSC",
  },
  Apple: {
    bg: "bg-slate-700/10 border-slate-700/30",
    text: "text-slate-900 dark:text-slate-100",
    initial: "APL",
  },
  Cognizant: {
    bg: "bg-teal-500/10 border-teal-500/30",
    text: "text-teal-800 dark:text-teal-300",
    initial: "CTS",
  },
  Accenture: {
    bg: "bg-purple-600/10 border-purple-600/30",
    text: "text-purple-800 dark:text-purple-300",
    initial: "ACN",
  },
  LinkedIn: {
    bg: "bg-blue-600/10 border-blue-600/30",
    text: "text-blue-800 dark:text-blue-300",
    initial: "IN",
  },
  Walmart: {
    bg: "bg-amber-600/10 border-amber-600/30",
    text: "text-amber-800 dark:text-amber-300",
    initial: "WMT",
  },
};

function CompanyBadge({ name }: { name: string }) {
  const style = COMPANY_STYLES[name] ?? {
    bg: "bg-slate-100 border-border dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    initial: name.slice(0, 2).toUpperCase(),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold transition-colors",
        style.bg,
        style.text,
      )}
      title={`Asked at ${name}`}
    >
      <span className="flex size-3.5 items-center justify-center rounded-[3px] bg-black/10 dark:bg-white/20 text-[9px] font-bold font-mono">
        {style.initial.slice(0, 2)}
      </span>
      <span>{name}</span>
    </span>
  );
}

const sel =
  "h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-medium";

function DsaSheetPage() {
  const q = useQuery(questionsQuery);
  const { data: me } = useMe();
  const progressQuery = useQuery(studentProgressQuery(me?.id));

  // Persistence for Solved & Bookmarks (with Supabase sync & localStorage backup)
  const [solved, setSolved] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SOLVED_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const [bookmarked, setBookmarked] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Sync Supabase progress into state when available
  useEffect(() => {
    if (progressQuery.data && progressQuery.data.length > 0) {
      setSolved((prev) => {
        const next = new Set(prev);
        progressQuery.data.forEach((p) => {
          if (p.is_solved) next.add(p.question_id);
        });
        return next;
      });
      setBookmarked((prev) => {
        const next = new Set(prev);
        progressQuery.data.forEach((p) => {
          if (p.is_bookmarked) next.add(p.question_id);
        });
        return next;
      });
    }
  }, [progressQuery.data]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SOLVED_KEY, JSON.stringify(Array.from(solved)));
    } catch (e) {
      console.error("Failed to save solved status to localStorage", e);
    }
  }, [solved]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(Array.from(bookmarked)));
    } catch (e) {
      console.error("Failed to save bookmarks to localStorage", e);
    }
  }, [bookmarked]);

  const toggleSolved = async (id: string, title: string) => {
    const isNowSolved = !solved.has(id);
    setSolved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast(`Unmarked "${title}" as solved.`);
      } else {
        next.add(id);
        toast.success(`Marked "${title}" as solved! Great job.`);
      }
      return next;
    });

    if (me?.id) {
      try {
        const rawId = id.startsWith("db-") ? id.replace("db-", "") : id;
        await supabase.from("student_question_progress").upsert(
          {
            user_id: me.id,
            question_id: rawId,
            is_solved: isNowSolved,
            solved_at: isNowSolved ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,question_id" },
        );
      } catch (e) {
        console.warn("Supabase progress sync notice:", e);
      }
    }
  };

  const toggleBookmark = async (id: string, title: string) => {
    const isNowBookmarked = !bookmarked.has(id);
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast(`Removed "${title}" from bookmarks.`);
      } else {
        next.add(id);
        toast.success(`Bookmarked "${title}"!`);
      }
      return next;
    });

    if (me?.id) {
      try {
        const rawId = id.startsWith("db-") ? id.replace("db-", "") : id;
        await supabase.from("student_question_progress").upsert(
          {
            user_id: me.id,
            question_id: rawId,
            is_bookmarked: isNowBookmarked,
            bookmarked_at: isNowBookmarked ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,question_id" },
        );
      } catch (e) {
        console.warn("Supabase bookmark sync notice:", e);
      }
    }
  };

  // Shared DSA sheet questions from Supabase (with fallback if remote DB not seeded yet)
  const activeDsaSheet: DsaQuestion[] = useMemo(() => {
    const dbRows = q.data ?? [];
    const dbDsaRows = dbRows.filter(
      (x) => x.is_published !== false && (x.question_type === "dsa_sheet" || x.day_number != null),
    );

    if (dbDsaRows.length > 0) {
      return dbDsaRows
        .sort((a, b) => {
          const dA = a.day_number ?? 1;
          const dB = b.day_number ?? 1;
          if (dA !== dB) return dA - dB;
          return (a.order_index ?? 1) - (b.order_index ?? 1);
        })
        .map((x) => {
          const comps = x.company_names
            ? x.company_names
                .split(",")
                .map((c: string) => c.trim())
                .filter(Boolean)
            : x.companies?.name
              ? [x.companies.name]
              : [];
          return {
            id: x.id,
            dayNumber: x.day_number ?? 1,
            dayTitle: x.day_title || `Day 0${x.day_number ?? 1}`,
            topic: (x.topic as DsaQuestion["topic"]) || "Arrays",
            title: x.question,
            difficulty: (x.difficulty as DsaQuestion["difficulty"]) || "medium",
            companies: comps,
            practiceUrl: x.practice_url || "",
            articleUrl: x.article_url || undefined,
            videoUrl: x.video_url || undefined,
            verified: x.is_verified ?? true,
            notes: x.notes || undefined,
          };
        });
    }

    // Graceful fallback to static CURATED_DSA_SHEET if database is not yet seeded
    return CURATED_DSA_SHEET;
  }, [q.data]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // All companies list for filter
  const allCompaniesList = useMemo(() => {
    const set = new Set<string>();
    activeDsaSheet.forEach((item) => {
      item.companies.forEach((c) => set.add(c));
    });
    (q.data ?? []).forEach((item) => {
      if (item.companies?.name) set.add(item.companies.name);
      if (item.company_names) {
        item.company_names.split(",").forEach((c: string) => {
          const trimmed = c.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [activeDsaSheet, q.data]);

  // Filter curated questions
  const filteredCurated = useMemo(() => {
    return activeDsaSheet.filter((item) => {
      if (
        searchTerm &&
        !`${item.title} ${item.topic} ${item.notes ?? ""} ${item.companies.join(" ")}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (selectedTopic !== "All" && selectedTopic !== "Database" && item.topic !== selectedTopic) {
        return false;
      }
      if (selectedDifficulty && item.difficulty !== selectedDifficulty) {
        return false;
      }
      if (selectedCompany && !item.companies.includes(selectedCompany)) {
        return false;
      }
      if (selectedStatus === "solved" && !solved.has(item.id)) {
        return false;
      }
      if (selectedStatus === "unsolved" && solved.has(item.id)) {
        return false;
      }
      if (selectedStatus === "bookmarked" && !bookmarked.has(item.id)) {
        return false;
      }
      return true;
    });
  }, [
    activeDsaSheet,
    searchTerm,
    selectedTopic,
    selectedDifficulty,
    selectedCompany,
    selectedStatus,
    solved,
    bookmarked,
  ]);

  // Database questions from campus drives (honoring publication flag)
  const filteredDbQuestions = useMemo(() => {
    if (selectedTopic !== "All" && selectedTopic !== "Database") return [];
    return (q.data ?? []).filter((x) => {
      if (x.is_published === false) return false;
      if (x.question_type !== "interview_question" && (x.day_number != null || !x.company_id)) {
        return false;
      }
      if (
        searchTerm &&
        !`${x.question} ${x.topic ?? ""} ${x.experience ?? ""} ${x.companies?.name ?? ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (selectedDifficulty && x.difficulty !== selectedDifficulty) {
        return false;
      }
      if (selectedCompany && x.companies?.name !== selectedCompany) {
        return false;
      }
      if (selectedStatus === "solved" && !solved.has(`db-${x.id}`)) {
        return false;
      }
      if (selectedStatus === "unsolved" && solved.has(`db-${x.id}`)) {
        return false;
      }
      if (selectedStatus === "bookmarked" && !bookmarked.has(`db-${x.id}`)) {
        return false;
      }
      return true;
    });
  }, [
    q.data,
    searchTerm,
    selectedDifficulty,
    selectedCompany,
    selectedStatus,
    selectedTopic,
    solved,
    bookmarked,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedTopic("All");
    setSelectedDifficulty("");
    setSelectedCompany("");
    setSelectedStatus("");
  };

  const hasFilter = Boolean(
    searchTerm ||
    selectedTopic !== "All" ||
    selectedDifficulty ||
    selectedCompany ||
    selectedStatus,
  );

  // Group curated by Day
  const days = [
    {
      day: 1,
      title: "Day 01: Arrays & Two Pointers",
      topic: "Arrays",
      desc: "Kadane's algorithm, two-pointer techniques, frequency counting, and interval merging.",
    },
    {
      day: 2,
      title: "Day 02: Strings & Hashing",
      topic: "Strings",
      desc: "Anagram grouping, sliding window substring search, and palindrome center expansion.",
    },
    {
      day: 3,
      title: "Day 03: Binary Search",
      topic: "Binary Search",
      desc: "Rotated sorted array search, lower/upper bounds, and answer space binary search.",
    },
    {
      day: 4,
      title: "Day 04: Binary Trees",
      topic: "Binary Trees",
      desc: "Level order traversals, maximum depth, diameter, and Lowest Common Ancestor (LCA).",
    },
    {
      day: 5,
      title: "Day 05: 1D Dynamic Programming",
      topic: "1D DP",
      desc: "Optimal substructure, memoization, space optimization, house robber, and coin change.",
    },
  ];

  // Stats calculation
  const totalCuratedCount = activeDsaSheet.length;
  const solvedCuratedCount = activeDsaSheet.filter((item) => solved.has(item.id)).length;
  const bookmarkedCuratedCount = activeDsaSheet.filter((item) => bookmarked.has(item.id)).length;

  const easyTotal = activeDsaSheet.filter((i) => i.difficulty === "easy").length;
  const easySolved = activeDsaSheet.filter(
    (i) => i.difficulty === "easy" && solved.has(i.id),
  ).length;

  const medTotal = activeDsaSheet.filter((i) => i.difficulty === "medium").length;
  const medSolved = activeDsaSheet.filter(
    (i) => i.difficulty === "medium" && solved.has(i.id),
  ).length;

  const hardTotal = activeDsaSheet.filter((i) => i.difficulty === "hard").length;
  const hardSolved = activeDsaSheet.filter(
    (i) => i.difficulty === "hard" && solved.has(i.id),
  ).length;

  const percentage =
    totalCuratedCount > 0 ? Math.round((solvedCuratedCount / totalCuratedCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-[4px] border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span>Campus Drive Season 2025–26 · Curated Preparation Sheet</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              DSA Sheet & Practice Hub
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Comprehensive day-wise coding questions covering Arrays, Strings, Binary Search,
              Binary Trees, and 1D Dynamic Programming. Review verified company patterns, practice
              on LeetCode/GFG, and track your solutions.
            </p>
          </div>

          {/* Quick Solved Ratio Card */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 shadow-2xs lg:w-80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Your Progress
              </span>
              <span className="font-mono text-xs font-bold text-primary">{percentage}% Done</span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-[2px] bg-muted">
              <div
                className="h-full rounded-[2px] bg-primary transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground font-mono">{solvedCuratedCount}</strong> of{" "}
                <span className="font-mono">{totalCuratedCount}</span> Solved
              </span>
              <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                <Bookmark className="size-3 fill-amber-500 text-amber-500" />
                <span className="font-mono">{bookmarkedCuratedCount}</span> Saved
              </span>
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/70 pt-6 sm:grid-cols-4">
          <div className="rounded-lg border border-border/60 bg-background/60 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Questions
            </span>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              {totalCuratedCount + (q.data?.length ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Easy Solved
            </span>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-2xl">
              {easySolved}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ {easyTotal}</span>
            </p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Medium Solved
            </span>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-amber-700 dark:text-amber-400 sm:text-2xl">
              {medSolved}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ {medTotal}</span>
            </p>
          </div>
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Hard Solved
            </span>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-rose-700 dark:text-rose-400 sm:text-2xl">
              {hardSolved}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ {hardTotal}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Topic Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-1.5 shadow-2xs">
        {[
          { id: "All", label: "All Days & Topics" },
          { id: "Arrays", label: "Day 1: Arrays" },
          { id: "Strings", label: "Day 2: Strings" },
          { id: "Binary Search", label: "Day 3: Binary Search" },
          { id: "Binary Trees", label: "Day 4: Binary Trees" },
          { id: "1D DP", label: "Day 5: 1D DP" },
          { id: "Database", label: "Campus Debriefs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTopic(tab.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              selectedTopic === tab.id
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9 text-xs"
              placeholder="Search problem title, algorithm, or company name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search DSA questions"
            />
          </div>

          <select
            className={sel}
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            aria-label="Filter by difficulty"
          >
            <option value="">Any Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className={sel}
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            aria-label="Filter by company"
          >
            <option value="">All Companies</option>
            {allCompaniesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className={sel}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by solved or bookmarked status"
          >
            <option value="">All Statuses</option>
            <option value="solved">Solved Only</option>
            <option value="unsolved">Unsolved Only</option>
            <option value="bookmarked">Bookmarked Only ⭐</option>
          </select>

          {hasFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3 mr-1.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Questions Content */}
      {filteredCurated.length === 0 && filteredDbQuestions.length === 0 ? (
        <EmptyState
          title="No questions match your current filters"
          body="Try resetting the topic or difficulty filters to see more DSA questions."
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset all filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Day-Wise Curated Sections */}
          {days.map((day) => {
            const dayItems = filteredCurated.filter(
              (item) => item.dayNumber === day.day || item.topic === day.topic,
            );
            if (!dayItems.length) return null;

            const daySolvedCount = dayItems.filter((i) => solved.has(i.id)).length;

            return (
              <section
                key={day.day}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
              >
                {/* Day Header */}
                <div className="flex flex-col justify-between gap-2 border-b border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:px-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-primary tracking-wider uppercase rounded-[4px] border border-primary/20 bg-primary/10 px-2 py-0.5">
                        DAY 0{day.day}
                      </span>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">
                        {day.title}
                      </h2>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{day.desc}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-[4px] border border-border bg-background px-2.5 py-0.5 font-mono text-[11px] font-semibold text-foreground shadow-2xs">
                      {daySolvedCount} / {dayItems.length} Solved
                    </span>
                  </div>
                </div>

                {/* Question List Items */}
                <div className="divide-y divide-border/60">
                  {dayItems.map((item) => {
                    const isSolved = solved.has(item.id);
                    const isBookmarked = bookmarked.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group p-4 transition-colors sm:p-5 hover:bg-muted/30",
                          isSolved && "bg-muted/20",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: Completion Checkbox & Question Info */}
                          <div className="flex items-start gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleSolved(item.id, item.title)}
                              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 border-input text-white hover:border-primary"
                              style={{
                                backgroundColor: isSolved ? "var(--primary)" : "transparent",
                                borderColor: isSolved ? "var(--primary)" : undefined,
                              }}
                              aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                            >
                              {isSolved && <Check className="size-3.5 stroke-[3]" />}
                            </button>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <a
                                  href={item.practiceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    "font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm sm:text-base",
                                    isSolved && "line-through text-muted-foreground",
                                  )}
                                >
                                  <span>{item.title}</span>
                                  <ArrowUpRight className="size-3.5 text-muted-foreground opacity-60 group-hover:opacity-100" />
                                </a>

                                <DifficultyTag level={item.difficulty} />

                                {item.verified ? (
                                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                                    <span className="size-1 rounded-full bg-emerald-500" /> Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                                    <span className="size-1 rounded-full bg-amber-500" /> Unverified
                                  </span>
                                )}
                              </div>

                              {item.notes && (
                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                  {item.notes}
                                </p>
                              )}

                              {/* Company Associations */}
                              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                                  Companies:
                                </span>
                                {item.companies.map((c) => (
                                  <CompanyBadge key={c} name={c} />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right: Action Links & Bookmark */}
                          <div className="flex shrink-0 items-center gap-2">
                            {/* Bookmark Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBookmark(item.id, item.title)}
                              className="size-8 p-0 text-muted-foreground hover:text-amber-500"
                              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
                            >
                              <Bookmark
                                className={cn(
                                  "size-4 transition-all",
                                  isBookmarked
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-muted-foreground",
                                )}
                              />
                            </Button>

                            {/* Resource Links: Video and Practice */}
                            {item.videoUrl && (
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 px-3 text-xs text-slate-700 dark:text-slate-300"
                              >
                                <a
                                  href={item.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Watch video walkthrough"
                                >
                                  <Video className="size-3.5 text-rose-500" />
                                  <span className="hidden sm:inline">Video</span>
                                </a>
                              </Button>
                            )}

                            <Button
                              asChild
                              size="sm"
                              className="h-8 gap-1.5 px-3 text-xs font-semibold"
                            >
                              <a
                                href={item.practiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Practice on LeetCode/GFG"
                              >
                                <ExternalLink className="size-3.5" />
                                <span>Practice</span>
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Campus Drives Archive (from Supabase Database) */}
          {(selectedTopic === "All" || selectedTopic === "Database") &&
            filteredDbQuestions.length > 0 && (
              <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="border-b border-border bg-muted/40 p-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-primary tracking-wider uppercase rounded-[4px] border border-primary/20 bg-primary/10 px-2 py-0.5">
                      CAMPUS ARCHIVE
                    </span>
                    <h2 className="text-base font-semibold text-foreground tracking-tight">
                      Direct Campus Placement Drive Debriefs
                    </h2>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Questions verified directly from student interviews and college placement
                    debriefs.
                  </p>
                </div>

                <div className="divide-y divide-border/60">
                  {filteredDbQuestions.map((x) => {
                    const dbId = `db-${x.id}`;
                    const isSolved = solved.has(dbId);
                    const isBookmarked = bookmarked.has(dbId);

                    return (
                      <div
                        key={x.id}
                        className={cn(
                          "group p-4 transition-colors sm:p-5 hover:bg-muted/30",
                          isSolved && "bg-muted/20",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleSolved(dbId, x.question)}
                              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 border-input text-white hover:border-primary"
                              style={{
                                backgroundColor: isSolved ? "var(--primary)" : "transparent",
                                borderColor: isSolved ? "var(--primary)" : undefined,
                              }}
                              aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                            >
                              {isSolved && <Check className="size-3.5 stroke-[3]" />}
                            </button>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {x.companies && (
                                  <Link
                                    to="/companies/$id"
                                    params={{ id: x.companies.id }}
                                    className="font-bold text-foreground hover:text-primary hover:underline flex items-center gap-1.5"
                                  >
                                    <CompanyBadge name={x.companies.name} />
                                  </Link>
                                )}
                                <span>·</span>
                                <span className="font-semibold text-foreground">
                                  {x.interview_rounds?.name ?? "Technical Assessment"}
                                </span>
                                <span>·</span>
                                <span className="rounded-[4px] border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-foreground">
                                  {x.topic || "Problem Solving"}
                                </span>
                                <DifficultyTag level={x.difficulty} />
                                {x.asked_on && <span>· Asked {fmtDate(x.asked_on)}</span>}
                              </div>

                              <p
                                className={cn(
                                  "mt-2.5 text-base font-semibold leading-relaxed text-foreground",
                                  isSolved && "line-through text-muted-foreground",
                                )}
                              >
                                {x.question}
                              </p>

                              {x.experience && (
                                <div className="mt-2.5 rounded-md border border-border/70 border-l-2 border-l-primary bg-muted/20 p-3 text-xs leading-relaxed text-foreground">
                                  <span className="font-bold text-foreground">
                                    Candidate Debrief:
                                  </span>{" "}
                                  {x.experience}
                                </div>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  Source: {x.sources?.title ?? "Campus candidate debrief"}
                                </span>
                                {x.sources ? (
                                  <VerifyTag status={x.sources.status} />
                                ) : (
                                  <VerifyTag status="unverified" />
                                )}
                                <span className="text-[11px] italic text-muted-foreground">
                                  · Campus debrief record (no external practice link)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBookmark(dbId, x.question)}
                              className="size-8 p-0 text-muted-foreground hover:text-amber-500"
                              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
                            >
                              <Bookmark
                                className={cn(
                                  "size-4 transition-all",
                                  isBookmarked
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-muted-foreground",
                                )}
                              />
                            </Button>
                            {x.companies && (
                              <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                                <Link to="/companies/$id" params={{ id: x.companies.id }}>
                                  Recruiter Info <ArrowUpRight className="size-3 ml-1" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

          <div className="p-3 text-center text-xs font-medium text-muted-foreground">
            Displaying {filteredCurated.length + filteredDbQuestions.length} curated & reported
            questions in the DSA Sheet.
          </div>
        </div>
      )}
    </div>
  );
}
