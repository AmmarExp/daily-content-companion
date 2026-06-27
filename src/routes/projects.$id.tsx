import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getProject, upsertProject, reExtractBrief } from "@/lib/projects.functions";
import { generateContent } from "@/lib/content.functions";
import { AppShell } from "@/components/AppShell";
import { ProjectFormModal, type ProjectFormValues } from "@/components/ProjectFormModal";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, FileText, Calendar, Sparkles, RefreshCw, BookOpen, Save } from "lucide-react";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({ meta: [{ title: "Project · BrandPulse" }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const q = useQuery({ queryKey: ["project", id], queryFn: () => getProject({ data: { id } }) });
  const [editOpen, setEditOpen] = useState(false);
  const [promptValue, setPromptValue] = useState<string | null>(null);

  const upsertFn = useServerFn(upsertProject);
  const reExtract = useServerFn(reExtractBrief);
  const genFn = useServerFn(generateContent);

  const save = useMutation({
    mutationFn: (v: ProjectFormValues) => upsertFn({ data: v }),
    onSuccess: () => {
      toast.success("Saved");
      setEditOpen(false);
      router.invalidate();
    },
  });
  const reExt = useMutation({
    mutationFn: () => reExtract({ data: { id } }),
    onSuccess: () => {
      toast.success("Knowledge re-extracted");
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const gen = useMutation({
    mutationFn: () => genFn({ data: { project_id: id, platform: "both", with_image: true } }),
    onSuccess: () => {
      toast.success("Sample generated");
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePrompt = useMutation({
    mutationFn: (brief: string) =>
      upsertFn({
        data: {
          id,
          name: project!.name,
          primary_language: project!.primary_language,
          brand_color: project!.brand_color,
          master_brief: brief,
        },
      }),
    onSuccess: () => {
      toast.success("Prompt saved ✓");
      setPromptValue(null);
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <AppShell title="Loading…" back="/projects"><div /></AppShell>;
  const project = q.data?.project;
  if (!project) return <AppShell title="Not found" back="/projects"><div className="text-sm text-muted-foreground">Project not found.</div></AppShell>;
  const notes = q.data?.notes;
  const files = q.data?.files ?? [];
  const schedules = q.data?.schedules ?? [];

  const currentPrompt = promptValue ?? (project.master_brief ?? "");
  const isDirty = promptValue !== null && promptValue !== (project.master_brief ?? "");

  return (
    <AppShell
      title={project.name}
      subtitle={project.short_description ?? project.website_url ?? "Project"}
      back="/projects"
      right={
        <button onClick={() => setEditOpen(true)} className="tap grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted">
          <Pencil className="h-4 w-4" />
        </button>
      }
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-white" style={{ background: project.brand_color }}>
          {project.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Language</div>
          <div className="font-medium">{project.primary_language === "ar" ? "العربية" : project.primary_language.toUpperCase()}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => gen.mutate()} disabled={gen.isPending} className="flex items-center justify-center gap-2 rounded-2xl brand-gradient px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          <Sparkles className="h-4 w-4" /> {gen.isPending ? "Generating…" : "Generate sample"}
        </button>
        <Link to="/schedule" search={{ project: id }} className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold">
          <Calendar className="h-4 w-4" /> Schedule
        </Link>
      </div>

      {/* ── Inline Prompt Editor ── */}
      <Section
        title="Project Prompt"
        right={
          isDirty ? (
            <button
              onClick={() => savePrompt.mutate(promptValue!)}
              disabled={savePrompt.isPending}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-3 w-3" />
              {savePrompt.isPending ? "Saving…" : "Save"}
            </button>
          ) : (
            <button
              onClick={() => reExt.mutate()}
              disabled={reExt.isPending}
              className="flex items-center gap-1 text-xs font-medium text-primary disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${reExt.isPending ? "animate-spin" : ""}`} /> Re-extract
            </button>
          )
        }
      >
        <textarea
          value={currentPrompt}
          onChange={(e) => setPromptValue(e.target.value)}
          rows={8}
          placeholder="اكتب البرومت الخاص بهذا المشروع هنا… (النبرة، الجمهور، الأهداف، الأسلوب)"
          className="w-full rounded-xl border border-border bg-surface-2 p-3 font-mono text-[13px] leading-relaxed text-foreground outline-none transition-colors focus:border-primary"
        />
        {isDirty && (
          <div className="mt-1 flex items-center justify-between">
            <p className="flex items-center gap-1 text-[11px] text-primary">
              <Sparkles className="h-3 w-3" /> سيتم إعادة استخراج المعرفة تلقائياً عند الحفظ
            </p>
            <button
              onClick={() => setPromptValue(null)}
              className="text-[11px] text-muted-foreground underline"
            >
              تراجع
            </button>
          </div>
        )}
      </Section>

      {notes ? (
        <Section title="Extracted knowledge" icon={<BookOpen className="h-4 w-4" />}>
          <KV k="Summary" v={notes.summary} />
          <KV k="Content pillars" v={notes.content_pillars} />
          <KV k="Differentiators" v={notes.differentiators} />
          <KV k="Tone rules" v={notes.tone_rules} />
          <KV k="Keywords" v={notes.approved_keywords} />
          <KV k="Avoid" v={notes.forbidden_topics} />
        </Section>
      ) : null}

      <Section title={`Knowledge files (${files.length})`} right={
        <Link to="/projects/$id/knowledge" params={{ id }} className="text-xs font-medium text-primary">Manage</Link>
      }>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {files.slice(0, 5).map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{f.title}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Schedules (${schedules.length})`} right={
        <Link to="/schedule" search={{ project: id }} className="text-xs font-medium text-primary">Edit</Link>
      }>
        {schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No schedule yet. Add one to enable daily auto-generation.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {schedules.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="font-mono text-xs">{s.slot_time}</span>
                <span className="text-muted-foreground">·</span>
                <span className="capitalize">{s.platform_mode}</span>
                {s.image_required ? <span className="text-xs text-muted-foreground">+ image</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <ProjectFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={{
          id: project.id,
          name: project.name,
          website_url: project.website_url,
          short_description: project.short_description,
          target_audience: project.target_audience,
          main_cta: project.main_cta,
          brand_tone: project.brand_tone,
          primary_language: project.primary_language,
          brand_color: project.brand_color,
          master_brief: project.master_brief,
        }}
        onSave={(v) => save.mutate(v)}
        saving={save.isPending}
      />
    </AppShell>
  );
}

function Section({ title, right, icon, children }: { title: string; right?: React.ReactNode; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function KV({ k, v }: { k: string; v: string | null | undefined }) {
  if (!v) return null;
  return (
    <div className="mb-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="whitespace-pre-wrap text-sm">{v}</div>
    </div>
  );
}
