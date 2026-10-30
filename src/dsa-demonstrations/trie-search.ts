/**
 * Concept 3: Trie (Prefix Tree) for Instantaneous Autocomplete & Filter Searches
 *
 * Context in Placement Portal:
 * In the Company Directory and DSA Practice Hub, students type search prefixes
 * like "Goo..." to quickly locate Google, or "Bin..." to filter questions tagged
 * with "Binary Search" and "Binary Trees".
 *
 * Unlike naive string scanning which takes O(N * L) time for N records, a Trie
 * navigates character nodes in O(P) time (where P is the prefix length), making
 * autocomplete queries independent of total database size.
 *
 * Time & Space Complexity:
 * - Insert (`insert`):                 Time O(L), where L is the length of the string
 * - Prefix Search (`searchPrefix`):     Time O(P + K), where P is prefix length and K is the number of matching items
 * - Exact Match Search (`exactMatch`): Time O(L)
 * - Autocomplete (`getSuggestions`):   Time O(P + M), where M is the number of suggestions returned
 * - Space Complexity:                   O(Σ * L * N), where Σ is alphabet size, L is word length, and N is the number of keys
 */

export interface TrieSearchResult<T> {
  matchedWord: string;
  data: T;
}

class TrieNode<T> {
  public children: Map<string, TrieNode<T>>;
  public isEndOfWord: boolean;
  public records: T[];
  public word: string | null;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.records = [];
    this.word = null;
  }
}

export class PrefixSearchTrie<T> {
  private root: TrieNode<T>;
  private totalWords: number;

  constructor() {
    this.root = new TrieNode<T>();
    this.totalWords = 0;
  }

  /**
   * Normalize input string to lowercase trimmed representation.
   */
  private normalize(str: string): string {
    return str.trim().toLowerCase();
  }

  /**
   * Insert a word or phrase associated with a data payload.
   *
   * Example:
   * ```ts
   * trie.insert("Google", { id: "comp-goog-01", ... });
   * trie.insert("Binary Trees", { topic: "Binary Trees", ... });
   * ```
   * Time Complexity: O(L) where L is string length.
   */
  public insert(key: string, data: T): void {
    const normalized = this.normalize(key);
    if (!normalized) return;

    let curr = this.root;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      if (!curr.children.has(char)) {
        curr.children.set(char, new TrieNode<T>());
      }
      curr = curr.children.get(char)!;
    }

    if (!curr.isEndOfWord) {
      curr.isEndOfWord = true;
      this.totalWords++;
    }
    curr.word = key; // Preserve original casing
    curr.records.push(data);
  }

  /**
   * Search for all items whose indexed key begins with the specified prefix.
   *
   * Example:
   * ```ts
   * trie.searchPrefix("bin"); // Returns Binary Search & Binary Trees records
   * ```
   * Time Complexity: O(P + K)
   */
  public searchPrefix(prefix: string): TrieSearchResult<T>[] {
    const normalized = this.normalize(prefix);
    let curr = this.root;

    // Navigate to end of prefix
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      if (!curr.children.has(char)) {
        return []; // Prefix does not exist
      }
      curr = curr.children.get(char)!;
    }

    // Collect all terminal nodes below this subtree (DFS)
    const results: TrieSearchResult<T>[] = [];
    this.collectSubtree(curr, results);
    return results;
  }

  /**
   * Check whether an exact word exists in the Trie.
   * Time Complexity: O(L)
   */
  public exactMatch(word: string): boolean {
    const normalized = this.normalize(word);
    let curr = this.root;

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      if (!curr.children.has(char)) {
        return false;
      }
      curr = curr.children.get(char)!;
    }

    return curr.isEndOfWord;
  }

  /**
   * Returns autocomplete string suggestions matching the given prefix.
   * Useful for live search dropdown hints.
   *
   * Example:
   * ```ts
   * trie.getAutocompleteSuggestions("a", 3); // ["Amazon", "Adobe Systems", "Arrays"]
   * ```
   * Time Complexity: O(P + limit)
   */
  public getAutocompleteSuggestions(prefix: string, limit = 5): string[] {
    const matches = this.searchPrefix(prefix);
    const uniqueWords = new Set<string>();

    for (const match of matches) {
      uniqueWords.add(match.matchedWord);
      if (uniqueWords.size >= limit) break;
    }

    return Array.from(uniqueWords);
  }

  /**
   * Total number of distinct words indexed in the Trie.
   */
  public size(): number {
    return this.totalWords;
  }

  /**
   * Helper to recursively collect all records in a subtree.
   */
  private collectSubtree(node: TrieNode<T>, accumulator: TrieSearchResult<T>[]): void {
    if (node.isEndOfWord && node.word) {
      for (const record of node.records) {
        accumulator.push({
          matchedWord: node.word,
          data: record,
        });
      }
    }

    for (const child of node.children.values()) {
      this.collectSubtree(child, accumulator);
    }
  }
}
