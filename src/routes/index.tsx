import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  Code2,
  ListOrdered,
  MessageSquareText,
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
    icon: MessageSquareText,
    title: "Verified Previous Questions",
    description:
      "Authentic questions reported from the last three placement years with candidate debriefs and review status.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* College Placement Cell Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-foreground">
                Placement Portal
              </span>
              <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
                Training & Placement Cell
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
              <Link to="/admin/login">
                <ShieldCheck className="size-3.5 mr-1 text-slate-600 dark:text-slate-300" /> TPO
                Staff
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
        <section className="border-b border-border bg-slate-50/50 py-16 sm:py-24 dark:bg-card/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              <CheckCircle2 className="size-3.5" /> Campus Recruitment Season 2025–2026
            </div>
            <h1 className="mt-4 max-w-3xl font-serif text-3xl font-bold tracking-tight text-foreground sm:text-5xl sm:leading-tight">
              Placement preparation for every student, from first year to final drive.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Explore which companies recruit from campus, their current CGPA and backlog criteria,
              the exact order of their selection rounds, and questions asked in previous drives.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="font-medium shadow-sm">
                <Link to="/auth">
                  Student Sign In or Register <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-medium">
                <Link to="/admin/login">
                  <ShieldCheck className="size-4 mr-1.5" /> Placement Office Staff Login
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500"></span> Verified Eligibility
                Criteria
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-teal-500"></span> Company-wise DSA Roadmaps
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary"></span> 3 Years Historical
                Questions
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 max-w-xl">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Structured placement intelligence
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Maintained directly by your Training & Placement Office to eliminate guesswork and
                prepare students systematically.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-serif text-base font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
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
              <h2 className="font-serif text-xl font-semibold text-white">
                Ready for your upcoming drive?
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Sign in with your student credentials to view all recruiter profiles.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="default" className="bg-teal-600 text-white hover:bg-teal-700">
                <Link to="/auth">Enter Student Portal</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="default"
                className="border-slate-700 text-slate-200 hover:bg-slate-800"
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
