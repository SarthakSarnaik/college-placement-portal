type Round = { id: string; round_order: number; name: string; purpose: string; preparation: string; duration: string | null };

export function RoundSteps({ rounds }: { rounds: Round[] }) {
  return (
    <ol className="relative space-y-0 border-l-2 border-border pl-6">
      {rounds.map((r) => (
        <li key={r.id} className="relative pb-8 last:pb-0">
          <span className="absolute -left-[37px] flex size-7 items-center justify-center border-2 border-primary bg-background text-xs font-semibold text-primary">{r.round_order}</span>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h3 className="text-lg font-semibold">{r.name}</h3>
            {r.duration && <span className="text-xs text-muted-foreground">{r.duration}</span>}
          </div>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Purpose</p><p className="mt-1 text-sm">{r.purpose || "—"}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How to prepare</p><p className="mt-1 text-sm">{r.preparation || "—"}</p></div>
          </div>
        </li>
      ))}
    </ol>
  );
}
