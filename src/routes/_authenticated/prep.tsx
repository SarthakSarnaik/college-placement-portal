import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Code2,
  Briefcase,
  Sparkles,
  Compass,
} from "lucide-react";
import { PageHeader } from "@/components/labels";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/prep")({
  head: () => ({ meta: [{ title: "Preparation Guide — Placement Portal" }] }),
  component: Prep,
});

const years = [
  {
    year: "First Year (Semesters 1 & 2)",
    focus: "Foundational Programming & Academic Foundation",
    icon: Code2,
    badge: "Stage 01",
    milestone: "Language Proficiency & 8.0+ CGPA",
    items: [
      "Master one core programming language thoroughly (C++, Java, or Python).",
      "Solve introductory algorithmic problems: loops, conditions, arrays, and string manipulation.",
      "Maintain a strong CGPA (aim for 8.0+) — majority of Tier-1 recruiters enforce strict cut-offs.",
      "Clear all semester courses without backlogs; campus recruitment rules heavily penalize active backlogs.",
    ],
  },
  {
    year: "Second Year (Semesters 3 & 4)",
    focus: "Core Data Structures & Applied Engineering Projects",
    icon: BookOpen,
    badge: "Stage 02",
    milestone: "LeetCode Foundation & GitHub Portfolio",
    items: [
      "Implement fundamental data structures from scratch: Linked Lists, Stacks, Queues, Trees, and Hash Tables.",
      "Practice consistently on coding platforms; log and re-solve problems you find challenging.",
      "Study Object-Oriented Programming (OOP) paradigms and clean code architecture.",
      "Build at least one substantial project end-to-end and host it on GitHub with complete documentation.",
    ],
  },
  {
    year: "Third Year (Semesters 5 & 6)",
    focus: "Advanced Algorithms, CS Fundamentals & Aptitude",
    icon: GraduationCap,
    badge: "Stage 03",
    milestone: "Core Subjects & Internship Assessments",
    items: [
      "Progress to advanced topics: Dynamic Programming, Graph Algorithms (BFS/DFS, shortest path), and Heaps.",
      "Revise CS Fundamentals comprehensively: DBMS (SQL & normalization), Operating Systems, and Computer Networks.",
      "Prepare quantitative, logical, and verbal aptitude tests for preliminary screening rounds.",
      "Review target company profiles on this portal to match eligibility and round patterns.",
    ],
  },
  {
    year: "Final Year (Semesters 7 & 8)",
    focus: "Mock Assessments, Interview Drills & Recruitment Drives",
    icon: Briefcase,
    badge: "Stage 04",
    milestone: "Campus Placement Drives & Offers",
    items: [
      "Simulate timed online coding assessments matching the exact duration of upcoming campus drives.",
      "Practice mock technical interviews; speak your thoughts aloud, starting with brute-force then optimizing.",
      "Prepare structured HR answers: introduction, conflict resolution (STAR format), relocation, and career ambitions.",
      "Monitor portal announcements daily for company registrations, eligibility updates, and test schedules.",
    ],
  },
];

function Prep() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Year-Wise Placement Preparation Guide"
        description="A four-year institutional roadmap designed by the Training & Placement Office to prepare engineering graduates for top-tier technology and consulting recruiters."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {years.map((s) => (
          <div
            key={s.year}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                <span className="rounded-[4px] border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-primary">
                  {s.badge}
                </span>
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <s.icon className="size-4" />
                </div>
              </div>

              <h2 className="mt-4 text-lg font-bold tracking-tight text-foreground">{s.year}</h2>
              <p className="text-xs font-semibold text-primary mt-0.5">{s.focus}</p>

              <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                {s.items.map((i) => (
                  <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span className="text-foreground/90">{i}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-3.5 border-t border-border/50 text-xs flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Milestone Target:
              </span>
              <span className="font-semibold text-foreground text-xs">{s.milestone}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          <h3 className="text-base font-bold tracking-tight text-foreground">
            Next Steps in Your Preparation
          </h3>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
          Combine this institutional preparation framework with company-specific intelligence logged
          by past candidates and verified by the TPO.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button asChild size="sm" className="text-xs font-semibold">
            <Link to="/companies">
              Explore Active Recruiters <ArrowRight className="size-3 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs font-medium">
            <Link to="/dsa">Review DSA Requirements</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs font-medium">
            <Link to="/questions">Solve DSA Sheet</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs font-medium">
            <Link to="/rounds">View Interview Rounds</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
