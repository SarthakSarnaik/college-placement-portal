import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  Code2,
  ListOrdered,
  FileCode2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Placement Portal — College Training & Placement Cell" },
      {
        name: "description",
        content:
          "Official college placement portal: recruiter eligibility cut-offs, DSA topics, ordered selection rounds, and past interview questions.",
      },
      { property: "og:title", content: "Placement Portal — College Career Cell" },
      {
        property: "og:description",
        content:
          "Recruiter eligibility, DSA topics, selection rounds and previous interview questions for students.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: Building2,
    title: "Company Directory",
    description:
      "Search recruiters visiting campus. Filter by eligible branch, minimum CGPA, and coding difficulty.",
  },
  {
    icon: ListOrdered,
    title: "Selection Rounds in Order",
    description:
      "Step-by-step breakdown of online assessments, technical rounds, system design, and HR interviews.",
  },
  {
    icon: Code2,
    title: "DSA & CS Fundamentals",
    description:
      "Focus on topics actually tested by each recruiter, from basic strings to dynamic programming and DBMS.",
  },
  {
    icon: FileCode2,
    title: "Curated DSA Sheet",
    description:
      "Day-wise coding interview sheet covering Arrays, Strings, Binary Search, Trees, and DP with company tags.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* College Placement Cell Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-auto items-center justify-center rounded-md border border-border/80 bg-white px-1.5 py-1 shadow-2xs shrink-0">
              <img
                src="/kkwagh-logo.png"
                alt="K K Wagh Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Placement Portal
              </span>
              <span className="hidden text-[10px] uppercase font-semibold tracking-wider text-muted-foreground sm:block">
                Training & Placement Cell
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex text-xs font-medium"
            >
              <Link to="/admin/login">
                <ShieldCheck className="size-3.5 mr-1 text-muted-foreground" /> TPO Staff
              </Link>
            </Button>
            <Button asChild size="sm" className="text-xs font-medium">
              <Link to="/auth">Student Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="border-b border-border bg-slate-50/40 py-16 sm:py-24 dark:bg-card/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Campus Recruitment Season 2025–2026</span>
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl sm:leading-[1.15]">
              Placement preparation for every student, from first year to final drive.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Explore which recruiters visit campus, their active CGPA and backlog criteria, the
              exact sequence of selection rounds, and questions asked in previous drives.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="font-semibold text-xs sm:text-sm shadow-xs">
                <Link to="/auth">
                  Student Sign In or Register <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-medium text-xs sm:text-sm"
              >
                <Link to="/admin/login">
                  <ShieldCheck className="size-4 mr-1.5" /> Placement Office Staff Login
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500"></span> Verified Eligibility
                Criteria
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-blue-500"></span> Company-wise DSA
                Roadmaps
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-slate-900 dark:bg-slate-300"></span>{" "}
                Day-Wise DSA Sheet & Questions
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 max-w-xl">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Structured placement intelligence
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Maintained directly by your Training & Placement Office to eliminate guesswork and
                prepare students systematically.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-foreground">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Access CTA Banner */}
        <section className="border-t border-border bg-slate-900 py-12 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Ready for your upcoming drive?
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Sign in with your student credentials to view verified recruiter profiles.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="default"
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-2xs"
              >
                <Link to="/auth">Enter Student Portal</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="default"
                className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
              >
                <Link to="/admin/login">Admin Console</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />
            <span>Placement & Career Guidance Cell © 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground hover:underline">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-foreground hover:underline">
              Terms of Service
            </Link>
            <span>·</span>
            <Link to="/admin/login" className="hover:text-foreground hover:underline">
              TPO Administration
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
