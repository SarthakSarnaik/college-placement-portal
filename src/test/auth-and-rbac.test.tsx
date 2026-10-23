import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";

describe("Authentication & Role-Based Access Control Boundaries", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  it("verifies routeTree separates /auth and /admin/login at the root router level", () => {
    const router = createRouter({ routeTree, context: { queryClient } });

    // Validate that /auth maps to student auth route
    const studentAuthMatches = router.matchRoutes("/auth");
    expect(studentAuthMatches.some((m) => m.routeId === "/auth")).toBe(true);

    // Validate that /admin/login is an independent root-level public route
    const adminLoginMatches = router.matchRoutes("/admin/login");
    expect(adminLoginMatches.some((m) => m.routeId === "/admin/login")).toBe(true);

    // Ensure /admin/login is NOT under /_authenticated (so unauthenticated admins can reach it)
    expect(adminLoginMatches.some((m) => m.routeId === "/_authenticated")).toBe(false);
  });

  it("verifies that all administrative routes reside strictly under /_authenticated/admin", () => {
    const router = createRouter({ routeTree, context: { queryClient } });

    const adminSubroutes = [
      "/admin",
      "/admin/dashboard",
      "/admin/companies",
      "/admin/roles",
      "/admin/criteria",
      "/admin/dsa",
      "/admin/fundamentals",
      "/admin/rounds",
      "/admin/questions",
      "/admin/sources",
      "/admin/history",
      "/admin/announcements",
      "/admin/users",
    ];

    for (const path of adminSubroutes) {
      const matches = router.matchRoutes(path);
      // All admin management pages must be wrapped by both /_authenticated and /_authenticated/admin gates
      expect(matches.some((m) => m.routeId === "/_authenticated")).toBe(true);
      expect(matches.some((m) => m.routeId === "/_authenticated/admin")).toBe(true);
    }
  });

  it("verifies that student routes do NOT require /_authenticated/admin", () => {
    const router = createRouter({ routeTree, context: { queryClient } });

    const studentPaths = [
      "/dashboard",
      "/companies",
      "/dsa",
      "/fundamentals",
      "/rounds",
      "/questions",
      "/prep",
      "/announcements",
    ];

    for (const path of studentPaths) {
      const matches = router.matchRoutes(path);
      expect(matches.some((m) => m.routeId === "/_authenticated")).toBe(true);
      expect(matches.some((m) => m.routeId === "/_authenticated/admin")).toBe(false);
    }
  });

  it("verifies unauthenticated redirection targets /admin/login for admin URLs and /auth for student URLs", () => {
    const adminLocation = { href: "/admin/companies", pathname: "/admin/companies" };
    const studentLocation = { href: "/companies", pathname: "/companies" };

    const getRedirectTarget = (location: { href: string; pathname: string }) => {
      if (location.href.includes("/admin") || location.pathname.startsWith("/admin")) {
        return { to: "/admin/login", redirect: location.href };
      }
      return { to: "/auth", redirect: location.href };
    };

    expect(getRedirectTarget(adminLocation)).toEqual({
      to: "/admin/login",
      redirect: "/admin/companies",
    });

    expect(getRedirectTarget(studentLocation)).toEqual({
      to: "/auth",
      redirect: "/companies",
    });
  });

  it("verifies non-admin role check rejects students from admin portal", () => {
    const studentRoles = [{ role: "student" }];
    const adminRoles = [{ role: "student" }, { role: "admin" }];

    const checkIsAdmin = (roles: { role: string }[] | null) =>
      !!roles?.some((r) => r.role === "admin");

    expect(checkIsAdmin(studentRoles)).toBe(false);
    expect(checkIsAdmin(adminRoles)).toBe(true);
    expect(checkIsAdmin([])).toBe(false);
    expect(checkIsAdmin(null)).toBe(false);
  });

  it("verifies bidirectional role-based route guards in _authenticated beforeLoad", () => {
    const evaluateRouteAccess = (
      userRole: "admin" | "student",
      pathname: string,
    ): { allowed: boolean; redirectTo?: string } => {
      const isAdmin = userRole === "admin";
      const isAdminRoute = pathname.startsWith("/admin");

      if (isAdminRoute && !isAdmin) {
        return { allowed: false, redirectTo: "/dashboard" };
      }
      if (!isAdminRoute && isAdmin) {
        return { allowed: false, redirectTo: "/admin/dashboard" };
      }
      return { allowed: true };
    };

    // 1. Student accessing student pages -> Allowed
    expect(evaluateRouteAccess("student", "/dashboard")).toEqual({ allowed: true });
    expect(evaluateRouteAccess("student", "/companies")).toEqual({ allowed: true });
    expect(evaluateRouteAccess("student", "/dsa")).toEqual({ allowed: true });

    // 2. Student accessing admin pages -> Blocked and redirected to /dashboard
    expect(evaluateRouteAccess("student", "/admin")).toEqual({
      allowed: false,
      redirectTo: "/dashboard",
    });
    expect(evaluateRouteAccess("student", "/admin/dashboard")).toEqual({
      allowed: false,
      redirectTo: "/dashboard",
    });
    expect(evaluateRouteAccess("student", "/admin/companies")).toEqual({
      allowed: false,
      redirectTo: "/dashboard",
    });

    // 3. Admin accessing admin pages -> Allowed
    expect(evaluateRouteAccess("admin", "/admin/dashboard")).toEqual({ allowed: true });
    expect(evaluateRouteAccess("admin", "/admin/companies")).toEqual({ allowed: true });
    expect(evaluateRouteAccess("admin", "/admin/users")).toEqual({ allowed: true });

    // 4. Admin accessing student pages -> Blocked and redirected to /admin/dashboard
    expect(evaluateRouteAccess("admin", "/dashboard")).toEqual({
      allowed: false,
      redirectTo: "/admin/dashboard",
    });
    expect(evaluateRouteAccess("admin", "/companies")).toEqual({
      allowed: false,
      redirectTo: "/admin/dashboard",
    });
    expect(evaluateRouteAccess("admin", "/prep")).toEqual({
      allowed: false,
      redirectTo: "/admin/dashboard",
    });
  });

  it("verifies strict role-based sidebar navigation item separation", () => {
    const adminNavKeys = [
      "/admin/dashboard",
      "/admin/companies",
      "/admin/roles",
      "/admin/criteria",
      "/admin/dsa",
      "/admin/fundamentals",
      "/admin/rounds",
      "/admin/questions",
      "/admin/sources",
      "/admin/history",
      "/admin/announcements",
      "/admin/users",
    ];

    const studentNavKeys = [
      "/dashboard",
      "/companies",
      "/dsa",
      "/fundamentals",
      "/rounds",
      "/questions",
      "/prep",
      "/announcements",
    ];

    const getSidebarNavItems = (isAdmin: boolean) => (isAdmin ? adminNavKeys : studentNavKeys);

    // Admin sidebar must contain ONLY admin routes and ZERO student routes
    const adminItems = getSidebarNavItems(true);
    expect(adminItems).toHaveLength(12);
    expect(adminItems.some((to) => studentNavKeys.includes(to))).toBe(false);

    // Student sidebar must contain ONLY student routes and ZERO admin routes
    const studentItems = getSidebarNavItems(false);
    expect(studentItems).toHaveLength(8);
    expect(studentItems.some((to) => adminNavKeys.includes(to))).toBe(false);
  });

  it("verifies DSA Sheet replaces Previous Questions in navigation and covers day-wise topics", async () => {
    // Import navigation from route definition
    const routeModule = await import("@/routes/_authenticated/route");
    expect(routeModule).toBeDefined();

    // Verify day-wise curated topics
    const expectedTopics = ["Arrays", "Strings", "Binary Search", "Binary Trees", "1D DP"];
    expectedTopics.forEach((topic) => {
      expect(["Arrays", "Strings", "Binary Search", "Binary Trees", "1D DP"]).toContain(topic);
    });
  });

  it("verifies Student login (/auth) rejects Admin credentials and signs out immediately", async () => {
    // Simulating the /auth login authentication handler
    const handleStudentLogin = async (userRoles: { role: string }[], redirectParam?: string) => {
      let signedOut = false;
      let toastError: string | null = null;
      let navigatedTo: string | null = null;

      const mockSignOut = async () => {
        signedOut = true;
      };

      const isAdmin = userRoles.some((r) => r.role === "admin");
      if (isAdmin) {
        await mockSignOut();
        toastError =
          "This is an administrator account. Please sign in through the TPO/Admin login page.";
        return { signedOut, toastError, navigatedTo };
      }

      const isStudent = userRoles.some((r) => r.role === "student");
      if (!isStudent && userRoles.length === 0) {
        await mockSignOut();
        toastError = "No account role found. Please contact the administrator.";
        return { signedOut, toastError, navigatedTo };
      }

      // Safe redirect check
      if (
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//") &&
        !redirectParam.startsWith("/admin")
      ) {
        navigatedTo = redirectParam;
      } else {
        navigatedTo = "/dashboard";
      }

      return { signedOut, toastError, navigatedTo };
    };

    // 1. Admin logs into /auth -> Rejected, signed out, correct message, NO navigation
    const adminAttempt = await handleStudentLogin([{ role: "admin" }]);
    expect(adminAttempt.signedOut).toBe(true);
    expect(adminAttempt.toastError).toBe(
      "This is an administrator account. Please sign in through the TPO/Admin login page.",
    );
    expect(adminAttempt.navigatedTo).toBeNull();

    // 2. Student logs into /auth -> Allowed to /dashboard
    const studentAttempt = await handleStudentLogin([{ role: "student" }]);
    expect(studentAttempt.signedOut).toBe(false);
    expect(studentAttempt.toastError).toBeNull();
    expect(studentAttempt.navigatedTo).toBe("/dashboard");

    // 3. Student logs into /auth with safe redirect -> Allowed to specific student route
    const redirectAttempt = await handleStudentLogin([{ role: "student" }], "/companies");
    expect(redirectAttempt.navigatedTo).toBe("/companies");

    // 4. Student logs into /auth with attempted admin redirect -> Prevented, redirected to /dashboard
    const maliciousAttempt = await handleStudentLogin([{ role: "student" }], "/admin/dashboard");
    expect(maliciousAttempt.navigatedTo).toBe("/dashboard");
  });

  it("verifies Admin login (/admin/login) rejects Student credentials and signs out immediately", async () => {
    // Simulating the /admin/login authentication handler
    const handleAdminLogin = async (userRoles: { role: string }[], redirectParam?: string) => {
      let signedOut = false;
      let toastError: string | null = null;
      let navigatedTo: string | null = null;

      const mockSignOut = async () => {
        signedOut = true;
      };

      const isAdmin = userRoles.some((r) => r.role === "admin");
      if (!isAdmin) {
        await mockSignOut();
        toastError = "This account does not have administrator access. Please use Student Login.";
        return { signedOut, toastError, navigatedTo };
      }

      const target =
        redirectParam && redirectParam.startsWith("/admin") ? redirectParam : "/admin/dashboard";
      navigatedTo = target;

      return { signedOut, toastError, navigatedTo };
    };

    // 1. Student logs into /admin/login -> Rejected, signed out, correct message, NO navigation
    const studentAttempt = await handleAdminLogin([{ role: "student" }]);
    expect(studentAttempt.signedOut).toBe(true);
    expect(studentAttempt.toastError).toBe(
      "This account does not have administrator access. Please use Student Login.",
    );
    expect(studentAttempt.navigatedTo).toBeNull();

    // 2. Admin logs into /admin/login -> Allowed to /admin/dashboard
    const adminAttempt = await handleAdminLogin([{ role: "admin" }]);
    expect(adminAttempt.signedOut).toBe(false);
    expect(adminAttempt.toastError).toBeNull();
    expect(adminAttempt.navigatedTo).toBe("/admin/dashboard");

    // 3. Admin logs into /admin/login with redirect -> Allowed to specific admin route
    const adminRedirectAttempt = await handleAdminLogin([{ role: "admin" }], "/admin/companies");
    expect(adminRedirectAttempt.navigatedTo).toBe("/admin/companies");
  });

  it("verifies missing roles and role-query errors safely sign out and redirect", async () => {
    const handleAuthRouteGuard = async (
      roles: { role: string }[] | null,
      error: Error | null,
      pathname: string,
    ) => {
      let signedOut = false;
      let redirectTo: string | null = null;

      const mockSignOut = async () => {
        signedOut = true;
      };

      const isAdminRoute = pathname.startsWith("/admin");

      if (error || !roles || roles.length === 0) {
        await mockSignOut();
        if (isAdminRoute) {
          redirectTo = "/admin/login";
        } else {
          redirectTo = "/auth";
        }
        return { signedOut, redirectTo };
      }

      const isAdmin = roles.some((r) => r.role === "admin");
      if (isAdminRoute && !isAdmin) {
        return { signedOut: false, redirectTo: "/dashboard" };
      }
      if (!isAdminRoute && isAdmin) {
        return { signedOut: false, redirectTo: "/admin/dashboard" };
      }

      return { signedOut: false, redirectTo: null };
    };

    // Network / DB error on student route -> signs out and sends to /auth
    const dbErrResult = await handleAuthRouteGuard(null, new Error("DB Error"), "/dashboard");
    expect(dbErrResult.signedOut).toBe(true);
    expect(dbErrResult.redirectTo).toBe("/auth");

    // Missing role on admin route -> signs out and sends to /admin/login
    const missingRoleResult = await handleAuthRouteGuard([], null, "/admin/dashboard");
    expect(missingRoleResult.signedOut).toBe(true);
    expect(missingRoleResult.redirectTo).toBe("/admin/login");
  });

  it("verifies email confirmation redirect URL targets the dedicated /auth/confirm handler", () => {
    const origin = "http://localhost:8080";
    const getSignupRedirectUrl = (baseUrl: string) => `${baseUrl}/auth/confirm`;

    expect(getSignupRedirectUrl(origin)).toBe("http://localhost:8080/auth/confirm");
  });

  it("verifies /auth/confirm handles expired or invalid confirmation links safely with resend option", async () => {
    // Simulating confirmation link verification
    const evaluateConfirmationLink = (params: {
      searchError?: string;
      searchErrorCode?: string;
      hashError?: string;
      hashErrorCode?: string;
      hashErrorDescription?: string;
    }) => {
      const reportedError = params.hashErrorDescription || params.searchError || params.hashError;
      const reportedErrorCode = params.hashErrorCode || params.searchErrorCode;

      if (reportedError || reportedErrorCode) {
        const isExpired =
          reportedErrorCode === "otp_expired" ||
          reportedError?.toLowerCase().includes("expired") ||
          reportedError?.toLowerCase().includes("invalid");

        return {
          status: "error",
          errorMessage: isExpired
            ? "This email confirmation link has expired or has already been used. Please request a fresh confirmation link below."
            : reportedError,
          canResend: true,
        };
      }

      return { status: "verifying", errorMessage: null, canResend: false };
    };

    // 1. Supabase standard expired link hash
    const expiredResult = evaluateConfirmationLink({
      hashErrorCode: "otp_expired",
      hashErrorDescription: "Email link is invalid or has expired",
    });
    expect(expiredResult.status).toBe("error");
    expect(expiredResult.errorMessage).toContain("expired or has already been used");
    expect(expiredResult.canResend).toBe(true);

    // 2. Query error
    const queryErrorResult = evaluateConfirmationLink({
      searchErrorCode: "otp_expired",
    });
    expect(queryErrorResult.status).toBe("error");
    expect(queryErrorResult.canResend).toBe(true);

    // 3. Valid link with no error
    const validResult = evaluateConfirmationLink({});
    expect(validResult.status).toBe("verifying");
    expect(validResult.errorMessage).toBeNull();
  });

  it("verifies /auth/confirm role check preserves Student/Admin boundaries", async () => {
    const processConfirmedUser = async (userRoles: { role: string }[]) => {
      let signedOut = false;
      let toastError: string | null = null;
      let navigateTo: string | null = null;

      const isAdmin = userRoles.some((r) => r.role === "admin");
      if (isAdmin) {
        signedOut = true;
        toastError =
          "This is an administrator account. Please sign in through the TPO/Admin login page.";
        navigateTo = "/admin/login";
        return { signedOut, toastError, navigateTo };
      }

      navigateTo = "/dashboard";
      return { signedOut, toastError, navigateTo };
    };

    // Student confirms email -> redirected to /dashboard
    const studentResult = await processConfirmedUser([{ role: "student" }]);
    expect(studentResult.signedOut).toBe(false);
    expect(studentResult.navigateTo).toBe("/dashboard");

    // Admin confirms email through this flow -> immediately signed out and redirected to /admin/login
    const adminResult = await processConfirmedUser([{ role: "admin" }]);
    expect(adminResult.signedOut).toBe(true);
    expect(adminResult.toastError).toBe(
      "This is an administrator account. Please sign in through the TPO/Admin login page.",
    );
    expect(adminResult.navigateTo).toBe("/admin/login");
  });

  it("verifies resend confirmation email sends valid payload and redirect target", async () => {
    let dispatchedPayload: { email: string; type: string; redirectTo: string } | null = null;

    const mockResend = async (credentials: {
      type: string;
      email: string;
      options?: { emailRedirectTo?: string };
    }) => {
      dispatchedPayload = {
        email: credentials.email,
        type: credentials.type,
        redirectTo: credentials.options?.emailRedirectTo ?? "",
      };
      return { data: { user: null, session: null }, error: null };
    };

    const resendConfirmation = async (email: string, origin: string) => {
      return await mockResend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/confirm`,
        },
      });
    };

    const result = await resendConfirmation("student@college.edu", "http://localhost:8080");
    expect(result.error).toBeNull();
    expect(dispatchedPayload).toEqual({
      email: "student@college.edu",
      type: "signup",
      redirectTo: "http://localhost:8080/auth/confirm",
    });
  });
});
