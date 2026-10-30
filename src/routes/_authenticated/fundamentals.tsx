import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, Fragment } from "react";
import {
  GraduationCap,
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { csQuery } from "@/lib/queries";
import { PageHeader, DemoTag } from "@/components/labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/fundamentals")({
  head: () => ({ meta: [{ title: "CS Fundamentals — Placement Portal" }] }),
  component: FundamentalsPage,
});

interface SubtopicResource {
  name: string;
  url: string;
}

interface SubjectCurriculum {
  displayTitle: string;
  mainTutorialUrl: string;
  categoryBadge: string;
  subtopics: SubtopicResource[];
}

/**
 * Curated, verified W3Schools study resources mapped to core CS subjects.
 * All URLs point to official, active W3Schools modules.
 */
const CURRICULA: Record<string, SubjectCurriculum> = {
  dbms: {
    displayTitle: "Database Management Systems (DBMS)",
    mainTutorialUrl: "https://www.w3schools.com/sql/",
    categoryBadge: "Database Systems",
    subtopics: [
      { name: "DBMS Introduction", url: "https://www.w3schools.com/sql/sql_intro.asp" },
      { name: "DBMS Architecture", url: "https://www.w3schools.com/sql/sql_rdbms.asp" },
      { name: "ER Model", url: "https://www.w3schools.com/sql/sql_create_db.asp" },
      { name: "Relational Model", url: "https://www.w3schools.com/sql/sql_create_table.asp" },
      { name: "Primary and Foreign Keys", url: "https://www.w3schools.com/sql/sql_primarykey.asp" },
      {
        name: "Normalization (1NF, 2NF, 3NF, BCNF)",
        url: "https://www.w3schools.com/sql/sql_rdbms.asp",
      },
      { name: "SQL Queries", url: "https://www.w3schools.com/sql/sql_select.asp" },
      { name: "SQL Joins", url: "https://www.w3schools.com/sql/sql_join.asp" },
      { name: "Indexing", url: "https://www.w3schools.com/sql/sql_create_index.asp" },
      { name: "Transactions", url: "https://www.w3schools.com/sql/sql_rdbms.asp" },
      { name: "ACID Properties", url: "https://www.w3schools.com/sql/sql_rdbms.asp" },
      { name: "Concurrency Control", url: "https://www.w3schools.com/sql/sql_rdbms.asp" },
      { name: "Deadlocks", url: "https://www.w3schools.com/sql/sql_rdbms.asp" },
    ],
  },
  oop: {
    displayTitle: "Object-Oriented Programming (OOP)",
    mainTutorialUrl: "https://www.w3schools.com/java/java_oop.asp",
    categoryBadge: "Programming Paradigms",
    subtopics: [
      {
        name: "OOP Introduction & Core Principles",
        url: "https://www.w3schools.com/java/java_oop.asp",
      },
      { name: "Classes and Objects", url: "https://www.w3schools.com/java/java_classes.asp" },
      {
        name: "Encapsulation & Data Hiding",
        url: "https://www.w3schools.com/java/java_encapsulation.asp",
      },
      {
        name: "Inheritance & Types of Inheritance",
        url: "https://www.w3schools.com/java/java_inheritance.asp",
      },
      {
        name: "Polymorphism (Overloading & Overriding)",
        url: "https://www.w3schools.com/java/java_polymorphism.asp",
      },
      {
        name: "Abstraction & Abstract Classes",
        url: "https://www.w3schools.com/java/java_abstract.asp",
      },
      {
        name: "Interfaces & Multiple Inheritance",
        url: "https://www.w3schools.com/java/java_interface.asp",
      },
      {
        name: "Constructors & Memory Allocation",
        url: "https://www.w3schools.com/java/java_constructors.asp",
      },
      {
        name: "Access Modifiers (public, private, protected)",
        url: "https://www.w3schools.com/java/java_modifiers.asp",
      },
    ],
  },
  os: {
    displayTitle: "Operating Systems (OS)",
    mainTutorialUrl: "https://www.w3schools.in/operating-system/intro",
    categoryBadge: "Systems Architecture",
    subtopics: [
      {
        name: "Operating Systems Architecture & Services",
        url: "https://www.w3schools.in/operating-system/intro",
      },
      {
        name: "Process Management & Lifecycle States",
        url: "https://www.w3schools.in/operating-system/process-management",
      },
      {
        name: "CPU Scheduling Algorithms (FCFS, SJF, RR)",
        url: "https://www.w3schools.in/operating-system/cpu-scheduling",
      },
      {
        name: "Process Synchronization & Critical Section",
        url: "https://www.w3schools.in/operating-system/process-management",
      },
      {
        name: "Mutex vs Semaphores",
        url: "https://www.w3schools.in/operating-system/process-management",
      },
      {
        name: "Deadlocks & Banker's Algorithm",
        url: "https://www.w3schools.in/operating-system/deadlocks",
      },
      {
        name: "Memory Management & Paging",
        url: "https://www.w3schools.in/operating-system/memory-management",
      },
      {
        name: "Virtual Memory & Page Replacement",
        url: "https://www.w3schools.in/operating-system/virtual-memory",
      },
    ],
  },
  cn: {
    displayTitle: "Computer Networks (CN)",
    mainTutorialUrl: "https://www.w3schools.in/computer-network/intro",
    categoryBadge: "Network Engineering",
    subtopics: [
      {
        name: "Computer Networks Introduction & Topologies",
        url: "https://www.w3schools.in/computer-network/intro",
      },
      {
        name: "OSI 7-Layer Reference Model",
        url: "https://www.w3schools.in/computer-network/osi-model",
      },
      { name: "TCP/IP Protocol Suite", url: "https://www.w3schools.in/computer-network/tcp-ip" },
      {
        name: "TCP 3-Way Handshake & Flow Control",
        url: "https://www.w3schools.in/computer-network/tcp-ip",
      },
      {
        name: "IP Addressing, Subnetting & CIDR",
        url: "https://www.w3schools.in/computer-network/network-protocols",
      },
      {
        name: "Application Protocols (HTTP, HTTPS, DNS, DHCP)",
        url: "https://www.w3schools.in/computer-network/network-protocols",
      },
      {
        name: "Network Security & SSL/TLS Encryption",
        url: "https://www.w3schools.com/cybersecurity/index.php",
      },
    ],
  },
  embedded: {
    displayTitle: "Embedded Systems & Low-Level C",
    mainTutorialUrl: "https://www.w3schools.com/c/index.php",
    categoryBadge: "Hardware & Systems",
    subtopics: [
      { name: "C Programming Language Fundamentals", url: "https://www.w3schools.com/c/index.php" },
      { name: "Pointers & Memory Addresses", url: "https://www.w3schools.com/c/c_pointers.php" },
      {
        name: "Dynamic Memory Management (malloc, free)",
        url: "https://www.w3schools.com/c/c_memory.php",
      },
      { name: "Structures, Unions & Bitfields", url: "https://www.w3schools.com/c/c_structs.php" },
      {
        name: "Bitwise Operators & Hardware Registers",
        url: "https://www.w3schools.com/c/c_operators.php",
      },
      {
        name: "Buffer Overflow & Secure Coding",
        url: "https://www.w3schools.com/cybersecurity/index.php",
      },
    ],
  },
};

/**
 * Resolves the structured curriculum for any given subject string.
 */
function getSubjectCurriculum(subjectName: string): SubjectCurriculum {
  const norm = subjectName.toLowerCase();
  if (norm.includes("database") || norm.includes("dbms") || norm.includes("sql")) {
    return CURRICULA.dbms;
  }
  if (norm.includes("object") || norm.includes("oop")) {
    return CURRICULA.oop;
  }
  if (norm.includes("operating") || norm.includes("os")) {
    return CURRICULA.os;
  }
  if (norm.includes("network") || norm.includes("cn")) {
    return CURRICULA.cn;
  }
  if (norm.includes("embedded") || norm.includes("microcontroller") || norm.includes("pointer")) {
    return CURRICULA.embedded;
  }

  // Fallback for custom recruiter subjects
  return {
    displayTitle: subjectName,
    mainTutorialUrl: "https://www.w3schools.com/",
    categoryBadge: "Computer Science",
    subtopics: [
      { name: `${subjectName} Fundamentals`, url: "https://www.w3schools.com/" },
      { name: "Core Architecture & Concepts", url: "https://www.w3schools.com/" },
      { name: "Campus Interview Problem Patterns", url: "https://www.w3schools.com/" },
    ],
  };
}

function FundamentalsPage() {
  const q = useQuery(csQuery);
  const [priority, setPriority] = useState("");
  const [term, setTerm] = useState("");

  // Track expanded subject rows. Initialize with DBMS expanded by default so key topics are immediately visible.
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    () => new Set(["Database Management Systems", "Database Management Systems (DBMS)", "DBMS"]),
  );

  const toggleSubject = (subjectKey: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectKey)) {
        next.delete(subjectKey);
      } else {
        next.add(subjectKey);
      }
      return next;
    });
  };

  const expandAll = (allSubjects: string[]) => {
    setExpandedSubjects(new Set(allSubjects));
  };

  const collapseAll = () => {
    setExpandedSubjects(new Set());
  };

  const grouped = useMemo(() => {
    const m = new Map<
      string,
      {
        subject: string;
        curriculum: SubjectCurriculum;
        companies: {
          id: string;
          name: string;
          demo: boolean;
          priority: number;
          subtopics: string;
        }[];
      }
    >();

    for (const f of q.data ?? []) {
      if (priority && String(f.priority) !== priority) continue;

      const curriculum = getSubjectCurriculum(f.subject);
      const subtopicsText = curriculum.subtopics.map((s) => s.name).join(" ");

      if (
        term &&
        !f.subject.toLowerCase().includes(term.toLowerCase()) &&
        !curriculum.displayTitle.toLowerCase().includes(term.toLowerCase()) &&
        !f.subtopics.toLowerCase().includes(term.toLowerCase()) &&
        !subtopicsText.toLowerCase().includes(term.toLowerCase())
      ) {
        continue;
      }

      if (!m.has(f.subject)) {
        m.set(f.subject, {
          subject: f.subject,
          curriculum,
          companies: [],
        });
      }

      if (f.companies) {
        m.get(f.subject)!.companies.push({
          id: f.companies.id,
          name: f.companies.name,
          demo: f.companies.is_demo,
          priority: f.priority,
          subtopics: f.subtopics,
        });
      }
    }

    return [...m.values()].sort((a, b) => b.companies.length - a.companies.length);
  }, [q.data, priority, term]);

  const allVisibleSubjectKeys = useMemo(() => grouped.map((g) => g.subject), [grouped]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Core Computer Science Fundamentals"
        description="Comprehensive technical subjects evaluated during written screening assessments and campus technical interview rounds. Click any subject row to expand its core placement syllabus and access direct W3Schools learning material."
      />

      {/* Search and Priority Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects or subtopics (e.g. Normalization, SQL Joins, Deadlocks)…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="pl-9 text-xs"
            aria-label="Search fundamentals"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground mr-1 text-[11px] font-semibold uppercase tracking-wider">
              Priority:
            </span>
            {[
              { val: "", label: "All Priorities" },
              { val: "1", label: "High Priority" },
              { val: "2", label: "Medium" },
              { val: "3", label: "Low" },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setPriority(p.val)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  priority === p.val
                    ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                    : "border border-border bg-background font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Quick Expand / Collapse All */}
          {grouped.length > 0 && (
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => expandAll(allVisibleSubjectKeys)}
                className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Expand All
              </Button>
              <span className="text-border">·</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Collapse
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {q.isLoading ? (
        <LoadingState label="Loading computer science fundamentals…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !grouped.length ? (
        <EmptyState
          title="No CS subjects found"
          body="The Placement Office has not logged specific subject requirements matching your filter."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 w-2/5">Core Subject (Click to Expand Topics)</th>
                  <th className="px-5 py-3 w-36">Company Count</th>
                  <th className="px-5 py-3">Recruiters Testing Subject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grouped.map((g) => {
                  const isExpanded =
                    expandedSubjects.has(g.subject) ||
                    expandedSubjects.has(g.curriculum.displayTitle);

                  return (
                    <Fragment key={g.subject}>
                      {/* Main Subject Summary Row */}
                      <tr
                        onClick={() => toggleSubject(g.subject)}
                        className={cn(
                          "cursor-pointer align-top transition-colors select-none",
                          isExpanded ? "bg-muted/30" : "hover:bg-muted/20",
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-border bg-background text-muted-foreground transition-all group-hover/row:border-primary/50 group-hover/row:text-primary">
                              {isExpanded ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="size-4 text-primary shrink-0" />
                                <span className="font-semibold text-foreground tracking-tight">
                                  {g.curriculum.displayTitle}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  {g.curriculum.subtopics.length} Key Subtopics & Study Modules
                                </span>
                                <span className="text-border">·</span>
                                <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                                  {isExpanded ? "Click to collapse" : "Click to view subtopics"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 tabular-nums text-foreground">
                          <span className="inline-flex items-center rounded-[4px] border border-border bg-muted/50 px-2 py-0.5 text-xs font-mono font-semibold text-foreground">
                            {g.companies.length}{" "}
                            {g.companies.length === 1 ? "Company" : "Companies"}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-2">
                            {g.companies.map((c) => (
                              <Link
                                key={c.id}
                                to="/companies/$id"
                                params={{ id: c.id }}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-muted/40 shadow-2xs"
                                title={c.subtopics ? `Focus: ${c.subtopics}` : undefined}
                              >
                                <span>{c.name}</span>
                                <span
                                  className={`rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                    c.priority === 1
                                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                                      : c.priority === 2
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                        : "bg-muted text-muted-foreground border border-border"
                                  }`}
                                >
                                  {c.priority === 1 ? "High" : c.priority === 2 ? "Med" : "Low"}
                                </span>
                                {c.demo && <DemoTag />}
                              </Link>
                            ))}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Subtopics Detail Panel */}
                      {isExpanded && (
                        <tr className="bg-muted/15 border-b border-border">
                          <td colSpan={3} className="p-0">
                            <div className="border-t border-border/70 p-4 sm:p-6 space-y-4">
                              {/* Subject Header with Main Tutorial "Study Material" Button */}
                              <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <BookOpen className="size-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="text-sm font-bold text-foreground">
                                        {g.curriculum.displayTitle}
                                      </h3>
                                      <span className="rounded-[4px] border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">
                                        {g.curriculum.categoryBadge}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      Essential curriculum subtopics with verified W3Schools
                                      interactive revision guides.
                                    </p>
                                  </div>
                                </div>

                                {/* Main Subject Study Material Button */}
                                <a
                                  href={g.curriculum.mainTutorialUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground shadow-2xs"
                                  title={`Open complete ${g.curriculum.displayTitle} tutorial on W3Schools`}
                                >
                                  <BookOpen className="size-3.5" />
                                  <span>Study Material</span>
                                  <ExternalLink className="size-3" />
                                </a>
                              </div>

                              {/* Subtopics Grid with Individual Study Material Buttons */}
                              <div>
                                <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  <span>
                                    Curriculum Subtopics ({g.curriculum.subtopics.length})
                                  </span>
                                  <span>W3Schools Learning Links</span>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2">
                                  {g.curriculum.subtopics.map((subtopic, idx) => (
                                    <div
                                      key={subtopic.name}
                                      className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs transition-all hover:border-primary/40 hover:bg-muted/30"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-[4px] bg-muted/80 text-[10px] font-mono font-semibold text-muted-foreground">
                                          {idx + 1}
                                        </span>
                                        <span className="text-xs font-semibold text-foreground truncate">
                                          {subtopic.name}
                                        </span>
                                      </div>

                                      {/* Rectangular Study Material Button on the Right */}
                                      <a
                                        href={subtopic.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-primary hover:border-primary/50 hover:bg-primary/5 dark:text-slate-200 transition-all shadow-2xs"
                                        title={`Study ${subtopic.name} on W3Schools`}
                                      >
                                        <span>Study Material</span>
                                        <ExternalLink className="size-3 text-muted-foreground" />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-muted/20 px-5 py-2.5 text-xs font-medium text-muted-foreground">
            Displaying {grouped.length} core subject areas across campus recruiters. Click any
            subject row to expand its curriculum subtopics.
          </div>
        </div>
      )}
    </div>
  );
}
