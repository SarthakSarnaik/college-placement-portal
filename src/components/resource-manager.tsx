import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  AlertTriangle,
  Info,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { PageHeader } from "@/components/labels";
import { difficultyOptions } from "@/lib/queries";

export { difficultyOptions };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
export type Field = {
  name: string;
  label: string;
  type?:
    "text" | "textarea" | "number" | "boolean" | "date" | "select" | "company" | "round" | "source";
  options?: { value: string; label: string }[];
  required?: boolean;
  hideInTable?: boolean;
  render?: (row: Row) => ReactNode;
  hint?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const selCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-medium";

function useLookup(table: string, label: string, enabled: boolean) {
  return useQuery({
    queryKey: ["lookup", table],
    enabled,
    queryFn: async () => {
      const { data, error } = await db
        .from(table)
        .select(
          `id, ${label}${table === "interview_rounds" ? ", company_id, companies(name)" : ""}`,
        )
        .order(label);
      if (error) throw error;
      return data as Row[];
    },
  });
}

const PAGE_SIZE = 12;

export function ResourceManager({
  title,
  description,
  table,
  select = "*",
  fields,
  order = { column: "created_at", ascending: false },
  searchKeys,
  readOnly,
  rowActions,
  defaults = {},
}: {
  title: string;
  description?: string;
  table: string;
  select?: string;
  fields: Field[];
  order?: { column: string; ascending: boolean };
  searchKeys: string[];
  readOnly?: boolean;
  rowActions?: (row: Row) => ReactNode;
  defaults?: Row;
}) {
  const qc = useQueryClient();
  const key = ["admin", table];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db
        .from(table)
        .select(select)
        .order(order.column, { ascending: order.ascending });
      if (error) throw error;
      return data as Row[];
    },
  });
  const needs = (t: string) => fields.some((f) => f.type === t);
  const companies = useLookup("companies", "name", needs("company"));
  const rounds = useLookup("interview_rounds", "name", needs("round"));
  const sources = useLookup("sources", "title", needs("source"));

  const [term, setTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(
    () =>
      (q.data ?? []).filter(
        (r) =>
          (!term ||
            searchKeys.some((k) =>
              String(r[k] ?? "")
                .toLowerCase()
                .includes(term.toLowerCase()),
            )) &&
          (!companyFilter || r.company_id === companyFilter),
      ),
    [q.data, term, companyFilter, searchKeys],
  );

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["lookup"] });
    qc.invalidateQueries({ queryKey: ["companies"] });
    qc.invalidateQueries({ queryKey: ["company"] });
    qc.invalidateQueries({ queryKey: ["dsa_all"] });
    qc.invalidateQueries({ queryKey: ["cs_all"] });
    qc.invalidateQueries({ queryKey: ["rounds_all"] });
    qc.invalidateQueries({ queryKey: ["questions_all"] });
    qc.invalidateQueries({ queryKey: ["announcements"] });
    qc.invalidateQueries({ predicate: (x) => x.queryKey[0] !== "me" });
  };

  const save = useMutation({
    mutationFn: async (payload: Row) => {
      const { id, ...rest } = payload;
      const res = id
        ? await db.from(table).update(rest).eq("id", id)
        : await db.from(table).insert(rest);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      toast.success("Record saved successfully");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("row-level security")
          ? "Permission denied: PostgreSQL row-level security policy rejected this modification."
          : e.message,
      ),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Record deleted");
      setDeleting(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const out: Row = editing?.id ? { id: editing.id } : {};
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (f.type === "boolean") {
        out[f.name] = fd.get(f.name) === "on";
        continue;
      }
      const raw = String(fd.get(f.name) ?? "").trim();
      if (f.required && !raw) {
        errs[f.name] = `${f.label} is required`;
        continue;
      }
      if (raw.length > 5000) {
        errs[f.name] = "Text too long (maximum 5,000 characters)";
        continue;
      }
      const isNumeric =
        f.type === "number" ||
        (f.type === "select" &&
          !!f.options?.length &&
          f.options.every((o) => /^-?\d+(\.\d+)?$/.test(o.value)));
      if (isNumeric) {
        if (raw && Number.isNaN(Number(raw))) {
          errs[f.name] = "Must be a valid number";
          continue;
        }
        out[f.name] = raw ? Number(raw) : null;
      } else out[f.name] = raw || (f.required ? raw : null);
    }
    setErrors(errs);
    if (!Object.keys(errs).length) save.mutate(out);
  }

  const lookupLabel = (f: Field, v: string) => {
    const list =
      f.type === "company" ? companies.data : f.type === "round" ? rounds.data : sources.data;
    const r = list?.find((x) => x.id === v);
    return r ? (r.name ?? r.title) : "—";
  };

  const cell = (f: Field, r: Row) => {
    if (f.render) return f.render(r);
    const v = r[f.name];
    if (f.type === "boolean")
      return v ? (
        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          No
        </span>
      );
    if (["company", "round", "source"].includes(f.type ?? "")) return v ? lookupLabel(f, v) : "—";
    if (f.type === "select") return f.options?.find((o) => o.value === v)?.label ?? v ?? "—";
    const s = v == null || v === "" ? "—" : String(v);
    return s.length > 80 ? s.slice(0, 80) + "…" : s;
  };

  const input = (f: Field) => {
    const dv = editing?.[f.name] ?? defaults[f.name] ?? "";
    const common = { id: f.name, name: f.name, defaultValue: dv };
    switch (f.type) {
      case "textarea":
        return <Textarea {...common} rows={3} className="text-xs" />;
      case "number":
        return <Input {...common} type="number" step="any" className="h-9 text-xs" />;
      case "date":
        return <Input {...common} type="date" className="h-9 text-xs" />;
      case "boolean":
        return (
          <input
            id={f.name}
            name={f.name}
            type="checkbox"
            defaultChecked={!!(editing?.[f.name] ?? defaults[f.name])}
            className="size-4 rounded border-border text-primary focus:ring-primary"
          />
        );
      case "select":
        return (
          <select {...common} className={selCls}>
            {f.options!.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "company":
      case "round":
      case "source": {
        const list =
          f.type === "company" ? companies.data : f.type === "round" ? rounds.data : sources.data;
        return (
          <select {...common} className={selCls}>
            <option value="">{f.required ? "Select option…" : "None (Optional)"}</option>
            {(list ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name ?? o.title}
                {o.companies ? ` — ${o.companies.name}` : ""}
              </option>
            ))}
          </select>
        );
      }
      default:
        return <Input {...common} className="h-9 text-xs" />;
    }
  };

  const tableFields = fields.filter((f) => !f.hideInTable);

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          !readOnly && (
            <Button
              size="sm"
              className="font-semibold text-xs shadow-xs"
              onClick={() => {
                setErrors({});
                setEditing({});
              }}
            >
              <Plus className="size-3.5 mr-1" /> Add Record
            </Button>
          )
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="h-9 pl-8 pr-7 text-xs"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setPage(1);
              }}
              aria-label="Search"
            />
            {term && (
              <button
                onClick={() => {
                  setTerm("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {needs("company") && (
            <select
              className={selCls + " sm:w-64"}
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by company"
            >
              <option value="">All Companies</option>
              {(companies.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs font-medium text-muted-foreground">
          <span>
            {filteredRows.length} {filteredRows.length === 1 ? "record" : "records"}
          </span>
          {companyFilter || term ? " (filtered)" : ""}
        </div>
      </div>

      {q.isLoading ? (
        <LoadingState label="Loading table records…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !filteredRows.length ? (
        <EmptyState
          title="No records found"
          body={
            term || companyFilter
              ? "No records match your active search or company filter."
              : "No records exist in this module yet. Click 'Add Record' to create one."
          }
          action={
            term || companyFilter ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTerm("");
                  setCompanyFilter("");
                }}
              >
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
                  <tr>
                    {tableFields.map((f) => (
                      <th key={f.name} className="whitespace-nowrap px-4 py-3">
                        {f.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedRows.map((r) => (
                    <tr
                      key={r.id}
                      className="align-top transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                    >
                      {tableFields.map((f) => (
                        <td
                          key={f.name}
                          className="px-4 py-3 text-foreground text-xs leading-relaxed"
                        >
                          {cell(f, r)}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {rowActions?.(r)}
                          {!readOnly && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                onClick={() => {
                                  setErrors({});
                                  setEditing(r);
                                }}
                                aria-label="Edit"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                onClick={() => setDeleting(r)}
                                aria-label="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {paginatedRows.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                  <span className="font-semibold text-foreground text-xs">
                    {r.name ||
                      r.title ||
                      r.subject ||
                      r.question?.slice(0, 40) ||
                      `Record #${r.id.slice(0, 6)}`}
                  </span>
                  <div className="flex items-center gap-1">
                    {rowActions?.(r)}
                    {!readOnly && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setErrors({});
                            setEditing(r);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => setDeleting(r)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {tableFields.slice(0, 4).map((f) => (
                    <div key={f.name}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {f.label}
                      </span>
                      <div className="mt-0.5 text-foreground">{cell(f, r)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredRows.length} total)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold">
              {editing?.id ? "Edit Record" : "Add New Record"} — {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Fill in the required information below. Fields marked with an asterisk (
              <span className="text-rose-500 font-bold">*</span>) are mandatory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 pt-2" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const isFull =
                  f.type === "textarea" ||
                  f.type === "boolean" ||
                  f.type === "company" ||
                  f.type === "round" ||
                  f.type === "source" ||
                  f.name === "question" ||
                  f.name === "overview" ||
                  f.name === "body";

                return (
                  <div
                    key={f.name}
                    className={`space-y-1.5 ${isFull ? "sm:col-span-2" : "sm:col-span-1"}`}
                  >
                    {f.type === "boolean" ? (
                      <div className="rounded-lg border border-border bg-slate-50/70 p-3 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2.5">
                          {input(f)}
                          <Label htmlFor={f.name} className="cursor-pointer font-semibold text-xs">
                            {f.label}
                          </Label>
                        </div>
                        {f.hint && (
                          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground ml-6">
                            {f.hint}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <Label htmlFor={f.name} className="text-xs font-semibold text-foreground">
                          {f.label}
                          {f.required && <span className="text-rose-500 ml-0.5">*</span>}
                        </Label>
                        {input(f)}
                        {f.hint && (
                          <p className="text-[11px] text-muted-foreground leading-normal">
                            {f.hint}
                          </p>
                        )}
                      </>
                    )}
                    {errors[f.name] && (
                      <p className="text-xs font-medium text-destructive">{errors[f.name]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <DialogFooter className="pt-4 border-t border-border/50 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-semibold"
                disabled={save.isPending}
              >
                {save.isPending ? "Saving changes…" : "Save Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-xl sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle className="font-serif text-lg font-bold">
                Delete this record permanently?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
              This action cannot be undone. Removing this record may cascade to related child
              entities (such as job roles, rounds, or questions associated with this company).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3">
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
              onClick={() => deleting && del.mutate(deleting.id)}
              disabled={del.isPending}
            >
              {del.isPending ? "Deleting…" : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
