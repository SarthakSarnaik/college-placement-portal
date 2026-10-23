-- ============================================================================
-- MIGRATION: SHARED DSA SHEET & DATA SYNCHRONIZATION
-- Project: PlacementPrep / Grad-to-Great-Jobs
-- Description:
-- 1. Updates public.questions table to support Day-Wise DSA practice sheets:
--    - Makes company_id nullable so general DSA questions don't require a single company.
--    - Adds day_number, day_title, order_index, question_type, is_published, is_verified,
--      practice_url, article_url, video_url, notes, company_names.
-- 2. Creates public.question_companies junction table for many-to-many company mapping.
-- 3. Creates public.student_question_progress for user-specific RLS-protected progress/bookmarks.
-- 4. Updates RLS policies so students read published DSA questions & admin manages them.
-- 5. Seeds the 28 curated day-wise questions into public.questions without duplicates.
-- ============================================================================

-- 1. ALTER public.questions: Make company_id nullable & add DSA Sheet fields
ALTER TABLE public.questions ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS day_number integer;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS day_title text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 1;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'dsa_sheet';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT true;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS practice_url text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS article_url text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS company_names text;

-- Mark existing 5 campus interview questions appropriately
UPDATE public.questions
SET question_type = 'interview_question',
    is_published = true,
    is_verified = true
WHERE day_number IS NULL AND (question_type IS NULL OR question_type = 'dsa_sheet');

-- 2. CREATE public.question_companies (Many-to-many company mapping)
CREATE TABLE IF NOT EXISTS public.question_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(question_id, company_name)
);

-- 3. CREATE public.student_question_progress (User-specific progress & bookmarks)
CREATE TABLE IF NOT EXISTS public.student_question_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  is_solved boolean NOT NULL DEFAULT false,
  is_bookmarked boolean NOT NULL DEFAULT false,
  solved_at timestamptz,
  bookmarked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- 4. CONFIGURE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_question_progress ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_companies TO authenticated;
GRANT ALL ON public.question_companies TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_question_progress TO authenticated;
GRANT ALL ON public.student_question_progress TO service_role;

-- Questions RLS
DROP POLICY IF EXISTS "admin write questions" ON public.questions;
CREATE POLICY "admin write questions" ON public.questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "read" ON public.questions;
CREATE POLICY "read" ON public.questions
  FOR SELECT TO authenticated
  USING (
    is_published AND (
      question_type = 'dsa_sheet'
      OR day_number IS NOT NULL
      OR company_id IS NULL
      OR public.company_visible(company_id)
    )
  );

-- Question Companies RLS
DROP POLICY IF EXISTS "admin write question_companies" ON public.question_companies;
CREATE POLICY "admin write question_companies" ON public.question_companies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "read question_companies" ON public.question_companies;
CREATE POLICY "read question_companies" ON public.question_companies
  FOR SELECT TO authenticated
  USING (true);

-- Student Question Progress RLS (Strict user isolation)
DROP POLICY IF EXISTS "own progress read" ON public.student_question_progress;
CREATE POLICY "own progress read" ON public.student_question_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own progress write" ON public.student_question_progress;
CREATE POLICY "own progress write" ON public.student_question_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. SEED CURATED DAY-WISE DSA QUESTIONS (Avoiding duplicates)
INSERT INTO public.questions (
  question, topic, difficulty, day_number, day_title, order_index, question_type,
  is_published, is_verified, practice_url, article_url, video_url, notes, company_names
)
SELECT q, top, diff::public.difficulty, d_num, d_title, o_idx, 'dsa_sheet',
       true, true, prac_url, art_url, vid_url, nts, comp_names
FROM (VALUES
  -- Day 1: Arrays
  ('Two Sum', 'Arrays', 'easy', 1, 'Day 01: Arrays & Two Pointers', 1,
   'https://leetcode.com/problems/two-sum/',
   'https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/',
   'https://www.youtube.com/watch?v=UXDSeD9mN-k',
   'Hash map lookup in O(N) time and O(N) space.',
   'Google, Amazon, Microsoft, TCS'),
  ('Best Time to Buy and Sell Stock', 'Arrays', 'easy', 1, 'Day 01: Arrays & Two Pointers', 2,
   'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
   'https://takeuforward.org/data-structure/stock-buy-and-sell/',
   'https://www.youtube.com/watch?v=excAOvwF_Wk',
   'Track minimum buy price and maximum profit in a single pass.',
   'Amazon, Microsoft, Infosys, Wipro'),
  ('Maximum Subarray (Kadane''s Algorithm)', 'Arrays', 'medium', 1, 'Day 01: Arrays & Two Pointers', 3,
   'https://leetcode.com/problems/maximum-subarray/',
   'https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/',
   'https://www.youtube.com/watch?v=AHZpyENo7k4',
   'Classic DP / Kadane''s single-pass running sum.',
   'Google, Amazon, Microsoft, Flipkart'),
  ('Next Permutation', 'Arrays', 'medium', 1, 'Day 01: Arrays & Two Pointers', 4,
   'https://leetcode.com/problems/next-permutation/',
   'https://takeuforward.org/data-structure/next_permutation-find-next-lexicographically-greater-permutation/',
   'https://www.youtube.com/watch?v=JDOXKqF60RQ',
   'Find break point from right, swap with next greater, reverse suffix.',
   'Google, Amazon, PayU'),
  ('Merge Overlapping Intervals', 'Arrays', 'medium', 1, 'Day 01: Arrays & Two Pointers', 5,
   'https://leetcode.com/problems/merge-intervals/',
   'https://takeuforward.org/data-structure/merge-overlapping-sub-intervals/',
   'https://www.youtube.com/watch?v=2JzRBPFYbKE',
   'Sort by start time and merge contiguous overlapping intervals.',
   'Google, Microsoft, Amazon, Adobe'),
  ('Trapping Rain Water', 'Arrays', 'hard', 1, 'Day 01: Arrays & Two Pointers', 6,
   'https://leetcode.com/problems/trapping-rain-water/',
   'https://takeuforward.org/data-structure/trapping-rainwater/',
   'https://www.youtube.com/watch?v=m18Hntz4go8',
   'Two-pointer approach tracking leftMax and rightMax.',
   'Google, Amazon, Microsoft, Goldman Sachs'),

  -- Day 2: Strings
  ('Valid Anagram', 'Strings', 'easy', 2, 'Day 02: Strings & Hashing', 1,
   'https://leetcode.com/problems/valid-anagram/',
   'https://takeuforward.org/data-structure/check-if-two-strings-are-anagrams-of-each-other/',
   'https://www.youtube.com/watch?v=9UtInBqnCgA',
   'Character frequency counter array of size 26.',
   'Amazon, TCS, Infosys, Cognizant'),
  ('Longest Substring Without Repeating Characters', 'Strings', 'medium', 2, 'Day 02: Strings & Hashing', 2,
   'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
   'https://takeuforward.org/data-structure/length-of-longest-substring-without-any-repeating-character/',
   'https://www.youtube.com/watch?v=qtVh-XEpsEc',
   'Sliding window with hash set / map of last seen indices.',
   'Amazon, Microsoft, Google, PayU'),
  ('Longest Palindromic Substring', 'Strings', 'medium', 2, 'Day 02: Strings & Hashing', 3,
   'https://leetcode.com/problems/longest-palindromic-substring/',
   'https://www.geeksforgeeks.org/longest-palindromic-substring/',
   'https://www.youtube.com/watch?v=XYQecbcd6fY',
   'Expand around center for both odd and even length centers.',
   'Microsoft, Amazon, Adobe, Flipkart'),
  ('Group Anagrams', 'Strings', 'medium', 2, 'Day 02: Strings & Hashing', 4,
   'https://leetcode.com/problems/group-anagrams/',
   'https://www.geeksforgeeks.org/given-a-sequence-of-words-print-all-anagrams-together/',
   'https://www.youtube.com/watch?v=vzdNOK2oB2E',
   'Sort each string or build frequency tuple as hash key.',
   'Amazon, Google, Uber, Walmart'),
  ('Minimum Window Substring', 'Strings', 'hard', 2, 'Day 02: Strings & Hashing', 5,
   'https://leetcode.com/problems/minimum-window-substring/',
   'https://www.geeksforgeeks.org/find-the-smallest-window-in-a-string-containing-all-characters-of-another-string/',
   'https://www.youtube.com/watch?v=jSto0O4AJbM',
   'Two-pointer variable sliding window with character frequency count.',
   'Google, Amazon, Microsoft, LinkedIn'),

  -- Day 3: Binary Search
  ('Binary Search (Find Target in Sorted Array)', 'Binary Search', 'easy', 3, 'Day 03: Binary Search', 1,
   'https://leetcode.com/problems/binary-search/',
   'https://takeuforward.org/data-structure/binary-search-explained/',
   'https://www.youtube.com/watch?v=MHf6a41R6A4',
   'Divide and conquer search in O(log N) time.',
   'TCS, Infosys, Wipro, Accenture'),
  ('Search in Rotated Sorted Array', 'Binary Search', 'medium', 3, 'Day 03: Binary Search', 2,
   'https://leetcode.com/problems/search-in-rotated-sorted-array/',
   'https://takeuforward.org/data-structure/search-element-in-a-rotated-sorted-array/',
   'https://www.youtube.com/watch?v=5qGrJbHhqFs',
   'Determine which half is sorted and narrow the search space.',
   'Google, Microsoft, Amazon, PayU'),
  ('Find First and Last Position of Element in Sorted Array', 'Binary Search', 'medium', 3, 'Day 03: Binary Search', 3,
   'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/',
   'https://takeuforward.org/data-structure/first-and-last-occurrences-in-array/',
   'https://www.youtube.com/watch?v=hjR1IYVx9lY',
   'Run two separate binary searches for lower and upper bound.',
   'Microsoft, Amazon, Oracle'),
  ('Find Minimum in Rotated Sorted Array', 'Binary Search', 'medium', 3, 'Day 03: Binary Search', 4,
   'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
   'https://takeuforward.org/data-structure/minimum-in-rotated-sorted-array/',
   'https://www.youtube.com/watch?v=nhEMDKMB44g',
   'Compare mid element with right boundary to locate inflection point.',
   'Amazon, Microsoft, Samsung'),
  ('Allocate Minimum Number of Pages (Book Allocation)', 'Binary Search', 'hard', 3, 'Day 03: Binary Search', 5,
   'https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1',
   'https://takeuforward.org/data-structure/allocate-minimum-number-of-pages/',
   'https://www.youtube.com/watch?v=Z0hwjftStI4',
   'Binary search on answer space: range [max(arr), sum(arr)].',
   'Google, Amazon, Flipkart, Cisco'),
  ('Median of Two Sorted Arrays', 'Binary Search', 'hard', 3, 'Day 03: Binary Search', 6,
   'https://leetcode.com/problems/median-of-two-sorted-arrays/',
   'https://takeuforward.org/data-structure/median-of-two-sorted-arrays-of-different-sizes/',
   'https://www.youtube.com/watch?v=C2rRzz-QkU4',
   'Binary search on partition point of smaller array in O(log(min(N, M))).',
   'Google, Microsoft, Amazon, Apple'),

  -- Day 4: Binary Trees
  ('Maximum Depth of Binary Tree', 'Binary Trees', 'easy', 4, 'Day 04: Binary Trees', 1,
   'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
   'https://takeuforward.org/data-structure/maximum-depth-of-a-binary-tree/',
   'https://www.youtube.com/watch?v=eD3tm276A80',
   'Recursive DFS returning 1 + max(leftDepth, rightDepth).',
   'Amazon, Microsoft, TCS, Infosys'),
  ('Diameter of Binary Tree', 'Binary Trees', 'easy', 4, 'Day 04: Binary Trees', 2,
   'https://leetcode.com/problems/diameter-of-binary-tree/',
   'https://takeuforward.org/data-structure/calculate-the-diameter-of-a-binary-tree/',
   'https://www.youtube.com/watch?v=Rezetez59Nk',
   'Pass maximum height sum through any node while computing depths.',
   'Amazon, Microsoft, Oracle'),
  ('Binary Tree Level Order Traversal', 'Binary Trees', 'medium', 4, 'Day 04: Binary Trees', 3,
   'https://leetcode.com/problems/binary-tree-level-order-traversal/',
   'https://takeuforward.org/data-structure/level-order-traversal-of-a-binary-tree/',
   'https://www.youtube.com/watch?v=EoAsWbO7sqg',
   'Queue-based breadth-first search processing level by level.',
   'Amazon, Microsoft, Google, PayU'),
  ('Lowest Common Ancestor of a Binary Tree', 'Binary Trees', 'medium', 4, 'Day 04: Binary Trees', 4,
   'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/',
   'https://takeuforward.org/data-structure/lowest-common-ancestor-for-two-given-nodes/',
   'https://www.youtube.com/watch?v=_-QHfMDde90',
   'Post-order DFS returning non-null subtree when matching p or q.',
   'Amazon, Microsoft, Google, Adobe'),
  ('Binary Tree Maximum Path Sum', 'Binary Trees', 'hard', 4, 'Day 04: Binary Trees', 5,
   'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
   'https://takeuforward.org/data-structure/maximum-sum-path-in-binary-tree/',
   'https://www.youtube.com/watch?v=WszrfSwMz58',
   'Compute maximum branch gain ignoring negative path sums.',
   'Google, Amazon, Microsoft, Uber'),

  -- Day 5: 1D Dynamic Programming
  ('Climbing Stairs', '1D DP', 'easy', 5, 'Day 05: 1D Dynamic Programming', 1,
   'https://leetcode.com/problems/climbing-stairs/',
   'https://takeuforward.org/data-structure/dynamic-programming-climbing-stairs/',
   'https://www.youtube.com/watch?v=mLfjzJsN8us',
   'Fibonacci recurrence relation dp[i] = dp[i-1] + dp[i-2].',
   'Amazon, TCS, Infosys, Wipro'),
  ('Frog Jump with K Steps', '1D DP', 'easy', 5, 'Day 05: 1D Dynamic Programming', 2,
   'https://www.geeksforgeeks.org/problems/geek-jump/1',
   'https://takeuforward.org/data-structure/dynamic-programming-frog-jump-dp-3/',
   'https://www.youtube.com/watch?v=EgG3jsGoPvQ',
   'Minimize step energy jump with memoized 1D array.',
   'Google, Amazon, Flipkart'),
  ('House Robber (Max Non-Adjacent Sum)', '1D DP', 'medium', 5, 'Day 05: 1D Dynamic Programming', 3,
   'https://leetcode.com/problems/house-robber/',
   'https://takeuforward.org/data-structure/maximum-sum-of-non-adjacent-elements-dp-5/',
   'https://www.youtube.com/watch?v=GrMBfJNk_NY',
   'Choose max between robbing current house + prev2 vs skipping to prev1.',
   'Google, Amazon, Microsoft, PayU'),
  ('Coin Change (Fewest Coins to Make Amount)', '1D DP', 'medium', 5, 'Day 05: 1D Dynamic Programming', 4,
   'https://leetcode.com/problems/coin-change/',
   'https://takeuforward.org/data-structure/coin-change-2-dp-22/',
   'https://www.youtube.com/watch?v=HgyouEiC540',
   'Unbounded knapsack: dp[i] = min(dp[i], 1 + dp[i - coin]).',
   'Amazon, Microsoft, PayU, Adobe'),
  ('Longest Increasing Subsequence (LIS)', '1D DP', 'medium', 5, 'Day 05: 1D Dynamic Programming', 5,
   'https://leetcode.com/problems/longest-increasing-subsequence/',
   'https://takeuforward.org/data-structure/longest-increasing-subsequence-dp-41/',
   'https://www.youtube.com/watch?v=ekcwMsSIzVc',
   'O(N^2) dynamic programming or O(N log N) binary search with patience sort.',
   'Google, Microsoft, Amazon, Goldman Sachs'),
  ('Word Break', '1D DP', 'medium', 5, 'Day 05: 1D Dynamic Programming', 6,
   'https://leetcode.com/problems/word-break/',
   'https://www.geeksforgeeks.org/word-break-problem-dp-32/',
   'https://www.youtube.com/watch?v=Sx9NNgInc3A',
   'Boolean dp[i] representing whether prefix s[0..i] can be segmented.',
   'Google, Amazon, Uber')
) AS v(q, top, diff, d_num, d_title, o_idx, prac_url, art_url, vid_url, nts, comp_names)
WHERE NOT EXISTS (
  SELECT 1 FROM public.questions existing WHERE lower(trim(existing.question)) = lower(trim(v.q))
);

-- Force PostgREST schema cache reload immediately
NOTIFY pgrst, 'reload schema';

