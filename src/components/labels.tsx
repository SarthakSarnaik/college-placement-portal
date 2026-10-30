import { cn } from "@/lib/utils";
import { CheckCircle2, CircleDashed, FlaskConical, XCircle, ShieldCheck } from "lucide-react";

const tagBase =
  "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase transition-colors";

export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        tagBase,
        "border-amber-500/25 bg-amber-500/8 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
        className,
      )}
      title="Sample data for demonstration. Not verified placement information."
    >
      <FlaskConical className="size-3 text-amber-600 dark:text-amber-400" />
      <span>Demo</span>
    </span>
  );
}

export function VerifyTag({ status, className }: { status: string; className?: string }) {
  if (status === "verified") {
    return (
      <span
        className={cn(
          tagBase,
          "border-emerald-600/25 bg-emerald-500/8 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
          className,
        )}
      >
        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
        <span>Verified</span>
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span
        className={cn(
          tagBase,
          "border-rose-500/25 bg-rose-500/8 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300",
          className,
        )}
      >
        <XCircle className="size-3 text-rose-600 dark:text-rose-400" />
        <span>Rejected</span>
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        className={cn(
          tagBase,
          "border-amber-500/25 bg-amber-500/8 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
          className,
        )}
      >
        <CircleDashed className="size-3 text-amber-600 dark:text-amber-400" />
        <span>Pending Review</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        tagBase,
        "border-border bg-slate-100/80 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400",
        className,
      )}
    >
      <CircleDashed className="size-3" />
      <span>Unverified</span>
    </span>
  );
}

export function DifficultyTag({ level, className }: { level: string; className?: string }) {
  const isHard = level === "hard";
  const isMedium = level === "medium";
  const cls = isHard
    ? "border-rose-500/25 bg-rose-500/8 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300"
    : isMedium
      ? "border-blue-500/25 bg-blue-500/8 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300"
      : "border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300";

  return (
    <span className={cn(tagBase, "capitalize font-medium tracking-normal", cls, className)}>
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0",
          isHard ? "bg-rose-500" : isMedium ? "bg-blue-500" : "bg-emerald-500",
        )}
      />
      <span>{level}</span>
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
  breadcrumb,
}: {
  title: string;
  description?: string | undefined;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        {breadcrumb && <div className="text-xs text-muted-foreground">{breadcrumb}</div>}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">{actions}</div>}
    </div>
  );
}
