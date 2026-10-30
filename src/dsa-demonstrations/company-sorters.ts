/**
 * Concept 4: Sorting Algorithms for Recruiter Records
 *
 * Context in Placement Portal:
 * When students explore campus placement opportunities, they frequently organize
 * recruiters by different criteria:
 * - Alphabetically by Name (A-Z or Z-A) to locate specific recruiters.
 * - By DSA Difficulty ("easy" -> "medium" -> "hard" or vice-versa) to systematically
 *   progress from foundational mass recruiters (e.g., TCS, Infosys) to product-tier giants
 *   (e.g., Google, Uber, Goldman Sachs).
 * - Multi-criteria sorting: grouping by difficulty tier first, and sorting alphabetically
 *   within each tier.
 *
 * Implemented Algorithms:
 * 1. Merge Sort:
 *    - Stable divide-and-conquer algorithm.
 *    - Preserves relative order of equal elements (essential for multi-stage sorting).
 *    - Time Complexity: O(N log N) in all cases (Best, Average, Worst).
 *    - Space Complexity: O(N) auxiliary memory for buffer merging.
 *
 * 2. Quick Sort:
 *    - In-place divide-and-conquer algorithm with median-of-three pivot selection.
 *    - Minimizes memory allocations in high-throughput listing views.
 *    - Time Complexity: O(N log N) average/best, O(N^2) worst case (rare with median pivot).
 *    - Space Complexity: O(log N) auxiliary recursion call stack space.
 */

import type { DsaDifficulty, PlacementCompanyRecord } from "./types";

/**
 * Numeric weights assigned to difficulty tiers for deterministic ordering.
 */
export const DIFFICULTY_WEIGHTS: Record<DsaDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * Comparator signature returning:
 * - negative number if a precedes b
 * - 0 if a and b are considered equal
 * - positive number if a succeeds b
 */
export type CompanyComparator = (a: PlacementCompanyRecord, b: PlacementCompanyRecord) => number;

/**
 * Common standard comparators tailored for campus placement portals.
 */
export const CompanyComparators = {
  /** Sort company name in ascending alphabetical order (A -> Z) */
  byNameAscending: (a: PlacementCompanyRecord, b: PlacementCompanyRecord): number => {
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  },

  /** Sort company name in descending alphabetical order (Z -> A) */
  byNameDescending: (a: PlacementCompanyRecord, b: PlacementCompanyRecord): number => {
    return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
  },

  /** Sort DSA difficulty ascending: easy -> medium -> hard */
  byDifficultyAscending: (a: PlacementCompanyRecord, b: PlacementCompanyRecord): number => {
    return DIFFICULTY_WEIGHTS[a.dsaDifficulty] - DIFFICULTY_WEIGHTS[b.dsaDifficulty];
  },

  /** Sort DSA difficulty descending: hard -> medium -> easy */
  byDifficultyDescending: (a: PlacementCompanyRecord, b: PlacementCompanyRecord): number => {
    return DIFFICULTY_WEIGHTS[b.dsaDifficulty] - DIFFICULTY_WEIGHTS[a.dsaDifficulty];
  },

  /** Sort minimum required CGPA ascending */
  byMinCgpaAscending: (a: PlacementCompanyRecord, b: PlacementCompanyRecord): number => {
    return a.minCgpa - b.minCgpa;
  },

  /** Sort minimum required CGPA descending */
  byMinCgpaDescending: (a: PlacementCompanyRecord, b: PlacementCompanyRecord): number => {
    return b.minCgpa - a.minCgpa;
  },

  /**
   * Multi-criteria comparator:
   * First groups by difficulty (e.g. hard -> medium -> easy),
   * then breaks ties by sorting company names alphabetically (A -> Z).
   */
  byDifficultyThenName: (a: PlacementCompanyRecord, b: PlacementCompanyRecord): number => {
    const diffComparison =
      DIFFICULTY_WEIGHTS[b.dsaDifficulty] - DIFFICULTY_WEIGHTS[a.dsaDifficulty];
    if (diffComparison !== 0) {
      return diffComparison;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  },
} as const;

/**
 * Merge Sort Implementation (Stable Sort)
 *
 * Time Complexity:
 * - Best Case:    O(N log N)
 * - Average Case: O(N log N)
 * - Worst Case:   O(N log N)
 *
 * Space Complexity:
 * - Auxiliary Space: O(N) for holding merged subarrays
 *
 * Stability: Stable (preserves original relative order of equivalent items)
 *
 * @param items Array of placement company records to sort
 * @param comparator Comparison function defining the ordering logic
 * @returns A newly allocated sorted array (non-mutating)
 */
export function mergeSortCompanies(
  items: readonly PlacementCompanyRecord[],
  comparator: CompanyComparator = CompanyComparators.byNameAscending,
): PlacementCompanyRecord[] {
  if (items.length <= 1) {
    return [...items];
  }

  const mid = Math.floor(items.length / 2);
  const left = mergeSortCompanies(items.slice(0, mid), comparator);
  const right = mergeSortCompanies(items.slice(mid), comparator);

  return merge(left, right, comparator);
}

/**
 * Merges two sorted subarrays into a single sorted array.
 * Time Complexity: O(N1 + N2)
 * Space Complexity: O(N1 + N2)
 */
function merge(
  left: PlacementCompanyRecord[],
  right: PlacementCompanyRecord[],
  comparator: CompanyComparator,
): PlacementCompanyRecord[] {
  const result: PlacementCompanyRecord[] = [];
  let i = 0;
  let j = 0;

  // Use <= 0 to ensure stability (left element preferred when values match)
  while (i < left.length && j < right.length) {
    if (comparator(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  while (i < left.length) {
    result.push(left[i]);
    i++;
  }

  while (j < right.length) {
    result.push(right[j]);
    j++;
  }

  return result;
}

/**
 * Quick Sort Implementation (In-Place / Divide-and-Conquer)
 *
 * Time Complexity:
 * - Best Case:    O(N log N)
 * - Average Case: O(N log N)
 * - Worst Case:   O(N^2) (mitigated using median-of-three pivot selection)
 *
 * Space Complexity:
 * - Auxiliary Stack Space: O(log N) average, O(N) worst case call stack depth
 *
 * Stability: Unstable
 *
 * @param items Array of placement company records to sort
 * @param comparator Comparison function defining the ordering logic
 * @returns A newly sorted copy of the input array (non-mutating to caller)
 */
export function quickSortCompanies(
  items: readonly PlacementCompanyRecord[],
  comparator: CompanyComparator = CompanyComparators.byNameAscending,
): PlacementCompanyRecord[] {
  const copy = [...items];
  if (copy.length <= 1) {
    return copy;
  }

  quickSortHelper(copy, 0, copy.length - 1, comparator);
  return copy;
}

/**
 * Recursive in-place quick sort partition routine.
 */
function quickSortHelper(
  arr: PlacementCompanyRecord[],
  low: number,
  high: number,
  comparator: CompanyComparator,
): void {
  if (low < high) {
    const pivotIndex = partition(arr, low, high, comparator);
    quickSortHelper(arr, low, pivotIndex - 1, comparator);
    quickSortHelper(arr, pivotIndex + 1, high, comparator);
  }
}

/**
 * Median-of-three pivot selection and Lomuto partition scheme.
 * Time Complexity: O(high - low + 1)
 */
function partition(
  arr: PlacementCompanyRecord[],
  low: number,
  high: number,
  comparator: CompanyComparator,
): number {
  const mid = Math.floor((low + high) / 2);

  // Median-of-three selection: sort low, mid, high elements
  if (comparator(arr[mid], arr[low]) < 0) {
    swap(arr, low, mid);
  }
  if (comparator(arr[high], arr[low]) < 0) {
    swap(arr, low, high);
  }
  if (comparator(arr[high], arr[mid]) < 0) {
    swap(arr, mid, high);
  }

  // Place median at high - 1 as pivot
  swap(arr, mid, high);
  const pivot = arr[high];

  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (comparator(arr[j], pivot) <= 0) {
      i++;
      swap(arr, i, j);
    }
  }

  swap(arr, i + 1, high);
  return i + 1;
}

function swap(arr: PlacementCompanyRecord[], a: number, b: number): void {
  const temp = arr[a];
  arr[a] = arr[b];
  arr[b] = temp;
}
