import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  History,
  ShieldCheck,
  FileText,
  Calendar,
  GraduationCap,
  Briefcase,
  MapPin,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PageHeader, DemoTag, VerifyTag, DifficultyTag } from "@/components/labels";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Company = Database["public"]["Tables"]["companies"]["Row"];
type EligibilityCriteria = Database["public"]["Tables"]["eligibility_criteria"]["Row"];
type JobRole = Database["public"]["Tables"]["job_roles"]["Row"];

type CompanyWithDetails = Company & {
  eligibility_criteria: EligibilityCriteria[];
  job_roles: JobRole[];
};

type CriteriaFormState = {
  id?: string;
  year: number | "";
  min_10th_percentage: number | "";
  min_12th_percentage: number | "";
  min_cgpa: number | "";
  max_backlogs: number | "";
  branches: string;
  notes: string;
  is_current: boolean;
};

const initialCriteriaForm: CriteriaFormState = {
  year: new Date().getFullYear(),
  min_10th_percentage: "",
  min_12th_percentage: "",
  min_cgpa: "",
  max_backlogs: "",
  branches: "Computer Engineering, Information Technology, AI & Data Science",
  notes: "",
  is_current: true,
};

type RoleFormState = {
  id?: string;
  company_id?: string;
  title: string;
  hiring_year: number | "";
  location: string;
  ctc_note: string;
};

const initialRoleForm: RoleFormState = {
  title: "",
  hiring_year: new Date().getFullYear(),
  location: "",
  ctc_note: "",
};

type CompanyFormState = {
  id?: string;
  name: string;
  sector: string;
  headquarters: string;
  website: string;
  first_visit_year: number | "";
  overview: string;
  dsa_difficulty: Database["public"]["Enums"]["difficulty"];
  verification_status: "unverified" | "pending" | "verified";
  is_published: boolean;
  is_demo: boolean;
  // Optional initial criteria on creation
  include_criteria?: boolean;
  criteria?: CriteriaFormState;
  // Optional initial job role on creation
  include_role?: boolean;
  role?: RoleFormState;
};

const initialCompanyForm: CompanyFormState = {
  name: "",
  sector: "",
  headquarters: "",
  website: "",
  first_visit_year: new Date().getFullYear(),
  overview: "",
  dsa_difficulty: "medium",
  verification_status: "unverified",
  is_published: false,
  is_demo: false,
  include_criteria: false,
  criteria: { ...initialCriteriaForm },
  include_role: false,
  role: { ...initialRoleForm },
};

export const Route = createFileRoute("/_authenticated/admin/companies")({
  head: () => ({ meta: [{ title: "Manage Companies — Placement Portal" }] }),
  component: ManageCompaniesPage,
});

export function ManageCompaniesPage() {
  const qc = useQueryClient();

  // Expandable row state
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());

  // Dialog & Selection States
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyModalTab, setCompanyModalTab] = useState<"details" | "criteria" | "roles">(
    "details",
  );
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Criteria Sub-Dialog States
  const [isCriteriaDialogOpen, setIsCriteriaDialogOpen] = useState(false);
  const [criteriaForm, setCriteriaForm] = useState<CriteriaFormState>(initialCriteriaForm);
  const [criteriaTargetCompanyId, setCriteriaTargetCompanyId] = useState<string | null>(null);
  const [criteriaToDelete, setCriteriaToDelete] = useState<EligibilityCriteria | null>(null);
  const [criteriaErrors, setCriteriaErrors] = useState<Record<string, string>>({});

  // Role Sub-Dialog States
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleFormState>(initialRoleForm);
  const [roleTargetCompanyId, setRoleTargetCompanyId] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<JobRole | null>(null);
  const [roleErrors, setRoleErrors] = useState<Record<string, string>>({});

  // Company Edit Form State
  const [companyEditForm, setCompanyEditForm] = useState<CompanyFormState>(initialCompanyForm);
  const [companyFormErrors, setCompanyFormErrors] = useState<Record<string, string>>({});

  // Add Company Form State
  const [newCompanyForm, setNewCompanyForm] = useState<CompanyFormState>(initialCompanyForm);
  const [newCompanyErrors, setNewCompanyErrors] = useState<Record<string, string>>({});

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "demo">("all");

  // Query: Companies with nested Eligibility Criteria and Job Roles
  const {
    data: companies,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "companies_with_details"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, eligibility_criteria(*), job_roles(*)")
        .order("name", { ascending: true });
      if (error) throw error;

      return (data as CompanyWithDetails[]).map((c) => ({
        ...c,
        eligibility_criteria: [...(c.eligibility_criteria || [])].sort((a, b) => b.year - a.year),
        job_roles: [...(c.job_roles || [])].sort((a, b) => b.hiring_year - a.hiring_year),
      }));
    },
  });

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId || !companies) return null;
    return companies.find((c) => c.id === selectedCompanyId) ?? null;
  }, [selectedCompanyId, companies]);

  const toggleExpandCompany = (id: string) => {
    setExpandedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!companies) return;
    setExpandedCompanyIds(new Set(companies.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedCompanyIds(new Set());
  };

  // Sync selected company into edit form
  const openCompanyManager = (
    company: CompanyWithDetails,
    defaultTab: "details" | "criteria" | "roles" = "details",
  ) => {
    setSelectedCompanyId(company.id);
    setCompanyModalTab(defaultTab);
    setCompanyEditForm({
      id: company.id,
      name: company.name,
      sector: company.sector || "",
      headquarters: company.headquarters || "",
      website: company.website || "",
      first_visit_year: company.first_visit_year ?? "",
      overview: company.overview || "",
      dsa_difficulty: company.dsa_difficulty,
      verification_status: company.verification_status as "unverified" | "pending" | "verified",
      is_published: company.is_published,
      is_demo: company.is_demo,
    });
    setCompanyFormErrors({});
  };

  // Invalidate query caches
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin", "companies_with_details"] });
    qc.invalidateQueries({ queryKey: ["admin", "companies_with_criteria"] });
    qc.invalidateQueries({ queryKey: ["admin", "companies"] });
    qc.invalidateQueries({ queryKey: ["admin", "eligibility_criteria"] });
    qc.invalidateQueries({ queryKey: ["admin", "job_roles"] });
    qc.invalidateQueries({ queryKey: ["companies"] });
    qc.invalidateQueries({ queryKey: ["company"] });
    qc.invalidateQueries({ queryKey: ["admin", "dashboard_counts"] });
    qc.invalidateQueries({ queryKey: ["admin", "dashboard_data"] });
  };

  // Mutation: Save Company Details (Update)
  const updateCompanyMutation = useMutation({
    mutationFn: async (form: CompanyFormState) => {
      if (!form.id) throw new Error("Missing company ID");
      const { error } = await supabase
        .from("companies")
        .update({
          name: form.name.trim(),
          sector: form.sector.trim(),
          headquarters: form.headquarters.trim(),
          website: form.website.trim() || null,
          first_visit_year: form.first_visit_year === "" ? null : Number(form.first_visit_year),
          overview: form.overview.trim(),
          dsa_difficulty: form.dsa_difficulty,
          verification_status: form.verification_status,
          is_published: form.is_published,
          is_demo: form.is_demo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company information updated successfully");
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update company");
    },
  });

  // Mutation: Create Company (+ optional criteria & optional role)
  const createCompanyMutation = useMutation({
    mutationFn: async (form: CompanyFormState) => {
      const { data: newComp, error: compErr } = await supabase
        .from("companies")
        .insert({
          name: form.name.trim(),
          sector: form.sector.trim(),
          headquarters: form.headquarters.trim(),
          website: form.website.trim() || null,
          first_visit_year: form.first_visit_year === "" ? null : Number(form.first_visit_year),
          overview: form.overview.trim(),
          dsa_difficulty: form.dsa_difficulty,
          verification_status: form.verification_status,
          is_published: form.is_published,
          is_demo: form.is_demo,
        })
        .select()
        .single();

      if (compErr) throw compErr;

      // If initial criteria is provided, insert it
      if (form.include_criteria && form.criteria && form.criteria.year !== "") {
        const crit = form.criteria;
        const { error: critErr } = await supabase.from("eligibility_criteria").insert({
          company_id: newComp.id,
          year: Number(crit.year),
          min_10th_percentage:
            crit.min_10th_percentage === "" ? null : Number(crit.min_10th_percentage),
          min_12th_percentage:
            crit.min_12th_percentage === "" ? null : Number(crit.min_12th_percentage),
          min_cgpa: crit.min_cgpa === "" ? null : Number(crit.min_cgpa),
          max_backlogs: crit.max_backlogs === "" ? null : Number(crit.max_backlogs),
          branches: crit.branches.trim(),
          notes: crit.notes.trim() || null,
          is_current: crit.is_current,
        });
        if (critErr) {
          toast.warning("Company created, but initial eligibility criteria failed to save");
        }
      }

      // If initial job role is provided, insert it
      if (form.include_role && form.role && form.role.title.trim()) {
        const r = form.role;
        const { error: roleErr } = await supabase.from("job_roles").insert({
          company_id: newComp.id,
          title: r.title.trim(),
          hiring_year: Number(r.hiring_year) || new Date().getFullYear(),
          location: r.location.trim() || null,
          ctc_note: r.ctc_note.trim() || null,
        });
        if (roleErr) {
          toast.warning("Company created, but initial job role failed to save");
        }
      }

      return newComp;
    },
    onSuccess: (data) => {
      toast.success(`Recruiter "${data.name}" added successfully`);
      setIsAddCompanyOpen(false);
      setNewCompanyForm(initialCompanyForm);
      setNewCompanyErrors({});
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add company");
    },
  });

  // Mutation: Quick Toggle Company Publication
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("companies")
        .update({ is_published, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.is_published
          ? "Company published (visible to students)"
          : "Company unpublished (hidden from students)",
      );
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to toggle status");
    },
  });

  // Mutation: Delete Company
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company and all associated records deleted");
      setCompanyToDelete(null);
      if (selectedCompanyId === companyToDelete?.id) {
        setSelectedCompanyId(null);
      }
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete company");
    },
  });

  // Mutation: Save / Update Eligibility Criteria Record
  const saveCriteriaMutation = useMutation({
    mutationFn: async ({
      companyId,
      criteria,
    }: {
      companyId: string;
      criteria: CriteriaFormState;
    }) => {
      if (criteria.is_current) {
        await supabase
          .from("eligibility_criteria")
          .update({ is_current: false })
          .eq("company_id", companyId);
      }

      const payload = {
        company_id: companyId,
        year: Number(criteria.year),
        min_10th_percentage:
          criteria.min_10th_percentage === "" ? null : Number(criteria.min_10th_percentage),
        min_12th_percentage:
          criteria.min_12th_percentage === "" ? null : Number(criteria.min_12th_percentage),
        min_cgpa: criteria.min_cgpa === "" ? null : Number(criteria.min_cgpa),
        max_backlogs: criteria.max_backlogs === "" ? null : Number(criteria.max_backlogs),
        branches: criteria.branches.trim(),
        notes: criteria.notes.trim() || null,
        is_current: criteria.is_current,
      };

      if (criteria.id) {
        const { error } = await supabase
          .from("eligibility_criteria")
          .update(payload)
          .eq("id", criteria.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("eligibility_criteria").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Eligibility criteria version saved successfully");
      setIsCriteriaDialogOpen(false);
      setCriteriaForm(initialCriteriaForm);
      setCriteriaTargetCompanyId(null);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save eligibility criteria");
    },
  });

  // Mutation: Set Active Drive Criteria
  const setActiveCriteriaMutation = useMutation({
    mutationFn: async ({ companyId, criteriaId }: { companyId: string; criteriaId: string }) => {
      const { error: err1 } = await supabase
        .from("eligibility_criteria")
        .update({ is_current: false })
        .eq("company_id", companyId);
      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from("eligibility_criteria")
        .update({ is_current: true })
        .eq("id", criteriaId);
      if (err2) throw err2;
    },
    onSuccess: () => {
      toast.success("Active drive criteria updated");
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update active criteria");
    },
  });

  // Mutation: Delete Criteria Record
  const deleteCriteriaMutation = useMutation({
    mutationFn: async (criteriaId: string) => {
      const { error } = await supabase.from("eligibility_criteria").delete().eq("id", criteriaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Eligibility criteria version deleted");
      setCriteriaToDelete(null);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete criteria");
    },
  });

  // Mutation: Save / Update Job Role
  const saveRoleMutation = useMutation({
    mutationFn: async ({ companyId, role }: { companyId: string; role: RoleFormState }) => {
      const payload = {
        company_id: companyId,
        title: role.title.trim(),
        hiring_year: Number(role.hiring_year),
        location: role.location.trim() || null,
        ctc_note: role.ctc_note.trim() || null,
      };

      if (role.id) {
        const { error } = await supabase.from("job_roles").update(payload).eq("id", role.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_roles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Campus job role saved successfully");
      setIsRoleDialogOpen(false);
      setRoleForm(initialRoleForm);
      setRoleTargetCompanyId(null);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save job role");
    },
  });

  // Mutation: Delete Job Role
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("job_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job role deleted");
      setRoleToDelete(null);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete job role");
    },
  });

  // Criteria validation helper
  const validateCriteria = (form: CriteriaFormState): boolean => {
    const errors: Record<string, string> = {};

    if (form.year === "" || isNaN(Number(form.year)) || Number(form.year) < 2000) {
      errors.year = "Valid recruitment drive year is required (e.g. 2026)";
    }

    if (form.min_10th_percentage !== "") {
      const val = Number(form.min_10th_percentage);
      if (isNaN(val) || val < 0 || val > 100) {
        errors.min_10th_percentage = "10th percentage must be between 0.00% and 100.00%";
      }
    }

    if (form.min_12th_percentage !== "") {
      const val = Number(form.min_12th_percentage);
      if (isNaN(val) || val < 0 || val > 100) {
        errors.min_12th_percentage = "12th percentage must be between 0.00% and 100.00%";
      }
    }

    if (form.min_cgpa !== "") {
      const val = Number(form.min_cgpa);
      if (isNaN(val) || val < 0 || val > 10) {
        errors.min_cgpa = "CGPA must be between 0.00 and 10.00";
      }
    }

    if (form.max_backlogs !== "") {
      const val = Number(form.max_backlogs);
      if (isNaN(val) || val < 0 || !Number.isInteger(val)) {
        errors.max_backlogs = "Max backlogs must be 0 or a positive whole number";
      }
    }

    if (!form.branches.trim()) {
      errors.branches = "Eligible branches are required (e.g. Computer, IT, E&TC)";
    }

    setCriteriaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Role validation helper
  const validateRole = (form: RoleFormState): boolean => {
    const errors: Record<string, string> = {};

    if (!form.title.trim()) {
      errors.title = "Role title is required (e.g. Software Engineer)";
    }

    if (
      form.hiring_year === "" ||
      isNaN(Number(form.hiring_year)) ||
      Number(form.hiring_year) < 2000
    ) {
      errors.hiring_year = "Valid recruitment year is required (e.g. 2026)";
    }

    setRoleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open criteria sub-dialog
  const handleAddNewCriteria = (companyId?: string) => {
    const targetId = companyId || selectedCompanyId;
    if (!targetId || !companies) return;
    const targetComp = companies.find((c) => c.id === targetId);
    const existingYears = (targetComp?.eligibility_criteria || []).map((c) => c.year);
    const nextYear =
      existingYears.length > 0 ? Math.max(...existingYears) + 1 : new Date().getFullYear();

    setCriteriaTargetCompanyId(targetId);
    setCriteriaForm({
      ...initialCriteriaForm,
      year: nextYear,
      is_current: existingYears.length === 0,
    });
    setCriteriaErrors({});
    setIsCriteriaDialogOpen(true);
  };

  const handleEditCriteria = (crit: EligibilityCriteria, companyId?: string) => {
    setCriteriaTargetCompanyId(companyId || selectedCompanyId);
    setCriteriaForm({
      id: crit.id,
      year: crit.year,
      min_10th_percentage: crit.min_10th_percentage ?? "",
      min_12th_percentage: crit.min_12th_percentage ?? "",
      min_cgpa: crit.min_cgpa ?? "",
      max_backlogs: crit.max_backlogs ?? "",
      branches: crit.branches,
      notes: crit.notes ?? "",
      is_current: crit.is_current,
    });
    setCriteriaErrors({});
    setIsCriteriaDialogOpen(true);
  };

  const handleSaveCriteriaSubmit = (e: FormEvent) => {
    e.preventDefault();
    const targetId = criteriaTargetCompanyId || selectedCompanyId;
    if (!targetId) return;
    if (!validateCriteria(criteriaForm)) return;

    saveCriteriaMutation.mutate({
      companyId: targetId,
      criteria: criteriaForm,
    });
  };

  // Open job role sub-dialog
  const handleAddNewRole = (companyId?: string) => {
    const targetId = companyId || selectedCompanyId;
    if (!targetId) return;

    setRoleTargetCompanyId(targetId);
    setRoleForm({
      ...initialRoleForm,
      hiring_year: new Date().getFullYear(),
    });
    setRoleErrors({});
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: JobRole, companyId?: string) => {
    setRoleTargetCompanyId(companyId || selectedCompanyId);
    setRoleForm({
      id: role.id,
      title: role.title,
      hiring_year: role.hiring_year,
      location: role.location || "",
      ctc_note: role.ctc_note || "",
    });
    setRoleErrors({});
    setIsRoleDialogOpen(true);
  };

  const handleSaveRoleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const targetId = roleTargetCompanyId || selectedCompanyId;
    if (!targetId) return;
    if (!validateRole(roleForm)) return;

    saveRoleMutation.mutate({
      companyId: targetId,
      role: roleForm,
    });
  };

  // Filtered companies list
  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c) => {
      if (statusFilter === "published" && !c.is_published) return false;
      if (statusFilter === "draft" && c.is_published) return false;
      if (statusFilter === "demo" && !c.is_demo) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(term);
        const matchesSector = (c.sector || "").toLowerCase().includes(term);
        const matchesHq = (c.headquarters || "").toLowerCase().includes(term);
        const matchesBranches = (c.eligibility_criteria || []).some((crit) =>
          crit.branches.toLowerCase().includes(term),
        );
        const matchesRoles = (c.job_roles || []).some(
          (r) =>
            r.title.toLowerCase().includes(term) ||
            (r.location || "").toLowerCase().includes(term) ||
            (r.ctc_note || "").toLowerCase().includes(term),
        );
        return matchesName || matchesSector || matchesHq || matchesBranches || matchesRoles;
      }
      return true;
    });
  }, [companies, statusFilter, searchTerm]);

  return (
    <>
      <PageHeader
        title="Manage Companies"
        description="Unified recruiter management console. Manage company profiles, multi-year academic eligibility cut-offs, and campus job roles directly in one centralized place."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setNewCompanyForm(initialCompanyForm);
                setNewCompanyErrors({});
                setIsAddCompanyOpen(true);
              }}
              size="sm"
              className="font-semibold text-xs shadow-xs rounded-md"
            >
              <Plus className="size-3.5 mr-1.5" /> Add New Company
            </Button>
          </div>
        }
      />

      {/* Toolbar: Search, Filters & Counters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company, industry, location, role, branch…"
            className="pl-9 text-xs h-9 rounded-md bg-card"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Filter:</span>
          {[
            { id: "all", label: "All Companies" },
            { id: "published", label: "Published" },
            { id: "draft", label: "Drafts (Hidden)" },
            { id: "demo", label: "Demo Data" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                statusFilter === tab.id
                  ? "border-slate-800 bg-slate-900 text-white dark:border-slate-700 dark:bg-slate-800"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2"
            >
              Collapse All
            </Button>
          </div>

          <span className="ml-2 rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
            {filteredCompanies.length} records
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState label="Loading recruiter directory, criteria and job roles…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          title="No companies found"
          description={
            searchTerm || statusFilter !== "all"
              ? "No companies match your current search or filter criteria. Try resetting filters."
              : "Get started by registering your first campus recruitment partner company."
          }
          action={
            <Button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              variant="outline"
              size="sm"
              className="text-xs rounded-md"
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredCompanies.map((c) => {
            const criteriaList = c.eligibility_criteria || [];
            const activeCriteria = criteriaList.find((crit) => crit.is_current) ?? criteriaList[0];
            const rolesList = c.job_roles || [];
            const isExpanded = expandedCompanyIds.has(c.id);

            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all hover:border-slate-800/40"
              >
                {/* Main Card Header / Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      onClick={() => toggleExpandCompany(c.id)}
                      className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title={isExpanded ? "Collapse management panel" : "Expand management panel"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-100 font-mono text-sm font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground text-sm sm:text-base">
                          {c.name}
                        </span>
                        {c.website && (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title={c.website}
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                        <span
                          className={`inline-flex items-center rounded-[4px] border px-2 py-0.2 text-[10px] font-semibold ${
                            c.is_published
                              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {c.is_published ? "Published" : "Draft"}
                        </span>
                        <VerifyTag status={c.verification_status} />
                        {c.is_demo && <DemoTag />}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {c.sector && <span>{c.sector}</span>}
                        {c.headquarters && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" /> {c.headquarters}
                          </span>
                        )}
                        {c.first_visit_year && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" /> Visit: {c.first_visit_year}
                          </span>
                        )}
                        <DifficultyTag level={c.dsa_difficulty} />
                      </div>
                    </div>
                  </div>

                  {/* Summary Badges & Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 lg:self-center pl-10 lg:pl-0">
                    <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="size-3 text-primary" />
                      <span>{criteriaList.length} Criteria Years</span>
                    </span>

                    <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Briefcase className="size-3 text-primary" />
                      <span>{rolesList.length} Job Roles</span>
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCompanyManager(c, "details")}
                      className="h-8 text-xs font-semibold rounded-md border-border"
                    >
                      <Pencil className="size-3 mr-1" /> Manage Recruiter
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        togglePublishMutation.mutate({
                          id: c.id,
                          is_published: !c.is_published,
                        })
                      }
                      className={`h-8 text-xs font-medium rounded-md px-2 ${
                        c.is_published
                          ? "text-amber-700 hover:text-amber-800 hover:bg-amber-500/10 dark:text-amber-400"
                          : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-400"
                      }`}
                      title={c.is_published ? "Unpublish company" : "Publish to students"}
                    >
                      {c.is_published ? "Unpublish" : "Publish"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCompanyToDelete(c)}
                      className="h-8 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md px-2"
                      title="Delete company"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Active Criteria Sneak-Peek (When Collapsed) */}
                {!isExpanded && activeCriteria && (
                  <div className="px-5 pb-4 pt-0 border-t border-border/40 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2 bg-muted/10">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <GraduationCap className="size-3 text-primary" /> {activeCriteria.year}{" "}
                        Active Cut-offs:
                      </span>
                      <span>
                        10th:{" "}
                        <strong className="text-foreground">
                          {activeCriteria.min_10th_percentage != null
                            ? `${activeCriteria.min_10th_percentage}%`
                            : "Not specified"}
                        </strong>
                      </span>
                      <span>
                        12th:{" "}
                        <strong className="text-foreground">
                          {activeCriteria.min_12th_percentage != null
                            ? `${activeCriteria.min_12th_percentage}%`
                            : "Not specified"}
                        </strong>
                      </span>
                      <span>
                        CGPA:{" "}
                        <strong className="text-foreground">
                          {activeCriteria.min_cgpa != null
                            ? activeCriteria.min_cgpa
                            : "Not specified"}
                        </strong>
                      </span>
                      <span>
                        Backlogs:{" "}
                        <strong className="text-foreground">
                          {activeCriteria.max_backlogs != null
                            ? activeCriteria.max_backlogs === 0
                              ? "0 permitted"
                              : `${activeCriteria.max_backlogs} max`
                            : "Not specified"}
                        </strong>
                      </span>
                    </div>

                    <button
                      onClick={() => toggleExpandCompany(c.id)}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                      View 3 Management Sections <ChevronRight className="size-3" />
                    </button>
                  </div>
                )}

                {/* ============================================================= */}
                {/* EXPANDABLE MANAGEMENT ACCORDION: 3 SECTIONS                   */}
                {/* ============================================================= */}
                {isExpanded && (
                  <div className="border-t border-border bg-slate-50/50 p-4 sm:p-6 dark:bg-slate-900/30 space-y-6">
                    {/* SECTION 1: COMPANY INFORMATION */}
                    <div className="rounded-lg border border-border bg-card p-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-primary" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            1. Company Information
                          </h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCompanyManager(c, "details")}
                          className="h-7 text-[11px] font-semibold rounded-md"
                        >
                          <Pencil className="size-3 mr-1" /> Edit Profile
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                            Company Name
                          </span>
                          <span className="font-semibold text-foreground mt-0.5 block">
                            {c.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                            Industry / Sector
                          </span>
                          <span className="text-foreground mt-0.5 block">
                            {c.sector || "General / Uncategorized"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                            Headquarters / Location
                          </span>
                          <span className="text-foreground mt-0.5 block">
                            {c.headquarters || "Not specified"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                            Website
                          </span>
                          {c.website ? (
                            <a
                              href={c.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline mt-0.5 flex items-center gap-1"
                            >
                              {c.website} <ExternalLink className="size-2.5" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground mt-0.5 block">Not provided</span>
                          )}
                        </div>
                      </div>

                      {c.overview && (
                        <div className="mt-3 pt-3 border-t border-border/60 text-xs">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                            Overview & Hiring Guidelines
                          </span>
                          <p className="mt-1 text-muted-foreground leading-relaxed">{c.overview}</p>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: ELIGIBILITY CRITERIA */}
                    <div className="rounded-lg border border-border bg-card p-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-4 text-primary" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            2. Academic Eligibility Criteria ({criteriaList.length} drive years)
                          </h3>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddNewCriteria(c.id)}
                          className="h-7 text-[11px] font-semibold rounded-md shadow-2xs"
                        >
                          <Plus className="size-3 mr-1" /> Add Drive Year
                        </Button>
                      </div>

                      {criteriaList.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                          <p>No academic eligibility criteria configured for this company yet.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddNewCriteria(c.id)}
                            className="mt-2 text-xs rounded-md"
                          >
                            <Plus className="size-3 mr-1" /> Configure Drive Criteria
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {criteriaList.map((crit) => (
                            <div
                              key={crit.id}
                              className={`rounded-lg border p-3.5 text-xs transition-colors ${
                                crit.is_current
                                  ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/5"
                                  : "border-border bg-muted/20"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-foreground">
                                    {crit.year} Recruitment Drive
                                  </span>
                                  {crit.is_current ? (
                                    <span className="inline-flex items-center gap-1 rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                      <Check className="size-3" /> Active Drive Criteria
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-[4px] border border-border bg-card px-2 py-0.2 text-[10px] font-medium text-muted-foreground">
                                      Historical Record
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {!crit.is_current && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setActiveCriteriaMutation.mutate({
                                          companyId: c.id,
                                          criteriaId: crit.id,
                                        })
                                      }
                                      className="h-6 text-[10px] font-medium rounded px-2"
                                    >
                                      Set Active
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditCriteria(crit, c.id)}
                                    className="h-6 text-[10px] font-medium rounded px-2"
                                  >
                                    <Pencil className="size-2.5 mr-1" /> Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCriteriaToDelete(crit)}
                                    className="h-6 text-[10px] text-destructive hover:bg-destructive/10 rounded px-1.5"
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2.5 text-xs">
                                <div className="rounded border border-border/50 bg-background/50 p-2">
                                  <span className="text-[10px] text-muted-foreground block">
                                    Min. 10th %
                                  </span>
                                  <span className="font-mono font-semibold text-foreground">
                                    {crit.min_10th_percentage != null
                                      ? `${crit.min_10th_percentage}%`
                                      : "Not specified"}
                                  </span>
                                </div>
                                <div className="rounded border border-border/50 bg-background/50 p-2">
                                  <span className="text-[10px] text-muted-foreground block">
                                    Min. 12th %
                                  </span>
                                  <span className="font-mono font-semibold text-foreground">
                                    {crit.min_12th_percentage != null
                                      ? `${crit.min_12th_percentage}%`
                                      : "Not specified"}
                                  </span>
                                </div>
                                <div className="rounded border border-border/50 bg-background/50 p-2">
                                  <span className="text-[10px] text-muted-foreground block">
                                    Min. CGPA
                                  </span>
                                  <span className="font-mono font-semibold text-foreground">
                                    {crit.min_cgpa != null ? crit.min_cgpa : "Not specified"}
                                  </span>
                                </div>
                                <div className="rounded border border-border/50 bg-background/50 p-2">
                                  <span className="text-[10px] text-muted-foreground block">
                                    Max Backlogs
                                  </span>
                                  <span className="font-mono font-semibold text-foreground">
                                    {crit.max_backlogs != null
                                      ? crit.max_backlogs === 0
                                        ? "0 (Zero backlogs)"
                                        : `${crit.max_backlogs} allowed`
                                      : "Not specified"}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1 text-[11px] pt-1">
                                <div>
                                  <span className="font-semibold text-foreground">Branches:</span>{" "}
                                  <span className="text-muted-foreground">{crit.branches}</span>
                                </div>
                                {crit.notes && (
                                  <div>
                                    <span className="font-semibold text-foreground">
                                      Conditions:
                                    </span>{" "}
                                    <span className="text-muted-foreground">{crit.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION 3: JOB ROLES */}
                    <div className="rounded-lg border border-border bg-card p-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Briefcase className="size-4 text-primary" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            3. Campus Job Roles ({rolesList.length} positions)
                          </h3>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddNewRole(c.id)}
                          className="h-7 text-[11px] font-semibold rounded-md shadow-2xs"
                        >
                          <Plus className="size-3 mr-1" /> Add Job Role
                        </Button>
                      </div>

                      {rolesList.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                          <p>No job roles recorded for this company yet.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddNewRole(c.id)}
                            className="mt-2 text-xs rounded-md"
                          >
                            <Plus className="size-3 mr-1" /> Add First Role
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-border bg-muted/40 text-[10px] font-semibold uppercase text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2">Role Title</th>
                                <th className="px-3 py-2">Hiring Year</th>
                                <th className="px-3 py-2">Location</th>
                                <th className="px-3 py-2">Salary / CTC Notes</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {rolesList.map((role) => (
                                <tr
                                  key={role.id}
                                  className="hover:bg-muted/30 transition-colors text-xs"
                                >
                                  <td className="px-3 py-2.5 font-semibold text-foreground">
                                    {role.title}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-muted-foreground">
                                    {role.hiring_year}
                                  </td>
                                  <td className="px-3 py-2.5 text-muted-foreground">
                                    {role.location || "Not specified"}
                                  </td>
                                  <td className="px-3 py-2.5 text-muted-foreground font-mono">
                                    {role.ctc_note || "Not specified"}
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditRole(role, c.id)}
                                        className="h-6 text-[10px] font-medium rounded px-2"
                                      >
                                        <Pencil className="size-2.5 mr-1" /> Edit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setRoleToDelete(role)}
                                        className="h-6 text-[10px] text-destructive hover:bg-destructive/10 rounded px-1.5"
                                      >
                                        <Trash2 className="size-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 1: ADD NEW COMPANY (+ CRITERIA & ROLE)                              */}
      {/* ========================================================================= */}
      <Dialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Add New Campus Recruiter
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a new partner company with optional initial eligibility criteria and job
              role.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const errors: Record<string, string> = {};
              if (!newCompanyForm.name.trim()) errors.name = "Company name is required";
              if (
                newCompanyForm.include_criteria &&
                newCompanyForm.criteria &&
                !validateCriteria(newCompanyForm.criteria)
              ) {
                return;
              }
              if (
                newCompanyForm.include_role &&
                newCompanyForm.role &&
                !validateRole(newCompanyForm.role)
              ) {
                return;
              }
              if (Object.keys(errors).length > 0) {
                setNewCompanyErrors(errors);
                return;
              }
              createCompanyMutation.mutate(newCompanyForm);
            }}
            className="space-y-5 py-2 text-xs"
          >
            {/* Section 1: Company Profile */}
            <div className="space-y-4">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider pb-1 border-b border-border">
                1. Company Information
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="new-name" className="text-xs font-medium">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-name"
                    value={newCompanyForm.name}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Google India, TCS, Infosys"
                    className="mt-1 h-8 text-xs rounded-md"
                  />
                  {newCompanyErrors.name && (
                    <p className="mt-1 text-[11px] text-destructive">{newCompanyErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="new-sector" className="text-xs font-medium">
                    Industry / Sector
                  </Label>
                  <Input
                    id="new-sector"
                    value={newCompanyForm.sector}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({ ...prev, sector: e.target.value }))
                    }
                    placeholder="e.g. IT Services, Cloud, FinTech"
                    className="mt-1 h-8 text-xs rounded-md"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="new-hq" className="text-xs font-medium">
                    Location / Headquarters
                  </Label>
                  <Input
                    id="new-hq"
                    value={newCompanyForm.headquarters}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({ ...prev, headquarters: e.target.value }))
                    }
                    placeholder="e.g. Pune / Bengaluru"
                    className="mt-1 h-8 text-xs rounded-md"
                  />
                </div>

                <div>
                  <Label htmlFor="new-website" className="text-xs font-medium">
                    Website URL
                  </Label>
                  <Input
                    id="new-website"
                    type="url"
                    value={newCompanyForm.website}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({ ...prev, website: e.target.value }))
                    }
                    placeholder="https://..."
                    className="mt-1 h-8 text-xs rounded-md"
                  />
                </div>

                <div>
                  <Label htmlFor="new-visit-year" className="text-xs font-medium">
                    Recruiting Year (Campus Visit)
                  </Label>
                  <Input
                    id="new-visit-year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={newCompanyForm.first_visit_year}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({
                        ...prev,
                        first_visit_year: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    placeholder="e.g. 2026"
                    className="mt-1 h-8 text-xs rounded-md"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="new-diff" className="text-xs font-medium">
                    DSA Difficulty
                  </Label>
                  <select
                    id="new-diff"
                    value={newCompanyForm.dsa_difficulty}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({
                        ...prev,
                        dsa_difficulty: e.target.value as Database["public"]["Enums"]["difficulty"],
                      }))
                    }
                    className="mt-1 h-8 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="new-verify" className="text-xs font-medium">
                    Verification Status
                  </Label>
                  <select
                    id="new-verify"
                    value={newCompanyForm.verification_status}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({
                        ...prev,
                        verification_status: e.target.value as
                          "unverified" | "pending" | "verified",
                      }))
                    }
                    className="mt-1 h-8 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending Review</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="new-overview" className="text-xs font-medium">
                  Overview & Company Profile
                </Label>
                <Textarea
                  id="new-overview"
                  rows={2}
                  value={newCompanyForm.overview}
                  onChange={(e) =>
                    setNewCompanyForm((prev) => ({ ...prev, overview: e.target.value }))
                  }
                  placeholder="Summary of hiring focus, requirements, technologies…"
                  className="mt-1 text-xs rounded-md"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCompanyForm.is_published}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({ ...prev, is_published: e.target.checked }))
                    }
                    className="rounded border-input text-primary focus:ring-primary size-4"
                  />
                  <span className="text-xs font-medium text-foreground">
                    Publish immediately (Visible to students)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCompanyForm.is_demo}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({ ...prev, is_demo: e.target.checked }))
                    }
                    className="rounded border-input text-primary focus:ring-primary size-4"
                  />
                  <span className="text-xs text-muted-foreground">Mark as demo data</span>
                </label>
              </div>
            </div>

            {/* Section 2: Optional Initial Criteria */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-primary" /> 2. Initial Drive Criteria
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Optionally define cut-offs for this company's upcoming drive now.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCompanyForm.include_criteria}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({
                        ...prev,
                        include_criteria: e.target.checked,
                      }))
                    }
                    className="rounded border-input text-primary focus:ring-primary size-4"
                  />
                  <span className="text-xs font-semibold text-foreground">Configure now</span>
                </label>
              </div>

              {newCompanyForm.include_criteria && newCompanyForm.criteria && (
                <div className="grid gap-3 pt-2 border-t border-border/60">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-[11px] font-medium">Drive Year *</Label>
                      <Input
                        type="number"
                        value={newCompanyForm.criteria.year}
                        onChange={(e) =>
                          setNewCompanyForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria!,
                              year: e.target.value === "" ? "" : Number(e.target.value),
                            },
                          }))
                        }
                        className="mt-1 h-8 text-xs rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium">Min. 10th % (0-100)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="Nullable"
                        value={newCompanyForm.criteria.min_10th_percentage}
                        onChange={(e) =>
                          setNewCompanyForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria!,
                              min_10th_percentage:
                                e.target.value === "" ? "" : Number(e.target.value),
                            },
                          }))
                        }
                        className="mt-1 h-8 text-xs rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium">Min. 12th % (0-100)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="Nullable"
                        value={newCompanyForm.criteria.min_12th_percentage}
                        onChange={(e) =>
                          setNewCompanyForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria!,
                              min_12th_percentage:
                                e.target.value === "" ? "" : Number(e.target.value),
                            },
                          }))
                        }
                        className="mt-1 h-8 text-xs rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-[11px] font-medium">Min. CGPA (0-10)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        placeholder="e.g. 7.50"
                        value={newCompanyForm.criteria.min_cgpa}
                        onChange={(e) =>
                          setNewCompanyForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria!,
                              min_cgpa: e.target.value === "" ? "" : Number(e.target.value),
                            },
                          }))
                        }
                        className="mt-1 h-8 text-xs rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium">Max Backlogs</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0 for zero backlog policy"
                        value={newCompanyForm.criteria.max_backlogs}
                        onChange={(e) =>
                          setNewCompanyForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria!,
                              max_backlogs: e.target.value === "" ? "" : Number(e.target.value),
                            },
                          }))
                        }
                        className="mt-1 h-8 text-xs rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium">Eligible Branches *</Label>
                    <Input
                      value={newCompanyForm.criteria.branches}
                      onChange={(e) =>
                        setNewCompanyForm((prev) => ({
                          ...prev,
                          criteria: {
                            ...prev.criteria!,
                            branches: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Computer Engineering, IT, AI&DS"
                      className="mt-1 h-8 text-xs rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Optional Initial Job Role */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Briefcase className="size-4 text-primary" /> 3. Initial Campus Job Role
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Optionally add the first job role offered by this recruiter.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCompanyForm.include_role}
                    onChange={(e) =>
                      setNewCompanyForm((prev) => ({
                        ...prev,
                        include_role: e.target.checked,
                      }))
                    }
                    className="rounded border-input text-primary focus:ring-primary size-4"
                  />
                  <span className="text-xs font-semibold text-foreground">Add role now</span>
                </label>
              </div>

              {newCompanyForm.include_role && newCompanyForm.role && (
                <div className="grid gap-3 pt-2 border-t border-border/60">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-[11px] font-medium">Role Title *</Label>
                      <Input
                        value={newCompanyForm.role.title}
                        onChange={(e) =>
                          setNewCompanyForm((prev) => ({
                            ...prev,
                            role: { ...prev.role!, title: e.target.value },
                          }))
                        }
                        placeholder="e.g. Associate Software Engineer"
                        className="mt-1 h-8 text-xs rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium">Hiring Year *</Label>
                      <Input
                        type="number"
                        value={newCompanyForm.role.hiring_year}
                        onChange={(e) =>
                          setNewCompanyForm((prev) => ({
                            ...prev,
                            role: {
                              ...prev.role!,
                              hiring_year: e.target.value === "" ? "" : Number(e.target.value),
                            },
                          }))
                        }
                        className="mt-1 h-8 text-xs rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-[11px] font-medium">Job Location</Label>
                      <Input
                        value={newCompanyForm.role.location}
                        onChange={(e) =>
                          setNewCompanyForm((prev) => ({
                            ...prev,
                            role: { ...prev.role!, location: e.target.value },
                          }))
                        }
                        placeholder="e.g. Pune / Bengaluru"
                        className="mt-1 h-8 text-xs rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium">Salary / CTC Notes</Label>
                      <Input
                        value={newCompanyForm.role.ctc_note}
                        onChange={(e) =>
                          setNewCompanyForm((prev) => ({
                            ...prev,
                            role: { ...prev.role!, ctc_note: e.target.value },
                          }))
                        }
                        placeholder="e.g. 10–12 LPA"
                        className="mt-1 h-8 text-xs rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddCompanyOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createCompanyMutation.isPending}
                className="text-xs font-semibold rounded-md"
              >
                {createCompanyMutation.isPending ? "Adding…" : "Add Recruiter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: MANAGE COMPANY & INTEGRATED CRITERIA + ROLES MODAL               */}
      {/* ========================================================================= */}
      <Dialog
        open={!!selectedCompanyId}
        onOpenChange={(open) => {
          if (!open) setSelectedCompanyId(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl">
          {selectedCompany && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <Building2 className="size-4 text-primary" />
                      <span>{selectedCompany.name}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {selectedCompany.sector || "Uncategorized"} ·{" "}
                      {selectedCompany.headquarters || "No location recorded"}
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold ${
                        selectedCompany.is_published
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {selectedCompany.is_published ? "Published" : "Draft"}
                    </span>
                    <VerifyTag status={selectedCompany.verification_status} />
                  </div>
                </div>
              </DialogHeader>

              {/* Tabs: Details vs Academic Criteria vs Job Roles */}
              <Tabs
                value={companyModalTab}
                onValueChange={(v) => setCompanyModalTab(v as typeof companyModalTab)}
                className="mt-2"
              >
                <TabsList className="grid w-full grid-cols-3 rounded-lg bg-muted p-1">
                  <TabsTrigger
                    value="details"
                    className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold rounded-md"
                  >
                    <FileText className="size-3.5 mr-1.5" /> 1. Company Information
                  </TabsTrigger>
                  <TabsTrigger
                    value="criteria"
                    className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold rounded-md"
                  >
                    <GraduationCap className="size-3.5 mr-1.5" /> 2. Eligibility (
                    {selectedCompany.eligibility_criteria.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="roles"
                    className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold rounded-md"
                  >
                    <Briefcase className="size-3.5 mr-1.5" /> 3. Job Roles (
                    {selectedCompany.job_roles.length})
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: COMPANY INFORMATION FORM */}
                <TabsContent value="details" className="pt-4 space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const errors: Record<string, string> = {};
                      if (!companyEditForm.name.trim()) errors.name = "Company name is required";
                      if (Object.keys(errors).length > 0) {
                        setCompanyFormErrors(errors);
                        return;
                      }
                      updateCompanyMutation.mutate(companyEditForm);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="edit-name" className="text-xs font-medium">
                          Company Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="edit-name"
                          value={companyEditForm.name}
                          onChange={(e) =>
                            setCompanyEditForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="mt-1 h-8 text-xs rounded-md"
                        />
                        {companyFormErrors.name && (
                          <p className="mt-1 text-[11px] text-destructive">
                            {companyFormErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="edit-sector" className="text-xs font-medium">
                          Industry / Sector
                        </Label>
                        <Input
                          id="edit-sector"
                          value={companyEditForm.sector}
                          onChange={(e) =>
                            setCompanyEditForm((prev) => ({ ...prev, sector: e.target.value }))
                          }
                          className="mt-1 h-8 text-xs rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="edit-hq" className="text-xs font-medium">
                          Location / Headquarters
                        </Label>
                        <Input
                          id="edit-hq"
                          value={companyEditForm.headquarters}
                          onChange={(e) =>
                            setCompanyEditForm((prev) => ({
                              ...prev,
                              headquarters: e.target.value,
                            }))
                          }
                          className="mt-1 h-8 text-xs rounded-md"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-website" className="text-xs font-medium">
                          Website
                        </Label>
                        <Input
                          id="edit-website"
                          type="url"
                          value={companyEditForm.website}
                          onChange={(e) =>
                            setCompanyEditForm((prev) => ({ ...prev, website: e.target.value }))
                          }
                          className="mt-1 h-8 text-xs rounded-md"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-year" className="text-xs font-medium">
                          Recruiting Year (First Visit)
                        </Label>
                        <Input
                          id="edit-year"
                          type="number"
                          value={companyEditForm.first_visit_year}
                          onChange={(e) =>
                            setCompanyEditForm((prev) => ({
                              ...prev,
                              first_visit_year: e.target.value === "" ? "" : Number(e.target.value),
                            }))
                          }
                          className="mt-1 h-8 text-xs rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="edit-diff" className="text-xs font-medium">
                          DSA Difficulty
                        </Label>
                        <select
                          id="edit-diff"
                          value={companyEditForm.dsa_difficulty}
                          onChange={(e) =>
                            setCompanyEditForm((prev) => ({
                              ...prev,
                              dsa_difficulty: e.target
                                .value as Database["public"]["Enums"]["difficulty"],
                            }))
                          }
                          className="mt-1 h-8 w-full rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="edit-verify" className="text-xs font-medium">
                          Verification Status
                        </Label>
                        <select
                          id="edit-verify"
                          value={companyEditForm.verification_status}
                          onChange={(e) =>
                            setCompanyEditForm((prev) => ({
                              ...prev,
                              verification_status: e.target.value as
                                "unverified" | "pending" | "verified",
                            }))
                          }
                          className="mt-1 h-8 w-full rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="unverified">Unverified</option>
                          <option value="pending">Pending Review</option>
                          <option value="verified">Verified</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-overview" className="text-xs font-medium">
                        Overview & Hiring Description
                      </Label>
                      <Textarea
                        id="edit-overview"
                        rows={3}
                        value={companyEditForm.overview}
                        onChange={(e) =>
                          setCompanyEditForm((prev) => ({ ...prev, overview: e.target.value }))
                        }
                        className="mt-1 text-xs rounded-md"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={companyEditForm.is_published}
                          onChange={(e) =>
                            setCompanyEditForm((prev) => ({
                              ...prev,
                              is_published: e.target.checked,
                            }))
                          }
                          className="rounded border-input text-primary focus:ring-primary size-4"
                        />
                        <span className="text-xs font-medium text-foreground">
                          Published (Visible to students in directory & dashboard)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={companyEditForm.is_demo}
                          onChange={(e) =>
                            setCompanyEditForm((prev) => ({
                              ...prev,
                              is_demo: e.target.checked,
                            }))
                          }
                          className="rounded border-input text-primary focus:ring-primary size-4"
                        />
                        <span className="text-xs text-muted-foreground">Demo Profile</span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-border">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={updateCompanyMutation.isPending}
                        className="text-xs font-semibold rounded-md shadow-xs"
                      >
                        {updateCompanyMutation.isPending
                          ? "Saving Changes…"
                          : "Save Company Profile"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* TAB 2: ELIGIBILITY CRITERIA */}
                <TabsContent value="criteria" className="pt-4 space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Multi-Year Criteria Independence
                      </p>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Every drive year maintains isolated eligibility cut-offs. Adding a new drive
                        year preserves all previous historical records for campus audit trails.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Configured Drive Years
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedCompany.eligibility_criteria.length} criteria version(s) on record
                      </p>
                    </div>

                    <Button
                      onClick={() => handleAddNewCriteria(selectedCompany.id)}
                      size="sm"
                      className="text-xs font-semibold rounded-md shadow-xs"
                    >
                      <Plus className="size-3.5 mr-1.5" /> Add Drive Year Criteria
                    </Button>
                  </div>

                  {selectedCompany.eligibility_criteria.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                      <AlertCircle className="size-6 text-muted-foreground mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-semibold text-foreground">
                        No criteria configured for this company yet
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Add cut-offs for the active campus placement drive.
                      </p>
                      <Button
                        onClick={() => handleAddNewCriteria(selectedCompany.id)}
                        size="sm"
                        variant="outline"
                        className="mt-3 text-xs rounded-md"
                      >
                        <Plus className="size-3.5 mr-1.5" /> Add First Drive Year
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCompany.eligibility_criteria.map((crit) => (
                        <div
                          key={crit.id}
                          className={`rounded-lg border p-4 transition-all ${
                            crit.is_current
                              ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/5"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-foreground">
                                {crit.year} Drive
                              </span>
                              {crit.is_current ? (
                                <span className="inline-flex items-center gap-1 rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  <Check className="size-3" /> Active Drive Criteria
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-[4px] border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  Historical Version
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {!crit.is_current && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setActiveCriteriaMutation.mutate({
                                      companyId: selectedCompany.id,
                                      criteriaId: crit.id,
                                    })
                                  }
                                  className="h-7 text-[11px] font-medium rounded-md px-2"
                                >
                                  Set as Active
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCriteria(crit, selectedCompany.id)}
                                className="h-7 text-[11px] font-medium rounded-md px-2"
                              >
                                <Pencil className="size-3 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCriteriaToDelete(crit)}
                                className="h-7 text-[11px] font-medium text-destructive hover:bg-destructive/10 rounded-md px-2"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                            <div className="rounded-md border border-border/50 bg-background/50 p-2">
                              <span className="text-[10px] font-medium text-muted-foreground block">
                                Min. 10th Percentage
                              </span>
                              <span className="font-mono text-xs font-semibold text-foreground mt-0.5 block">
                                {crit.min_10th_percentage != null
                                  ? `${crit.min_10th_percentage}%`
                                  : "Not specified"}
                              </span>
                            </div>
                            <div className="rounded-md border border-border/50 bg-background/50 p-2">
                              <span className="text-[10px] font-medium text-muted-foreground block">
                                Min. 12th Percentage
                              </span>
                              <span className="font-mono text-xs font-semibold text-foreground mt-0.5 block">
                                {crit.min_12th_percentage != null
                                  ? `${crit.min_12th_percentage}%`
                                  : "Not specified"}
                              </span>
                            </div>
                            <div className="rounded-md border border-border/50 bg-background/50 p-2">
                              <span className="text-[10px] font-medium text-muted-foreground block">
                                Min. CGPA Cut-off
                              </span>
                              <span className="font-mono text-xs font-semibold text-foreground mt-0.5 block">
                                {crit.min_cgpa != null ? crit.min_cgpa : "Not specified"}
                              </span>
                            </div>
                            <div className="rounded-md border border-border/50 bg-background/50 p-2">
                              <span className="text-[10px] font-medium text-muted-foreground block">
                                Max Active Backlogs
                              </span>
                              <span className="font-mono text-xs font-semibold text-foreground mt-0.5 block">
                                {crit.max_backlogs != null
                                  ? crit.max_backlogs === 0
                                    ? "0 (Zero backlogs)"
                                    : `${crit.max_backlogs} allowed`
                                  : "Not specified"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1 text-xs">
                            <div className="text-[11px]">
                              <span className="font-semibold text-foreground">
                                Eligible Branches:
                              </span>{" "}
                              <span className="text-muted-foreground">{crit.branches}</span>
                            </div>
                            {crit.notes && (
                              <div className="text-[11px] rounded-md bg-muted/40 p-2 text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  Conditions / Notes:
                                </span>{" "}
                                {crit.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* TAB 3: CAMPUS JOB ROLES */}
                <TabsContent value="roles" className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Configured Job Roles
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedCompany.job_roles.length} campus hiring position(s) on record
                      </p>
                    </div>

                    <Button
                      onClick={() => handleAddNewRole(selectedCompany.id)}
                      size="sm"
                      className="text-xs font-semibold rounded-md shadow-xs"
                    >
                      <Plus className="size-3.5 mr-1.5" /> Add Job Role
                    </Button>
                  </div>

                  {selectedCompany.job_roles.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                      <Briefcase className="size-6 text-muted-foreground mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-semibold text-foreground">
                        No job roles configured for this company yet
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Add the job designations and package notes offered by this recruiter.
                      </p>
                      <Button
                        onClick={() => handleAddNewRole(selectedCompany.id)}
                        size="sm"
                        variant="outline"
                        className="mt-3 text-xs rounded-md"
                      >
                        <Plus className="size-3.5 mr-1.5" /> Add First Role
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-slate-50/80 text-[10px] font-semibold uppercase text-muted-foreground dark:bg-slate-900/60">
                          <tr>
                            <th className="px-4 py-3">Role Title</th>
                            <th className="px-4 py-3">Hiring Year</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3">Salary / CTC Notes</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {selectedCompany.job_roles.map((role) => (
                            <tr
                              key={role.id}
                              className="hover:bg-muted/30 transition-colors text-xs"
                            >
                              <td className="px-4 py-3 font-semibold text-foreground">
                                {role.title}
                              </td>
                              <td className="px-4 py-3 font-mono text-muted-foreground">
                                {role.hiring_year}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {role.location || "Not specified"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground font-mono">
                                {role.ctc_note || "Not specified"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditRole(role, selectedCompany.id)}
                                    className="h-7 text-[11px] font-medium rounded-md px-2"
                                  >
                                    <Pencil className="size-3 mr-1" /> Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRoleToDelete(role)}
                                    className="h-7 text-[11px] font-medium text-destructive hover:bg-destructive/10 rounded-md px-2"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 3: ADD / EDIT CRITERIA SUB-MODAL                                    */}
      {/* ========================================================================= */}
      <Dialog open={isCriteriaDialogOpen} onOpenChange={setIsCriteriaDialogOpen}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {criteriaForm.id ? "Edit Drive-Year Criteria" : "Add New Drive-Year Criteria"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {criteriaForm.id
                ? "Updating this record modifies only this specific drive year. Other years remain untouched."
                : "Creates a new independent drive-year record. All prior drive years are preserved."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCriteriaSubmit} className="space-y-3.5 py-1 text-xs">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="sub-year" className="text-xs font-medium">
                  Drive Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sub-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={criteriaForm.year}
                  onChange={(e) =>
                    setCriteriaForm((prev) => ({
                      ...prev,
                      year: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="mt-1 h-8 text-xs rounded-md"
                />
                {criteriaErrors.year && (
                  <p className="mt-1 text-[10px] text-destructive">{criteriaErrors.year}</p>
                )}
              </div>

              <div>
                <Label htmlFor="sub-10th" className="text-xs font-medium">
                  10th Min. %
                </Label>
                <Input
                  id="sub-10th"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Nullable"
                  value={criteriaForm.min_10th_percentage}
                  onChange={(e) =>
                    setCriteriaForm((prev) => ({
                      ...prev,
                      min_10th_percentage: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="mt-1 h-8 text-xs rounded-md"
                />
                {criteriaErrors.min_10th_percentage && (
                  <p className="mt-1 text-[10px] text-destructive">
                    {criteriaErrors.min_10th_percentage}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="sub-12th" className="text-xs font-medium">
                  12th Min. %
                </Label>
                <Input
                  id="sub-12th"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Nullable"
                  value={criteriaForm.min_12th_percentage}
                  onChange={(e) =>
                    setCriteriaForm((prev) => ({
                      ...prev,
                      min_12th_percentage: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="mt-1 h-8 text-xs rounded-md"
                />
                {criteriaErrors.min_12th_percentage && (
                  <p className="mt-1 text-[10px] text-destructive">
                    {criteriaErrors.min_12th_percentage}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="sub-cgpa" className="text-xs font-medium">
                  Min. CGPA (0.00 - 10.00)
                </Label>
                <Input
                  id="sub-cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 7.50 (Nullable)"
                  value={criteriaForm.min_cgpa}
                  onChange={(e) =>
                    setCriteriaForm((prev) => ({
                      ...prev,
                      min_cgpa: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="mt-1 h-8 text-xs rounded-md"
                />
                {criteriaErrors.min_cgpa && (
                  <p className="mt-1 text-[10px] text-destructive">{criteriaErrors.min_cgpa}</p>
                )}
              </div>

              <div>
                <Label htmlFor="sub-backlogs" className="text-xs font-medium">
                  Max Backlogs Allowed
                </Label>
                <Input
                  id="sub-backlogs"
                  type="number"
                  min="0"
                  placeholder="0 for zero backlog policy"
                  value={criteriaForm.max_backlogs}
                  onChange={(e) =>
                    setCriteriaForm((prev) => ({
                      ...prev,
                      max_backlogs: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="mt-1 h-8 text-xs rounded-md"
                />
                {criteriaErrors.max_backlogs && (
                  <p className="mt-1 text-[10px] text-destructive">{criteriaErrors.max_backlogs}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="sub-branches" className="text-xs font-medium">
                Eligible Branches <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sub-branches"
                value={criteriaForm.branches}
                onChange={(e) => setCriteriaForm((prev) => ({ ...prev, branches: e.target.value }))}
                placeholder="e.g. Computer Engineering, Information Technology, AI&DS"
                className="mt-1 h-8 text-xs rounded-md"
              />
              {criteriaErrors.branches && (
                <p className="mt-1 text-[10px] text-destructive">{criteriaErrors.branches}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sub-notes" className="text-xs font-medium">
                Special Conditions / Notes
              </Label>
              <Textarea
                id="sub-notes"
                rows={2}
                value={criteriaForm.notes}
                onChange={(e) => setCriteriaForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any bond period, education gap criteria, or specific requirements…"
                className="mt-1 text-xs rounded-md"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criteriaForm.is_current}
                  onChange={(e) =>
                    setCriteriaForm((prev) => ({ ...prev, is_current: e.target.checked }))
                  }
                  className="rounded border-input text-primary focus:ring-primary size-4"
                />
                <span className="text-xs font-semibold text-foreground">
                  Mark as Active Drive Criteria (enforced on student dashboard)
                </span>
              </label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCriteriaDialogOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saveCriteriaMutation.isPending}
                className="text-xs font-semibold rounded-md shadow-xs"
              >
                {saveCriteriaMutation.isPending
                  ? "Saving…"
                  : criteriaForm.id
                    ? "Update Criteria"
                    : "Add Criteria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 4: ADD / EDIT JOB ROLE SUB-MODAL                                    */}
      {/* ========================================================================= */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {roleForm.id ? "Edit Campus Job Role" : "Add Campus Job Role"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Specify the designation, hiring recruitment year, location, and package details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRoleSubmit} className="space-y-3.5 py-1 text-xs">
            <div>
              <Label htmlFor="role-title" className="text-xs font-medium">
                Job Title / Designation <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role-title"
                value={roleForm.title}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Graduate Software Engineer, SDE-1"
                className="mt-1 h-8 text-xs rounded-md"
              />
              {roleErrors.title && (
                <p className="mt-1 text-[10px] text-destructive">{roleErrors.title}</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="role-year" className="text-xs font-medium">
                  Hiring Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="role-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={roleForm.hiring_year}
                  onChange={(e) =>
                    setRoleForm((prev) => ({
                      ...prev,
                      hiring_year: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="mt-1 h-8 text-xs rounded-md"
                />
                {roleErrors.hiring_year && (
                  <p className="mt-1 text-[10px] text-destructive">{roleErrors.hiring_year}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role-location" className="text-xs font-medium">
                  Job Location
                </Label>
                <Input
                  id="role-location"
                  value={roleForm.location}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Pune, Bengaluru, Hybrid"
                  className="mt-1 h-8 text-xs rounded-md"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role-ctc" className="text-xs font-medium">
                Salary / CTC & Compensation Notes
              </Label>
              <Textarea
                id="role-ctc"
                rows={2}
                value={roleForm.ctc_note}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, ctc_note: e.target.value }))}
                placeholder="e.g. 12 LPA (Fixed: 10 LPA + Joining Bonus: 2 LPA)"
                className="mt-1 text-xs rounded-md"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRoleDialogOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saveRoleMutation.isPending}
                className="text-xs font-semibold rounded-md shadow-xs"
              >
                {saveRoleMutation.isPending
                  ? "Saving…"
                  : roleForm.id
                    ? "Update Role"
                    : "Add Job Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ALERT DIALOG: DELETE COMPANY CONFIRMATION                                  */}
      {/* ========================================================================= */}
      <AlertDialog
        open={!!companyToDelete}
        onOpenChange={(open) => {
          if (!open) setCompanyToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Recruiter "{companyToDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This action will permanently delete this company and all its associated eligibility
              criteria, interview rounds, and job roles. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (companyToDelete) {
                  deleteCompanyMutation.mutate(companyToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold rounded-md"
            >
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================================= */}
      {/* ALERT DIALOG: DELETE CRITERIA RECORD CONFIRMATION                          */}
      {/* ========================================================================= */}
      <AlertDialog
        open={!!criteriaToDelete}
        onOpenChange={(open) => {
          if (!open) setCriteriaToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete {criteriaToDelete?.year} Criteria Version?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will remove the {criteriaToDelete?.year} academic criteria record for this
              company. Other drive years and job roles will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (criteriaToDelete) {
                  deleteCriteriaMutation.mutate(criteriaToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold rounded-md"
            >
              Delete Criteria
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================================= */}
      {/* ALERT DIALOG: DELETE JOB ROLE CONFIRMATION                                 */}
      {/* ========================================================================= */}
      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={(open) => {
          if (!open) setRoleToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Job Role "{roleToDelete?.title}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will remove this role from campus hiring records. Eligibility criteria and
              company details remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roleToDelete) {
                  deleteRoleMutation.mutate(roleToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold rounded-md"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
