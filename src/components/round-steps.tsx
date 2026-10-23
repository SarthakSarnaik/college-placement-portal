import { Clock, Target, Lightbulb, CheckCircle2 } from "lucide-react";

type Round = {
  id: string;
  round_order: number;
  name: string;
  purpose: string;
  preparation: string;
  duration: string | null;
};

export function RoundSteps({ rounds }: { rounds: Round[] }) {
  const sorted = [...rounds].sort((a, b) => a.round_order - b.round_order);

  return (
    <div className="relative pl-6 sm:pl-8">
      {/* Vertical connection track */}
      <div className="absolute bottom-4 left-3 top-4 w-0.5 bg-slate-200 dark:bg-slate-800 sm:left-4" />

      <ol className="space-y-8">
        {sorted.map((r, idx) => (
          <li key={r.id} className="relative">
            {/* Step order circular badge */}
            <div className="absolute -left-6 flex size-7 items-center justify-center rounded-full border-2 border-primary bg-background font-mono text-xs font-bold text-primary shadow-xs dark:bg-card sm:-left-8 sm:size-8 sm:text-sm">
              {r.round_order || idx + 1}
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                    Round {r.round_order}
                  </span>
                  <h3 className="font-serif text-base font-bold text-foreground sm:text-lg">
                    {r.name}
                  </h3>
                </div>

                {r.duration && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground dark:bg-slate-900">
                    <Clock className="size-3 text-slate-500" /> {r.duration}
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50/70 p-3.5 dark:bg-slate-900/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Target className="size-3.5 text-teal-600" /> What this round tests
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/90">
                    {r.purpose || "General screening and technical assessment."}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50/70 p-3.5 dark:bg-slate-900/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Lightbulb className="size-3.5 text-amber-600" /> How to prepare
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/90">
                    {r.preparation || "Revise core concepts and practice under timed conditions."}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
