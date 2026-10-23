import type { ReactNode } from "react";
import { AlertCircle, Inbox, Lock, Loader2, RefreshCw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading data…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-border/70 bg-card/60 p-8 text-center"
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Loader2 className="size-4 animate-spin" />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-card/50 px-6 py-12 text-center shadow-xs">
      <div className="flex size-11 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground shadow-xs">
        <Inbox className="size-5" strokeWidth={1.6} />
      </div>
      <h3 className="mt-3.5 font-serif text-base font-semibold text-foreground">{title}</h3>
      {body && (
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">{body}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground shadow-xs"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive mt-0.5">
          <AlertCircle className="size-4" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-destructive">Could not load requested data</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{msg}</p>
        </div>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-8 gap-1.5 text-xs font-medium border-destructive/20 hover:bg-destructive/10"
          >
            <RefreshCw className="size-3" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export function UnauthorizedState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive shadow-xs">
        <Lock className="size-6" strokeWidth={1.8} />
      </div>
      <h1 className="mt-4 font-serif text-xl font-bold tracking-tight text-foreground">
        Access Restricted
      </h1>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        This area is reserved for authorized Training & Placement Office staff. If you believe you
        need administrative clearance, please contact your college placement coordinator.
      </p>
      <div className="mt-6">
        <Button asChild size="sm" className="font-medium">
          <Link to="/dashboard">Back to Student Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
