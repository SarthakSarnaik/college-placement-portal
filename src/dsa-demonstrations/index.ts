/**
 * DSA Demonstrations Module — Barrel Export & Interactive Runner
 *
 * Notice:
 * This module is an educational, non-invasive Data Structures and Algorithms
 * demonstration specifically crafted around college placement portal scenarios.
 * It is completely decoupled from the production application, live database queries,
 * and user-facing routes.
 */

export * from "./types";
export * from "./hash-map";
export * from "./graph-rounds";
export * from "./trie-search";
export * from "./company-sorters";
export * from "./binary-search-questions";

import {
  SAMPLE_COMPANIES,
  SAMPLE_ROUNDS,
  SAMPLE_QUESTIONS,
  type PlacementCompanyRecord,
  type InterviewQuestionRecord,
} from "./types";
import { CompanyHashMap } from "./hash-map";
import { InterviewRoundGraph } from "./graph-rounds";
import { PrefixSearchTrie } from "./trie-search";
import { mergeSortCompanies, quickSortCompanies, CompanyComparators } from "./company-sorters";
import {
  binarySearchByQuestionId,
  binarySearchByTitle,
  binarySearchRangeByDifficulty,
} from "./binary-search-questions";

/**
 * Programmatic demonstration runner displaying console outputs for all 5 concepts.
 * Can be executed in scratch runners or unit tests.
 */
export function runAllDsaDemonstrations(): {
  hashMapResults: { inserted: number; lookup: PlacementCompanyRecord | null };
  graphResults: {
    bfsOrder: string[];
    dfsOrder: string[];
    topologicalOrder: string[];
    hasDeadlock: boolean;
  };
  trieResults: {
    prefixMatches: string[];
    suggestions: string[];
  };
  sortingResults: {
    mergeSortedCount: number;
    quickSortedCount: number;
    sampleSortedNames: string[];
  };
  binarySearchResults: {
    foundById: boolean;
    foundByTitle: boolean;
    mediumQuestionsCount: number;
  };
} {
  // Concept 1: HashMap Lookup
  const companyMap = new CompanyHashMap<PlacementCompanyRecord>(8);
  for (const company of SAMPLE_COMPANIES) {
    companyMap.put(company.id, company);
  }
  const googLookup = companyMap.get("comp-goog-01");

  // Concept 2: Graph Traversals
  const graph = new InterviewRoundGraph();
  for (const round of SAMPLE_ROUNDS) {
    graph.addRound(round);
  }
  graph.addPrerequisite("rnd-oa-1", "rnd-tech-1");
  graph.addPrerequisite("rnd-tech-1", "rnd-tech-2");
  graph.addPrerequisite("rnd-tech-2", "rnd-sys-design");
  graph.addPrerequisite("rnd-sys-design", "rnd-hr-final");

  const bfsOrder = graph.bfs("rnd-oa-1").map((r) => r.name);
  const dfsOrder = graph.dfs("rnd-oa-1").map((r) => r.name);
  const topologicalOrder = graph.topologicalSort().map((r) => r.name);
  const hasDeadlock = graph.hasCycle();

  // Concept 3: Trie Prefix Search & Autocomplete
  const trie = new PrefixSearchTrie<string>();
  for (const comp of SAMPLE_COMPANIES) {
    trie.insert(comp.name, comp.id);
  }
  for (const q of SAMPLE_QUESTIONS) {
    trie.insert(q.topic, q.id);
  }
  const prefixMatches = trie.searchPrefix("A").map((r) => r.matchedWord);
  const suggestions = trie.getAutocompleteSuggestions("Go", 5);

  // Concept 4: Sorting (MergeSort & QuickSort)
  const mergeSorted = mergeSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byDifficultyThenName);
  const quickSorted = quickSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byNameAscending);

  // Concept 5: Binary Search on Questions
  const sortedById = [...SAMPLE_QUESTIONS].sort((a, b) => a.id.localeCompare(b.id));
  const searchByIdRes = binarySearchByQuestionId(sortedById, "q-005");

  const sortedByTitle = [...SAMPLE_QUESTIONS].sort((a, b) => a.title.localeCompare(b.title));
  const searchByTitleRes = binarySearchByTitle(sortedByTitle, "Two Sum");

  const sortedByDifficulty = [...SAMPLE_QUESTIONS].sort((a, b) => {
    const weights: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
    return weights[a.difficulty] - weights[b.difficulty];
  });
  const mediumQuestions = binarySearchRangeByDifficulty(sortedByDifficulty, "medium");

  return {
    hashMapResults: {
      inserted: companyMap.size(),
      lookup: googLookup,
    },
    graphResults: {
      bfsOrder,
      dfsOrder,
      topologicalOrder,
      hasDeadlock,
    },
    trieResults: {
      prefixMatches,
      suggestions,
    },
    sortingResults: {
      mergeSortedCount: mergeSorted.length,
      quickSortedCount: quickSorted.length,
      sampleSortedNames: quickSorted.map((c) => c.name),
    },
    binarySearchResults: {
      foundById: searchByIdRes.found,
      foundByTitle: searchByTitleRes.found,
      mediumQuestionsCount: mediumQuestions.length,
    },
  };
}
