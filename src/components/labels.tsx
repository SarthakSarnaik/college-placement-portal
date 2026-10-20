import { cn } from "@/lib/utils";
import { BadgeCheck, CircleDashed, FlaskConical } from "lucide-react";

const base = "inline-flex items-center gap-1 border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide rounded-sm";

export function DemoTag({ className }: { className?: string }) {
  return (
    <span className={cn(base, "border-demo-foreground/30 bg-demo text-demo-foreground", className)} title="Sample data for demonstration. Not verified information.">
      <FlaskConical className="size-3" /> Demo
    </span>
  );
}

export function VerifyTag({ status }: { status: string }) {
  if (status === "verified")
    return (
      <span className={cn(base, "border-success/40 bg-success/10 text-success")}>
        <BadgeCheck className="size-3" /> Verified
      </span>
    );
  if (status === "rejected") return <span className={cn(base, "border-destructive/40 text-destructive")}>Rejected</span>;
  return (
    <span className={cn(base, "border-border bg-muted text-muted-foreground")}>
      <CircleDashed className="size-3" /> {status === "pending" ? "Pending review" : "Unverified"}
    </span>
  );
}

export function DifficultyTag({ level }: { level: string }) {
  const cls =
    level === "hard"
      ? "border-destructive/30 text-destructive"
      : level === "medium"
        ? "border-warning-foreground/30 bg-warning/40 text-warning-foreground"
        : "border-success/30 text-success";
  return <span className={cn(base, cls)}>{level}</span>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string | undefined; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
