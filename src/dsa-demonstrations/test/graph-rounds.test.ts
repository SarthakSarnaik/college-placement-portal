import { describe, expect, it } from "vitest";
import { InterviewRoundGraph } from "../graph-rounds";
import { SAMPLE_ROUNDS } from "../types";

describe("DSA Concept 2: InterviewRoundGraph (BFS, DFS, DAG Topological Sort)", () => {
  function setupSampleGraph(): InterviewRoundGraph {
    const graph = new InterviewRoundGraph();
    for (const round of SAMPLE_ROUNDS) {
      graph.addRound(round);
    }
    // Set standard linear interview sequence:
    // OA -> Tech 1 -> Tech 2 -> System Design -> HR Final
    graph.addPrerequisite("rnd-oa-1", "rnd-tech-1");
    graph.addPrerequisite("rnd-tech-1", "rnd-tech-2");
    graph.addPrerequisite("rnd-tech-2", "rnd-sys-design");
    graph.addPrerequisite("rnd-sys-design", "rnd-hr-final");
    return graph;
  }

  it("adds interview nodes and directed prerequisite edges", () => {
    const graph = setupSampleGraph();
    expect(graph.getVertexCount()).toBe(5);
    const nextRounds = graph.getNextRounds("rnd-oa-1");
    expect(nextRounds.length).toBe(1);
    expect(nextRounds[0].id).toBe("rnd-tech-1");
  });

  it("throws error when adding prerequisite between nonexistent nodes", () => {
    const graph = new InterviewRoundGraph();
    graph.addRound(SAMPLE_ROUNDS[0]);

    expect(() => {
      graph.addPrerequisite("rnd-oa-1", "rnd-nonexistent");
    }).toThrow(/Both rounds must exist in graph/);
  });

  it("traverses interview rounds in level order using BFS", () => {
    const graph = setupSampleGraph();
    const bfsOrder = graph.bfs("rnd-oa-1");

    expect(bfsOrder.map((r) => r.id)).toEqual([
      "rnd-oa-1",
      "rnd-tech-1",
      "rnd-tech-2",
      "rnd-sys-design",
      "rnd-hr-final",
    ]);
  });

  it("traverses branched interview paths using BFS and DFS", () => {
    const graph = new InterviewRoundGraph();
    for (const round of SAMPLE_ROUNDS) {
      graph.addRound(round);
    }
    // Branching: OA unlocks Tech 1 AND Tech 2 concurrently
    graph.addPrerequisite("rnd-oa-1", "rnd-tech-1");
    graph.addPrerequisite("rnd-oa-1", "rnd-tech-2");
    graph.addPrerequisite("rnd-tech-1", "rnd-hr-final");
    graph.addPrerequisite("rnd-tech-2", "rnd-hr-final");

    const bfsResult = graph.bfs("rnd-oa-1").map((r) => r.id);
    expect(bfsResult[0]).toBe("rnd-oa-1");
    expect(bfsResult.slice(1, 3)).toEqual(expect.arrayContaining(["rnd-tech-1", "rnd-tech-2"]));
    expect(bfsResult[3]).toBe("rnd-hr-final");

    const dfsResult = graph.dfs("rnd-oa-1").map((r) => r.id);
    expect(dfsResult.length).toBe(4);
    expect(dfsResult[0]).toBe("rnd-oa-1");
  });

  it("computes valid topological ordering using Kahn's algorithm", () => {
    const graph = setupSampleGraph();
    const sorted = graph.topologicalSort();

    expect(sorted.length).toBe(5);

    // Verify prerequisite dependencies: for every edge u -> v, u appears before v
    const indices = new Map<string, number>();
    sorted.forEach((round, idx) => indices.set(round.id, idx));

    expect(indices.get("rnd-oa-1")!).toBeLessThan(indices.get("rnd-tech-1")!);
    expect(indices.get("rnd-tech-1")!).toBeLessThan(indices.get("rnd-tech-2")!);
    expect(indices.get("rnd-tech-2")!).toBeLessThan(indices.get("rnd-sys-design")!);
    expect(indices.get("rnd-sys-design")!).toBeLessThan(indices.get("rnd-hr-final")!);
  });

  it("detects cycle-free DAGs correctly", () => {
    const graph = setupSampleGraph();
    expect(graph.hasCycle()).toBe(false);
  });

  it("detects cyclic deadlocks when an invalid circular dependency is introduced", () => {
    const graph = setupSampleGraph();
    // Introduce deadlock cycle: HR Final -> OA
    graph.addPrerequisite("rnd-hr-final", "rnd-oa-1");

    expect(graph.hasCycle()).toBe(true);
    // Kahn's algorithm returns empty array when cyclic deadlock is detected
    expect(graph.topologicalSort()).toEqual([]);
  });

  it("finds shortest prerequisite transition path from start to target round", () => {
    const graph = setupSampleGraph();
    const path = graph.findPath("rnd-oa-1", "rnd-sys-design");

    expect(path).not.toBeNull();
    expect(path).toEqual(["rnd-oa-1", "rnd-tech-1", "rnd-tech-2", "rnd-sys-design"]);
  });

  it("returns null when no prerequisite path exists between disconnected rounds", () => {
    const graph = new InterviewRoundGraph();
    graph.addRound(SAMPLE_ROUNDS[0]);
    graph.addRound(SAMPLE_ROUNDS[1]);

    const path = graph.findPath(SAMPLE_ROUNDS[0].id, SAMPLE_ROUNDS[1].id);
    expect(path).toBeNull();
  });
});
