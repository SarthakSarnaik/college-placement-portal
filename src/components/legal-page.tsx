import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b"><div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4"><Link to="/" className="flex items-center gap-2"><img src="/favicon.svg" alt="" className="size-6" /><span className="font-serif text-lg font-semibold">Placement Portal</span></Link></div></header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated {updated}. This is a template — have it reviewed by your institution before launch.</p>
        <div className="mt-8 space-y-6 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
      </main>
    </div>
  );
}
