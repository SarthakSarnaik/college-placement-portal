import { describe, expect, it } from "vitest";
import {
  binarySearchByQuestionId,
  binarySearchByTitle,
  findDifficultyLowerBound,
  findDifficultyUpperBound,
  binarySearchRangeByDifficulty,
  binarySearchGeneric,
} from "../binary-search-questions";
import { SAMPLE_QUESTIONS, type InterviewQuestionRecord } from "../types";
import { DIFFICULTY_WEIGHTS } from "../company-sorters";

describe("DSA Concept 5: Binary Search on Sorted Interview Questions", () => {
  // Sorted copies for binary search prerequisites
  const sortedById = [...SAMPLE_QUESTIONS].sort((a, b) => a.id.localeCompare(b.id));

  const sortedByTitle = [...SAMPLE_QUESTIONS].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );

  const sortedByDifficulty = [...SAMPLE_QUESTIONS].sort((a, b) => {
    return DIFFICULTY_WEIGHTS[a.difficulty] - DIFFICULTY_WEIGHTS[b.difficulty];
  });

  it("finds a question by unique ID in O(log N) iterations", () => {
    const target = "q-007";
    const result = binarySearchByQuestionId(sortedById, target);

    expect(result.found).toBe(true);
    expect(result.item?.id).toBe(target);
    expect(result.item?.title).toBe("Maximum Subarray (Kadane's Algorithm)");
    // For 10 elements, log2(10) ~ 3.32 -> max iterations ~ 4
    expect(result.iterations).toBeLessThanOrEqual(4);
  });

  it("returns not found for non-existent question ID", () => {
    const result = binarySearchByQuestionId(sortedById, "q-999");
    expect(result.found).toBe(false);
    expect(result.item).toBeNull();
    expect(result.index).toBe(-1);
  });

  it("finds a question by title with case-insensitive matching", () => {
    const targetTitle = "two sum";
    const result = binarySearchByTitle(sortedByTitle, targetTitle);

    expect(result.found).toBe(true);
    expect(result.item?.title).toBe("Two Sum");
    expect(result.item?.topic).toBe("Arrays");
    expect(result.iterations).toBeLessThanOrEqual(4);
  });

  it("returns not found for non-existent question title", () => {
    const result = binarySearchByTitle(sortedByTitle, "Nonexistent Problem");
    expect(result.found).toBe(false);
    expect(result.item).toBeNull();
  });

  it("locates lower and upper bounds for difficulty categories", () => {
    const lowerBoundMedium = findDifficultyLowerBound(sortedByDifficulty, "medium");
    const upperBoundMedium = findDifficultyUpperBound(sortedByDifficulty, "medium");

    expect(lowerBoundMedium).toBeLessThan(upperBoundMedium);

    // Verify all items in [lowerBound, upperBound) have difficulty === "medium"
    for (let i = lowerBoundMedium; i < upperBoundMedium; i++) {
      expect(sortedByDifficulty[i].difficulty).toBe("medium");
    }

    // Item immediately preceding lowerBound should have weight < medium
    if (lowerBoundMedium > 0) {
      expect(DIFFICULTY_WEIGHTS[sortedByDifficulty[lowerBoundMedium - 1].difficulty]).toBeLessThan(
        DIFFICULTY_WEIGHTS["medium"],
      );
    }

    // Item at upperBound (if within bounds) should have weight > medium
    if (upperBoundMedium < sortedByDifficulty.length) {
      expect(DIFFICULTY_WEIGHTS[sortedByDifficulty[upperBoundMedium].difficulty]).toBeGreaterThan(
        DIFFICULTY_WEIGHTS["medium"],
      );
    }
  });

  it("extracts all questions for a given difficulty tier using binarySearchRangeByDifficulty", () => {
    const easyQuestions = binarySearchRangeByDifficulty(sortedByDifficulty, "easy");
    const mediumQuestions = binarySearchRangeByDifficulty(sortedByDifficulty, "medium");
    const hardQuestions = binarySearchRangeByDifficulty(sortedByDifficulty, "hard");

    expect(easyQuestions.every((q) => q.difficulty === "easy")).toBe(true);
    expect(mediumQuestions.every((q) => q.difficulty === "medium")).toBe(true);
    expect(hardQuestions.every((q) => q.difficulty === "hard")).toBe(true);

    const totalExtracted = easyQuestions.length + mediumQuestions.length + hardQuestions.length;
    expect(totalExtracted).toBe(SAMPLE_QUESTIONS.length);
  });

  it("returns empty array when range search difficulty has no matching records", () => {
    const onlyHardQuestions: InterviewQuestionRecord[] = sortedByDifficulty.filter(
      (q) => q.difficulty === "hard",
    );

    const result = binarySearchRangeByDifficulty(onlyHardQuestions, "easy");
    expect(result).toEqual([]);
  });

  it("executes generic binary search with custom key extractor and comparator", () => {
    const result = binarySearchGeneric(
      sortedById,
      "q-003",
      (q) => q.id,
      (a, b) => a.localeCompare(b),
    );

    expect(result.found).toBe(true);
    expect(result.item?.id).toBe("q-003");
    expect(result.item?.title).toBe("Climbing Stairs");
  });
});
