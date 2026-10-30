import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Code2,
  ListOrdered,
  FileCode2,
  BookOpen,
  Megaphone,
  ShieldCheck,
  Briefcase,
  ClipboardCheck,
  History,
  Users,
  FileCheck2,
  LogOut,
  Menu,
  X,
  ListChecks,
  GraduationCap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      if (location.href.includes("/admin") || location.pathname.startsWith("/admin")) {
        throw redirect({ to: "/admin/login", search: { redirect: location.href } });
      }
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }

    // Role-based route guard: check user role from database
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const isAdminRoute = location.pathname.startsWith("/admin") || location.href.includes("/admin");

    if (roleError || !roles || roles.length === 0) {
      // In case of role error or missing role, safely clear session and redirect
      await supabase.auth.signOut();
      if (isAdminRoute) {
        throw redirect({ to: "/admin/login" });
      }
      throw redirect({ to: "/auth" });
    }

    const isAdmin = !!roles.some((r) => r.role === "admin");

    if (isAdminRoute && !isAdmin) {
      // Students accessing /admin/* are strictly redirected to /dashboard
      throw redirect({ to: "/dashboard" });
    }

    if (!isAdminRoute && isAdmin) {
      // Admins accessing student-only routes are strictly redirected to /admin/dashboard
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  component: AppShell,
});

const studentNav = [
  { to: "/dashboard", label: "Student Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/dsa", label: "DSA Requirements", icon: Code2 },
  { to: "/fundamentals", label: "CS Fundamentals", icon: GraduationCap },
  { to: "/rounds", label: "Interview Rounds", icon: ListOrdered },
  { to: "/questions", label: "DSA Sheet", icon: FileCode2 },
  { to: "/prep", label: "Preparation Guide", icon: BookOpen },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
] as const;

const adminNav = [
  { to: "/admin/dashboard", label: "Admin Dashboard", icon: ShieldCheck },
  { to: "/admin/companies", label: "Manage Companies", icon: Building2 },
  { to: "/admin/roles", label: "Job Roles", icon: Briefcase },
  { to: "/admin/criteria", label: "Eligibility Criteria", icon: ClipboardCheck },
  { to: "/admin/dsa", label: "DSA Topics", icon: Code2 },
  { to: "/admin/fundamentals", label: "CS Fundamentals", icon: GraduationCap },
  { to: "/admin/rounds", label: "Interview Rounds", icon: ListChecks },
  { to: "/admin/questions", label: "DSA Sheet", icon: FileCode2 },
  { to: "/admin/sources", label: "Source Verification", icon: FileCheck2 },
  { to: "/admin/history", label: "Criteria History", icon: History },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/users", label: "User Management", icon: Users },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof Users;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeOptions={{ exact: to === "/admin" || to === "/admin/dashboard" || to === "/dashboard" }}
      className="group flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white"
      activeProps={{
        className:
          "!bg-slate-900 !text-white shadow-2xs dark:!bg-slate-800 dark:!text-white font-semibold",
      }}
    >
      <Icon
        className="size-4 shrink-0 transition-transform group-hover:scale-105"
        strokeWidth={1.8}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

function AppShell() {
  const { data: me, isLoading } = useMe();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    const wasAdmin = me?.isAdmin;
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    if (wasAdmin) {
      navigate({ to: "/admin/login", replace: true });
    } else {
      navigate({ to: "/auth", replace: true });
    }
  }

  const close = () => setOpen(false);

  const sidebarContent = (
    <nav
      className="flex h-full flex-col justify-between overflow-y-auto px-3 py-4"
      aria-label="Main Navigation"
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-2 p-2">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800/50" />
            <div className="h-8 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800/50" />
            <div className="h-8 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800/50" />
          </div>
        ) : me?.isAdmin ? (
          <div>
            <div className="mb-2.5 flex items-center justify-between px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                TPO Administration
              </span>
              <span className="rounded-[4px] border border-slate-900/20 bg-slate-900/5 px-1.5 py-0.5 text-[9px] font-bold text-slate-800 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300">
                STAFF
              </span>
            </div>
            <div className="space-y-0.5">
              {adminNav.map((n) => (
                <NavItem key={n.to} {...n} onClick={close} />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2.5 flex items-center justify-between px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Student Portal
              </span>
              <span className="rounded-[4px] border border-border bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                STUDENT
              </span>
            </div>
            <div className="space-y-0.5">
              {studentNav.map((n) => (
                <NavItem key={n.to} {...n} onClick={close} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-border/80 pt-4">
        {/* User Profile Summary */}
        {me && (
          <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-slate-50/70 p-2.5 dark:bg-slate-900/40 shadow-2xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white shadow-2xs dark:bg-primary dark:text-primary-foreground">
              {getInitials(me.fullName, me.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {me.fullName || "Signed-in User"}
              </p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">{me.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-3.5 shrink-0" strokeWidth={1.8} />
          <span>Sign Out</span>
        </button>

        <div className="flex items-center justify-between px-3 text-[10px] text-muted-foreground">
          <Link to="/privacy" className="hover:underline">
            Privacy
          </Link>
          <span>·</span>
          <Link to="/terms" className="hover:underline">
            Terms
          </Link>
          <span>·</span>
          <span>Drive 2025–26</span>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <Link
            to={me?.isAdmin ? "/admin/dashboard" : "/dashboard"}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex size-8 items-center justify-center rounded-md bg-slate-900 text-white shadow-2xs dark:bg-primary dark:text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                  Placement Portal
                </span>
                <span className="hidden items-center gap-1.5 rounded-[4px] border border-emerald-500/25 bg-emerald-500/8 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 md:inline-flex">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Drive Season 2025–26
                </span>
              </div>
              <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
                {me?.isAdmin ? "TPO Administrative Console" : "Training & Placement Cell"}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden text-right sm:block">
            <div className="font-semibold text-foreground">{me?.fullName || me?.email}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{me?.email}</div>
          </div>
          {me && (
            <span
              className={cn(
                "rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                me.isAdmin
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-700 dark:bg-slate-800"
                  : "border-border bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {me.isAdmin ? "Staff" : "Student"}
            </span>
          )}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-foreground dark:hover:bg-slate-800"
          >
            <LogOut className="size-3.5" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border bg-card lg:block">
          {sidebarContent}
        </aside>

        {/* Mobile Navigation Drawer with Backdrop */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={close}
              aria-hidden="true"
            />
            {/* Drawer slide-over */}
            <aside className="fixed inset-y-0 left-0 top-16 z-50 w-72 border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200">
              {sidebarContent}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
