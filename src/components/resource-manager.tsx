import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { PageHeader } from "@/components/labels";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "boolean" | "date" | "select" | "company" | "round" | "source";
  options?: { value: string; label: string }[];
  required?: boolean;
  hideInTable?: boolean;
  render?: (row: Row) => ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const selCls = "h-9 w-full border border-input bg-background px-2 text-sm rounded-md";

function useLookup(table: string, label: string, enabled: boolean) {
  return useQuery({
    queryKey: ["lookup", table],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.from(table).select(`id, ${label}${table === "interview_rounds" ? ", company_id, companies(name)" : ""}`).order(label);
      if (error) throw error;
      return data as Row[];
    },
  });
}

export function ResourceManager({
  title, description, table, select = "*", fields, order = { column: "created_at", ascending: false }, searchKeys, readOnly, rowActions, defaults = {},
}: {
  title: string; description?: string; table: string; select?: string; fields: Field[];
  order?: { column: string; ascending: boolean }; searchKeys: string[]; readOnly?: boolean;
  rowActions?: (row: Row) => ReactNode; defaults?: Row;
}) {
  const qc = useQueryClient();
  const key = ["admin", table];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from(table).select(select).order(order.column, { ascending: order.ascending });
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

  const rows = useMemo(() => (q.data ?? []).filter((r) =>
    (!term || searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(term.toLowerCase()))) &&
    (!companyFilter || r.company_id === companyFilter)), [q.data, term, companyFilter, searchKeys]);

  const invalidate = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["lookup"] }); qc.invalidateQueries({ predicate: (x) => x.queryKey[0] !== "admin" && x.queryKey[0] !== "me" }); };

  const save = useMutation({
    mutationFn: async (payload: Row) => {
      const { id, ...rest } = payload;
      const res = id ? await db.from(table).update(rest).eq("id", id) : await db.from(table).insert(rest);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => { toast.success("Saved"); setEditing(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message.includes("row-level security") ? "You do not have permission to change this." : e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from(table).delete().eq("id", id); if (error) throw new Error(error.message); },
    onSuccess: () => { toast.success("Deleted"); setDeleting(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const out: Row = editing?.id ? { id: editing.id } : {};
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (f.type === "boolean") { out[f.name] = fd.get(f.name) === "on"; continue; }
      const raw = String(fd.get(f.name) ?? "").trim();
      if (f.required && !raw) { errs[f.name] = `${f.label} is required`; continue; }
      if (raw.length > 5000) { errs[f.name] = "Too long"; continue; }
      if (f.type === "number") {
        if (raw && Number.isNaN(Number(raw))) { errs[f.name] = "Must be a number"; continue; }
        out[f.name] = raw ? Number(raw) : null;
      } else out[f.name] = raw || (f.required ? raw : null);
    }
    setErrors(errs);
    if (!Object.keys(errs).length) save.mutate(out);
  }

  const lookupLabel = (f: Field, v: string) => {
    const list = f.type === "company" ? companies.data : f.type === "round" ? rounds.data : sources.data;
    const r = list?.find((x) => x.id === v);
    return r ? (r.name ?? r.title) : "—";
  };

  const cell = (f: Field, r: Row) => {
    if (f.render) return f.render(r);
    const v = r[f.name];
    if (f.type === "boolean") return v ? "Yes" : "No";
    if (["company", "round", "source"].includes(f.type ?? "")) return v ? lookupLabel(f, v) : "—";
    if (f.type === "select") return f.options?.find((o) => o.value === v)?.label ?? v ?? "—";
    const s = v == null || v === "" ? "—" : String(v);
    return s.length > 80 ? s.slice(0, 80) + "…" : s;
  };

  const input = (f: Field) => {
    const dv = editing?.[f.name] ?? defaults[f.name] ?? "";
    const common = { id: f.name, name: f.name, defaultValue: dv };
    switch (f.type) {
      case "textarea": return <Textarea {...common} rows={3} />;
      case "number": return <Input {...common} type="number" step="any" />;
      case "date": return <Input {...common} type="date" />;
      case "boolean": return <input id={f.name} name={f.name} type="checkbox" defaultChecked={!!(editing?.[f.name] ?? defaults[f.name])} className="size-4" />;
      case "select": return <select {...common} className={selCls}>{f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case "company": case "round": case "source": {
        const list = f.type === "company" ? companies.data : f.type === "round" ? rounds.data : sources.data;
        return <select {...common} className={selCls}><option value="">{f.required ? "Select…" : "None"}</option>{(list ?? []).map((o) => <option key={o.id} value={o.id}>{o.name ?? o.title}{o.companies ? ` — ${o.companies.name}` : ""}</option>)}</select>;
      }
      default: return <Input {...common} />;
    }
  };

  const tableFields = fields.filter((f) => !f.hideInTable);
  return (
    <>
      <PageHeader title={title} description={description} actions={!readOnly && <Button onClick={() => { setErrors({}); setEditing({}); }}><Plus /> Add</Button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Search" /></div>
        {needs("company") && (
          <select className={selCls + " sm:w-64"} value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} aria-label="Filter by company">
            <option value="">All companies</option>{(companies.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !rows.length ? (
        <EmptyState title="No records" body={term || companyFilter ? "No records match your search." : "Nothing has been added yet."} />
      ) : (
        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>{tableFields.map((f) => <th key={f.name} className="whitespace-nowrap px-3 py-2.5">{f.label}</th>)}<th className="px-3 py-2.5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="align-top hover:bg-muted/50">
                  {tableFields.map((f) => <td key={f.name} className="px-3 py-2.5">{cell(f, r)}</td>)}
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      {rowActions?.(r)}
                      {!readOnly && <>
                        <Button size="sm" variant="ghost" onClick={() => { setErrors({}); setEditing(r); }} aria-label="Edit"><Pencil /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(r)} aria-label="Delete"><Trash2 className="text-destructive" /></Button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{rows.length} record(s)</p>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-md sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Add"} — {title}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {fields.map((f) => (
              <div key={f.name} className={f.type === "boolean" ? "flex items-center gap-2" : "space-y-1.5"}>
                {f.type === "boolean" ? <>{input(f)}<Label htmlFor={f.name}>{f.label}</Label></> : <><Label htmlFor={f.name}>{f.label}{f.required && " *"}</Label>{input(f)}</>}
                {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]}</p>}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader><AlertDialogTitle>Delete this record?</AlertDialogTitle><AlertDialogDescription>This cannot be undone. Related records may also be removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleting && del.mutate(deleting.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const difficultyOptions = [{ value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }];
