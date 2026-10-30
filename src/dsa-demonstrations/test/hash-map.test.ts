import { describe, expect, it } from "vitest";
import { CompanyHashMap } from "../hash-map";
import { SAMPLE_COMPANIES, type PlacementCompanyRecord } from "../types";

describe("DSA Concept 1: CompanyHashMap (O(1) Recruiter Lookup)", () => {
  it("initializes with default capacity and zero size", () => {
    const map = new CompanyHashMap<PlacementCompanyRecord>();
    expect(map.size()).toBe(0);
    expect(map.isEmpty()).toBe(true);
    expect(map.getCapacity()).toBe(16);
  });

  it("stores and retrieves company records correctly by ID in O(1) average time", () => {
    const map = new CompanyHashMap<PlacementCompanyRecord>();
    const google = SAMPLE_COMPANIES[0];
    const amazon = SAMPLE_COMPANIES[1];

    map.put(google.id, google);
    map.put(amazon.id, amazon);

    expect(map.size()).toBe(2);
    expect(map.has(google.id)).toBe(true);
    expect(map.has(amazon.id)).toBe(true);
    expect(map.get(google.id)).toEqual(google);
    expect(map.get(amazon.id)).toEqual(amazon);
  });

  it("returns undefined for non-existent company IDs", () => {
    const map = new CompanyHashMap<PlacementCompanyRecord>();
    expect(map.get("non-existent-id")).toBeUndefined();
    expect(map.has("non-existent-id")).toBe(false);
  });

  it("updates existing company record without increasing size", () => {
    const map = new CompanyHashMap<PlacementCompanyRecord>();
    const original = SAMPLE_COMPANIES[0];
    map.put(original.id, original);

    expect(map.size()).toBe(1);

    const updated: PlacementCompanyRecord = {
      ...original,
      minCgpa: 9.0,
      sector: "Artificial Intelligence",
    };
    map.put(original.id, updated);

    expect(map.size()).toBe(1);
    expect(map.get(original.id)?.minCgpa).toBe(9.0);
    expect(map.get(original.id)?.sector).toBe("Artificial Intelligence");
  });

  it("handles hash collisions gracefully using separate chaining", () => {
    // Force small initial capacity to deliberately create collisions
    const map = new CompanyHashMap<PlacementCompanyRecord>(4, 1.0);

    for (const company of SAMPLE_COMPANIES) {
      map.put(company.id, company);
    }

    expect(map.size()).toBe(SAMPLE_COMPANIES.length);

    // Verify all collided keys can still be retrieved correctly
    for (const company of SAMPLE_COMPANIES) {
      expect(map.has(company.id)).toBe(true);
      expect(map.get(company.id)).toEqual(company);
    }
  });

  it("automatically rehashes and doubles capacity when load factor exceeds threshold", () => {
    // Initial capacity 4, threshold 0.75 -> threshold exceeded when items > 3
    const map = new CompanyHashMap<PlacementCompanyRecord>(4, 0.75);
    expect(map.getCapacity()).toBe(4);

    map.put(SAMPLE_COMPANIES[0].id, SAMPLE_COMPANIES[0]);
    map.put(SAMPLE_COMPANIES[1].id, SAMPLE_COMPANIES[1]);
    map.put(SAMPLE_COMPANIES[2].id, SAMPLE_COMPANIES[2]);
    expect(map.getCapacity()).toBe(4);

    // 4th insert causes load factor (4/4 = 1.0 > 0.75), triggering rehash to 8
    map.put(SAMPLE_COMPANIES[3].id, SAMPLE_COMPANIES[3]);
    expect(map.getCapacity()).toBe(8);

    // Verify that all items remain accessible after rehashing
    for (let i = 0; i <= 3; i++) {
      expect(map.get(SAMPLE_COMPANIES[i].id)).toEqual(SAMPLE_COMPANIES[i]);
    }
  });

  it("deletes entries and correctly cleans up linked lists", () => {
    const map = new CompanyHashMap<PlacementCompanyRecord>(4, 2.0);
    const c1 = SAMPLE_COMPANIES[0];
    const c2 = SAMPLE_COMPANIES[1];
    const c3 = SAMPLE_COMPANIES[2];

    map.put(c1.id, c1);
    map.put(c2.id, c2);
    map.put(c3.id, c3);

    expect(map.delete(c2.id)).toBe(true);
    expect(map.has(c2.id)).toBe(false);
    expect(map.get(c2.id)).toBeUndefined();
    expect(map.size()).toBe(2);

    // Deleting again should return false
    expect(map.delete(c2.id)).toBe(false);

    // Other keys remain unaffected
    expect(map.get(c1.id)).toEqual(c1);
    expect(map.get(c3.id)).toEqual(c3);
  });

  it("extracts all keys and values correctly", () => {
    const map = new CompanyHashMap<PlacementCompanyRecord>();
    for (const c of SAMPLE_COMPANIES) {
      map.put(c.id, c);
    }

    const keys = map.keys();
    const values = map.values();

    expect(keys.length).toBe(SAMPLE_COMPANIES.length);
    expect(values.length).toBe(SAMPLE_COMPANIES.length);

    for (const c of SAMPLE_COMPANIES) {
      expect(keys).toContain(c.id);
      expect(values.some((v) => v.id === c.id)).toBe(true);
    }
  });

  it("clears all contents correctly", () => {
    const map = new CompanyHashMap<PlacementCompanyRecord>();
    for (const c of SAMPLE_COMPANIES) {
      map.put(c.id, c);
    }

    expect(map.size()).toBe(SAMPLE_COMPANIES.length);
    map.clear();
    expect(map.size()).toBe(0);
    expect(map.isEmpty()).toBe(true);
    expect(map.keys()).toEqual([]);
  });
});
