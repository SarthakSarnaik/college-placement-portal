/**
 * Concept 2: Graph Modeling & Traversal (BFS & DFS) for Interview Sequences
 *
 * Context in Placement Portal:
 * A company's hiring process is not just an isolated list; it is a directed
 * sequence of stages with clear dependencies. For example, clearing the Online
 * Coding Assessment is a prerequisite to attend Technical Interview 1, which in turn
 * unlocks System Design and the Final HR round.
 *
 * Modeling interview rounds as a Directed Acyclic Graph (DAG) allows students to:
 * 1. Traverse round progressions level-by-level using Breadth-First Search (BFS).
 * 2. Explore deep specialization tracks using Depth-First Search (DFS).
 * 3. Compute optimal preparation sequences using Topological Sorting.
 * 4. Verify that interview prerequisites have no circular deadlocks (Cycle Detection).
 *
 * Time & Space Complexity:
 * - BFS Traversal:        Time O(V + E), Space O(V)
 * - DFS Traversal:        Time O(V + E), Space O(V)
 * - Topological Sorting:  Time O(V + E), Space O(V)
 * - Cycle Detection:      Time O(V + E), Space O(V)
 * where V is the number of interview rounds (vertices) and E is the number
 * of prerequisite transitions (edges).
 */

import type { InterviewRoundNode } from "./types";

export class InterviewRoundGraph {
  private nodes: Map<string, InterviewRoundNode>;
  private adjacencyList: Map<string, string[]>;
  private inDegree: Map<string, number>;

  constructor() {
    this.nodes = new Map();
    this.adjacencyList = new Map();
    this.inDegree = new Map();
  }

  /**
   * Register an interview round node into the graph.
   * Time Complexity: O(1)
   */
  public addRound(round: InterviewRoundNode): void {
    if (!this.nodes.has(round.id)) {
      this.nodes.set(round.id, round);
      this.adjacencyList.set(round.id, []);
      this.inDegree.set(round.id, 0);
    }
  }

  /**
   * Add a directed dependency: fromRound must be completed before toRound can begin.
   * Time Complexity: O(1)
   */
  public addPrerequisite(fromRoundId: string, toRoundId: string): void {
    if (!this.nodes.has(fromRoundId) || !this.nodes.has(toRoundId)) {
      throw new Error(
        `Cannot add dependency: Both rounds must exist in graph (${fromRoundId} -> ${toRoundId})`,
      );
    }

    const neighbors = this.adjacencyList.get(fromRoundId)!;
    if (!neighbors.includes(toRoundId)) {
      neighbors.push(toRoundId);
      this.inDegree.set(toRoundId, (this.inDegree.get(toRoundId) ?? 0) + 1);
    }
  }

  /**
   * Retrieve a round node by its identifier.
   */
  public getRound(id: string): InterviewRoundNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Retrieve all immediate next rounds following the given round.
   */
  public getNextRounds(id: string): InterviewRoundNode[] {
    const nextIds = this.adjacencyList.get(id) ?? [];
    return nextIds.map((nextId) => this.nodes.get(nextId)!).filter(Boolean);
  }

  /**
   * Total number of rounds (vertices).
   */
  public getVertexCount(): number {
    return this.nodes.size;
  }

  /**
   * Breadth-First Search (BFS) Traversal.
   * Explores interview rounds level-by-level starting from an initial stage.
   *
   * Example Use Case:
   * Identifying all immediately upcoming and secondary interview rounds
   * to prioritize near-term preparation.
   *
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  public bfs(startRoundId: string): InterviewRoundNode[] {
    if (!this.nodes.has(startRoundId)) return [];

    const visited = new Set<string>();
    const queue: string[] = [startRoundId];
    const order: InterviewRoundNode[] = [];

    visited.add(startRoundId);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const round = this.nodes.get(currentId);
      if (round) order.push(round);

      const neighbors = this.adjacencyList.get(currentId) ?? [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return order;
  }

  /**
   * Depth-First Search (DFS) Traversal.
   * Explores as far as possible along each interview path before backtracking.
   *
   * Example Use Case:
   * Tracing the complete vertical track from preliminary screening through
   * senior technical and partner rounds.
   *
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  public dfs(startRoundId: string): InterviewRoundNode[] {
    if (!this.nodes.has(startRoundId)) return [];

    const visited = new Set<string>();
    const order: InterviewRoundNode[] = [];

    const explore = (currentId: string) => {
      visited.add(currentId);
      const round = this.nodes.get(currentId);
      if (round) order.push(round);

      const neighbors = this.adjacencyList.get(currentId) ?? [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          explore(neighborId);
        }
      }
    };

    explore(startRoundId);
    return order;
  }

  /**
   * Topological Sort (Kahn's Algorithm).
   * Determines a valid linear execution order for all rounds respecting all prerequisites.
   * Returns empty array if a cycle exists (invalid interview sequence).
   *
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  public topologicalSort(): InterviewRoundNode[] {
    const inDegreeCopy = new Map<string, number>(this.inDegree);
    const queue: string[] = [];
    const sortedOrder: InterviewRoundNode[] = [];

    // Enqueue all stages with 0 incoming prerequisites
    for (const [id, deg] of inDegreeCopy.entries()) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      sortedOrder.push(this.nodes.get(currentId)!);

      const neighbors = this.adjacencyList.get(currentId) ?? [];
      for (const neighborId of neighbors) {
        const newDeg = (inDegreeCopy.get(neighborId) ?? 1) - 1;
        inDegreeCopy.set(neighborId, newDeg);
        if (newDeg === 0) {
          queue.push(neighborId);
        }
      }
    }

    // If topological sort does not include all vertices, a cycle was detected
    if (sortedOrder.length !== this.nodes.size) {
      return [];
    }

    return sortedOrder;
  }

  /**
   * Detects whether the round dependency graph has circular references (cycles).
   * Time Complexity: O(V + E)
   */
  public hasCycle(): boolean {
    return this.topologicalSort().length !== this.nodes.size;
  }

  /**
   * Find the shortest sequence of rounds connecting startRound to targetRound using BFS.
   * Returns array of round IDs, or null if target is unreachable.
   * Time Complexity: O(V + E)
   * Space Complexity: O(V)
   */
  public findPath(startRoundId: string, targetRoundId: string): string[] | null {
    if (!this.nodes.has(startRoundId) || !this.nodes.has(targetRoundId)) return null;
    if (startRoundId === targetRoundId) return [startRoundId];

    const visited = new Set<string>();
    const parent = new Map<string, string | null>();
    const queue: string[] = [startRoundId];

    visited.add(startRoundId);
    parent.set(startRoundId, null);

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (currentId === targetRoundId) {
        // Reconstruct path backwards
        const path: string[] = [];
        let curr: string | null = targetRoundId;
        while (curr !== null) {
          path.unshift(curr);
          curr = parent.get(curr) ?? null;
        }
        return path;
      }

      const neighbors = this.adjacencyList.get(currentId) ?? [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          parent.set(neighborId, currentId);
          queue.push(neighborId);
        }
      }
    }

    return null;
  }
}
