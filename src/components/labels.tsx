import { cn } from "@/lib/utils";
import { BadgeCheck, CircleDashed, FlaskConical, XCircle } from "lucide-react";

const pillBase =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors";

export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        pillBase,
        "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
        className,
      )}
      title="Sample data for demonstration. Not verified placement information."
    >
      <FlaskConical className="size-3 text-amber-600 dark:text-amber-400" /> Demo
    </span>
  );
}

export function VerifyTag({ status, className }: { status: string; className?: string }) {
  if (status === "verified") {
    return (
      <span
        className={cn(
          pillBase,
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
          className,
        )}
      >
        <BadgeCheck className="size-3 text-emerald-600 dark:text-emerald-400" /> Verified
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span
        className={cn(
          pillBase,
          "border-destructive/30 bg-destructive/10 text-destructive",
          className,
        )}
      >
        <XCircle className="size-3" /> Rejected
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        className={cn(
          pillBase,
          "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
          className,
        )}
      >
        <CircleDashed className="size-3 text-amber-600 dark:text-amber-400" /> Pending Review
      </span>
    );
  }
  return (
    <span
      className={cn(
        pillBase,
        "border-border bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        className,
      )}
    >
      <CircleDashed className="size-3" /> Unverified
    </span>
  );
}

export function DifficultyTag({ level, className }: { level: string; className?: string }) {
  const isHard = level === "hard";
  const isMedium = level === "medium";
  const cls = isHard
    ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300"
    : isMedium
      ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300";

  return <span className={cn(pillBase, "capitalize font-medium", cls, className)}>{level}</span>;
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
    <div className="mb-6 flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        {breadcrumb && <div className="text-xs text-muted-foreground">{breadcrumb}</div>}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">{actions}</div>}
    </div>
  );
}
