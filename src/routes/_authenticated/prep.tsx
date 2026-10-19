import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/labels";

export const Route = createFileRoute("/_authenticated/prep")({
  head: () => ({ meta: [{ title: "Preparation Guide — Placement Portal" }] }),
  component: Prep,
});

const years = [
  { y: "First year", items: ["Learn one programming language thoroughly (C++, Java or Python).", "Practise basic problems: loops, arrays, strings.", "Keep your CGPA steady — most recruiters set a minimum cut-off.", "Avoid backlogs; many companies allow zero active backlogs."] },
  { y: "Second year", items: ["Cover core data structures: linked lists, stacks, queues, trees, hashing.", "Solve problems regularly and track topics you find difficult.", "Study OOP concepts and build one small project end to end."] },
  { y: "Third year", items: ["Move to graphs, dynamic programming, greedy and recursion-heavy problems.", "Revise DBMS, Operating Systems and Computer Networks fundamentals.", "Prepare aptitude: quantitative, logical reasoning, verbal ability.", "Look up target companies' rounds and DSA topics on this portal."] },
  { y: "Final year", items: ["Take timed mock assessments matching each company's first round.", "Practise explaining your projects and solutions aloud.", "Prepare HR answers: introduction, strengths, relocation, career goals.", "Check announcements and eligibility before each drive."] },
];

function Prep() {
  return (
    <>
      <PageHeader title="Preparation Guide" description="A general year-by-year plan. Use company profiles for company-specific requirements." />
      <div className="grid gap-px border bg-border md:grid-cols-2">
        {years.map((s) => (
          <section key={s.y} className="bg-background p-5">
            <h2 className="text-lg font-semibold">{s.y}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </section>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Next: <Link to="/companies" className="text-primary hover:underline">explore companies</Link> or <Link to="/dsa" className="text-primary hover:underline">review DSA requirements</Link>.</p>
    </>
  );
}
