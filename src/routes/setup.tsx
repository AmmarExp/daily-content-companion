import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProjectFormModal, type ProjectFormValues } from "@/components/ProjectFormModal";
import { listProjects, upsertProject } from "@/lib/projects.functions";
import { Plus, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "Setup · BrandPulse" }] }),
  component: SetupPage,
});

function SetupPage() {
  const router = useRouter();
  const q = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const [open, setOpen] = useState(false);
  const upsertFn = useServerFn(upsertProject);
  const create = useMutation({
    mutationFn: (v: ProjectFormValues) => upsertFn({ data: v }),
    onSuccess: () => { toast.success("Project added"); setOpen(false); router.invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const projects = q.data ?? [];
  const slots = Math.max(3, projects.length);

  return (
    <AppShell title="First-time setup" subtitle="Add your projects">
      <ol className="space-y-2">
        {Array.from({ length: slots }).map((_, i) => {
          const p = projects[i];
          return (
            <li key={i} className={`flex items-center gap-3 rounded-2xl border p-3 ${p ? "border-success/40 bg-success/5" : "border-dashed border-border bg-card/50"}`}>
              <span className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-bold ${p ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>
                {p ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p ? p.name : `Project ${i + 1}`}</div>
                <div className="truncate text-xs text-muted-foreground">{p ? "Master brief saved" : "Paste master brief"}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <button onClick={() => setOpen(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
        <Plus className="h-4 w-4" /> Add a project
      </button>

      {projects.length > 0 ? (
        <a href="/" className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold">
          Go to Today <ArrowRight className="h-4 w-4" />
        </a>
      ) : null}

      <ProjectFormModal open={open} onOpenChange={setOpen} onSave={(v) => create.mutate(v)} saving={create.isPending} />
    </AppShell>
  );
}
