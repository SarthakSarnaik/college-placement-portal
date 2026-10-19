import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Lock, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 border border-dashed px-4 py-10 text-sm text-muted-foreground justify-center">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed px-6 py-10 text-center">
      <Inbox className="mx-auto size-6 text-muted-foreground" strokeWidth={1.5} />
      <p className="mt-3 font-medium">{title}</p>
      {body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div role="alert" className="border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 text-destructive" />
        <div className="flex-1">
          <p className="font-medium text-destructive">Could not load data</p>
          <p className="mt-1 text-muted-foreground">{msg}</p>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export function UnauthorizedState() {
  return (
    <div className="mx-auto max-w-md border px-6 py-12 text-center">
      <Lock className="mx-auto size-6 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="mt-3 text-xl font-semibold">Access restricted</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This area is only available to Training & Placement Office staff. If you believe you need access, contact your placement coordinator.
      </p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
