import { Clock, Target, Lightbulb, CheckCircle2, Code2, Users, FileText, Cpu } from "lucide-react";

type Round = {
  id: string;
  round_order: number;
  name: string;
  purpose: string;
  preparation: string;
  duration: string | null;
};

function getStageCategory(name: string): { label: string; icon: typeof Code2 } {
  const lower = name.toLowerCase();
  if (
    lower.includes("oa") ||
    lower.includes("coding") ||
    lower.includes("assessment") ||
    lower.includes("online")
  ) {
    return { label: "Online Assessment", icon: Code2 };
  }
  if (lower.includes("design") || lower.includes("architecture")) {
    return { label: "System Design", icon: Cpu };
  }
  if (
    lower.includes("hr") ||
    lower.includes("manager") ||
    lower.includes("fit") ||
    lower.includes("behavioral")
  ) {
    return { label: "HR & Leadership", icon: Users };
  }
  return { label: "Technical Interview", icon: FileText };
}

export function RoundSteps({ rounds }: { rounds: Round[] }) {
  const sorted = [...rounds].sort((a, b) => a.round_order - b.round_order);

  return (
    <div className="relative pl-7 sm:pl-9">
      {/* Vertical connection track */}
      <div className="absolute bottom-5 left-3 top-5 w-0.5 bg-border/80 sm:left-4" />

      <ol className="space-y-6">
        {sorted.map((r, idx) => {
          const cat = getStageCategory(r.name);
          const CatIcon = cat.icon;
          return (
            <li key={r.id} className="relative">
              {/* Step order rectangular badge */}
              <div className="absolute -left-7 flex size-7 items-center justify-center rounded-md border border-border bg-slate-900 font-mono text-xs font-bold text-white shadow-2xs dark:border-primary/40 dark:bg-slate-800 sm:-left-9 sm:size-8 sm:text-xs">
                {String(r.round_order || idx + 1).padStart(2, "0")}
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-[4px] border border-blue-500/20 bg-blue-500/8 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                      Stage {r.round_order}
                    </span>
                    <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                      {r.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden items-center gap-1 rounded-[4px] border border-border bg-slate-50/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-flex dark:bg-slate-900/60">
                      <CatIcon className="size-3 text-slate-500" />
                      <span>{cat.label}</span>
                    </span>

                    {r.duration && (
                      <span className="inline-flex items-center gap-1 rounded-[4px] border border-border bg-slate-50/80 px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground dark:bg-slate-900/60">
                        <Clock className="size-3 text-slate-500" />
                        <span>{r.duration}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-slate-50/60 p-3.5 dark:bg-slate-900/40">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Target className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span>What this round evaluates</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-foreground/90 font-normal">
                      {r.purpose || "General screening and technical assessment."}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-slate-50/60 p-3.5 dark:bg-slate-900/40">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Lightbulb className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Preparation strategy</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-foreground/90 font-normal">
                      {r.preparation || "Revise core concepts and practice under timed conditions."}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
