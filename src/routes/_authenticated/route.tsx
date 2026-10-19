import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard, Building2, Code2, ListOrdered, MessageSquareText, BookOpen, Megaphone,
  ShieldCheck, Briefcase, ClipboardCheck, History, Users, FileCheck2, LogOut, Menu, X, ListChecks,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
  },
  component: AppShell,
});

const studentNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/dsa", label: "DSA Requirements", icon: Code2 },
  { to: "/rounds", label: "Interview Rounds", icon: ListOrdered },
  { to: "/questions", label: "Previous Questions", icon: MessageSquareText },
  { to: "/prep", label: "Preparation Guide", icon: BookOpen },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
] as const;

const adminNav = [
  { to: "/admin", label: "Admin Dashboard", icon: ShieldCheck },
  { to: "/admin/companies", label: "Companies", icon: Building2 },
  { to: "/admin/roles", label: "Job Roles", icon: Briefcase },
  { to: "/admin/criteria", label: "Eligibility Criteria", icon: ClipboardCheck },
  { to: "/admin/dsa", label: "DSA Topics", icon: Code2 },
  { to: "/admin/rounds", label: "Interview Rounds", icon: ListChecks },
  { to: "/admin/questions", label: "Questions", icon: MessageSquareText },
  { to: "/admin/sources", label: "Source Verification", icon: FileCheck2 },
  { to: "/admin/history", label: "Criteria History", icon: History },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/users", label: "Users", icon: Users },
] as const;

function NavItem({ to, label, icon: Icon, onClick }: { to: string; label: string; icon: typeof Users; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeOptions={{ exact: to === "/admin" || to === "/dashboard" }}
      className="flex items-center gap-2.5 border-l-2 border-transparent px-3 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
      activeProps={{ className: "!border-sidebar-primary bg-sidebar-accent font-medium !text-sidebar-accent-foreground" }}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

function AppShell() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const close = () => setOpen(false);
  const sidebar = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto py-5" aria-label="Main">
      <div>
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Student</p>
        {studentNav.map((n) => <NavItem key={n.to} {...n} onClick={close} />)}
      </div>
      {me?.isAdmin && (
        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">TPO / Admin</p>
          {adminNav.map((n) => <NavItem key={n.to} {...n} onClick={close} />)}
        </div>
      )}
      <div className="mt-auto border-t px-3 pt-4 text-xs text-muted-foreground">
        <Link to="/privacy" className="hover:underline">Privacy</Link> · <Link to="/terms" className="hover:underline">Terms</Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
        <button className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-6" />
          <span className="font-serif text-lg font-semibold">Placement Portal</span>
        </Link>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="hidden text-muted-foreground sm:inline">
            {me?.fullName || me?.email}
            {me && <span className="ml-2 border px-1.5 py-0.5 text-[11px] uppercase">{me.isAdmin ? "TPO / Admin" : "Student"}</span>}
          </span>
          <button onClick={signOut} className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-sm hover:bg-muted">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r bg-sidebar lg:block">{sidebar}</aside>
        {open && (
          <aside className={cn("fixed inset-x-0 top-14 bottom-0 z-20 bg-sidebar lg:hidden")}>{sidebar}</aside>
        )}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
