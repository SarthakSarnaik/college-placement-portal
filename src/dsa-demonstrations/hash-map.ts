/**
 * Concept 1: HashMap Implementation for Fast Entity Lookup
 *
 * Context in Placement Portal:
 * When students click recruiter cards or view company profiles, the system
 * frequently resolves recruiter metadata by its unique company ID (e.g., 'comp-goog-01').
 * A hash map maps string IDs directly to records in O(1) average time, preventing
 * expensive O(N) linear table scans.
 *
 * Time & Space Complexity:
 * - Insert / Update (`put`): Average O(1), Worst O(N) under hash collisions
 * - Lookup (`get`):           Average O(1), Worst O(N) under hash collisions
 * - Existence Check (`has`):  Average O(1), Worst O(N) under hash collisions
 * - Deletion (`delete`):      Average O(1), Worst O(N) under hash collisions
 * - Space Complexity:         O(N) where N is the number of stored key-value pairs
 */

import type { PlacementCompanyRecord } from "./types";

interface HashNode<V> {
  key: string;
  value: V;
  next: HashNode<V> | null;
}

export class CompanyHashMap<V = PlacementCompanyRecord> {
  private buckets: Array<HashNode<V> | null>;
  private capacity: number;
  private count: number;
  private readonly loadFactorThreshold: number;

  /**
   * @param initialCapacity Number of underlying buckets (default: 16)
   * @param loadFactorThreshold Ratio of count/capacity before resizing (default: 0.75)
   */
  constructor(initialCapacity = 16, loadFactorThreshold = 0.75) {
    this.capacity = Math.max(4, initialCapacity);
    this.loadFactorThreshold = loadFactorThreshold;
    this.count = 0;
    this.buckets = new Array<HashNode<V> | null>(this.capacity).fill(null);
  }

  /**
   * Polynomial rolling hash function.
   * Produces an integer index within [0, capacity - 1] for a given string key.
   * Time Complexity: O(L) where L is string length.
   */
  private hash(key: string): number {
    let hashVal = 0;
    const prime = 31;
    for (let i = 0; i < key.length; i++) {
      hashVal = (hashVal * prime + key.charCodeAt(i)) >>> 0;
    }
    return hashVal % this.capacity;
  }

  /**
   * Current number of stored elements.
   * Time Complexity: O(1)
   */
  public size(): number {
    return this.count;
  }

  /**
   * Check whether the hash map contains zero elements.
   * Time Complexity: O(1)
   */
  public isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Current bucket array capacity.
   * Time Complexity: O(1)
   */
  public getCapacity(): number {
    return this.capacity;
  }

  /**
   * Current load factor (count / capacity).
   * Time Complexity: O(1)
   */
  public getLoadFactor(): number {
    return this.count / this.capacity;
  }

  /**
   * Insert or update a company record by key.
   * Automatically rehashes and doubles capacity if the load factor exceeds the threshold.
   *
   * Example:
   * ```ts
   * map.put("comp-goog-01", { name: "Google", ... });
   * ```
   * Time Complexity: Average O(1), Worst O(N)
   */
  public put(key: string, value: V): void {
    const bucketIndex = this.hash(key);
    const head = this.buckets[bucketIndex];

    // Traverse existing bucket chain to update if key already exists
    let curr: HashNode<V> | null = head;
    while (curr !== null) {
      if (curr.key === key) {
        curr.value = value;
        return;
      }
      curr = curr.next;
    }

    // Insert new node at bucket head (separate chaining)
    const newNode: HashNode<V> = {
      key,
      value,
      next: head,
    };
    this.buckets[bucketIndex] = newNode;
    this.count++;

    // Rehash if load factor threshold breached
    if (this.count / this.capacity > this.loadFactorThreshold) {
      this.rehash(this.capacity * 2);
    }
  }

  /**
   * Retrieve a record by key.
   * Returns undefined if key is not found.
   *
   * Example:
   * ```ts
   * const google = map.get("comp-goog-01");
   * ```
   * Time Complexity: Average O(1), Worst O(N)
   */
  public get(key: string): V | undefined {
    const bucketIndex = this.hash(key);
    let curr = this.buckets[bucketIndex];

    while (curr !== null) {
      if (curr.key === key) {
        return curr.value;
      }
      curr = curr.next;
    }

    return undefined;
  }

  /**
   * Check if a key exists in the hash map.
   * Time Complexity: Average O(1), Worst O(N)
   */
  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Remove a key and its associated value from the hash map.
   * Returns true if deleted, false if key was absent.
   * Time Complexity: Average O(1), Worst O(N)
   */
  public delete(key: string): boolean {
    const bucketIndex = this.hash(key);
    let curr = this.buckets[bucketIndex];
    let prev: HashNode<V> | null = null;

    while (curr !== null) {
      if (curr.key === key) {
        if (prev === null) {
          this.buckets[bucketIndex] = curr.next;
        } else {
          prev.next = curr.next;
        }
        this.count--;
        return true;
      }
      prev = curr;
      curr = curr.next;
    }

    return false;
  }

  /**
   * Returns an array of all keys stored in the map.
   * Time Complexity: O(N + C) where C is capacity.
   */
  public keys(): string[] {
    const result: string[] = [];
    for (const head of this.buckets) {
      let curr = head;
      while (curr !== null) {
        result.push(curr.key);
        curr = curr.next;
      }
    }
    return result;
  }

  /**
   * Returns an array of all values stored in the map.
   * Time Complexity: O(N + C).
   */
  public values(): V[] {
    const result: V[] = [];
    for (const head of this.buckets) {
      let curr = head;
      while (curr !== null) {
        result.push(curr.value);
        curr = curr.next;
      }
    }
    return result;
  }

  /**
   * Clears all entries from the hash map.
   */
  public clear(): void {
    this.buckets = new Array<HashNode<V> | null>(this.capacity).fill(null);
    this.count = 0;
  }

  /**
   * Doubles capacity and redistributes all existing entries into new bucket indices.
   * Time Complexity: O(N + C)
   * Space Complexity: O(newCapacity)
   */
  private rehash(newCapacity: number): void {
    const oldBuckets = this.buckets;
    this.capacity = newCapacity;
    this.buckets = new Array<HashNode<V> | null>(this.capacity).fill(null);
    this.count = 0;

    for (const head of oldBuckets) {
      let curr = head;
      while (curr !== null) {
        this.put(curr.key, curr.value);
        curr = curr.next;
      }
    }
  }
}
