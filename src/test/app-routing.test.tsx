import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

describe("Placement Portal Routing & Architecture", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it("matches the public landing page route /", () => {
    const matches = router.matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/")).toBe(true);
  });

  it("matches the dedicated student login route /auth", () => {
    const matches = router.matchRoutes("/auth");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/auth")).toBe(true);
  });

  it("matches the separate administrator login route /admin/login", () => {
    const matches = router.matchRoutes("/admin/login");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/admin/login")).toBe(true);
  });

  it("matches the student dashboard route /dashboard", () => {
    const matches = router.matchRoutes("/dashboard");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/_authenticated/dashboard")).toBe(true);
  });

  it("matches the administrative dashboard route /admin/dashboard", () => {
    const matches = router.matchRoutes("/admin/dashboard");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/_authenticated/admin/dashboard")).toBe(true);
  });

  it("matches the core student placement intelligence routes", () => {
    const studentRoutes = [
      { path: "/companies", expected: "/_authenticated/companies/" },
      { path: "/dsa", expected: "/_authenticated/dsa" },
      { path: "/fundamentals", expected: "/_authenticated/fundamentals" },
      { path: "/rounds", expected: "/_authenticated/rounds" },
      { path: "/questions", expected: "/_authenticated/questions" },
      { path: "/prep", expected: "/_authenticated/prep" },
      { path: "/announcements", expected: "/_authenticated/announcements" },
    ];

    for (const { path, expected } of studentRoutes) {
      const matches = router.matchRoutes(path);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
      expect(matches.some((m) => m.routeId === expected)).toBe(true);
    }
  });

  it("matches the TPO administrative CRUD routes", () => {
    const adminRoutes = [
      { path: "/admin", expected: "/_authenticated/admin/" },
      { path: "/admin/companies", expected: "/_authenticated/admin/companies" },
      { path: "/admin/roles", expected: "/_authenticated/admin/roles" },
      { path: "/admin/criteria", expected: "/_authenticated/admin/criteria" },
      { path: "/admin/dsa", expected: "/_authenticated/admin/dsa" },
      { path: "/admin/fundamentals", expected: "/_authenticated/admin/fundamentals" },
      { path: "/admin/rounds", expected: "/_authenticated/admin/rounds" },
      { path: "/admin/questions", expected: "/_authenticated/admin/questions" },
      { path: "/admin/sources", expected: "/_authenticated/admin/sources" },
      { path: "/admin/history", expected: "/_authenticated/admin/history" },
      { path: "/admin/announcements", expected: "/_authenticated/admin/announcements" },
      { path: "/admin/users", expected: "/_authenticated/admin/users" },
    ];

    for (const { path, expected } of adminRoutes) {
      const matches = router.matchRoutes(path);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
      expect(matches.some((m) => m.routeId === expected)).toBe(true);
    }
  });

  it("matches the dedicated public email confirmation route /auth/confirm", () => {
    const matches = router.matchRoutes("/auth/confirm");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/auth/confirm")).toBe(true);
    // Ensure /auth/confirm is public and NOT guarded by /_authenticated
    expect(matches.some((m) => m.routeId === "/_authenticated")).toBe(false);
  });
});
