import { describe, expect, it } from "vitest";
import {
  mergeSortCompanies,
  quickSortCompanies,
  CompanyComparators,
  DIFFICULTY_WEIGHTS,
} from "../company-sorters";
import { SAMPLE_COMPANIES, type PlacementCompanyRecord } from "../types";

describe("DSA Concept 4: Company Sorting Algorithms (MergeSort & QuickSort)", () => {
  it("handles empty arrays and single-element arrays correctly", () => {
    expect(mergeSortCompanies([])).toEqual([]);
    expect(quickSortCompanies([])).toEqual([]);

    const single = [SAMPLE_COMPANIES[0]];
    expect(mergeSortCompanies(single)).toEqual(single);
    expect(quickSortCompanies(single)).toEqual(single);
  });

  it("does not mutate the original input array", () => {
    const originalOrder = SAMPLE_COMPANIES.map((c) => c.id);
    mergeSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byNameAscending);
    quickSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byNameAscending);

    expect(SAMPLE_COMPANIES.map((c) => c.id)).toEqual(originalOrder);
  });

  it("sorts companies alphabetically by name ascending (A-Z) using MergeSort", () => {
    const sorted = mergeSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byNameAscending);
    const names = sorted.map((c) => c.name);

    for (let i = 0; i < names.length - 1; i++) {
      expect(
        names[i].localeCompare(names[i + 1], undefined, { sensitivity: "base" }),
      ).toBeLessThanOrEqual(0);
    }

    expect(names[0]).toBe("Adobe Systems");
    expect(names[names.length - 1]).toBe("Wipro Turbo");
  });

  it("sorts companies alphabetically by name descending (Z-A) using QuickSort", () => {
    const sorted = quickSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byNameDescending);
    const names = sorted.map((c) => c.name);

    for (let i = 0; i < names.length - 1; i++) {
      expect(
        names[i].localeCompare(names[i + 1], undefined, { sensitivity: "base" }),
      ).toBeGreaterThanOrEqual(0);
    }

    expect(names[0]).toBe("Wipro Turbo");
    expect(names[names.length - 1]).toBe("Adobe Systems");
  });

  it("sorts companies by DSA difficulty ascending (easy -> medium -> hard)", () => {
    const sortedMerge = mergeSortCompanies(
      SAMPLE_COMPANIES,
      CompanyComparators.byDifficultyAscending,
    );
    const sortedQuick = quickSortCompanies(
      SAMPLE_COMPANIES,
      CompanyComparators.byDifficultyAscending,
    );

    for (const sorted of [sortedMerge, sortedQuick]) {
      for (let i = 0; i < sorted.length - 1; i++) {
        const weightCurr = DIFFICULTY_WEIGHTS[sorted[i].dsaDifficulty];
        const weightNext = DIFFICULTY_WEIGHTS[sorted[i + 1].dsaDifficulty];
        expect(weightCurr).toBeLessThanOrEqual(weightNext);
      }
    }
  });

  it("sorts companies by DSA difficulty descending (hard -> medium -> easy)", () => {
    const sorted = mergeSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byDifficultyDescending);

    for (let i = 0; i < sorted.length - 1; i++) {
      const weightCurr = DIFFICULTY_WEIGHTS[sorted[i].dsaDifficulty];
      const weightNext = DIFFICULTY_WEIGHTS[sorted[i + 1].dsaDifficulty];
      expect(weightCurr).toBeGreaterThanOrEqual(weightNext);
    }

    // Hard difficulty companies appear first
    expect(sorted[0].dsaDifficulty).toBe("hard");
  });

  it("sorts by multi-criteria: difficulty descending, then name ascending", () => {
    const sorted = mergeSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byDifficultyThenName);

    for (let i = 0; i < sorted.length - 1; i++) {
      const weightCurr = DIFFICULTY_WEIGHTS[sorted[i].dsaDifficulty];
      const weightNext = DIFFICULTY_WEIGHTS[sorted[i + 1].dsaDifficulty];

      if (weightCurr !== weightNext) {
        expect(weightCurr).toBeGreaterThan(weightNext);
      } else {
        expect(
          sorted[i].name.localeCompare(sorted[i + 1].name, undefined, {
            sensitivity: "base",
          }),
        ).toBeLessThanOrEqual(0);
      }
    }
  });

  it("verifies MergeSort stability when sorting by non-unique keys", () => {
    const mockList: PlacementCompanyRecord[] = [
      { id: "1", name: "Alpha", sector: "Tech", dsaDifficulty: "easy", minCgpa: 7.0 },
      { id: "2", name: "Beta", sector: "Tech", dsaDifficulty: "easy", minCgpa: 8.0 },
      { id: "3", name: "Gamma", sector: "Tech", dsaDifficulty: "easy", minCgpa: 6.0 },
    ];

    // Sorting by dsaDifficulty (all identical) should preserve original order
    const stableSorted = mergeSortCompanies(mockList, CompanyComparators.byDifficultyAscending);
    expect(stableSorted.map((c) => c.id)).toEqual(["1", "2", "3"]);
  });

  it("sorts by minimum CGPA criteria", () => {
    const sorted = quickSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byMinCgpaAscending);
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].minCgpa).toBeLessThanOrEqual(sorted[i + 1].minCgpa);
    }
  });
});
