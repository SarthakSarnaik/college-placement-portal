import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Placement Portal — Company, DSA and interview round information" },
      { name: "description", content: "College placement portal: recruiter eligibility, DSA topics, selection rounds and previous interview questions, maintained by the placement office." },
      { property: "og:title", content: "Placement Portal" },
      { property: "og:description", content: "Recruiter eligibility, DSA topics, selection rounds and previous interview questions for students." },
    ],
  }),
  component: Index,
});

const features = [
  ["Company directory", "Search recruiters and filter by branch, CGPA and DSA difficulty."],
  ["Eligibility by year", "Current criteria and how they changed across previous drives."],
  ["Selection rounds in order", "What each round tests and how to prepare for it."],
  ["Previous questions", "Reported questions with their source, date and review status."],
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <img src="/favicon.svg" alt="" className="size-6" />
          <span className="font-serif text-lg font-semibold">Placement Portal</span>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/auth">Sign in</Link></Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Training & Placement Office</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Placement information for every student, from first year onwards.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Check which companies recruit from campus, what they require, and how their selection process runs — before the drive is announced.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/auth">Sign in or register</Link></Button>
        </div>
        <div className="mt-16 grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([t, b]) => (
            <div key={t} className="bg-background p-5"><h2 className="text-base font-semibold">{t}</h2><p className="mt-1 text-sm text-muted-foreground">{b}</p></div>
          ))}
        </div>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-6 text-sm text-muted-foreground">
          <span>Placement Portal</span>
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:underline">Terms and Conditions</Link>
        </div>
      </footer>
    </div>
  );
}
