/**
 * Concept 5: Binary Search on Sorted Interview Questions
 *
 * Context in Placement Portal:
 * Placement portals manage question banks containing hundreds of coding problems.
 * When collections are sorted:
 * 1. Searching by unique identifier (e.g., Question ID "q-007") or canonical title
 *    can be performed in logarithmic time O(log N) rather than O(N) linear iteration.
 * 2. When questions are arranged in ascending difficulty (easy -> medium -> hard),
 *    students can instantly retrieve all problems of a specific difficulty level
 *    using binary search boundary detection (lower-bound and upper-bound) in O(log N + K)
 *    time (where K is the number of matching questions), rather than scanning the entire bank.
 *
 * Implemented Algorithms:
 * 1. `binarySearchByQuestionId`:
 *    - Exact match search by alphanumeric ID on an ID-sorted array.
 *    - Time Complexity: O(log N)
 *    - Space Complexity: O(1) iterative execution
 *
 * 2. `binarySearchByTitle`:
 *    - Case-insensitive exact title search on a title-sorted array.
 *    - Time Complexity: O(log N)
 *    - Space Complexity: O(1) iterative execution
 *
 * 3. `binarySearchRangeByDifficulty`:
 *    - Uses lower-bound and upper-bound binary searches to isolate a contiguous segment
 *      of questions sharing the target difficulty level.
 *    - Time Complexity: O(log N + K), where K is the number of questions in that tier.
 *    - Space Complexity: O(K) for the resulting slice.
 *
 * 4. `binarySearchGeneric`:
 *    - Parameterized generic binary search routine supporting custom keys and comparators.
 *    - Time Complexity: O(log N)
 *    - Space Complexity: O(1)
 */

import type { DsaDifficulty, InterviewQuestionRecord } from "./types";
import { DIFFICULTY_WEIGHTS } from "./company-sorters";

export interface BinarySearchResult<T> {
  found: boolean;
  index: number;
  item: T | null;
  iterations: number;
}

/**
 * Perform binary search to locate an interview question by its unique ID.
 * Expects `sortedQuestions` to be sorted in ascending order of `id`.
 *
 * Time Complexity:  O(log N)
 * Space Complexity: O(1)
 *
 * @param sortedQuestions Array of questions sorted ascending by `id`
 * @param targetId The question ID to search for (e.g. "q-005")
 * @returns BinarySearchResult containing the matching question, index, and iteration counter
 */
export function binarySearchByQuestionId(
  sortedQuestions: readonly InterviewQuestionRecord[],
  targetId: string,
): BinarySearchResult<InterviewQuestionRecord> {
  let low = 0;
  let high = sortedQuestions.length - 1;
  let iterations = 0;
  const normalizedTarget = targetId.trim().toLowerCase();

  while (low <= high) {
    iterations++;
    const mid = Math.floor(low + (high - low) / 2);
    const midId = sortedQuestions[mid].id.trim().toLowerCase();

    if (midId === normalizedTarget) {
      return {
        found: true,
        index: mid,
        item: sortedQuestions[mid],
        iterations,
      };
    }

    if (midId < normalizedTarget) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    found: false,
    index: -1,
    item: null,
    iterations,
  };
}

/**
 * Perform binary search to locate an interview question by title.
 * Expects `sortedQuestions` to be sorted in lexicographical order of `title`.
 *
 * Time Complexity:  O(log N)
 * Space Complexity: O(1)
 *
 * @param sortedQuestions Array of questions sorted ascending by title
 * @param targetTitle The title to search for (e.g. "Two Sum")
 * @returns BinarySearchResult containing the matched question or null
 */
export function binarySearchByTitle(
  sortedQuestions: readonly InterviewQuestionRecord[],
  targetTitle: string,
): BinarySearchResult<InterviewQuestionRecord> {
  let low = 0;
  let high = sortedQuestions.length - 1;
  let iterations = 0;
  const normalizedTarget = targetTitle.trim().toLowerCase();

  while (low <= high) {
    iterations++;
    const mid = Math.floor(low + (high - low) / 2);
    const midTitle = sortedQuestions[mid].title.trim().toLowerCase();

    const comparison = midTitle.localeCompare(normalizedTarget);

    if (comparison === 0) {
      return {
        found: true,
        index: mid,
        item: sortedQuestions[mid],
        iterations,
      };
    }

    if (comparison < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    found: false,
    index: -1,
    item: null,
    iterations,
  };
}

/**
 * Finds the lower bound (first index where question.difficulty >= targetDifficulty).
 * Expects `sortedQuestions` to be sorted in ascending order of difficulty weight
 * (easy: 1, medium: 2, hard: 3).
 *
 * Time Complexity:  O(log N)
 * Space Complexity: O(1)
 */
export function findDifficultyLowerBound(
  sortedQuestions: readonly InterviewQuestionRecord[],
  targetDifficulty: DsaDifficulty,
): number {
  const targetWeight = DIFFICULTY_WEIGHTS[targetDifficulty];
  let low = 0;
  let high = sortedQuestions.length;

  while (low < high) {
    const mid = Math.floor(low + (high - low) / 2);
    const midWeight = DIFFICULTY_WEIGHTS[sortedQuestions[mid].difficulty];

    if (midWeight >= targetWeight) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low;
}

/**
 * Finds the upper bound (first index where question.difficulty > targetDifficulty).
 * Expects `sortedQuestions` to be sorted in ascending order of difficulty weight
 * (easy: 1, medium: 2, hard: 3).
 *
 * Time Complexity:  O(log N)
 * Space Complexity: O(1)
 */
export function findDifficultyUpperBound(
  sortedQuestions: readonly InterviewQuestionRecord[],
  targetDifficulty: DsaDifficulty,
): number {
  const targetWeight = DIFFICULTY_WEIGHTS[targetDifficulty];
  let low = 0;
  let high = sortedQuestions.length;

  while (low < high) {
    const mid = Math.floor(low + (high - low) / 2);
    const midWeight = DIFFICULTY_WEIGHTS[sortedQuestions[mid].difficulty];

    if (midWeight > targetWeight) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low;
}

/**
 * Binary search range extraction:
 * Retrieves all interview questions matching a given difficulty level from a difficulty-sorted array.
 * Uses O(log N) boundary detection, followed by an O(K) slice of matching questions.
 *
 * Time Complexity:  O(log N + K) where K is the count of matching items
 * Space Complexity: O(K) for the extracted array slice
 *
 * @param sortedQuestions Array of questions sorted ascending by difficulty
 * @param difficulty Target difficulty level ("easy", "medium", or "hard")
 * @returns Array of questions matching the given difficulty
 */
export function binarySearchRangeByDifficulty(
  sortedQuestions: readonly InterviewQuestionRecord[],
  difficulty: DsaDifficulty,
): InterviewQuestionRecord[] {
  const start = findDifficultyLowerBound(sortedQuestions, difficulty);
  const end = findDifficultyUpperBound(sortedQuestions, difficulty);

  if (start >= end) {
    return [];
  }

  return sortedQuestions.slice(start, end) as InterviewQuestionRecord[];
}

/**
 * Generic binary search function for arbitrary sorted collections and keys.
 *
 * Time Complexity:  O(log N)
 * Space Complexity: O(1)
 */
export function binarySearchGeneric<T, K>(
  sortedItems: readonly T[],
  targetKey: K,
  keyExtractor: (item: T) => K,
  comparator: (a: K, b: K) => number,
): BinarySearchResult<T> {
  let low = 0;
  let high = sortedItems.length - 1;
  let iterations = 0;

  while (low <= high) {
    iterations++;
    const mid = Math.floor(low + (high - low) / 2);
    const midKey = keyExtractor(sortedItems[mid]);
    const cmp = comparator(midKey, targetKey);

    if (cmp === 0) {
      return {
        found: true,
        index: mid,
        item: sortedItems[mid],
        iterations,
      };
    }

    if (cmp < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    found: false,
    index: -1,
    item: null,
    iterations,
  };
}
