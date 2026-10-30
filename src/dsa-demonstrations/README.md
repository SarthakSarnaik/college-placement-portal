# Standalone DSA Demonstrations Module

> **Notice & Academic Integrity Disclaimer**  
> This directory (`src/dsa-demonstrations/`) is an **independent, non-invasive educational module**.  
> The live production application is powered by Supabase PostgreSQL database tables and TanStack Query caching. These algorithms **do not power live production routes or database transactions**; rather, they serve as clean, standalone TypeScript demonstrations showing how foundational computer science data structures and algorithms model real-world campus recruitment workflows.

---

## 📁 File Structure

```text
src/dsa-demonstrations/
├── types.ts                    # Domain interfaces & labeled sample datasets
├── hash-map.ts                 # Concept 1: Separate chaining HashMap with dynamic rehashing
├── graph-rounds.ts             # Concept 2: Interview sequence DAG (BFS, DFS, Topological Sort)
├── trie-search.ts              # Concept 3: Prefix Tree for recruiter & topic autocomplete
├── company-sorters.ts          # Concept 4: MergeSort & QuickSort with placement comparators
├── binary-search-questions.ts  # Concept 5: Binary search & difficulty boundary range search
├── index.ts                    # Barrel exports & interactive demonstration runner
├── README.md                   # Documentation, placement analogies & complexity analysis
└── test/
    ├── hash-map.test.ts        # Unit test suite for HashMap (10 test cases)
    ├── graph-rounds.test.ts    # Unit test suite for Graph & traversals (8 test cases)
    ├── trie-search.test.ts     # Unit test suite for Prefix Trie (7 test cases)
    ├── company-sorters.test.ts # Unit test suite for Sorting algorithms (9 test cases)
    └── binary-search-questions.test.ts # Unit test suite for Binary Search (8 test cases)
```

---

## 🧠 Algorithmic Concepts & Placement Domain Mapping

### 1. HashMap: O(1) Recruiter Record Lookup (`hash-map.ts`)

- **Placement Portal Context**: When students browse recruiter listings and click a specific company card, the portal resolves recruiter metadata using its unique ID (e.g., `"comp-goog-01"`). Using a linear scan $O(N)$ across all registered companies becomes wasteful as the recruiter directory expands. A custom HashMap provides immediate $O(1)$ average-time resolution.
- **Implementation Highlights**:
  - Polynomial rolling hash function with prime multiplier ($31$).
  - Separate chaining collision resolution using linked nodes (`HashNode<V>`).
  - Dynamic resizing (rehashing to $2\times$ capacity) when load factor ($\frac{\text{size}}{\text{capacity}}$) exceeds $0.75$.
- **Complexity**:
  | Operation         | Average Time | Worst Case Time                    | Space  |
  | :---------------- | :----------- | :--------------------------------- | :----- |
  | `put(key, value)` | $O(1)$       | $O(N)$ (hash collision clustering) | $O(N)$ |
  | `get(key)`        | $O(1)$       | $O(N)$                             | $O(1)$ |
  | `has(key)`        | $O(1)$       | $O(N)$                             | $O(1)$ |
  | `delete(key)`     | $O(1)$       | $O(N)$                             | $O(1)$ |
- **Example Input & Output**:
  ```ts
  const map = new CompanyHashMap<PlacementCompanyRecord>();
  map.put("comp-goog-01", {
    id: "comp-goog-01",
    name: "Google",
    sector: "Big Tech",
    dsaDifficulty: "hard",
    minCgpa: 8.5,
  });

  // Input
  const result = map.get("comp-goog-01");

  // Output: { id: "comp-goog-01", name: "Google", sector: "Big Tech", ... }
  ```

---

### 2. Graph: Interview Round Sequence Modeling (`graph-rounds.ts`)

- **Placement Portal Context**: Campus drives are structured as multi-stage prerequisite pipelines. For example, clearing the Online Assessment (OA) unlocks Technical Interview 1, which in turn unlocks Technical Interview 2 and System Design before reaching the Final HR round. Modeling these stages as a Directed Acyclic Graph (DAG) allows students to visualize prerequisites, explore alternate tracks, and detect circular interview dependencies.
- **Implementation Highlights**:
  - Adjacency list representation using TypeScript `Map<string, string[]>`.
  - **Breadth-First Search (BFS)**: Level-order traversal revealing immediate next hurdles.
  - **Depth-First Search (DFS)**: Deep traversal exploring complete technical specialization paths.
  - **Kahn's Algorithm (Topological Sort)**: Derives a valid preparation schedule respecting all prerequisite stages; returns empty if a cycle/deadlock exists.
  - **Cycle Detection**: Ensures no circular prerequisite deadlocks (e.g., Round A requires Round B while Round B requires Round A).
  - **Shortest Path**: Computes minimum rounds needed to reach a target interview milestone.
- **Complexity**:
  | Operation                 | Time Complexity | Space Complexity |
  | :------------------------ | :-------------- | :--------------- |
  | `bfs(startId)`            | $O(V + E)$      | $O(V)$           |
  | `dfs(startId)`            | $O(V + E)$      | $O(V)$           |
  | `topologicalSort()`       | $O(V + E)$      | $O(V)$           |
  | `hasCycle()`              | $O(V + E)$      | $O(V)$           |
  | `findPath(start, target)` | $O(V + E)$      | $O(V)$           |
- **Example Input & Output**:
  ```ts
  const graph = new InterviewRoundGraph();
  graph.addRound({ id: "rnd-oa-1", name: "Online Assessment", ... });
  graph.addRound({ id: "rnd-tech-1", name: "Tech Screening", ... });
  graph.addPrerequisite("rnd-oa-1", "rnd-tech-1");

  // Topological Sort Output
  graph.topologicalSort().map(r => r.name);
  // => ["Online Assessment", "Tech Screening", ...]
  ```

---

### 3. Trie: Prefix-Based Recruiter & Topic Search (`trie-search.ts`)

- **Placement Portal Context**: In the Company Directory and Interview Practice sections, students type search queries like `"Goo..."` to find Google or `"Bin..."` to filter topics tagged with `"Binary Trees"` or `"Binary Search"`. A Trie provides autocomplete predictions in time proportional to prefix length $O(P)$, without scanning unmatching records.
- **Implementation Highlights**:
  - Tree of `TrieNode<T>` where each node contains character edges and data records.
  - Case-insensitive string normalization while preserving original display casing.
  - Subtree depth-first collection for autocomplete suggestions (`getAutocompleteSuggestions`).
  - Capable of indexing multiple items per key (e.g., multiple questions under `"Arrays"`).
- **Complexity**:
  | Operation                                   | Time Complexity                                    | Space Complexity    |
  | :------------------------------------------ | :------------------------------------------------- | :------------------ |
  | `insert(key, record)`                       | $O(L)$ where $L$ is key length                     | $O(\Sigma \cdot L)$ |
  | `searchPrefix(prefix)`                      | $O(P + K)$ where $P$ is prefix len, $K$ is matches | $O(K)$              |
  | `exactMatch(word)`                          | $O(L)$                                             | $O(1)$              |
  | `getAutocompleteSuggestions(prefix, limit)` | $O(P + \text{limit})$                              | $O(\text{limit})$   |
- **Example Input & Output**:
  ```ts
  const trie = new PrefixSearchTrie<string>();
  trie.insert("Amazon", "comp-amzn-02");
  trie.insert("Adobe Systems", "comp-adobe-09");

  // Input
  const suggestions = trie.getAutocompleteSuggestions("A", 5);

  // Output: ["Amazon", "Adobe Systems"]
  ```

---

### 4. Sorting: MergeSort & QuickSort for Recruiters (`company-sorters.ts`)

- **Placement Portal Context**: Students regularly reorganize recruiter directories to plan preparation strategies:
  - **Alphabetical (A-Z / Z-A)**: Fast lookup when researching specific organizations.
  - **DSA Difficulty Progression**: Ordering companies from `"easy"` (mass recruiters) $\rightarrow$ `"medium"` $\rightarrow$ `"hard"` (tier-1 product giants).
  - **Multi-Criteria Sorting**: Grouping by difficulty first, and sorting alphabetically within each difficulty tier.
- **Implementation Highlights**:
  - **Merge Sort**: Stable divide-and-conquer implementation. Guaranteed $O(N \log N)$ worst-case performance, critical when preserving previous sub-sort orders.
  - **Quick Sort**: In-place divide-and-conquer implementation with median-of-three pivot selection to prevent worst-case quadratic degradation on pre-sorted lists.
  - Pluggable comparator functions (`CompanyComparators`).
- **Complexity**:
  | Algorithm      | Best Time     | Average Time  | Worst Time      | Space             | Stability |
  | :------------- | :------------ | :------------ | :-------------- | :---------------- | :-------- |
  | **Merge Sort** | $O(N \log N)$ | $O(N \log N)$ | $O(N \log N)$   | $O(N)$            | Stable    |
  | **Quick Sort** | $O(N \log N)$ | $O(N \log N)$ | $O(N^2)$ (rare) | $O(\log N)$ stack | Unstable  |
- **Example Input & Output**:
  ```ts
  // Input: Unsorted company list
  const sorted = mergeSortCompanies(SAMPLE_COMPANIES, CompanyComparators.byDifficultyThenName);

  // Output: Hard tier companies first (Goldman Sachs, Google, Uber), followed by Medium, then Easy
  ```

---

### 5. Binary Search: Question Bank Lookups (`binary-search-questions.ts`)

- **Placement Portal Context**: Placement portals maintain large archives of coding interview questions. When questions are indexed by ID, sorted alphabetically by title, or grouped by difficulty tier, binary search reduces linear $O(N)$ searches to logarithmic $O(\log N)$ operations.
- **Implementation Highlights**:
  - `binarySearchByQuestionId`: Exact match on ID-sorted collections in $O(\log N)$ time and $O(1)$ space.
  - `binarySearchByTitle`: Case-insensitive title search in $O(\log N)$ time.
  - `binarySearchRangeByDifficulty`: Uses lower-bound and upper-bound binary searches to isolate all questions belonging to a difficulty tier in $O(\log N + K)$ time without scanning outside that range.
  - `binarySearchGeneric`: Higher-order binary search accommodating custom key extractors and comparators.
- **Complexity**:
  | Operation                       | Time Complexity                                 | Auxiliary Space |
  | :------------------------------ | :---------------------------------------------- | :-------------- |
  | `binarySearchByQuestionId`      | $O(\log N)$                                     | $O(1)$          |
  | `binarySearchByTitle`           | $O(\log N)$                                     | $O(1)$          |
  | `findDifficultyLowerBound`      | $O(\log N)$                                     | $O(1)$          |
  | `findDifficultyUpperBound`      | $O(\log N)$                                     | $O(1)$          |
  | `binarySearchRangeByDifficulty` | $O(\log N + K)$ ($K$ = count of tier questions) | $O(K)$ slice    |
- **Example Input & Output**:
  ```ts
  // Search for question ID "q-007"
  const result = binarySearchByQuestionId(sortedById, "q-007");

  // Output:
  // {
  //   found: true,
  //   index: 6,
  //   item: { id: "q-007", title: "Maximum Subarray (Kadane's Algorithm)", ... },
  //   iterations: 3
  // }
  ```

---

## 🧪 Running the Unit Tests

The test suites are written using **Vitest** and can be run without impacting the existing test suite:

```bash
# Run all tests (including production tests and DSA demonstration tests)
npm.cmd test

# Run only the DSA demonstrations test suite
npm.cmd test src/dsa-demonstrations/
```

### Verification & Isolation Check

- **Zero Production Coupling**: Neither `src/routes/` nor `src/components/` import from `src/dsa-demonstrations/`.
- **Zero Runtime Dependencies**: Standard TypeScript implementations with zero third-party npm packages added.
- **Zero Database Impact**: Standalone in-memory execution.
