import { describe, expect, it } from "vitest";
import { PrefixSearchTrie } from "../trie-search";
import { SAMPLE_COMPANIES, SAMPLE_QUESTIONS } from "../types";

describe("DSA Concept 3: PrefixSearchTrie (Autocomplete & Topic Search)", () => {
  it("initializes with 0 indexed words", () => {
    const trie = new PrefixSearchTrie<string>();
    expect(trie.size()).toBe(0);
    expect(trie.exactMatch("Google")).toBe(false);
  });

  it("indexes company names and performs prefix matching in O(P + K) time", () => {
    const trie = new PrefixSearchTrie<string>();
    for (const company of SAMPLE_COMPANIES) {
      trie.insert(company.name, company.id);
    }

    // "A" should match Amazon and Adobe Systems
    const aResults = trie.searchPrefix("A");
    const matchedNames = aResults.map((r) => r.matchedWord);
    expect(matchedNames).toContain("Amazon");
    expect(matchedNames).toContain("Adobe Systems");
    expect(matchedNames).not.toContain("Google");
  });

  it("handles case-insensitive prefix and exact searches", () => {
    const trie = new PrefixSearchTrie<string>();
    trie.insert("Google", "comp-goog-01");

    expect(trie.exactMatch("google")).toBe(true);
    expect(trie.exactMatch("GOOGLE")).toBe(true);
    expect(trie.exactMatch("GooGLE")).toBe(true);
    expect(trie.exactMatch("Goog")).toBe(false);

    const prefixResults = trie.searchPrefix("goo");
    expect(prefixResults.length).toBe(1);
    expect(prefixResults[0].matchedWord).toBe("Google");
    expect(prefixResults[0].data).toBe("comp-goog-01");
  });

  it("indexes multiple items sharing the same key (e.g. DSA topics)", () => {
    const trie = new PrefixSearchTrie<{ id: string; title: string }>();

    for (const question of SAMPLE_QUESTIONS) {
      trie.insert(question.topic, {
        id: question.id,
        title: question.title,
      });
    }

    // Multiple questions belong to the "Arrays" topic
    const arrayResults = trie.searchPrefix("Array");
    expect(arrayResults.length).toBeGreaterThanOrEqual(3);

    const titles = arrayResults.map((r) => r.data.title);
    expect(titles).toContain("Two Sum");
    expect(titles).toContain("Trapping Rain Water");
    expect(titles).toContain("Best Time to Buy and Sell Stock");
  });

  it("provides autocomplete suggestions with custom result limits", () => {
    const trie = new PrefixSearchTrie<string>();
    trie.insert("Amazon", "1");
    trie.insert("Adobe", "2");
    trie.insert("Apple", "3");
    trie.insert("Airbnb", "4");
    trie.insert("Atlassian", "5");

    const suggestionsLimit2 = trie.getAutocompleteSuggestions("A", 2);
    expect(suggestionsLimit2.length).toBe(2);

    const allSuggestions = trie.getAutocompleteSuggestions("A", 10);
    expect(allSuggestions.length).toBe(5);
    expect(allSuggestions).toContain("Amazon");
    expect(allSuggestions).toContain("Atlassian");
  });

  it("returns empty results for non-matching prefixes", () => {
    const trie = new PrefixSearchTrie<string>();
    trie.insert("Google", "1");
    trie.insert("Amazon", "2");

    expect(trie.searchPrefix("Zzz")).toEqual([]);
    expect(trie.getAutocompleteSuggestions("Zzz")).toEqual([]);
    expect(trie.exactMatch("Microsoft")).toBe(false);
  });

  it("ignores empty or whitespace-only inputs gracefully", () => {
    const trie = new PrefixSearchTrie<string>();
    trie.insert("", "empty");
    trie.insert("   ", "spaces");

    expect(trie.size()).toBe(0);
    expect(trie.searchPrefix("")).toEqual([]);
  });
});
