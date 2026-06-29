import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { listProjects, upsertProject, deleteProject } from "@/lib/projects.functions";
import { AppShell } from "@/components/AppShell";
import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProjectFormModal, type ProjectFormValues } from "@/components/ProjectFormModal";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/")({
  head: () => ({ meta: [{ title: "Projects · BrandPulse" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const router = useRouter();
  const q = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const upsertFn = useServerFn(upsertProject);
  const delFn = useServerFn(deleteProject);

  const create = useMutation({
    mutationFn: (v: ProjectFormValues) => upsertFn({ data: v }),
    onSuccess: () => {
      toast.success("Project saved");
      setOpen(false);
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Project deleted");
      router.invalidate();
    },
  });

  const projects = (q.data ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell
      title="Projects"
      right={
        <button
          onClick={() => setOpen(true)}
          className="tap grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"
        >
          <Plus className="h-5 w-5" />
        </button>
      }
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects"
          className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4 space-y-2">
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No projects yet. Tap + to add one.
          </div>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <Link to="/projects/$id" params={{ id: p.id }} className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-base font-bold text-white"
                  style={{ background: p.brand_color || "var(--primary)" }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {p.short_description || p.website_url || "Tap to open"}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Delete "${p.name}"? This removes all its content and files.`)) {
                    del.mutate(p.id);
                  }
                }}
                className="tap grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <ProjectFormModal open={open} onOpenChange={setOpen} onSave={(v) => create.mutate(v)} saving={create.isPending} />
    </AppShell>
  );
}
