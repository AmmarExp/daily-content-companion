import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listProjects } from "@/lib/projects.functions";
import {
  listContent,
  generateContent,
  regenerateImage,
  regenerateText,
  updateContent,
  deleteContent,
} from "@/lib/content.functions";
import { StoredImage } from "@/components/StoredImage";
import { PlatformBadge, StatusDot } from "@/components/ui-bits";
import { Sparkles, Copy, RefreshCw, Image as ImageIcon, Check, Trash2, Pencil, Download } from "lucide-react";
import { toast } from "sonner";

const search = z.object({ id: z.string().optional(), project: z.string().optional() });

export const Route = createFileRoute("/generate")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Generate · BrandPulse" }] }),
  component: GeneratePage,
});

function GeneratePage() {
  const router = useRouter();
  const { id: focusId, project: projFilter } = Route.useSearch();
  const [selectedProject, setSelectedProject] = useState<string | "">(projFilter ?? "");
  const [hint, setHint] = useState("");
  const [language, setLanguage] = useState<string>("");

  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const listFn = useServerFn(listContent);
  const today = new Date().toISOString().slice(0, 10);
  const contentQ = useQuery({
    queryKey: ["content", selectedProject || "all", today],
    queryFn: () =>
      listFn({
        data: {
          project_id: selectedProject || undefined,
          date_from: today,
          date_to: today,
          limit: 50,
        },
      }),
  });

  const genFn = useServerFn(generateContent);
  const gen = useMutation({
    mutationFn: () =>
      genFn({
        data: {
          project_id: selectedProject,
          platform: "both",
          with_image: true,
          topic_hint: hint || null,
          language: language || null,
        },
      }),
    onSuccess: () => {
      toast.success("Generated");
      setHint("");
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const projects = projectsQ.data ?? [];
  const items = (contentQ.data ?? []).filter((i) => !focusId || i.id === focusId);

  return (
    <AppShell title="Generate" subtitle="Today's drafts">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm"
        >
          <option value="">Choose a project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Optional: angle hint (e.g. 'launch week day 2')"
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm"
        >
          <option value="">Language: project default</option>
          <option value="ar">العربية (Saudi/Gulf)</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
        </select>
        <button
          onClick={() => gen.mutate()}
          disabled={gen.isPending || !selectedProject}
          className="flex w-full items-center justify-center gap-2 rounded-xl brand-gradient px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" /> {gen.isPending ? "Generating…" : "Generate now"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No drafts yet. Generate one above.
          </div>
        ) : (
          items.map((item) => <ContentCard key={item.id} item={item} />)
        )}
      </div>
    </AppShell>
  );
}

export function ContentCard({ item }: { item: Awaited<ReturnType<typeof listContent>>[number] }) {
  const router = useRouter();
  const regenImg = useServerFn(regenerateImage);
  const regenTxt = useServerFn(regenerateText);
  const updateFn = useServerFn(updateContent);
  const delFn = useServerFn(deleteContent);
  const [editing, setEditing] = useState(false);
  const [x, setX] = useState(item.x_post ?? "");
  const [li, setLi] = useState(item.linkedin_post ?? "");
  const [tags, setTags] = useState(item.hashtags ?? "");

  const rImg = useMutation({
    mutationFn: () => regenImg({ data: { id: item.id } }),
    onSuccess: () => { toast.success("New image"); router.invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rTxt = useMutation({
    mutationFn: () => regenTxt({ data: { id: item.id, platform: "both" } }),
    onSuccess: () => { toast.success("New copy"); router.invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const save = useMutation({
    mutationFn: () =>
      updateFn({ data: { id: item.id, x_post: x, linkedin_post: li, hashtags: tags } }),
    onSuccess: () => { toast.success("Saved"); setEditing(false); router.invalidate(); },
  });
  const approve = useMutation({
    mutationFn: () => updateFn({ data: { id: item.id, status: "approved" } }),
    onSuccess: () => { toast.success("Marked ready"); router.invalidate(); },
  });
  const del = useMutation({
    mutationFn: () => delFn({ data: { id: item.id } }),
    onSuccess: () => { toast.success("Deleted"); router.invalidate(); },
  });

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <StatusDot status={item.status} />
        <span className="truncate text-sm font-medium" style={{ color: item.projects?.brand_color ?? undefined }}>
          {item.projects?.name}
        </span>
        {item.scheduled_time ? (
          <span className="text-xs text-muted-foreground">· {item.scheduled_time}</span>
        ) : null}
        <span className="ml-auto"><PlatformBadge platform={item.platform} /></span>
      </header>

      {item.topic_title ? (
        <div className="px-4 pt-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.objective ?? "Topic"}</div>
          <div className="font-medium">{item.topic_title}</div>
        </div>
      ) : null}

      {item.image_url ? (
        <div className="px-4 pt-3">
          <StoredImage path={item.image_url} alt={item.topic_title ?? "Generated image"} className="aspect-square w-full rounded-xl object-cover" />
          <div className="mt-2 flex gap-2">
            <button onClick={() => rImg.mutate()} disabled={rImg.isPending} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${rImg.isPending ? "animate-spin" : ""}`} /> New image
            </button>
            <a download href="#" onClick={(e) => { e.preventDefault(); window.open((e.currentTarget as HTMLAnchorElement).getAttribute("data-url") || "", "_blank"); }} className="hidden" />
          </div>
        </div>
      ) : item.image_prompt ? (
        <button onClick={() => rImg.mutate()} disabled={rImg.isPending} className="m-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-6 text-xs font-medium text-muted-foreground">
          <ImageIcon className="h-4 w-4" /> {rImg.isPending ? "Generating image…" : "Generate image"}
        </button>
      ) : null}

      <div className="space-y-3 p-4">
        <PostBlock label="X post" value={editing ? x : (item.x_post ?? "")} editable={editing} onChange={setX} onCopy={() => copy(item.x_post ?? "", "X post")} max={280} />
        <PostBlock label="LinkedIn post" value={editing ? li : (item.linkedin_post ?? "")} editable={editing} onChange={setLi} onCopy={() => copy(item.linkedin_post ?? "", "LinkedIn post")} multiline />
        {(item.hashtags || editing) ? (
          <PostBlock label="Hashtags" value={editing ? tags : (item.hashtags ?? "")} editable={editing} onChange={setTags} onCopy={() => copy(item.hashtags ?? "", "Hashtags")} />
        ) : null}
        {item.cta_text ? (
          <div className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">CTA:</span> {item.cta_text}</div>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border/70 bg-surface-2/40 px-3 py-2">
        {editing ? (
          <>
            <button onClick={() => save.mutate()} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"><Check className="h-3 w-3" /> Save</button>
            <button onClick={() => { setEditing(false); setX(item.x_post ?? ""); setLi(item.linkedin_post ?? ""); setTags(item.hashtags ?? ""); }} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => rTxt.mutate()} disabled={rTxt.isPending} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium disabled:opacity-50">
              <RefreshCw className={`h-3 w-3 ${rTxt.isPending ? "animate-spin" : ""}`} /> Regenerate copy
            </button>
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium">
              <Pencil className="h-3 w-3" /> Edit
            </button>
            {item.status !== "approved" ? (
              <button onClick={() => approve.mutate()} className="ml-auto flex items-center gap-1 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success">
                <Check className="h-3 w-3" /> Ready
              </button>
            ) : (
              <span className="ml-auto flex items-center gap-1 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success">
                <Check className="h-3 w-3" /> Ready
              </span>
            )}
            <button onClick={() => { if (confirm("Delete this draft?")) del.mutate(); }} className="tap grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </footer>
    </article>
  );
}

function PostBlock({
  label, value, editable, onChange, onCopy, multiline, max,
}: {
  label: string; value: string; editable: boolean; onChange: (v: string) => void; onCopy: () => void; multiline?: boolean; max?: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="flex items-center gap-2">
          {max ? <span className={`text-[11px] ${value.length > max ? "text-destructive" : "text-muted-foreground"}`}>{value.length}/{max}</span> : null}
          {!editable && value ? (
            <button onClick={onCopy} className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
              <Copy className="h-3 w-3" /> Copy
            </button>
          ) : null}
        </div>
      </div>
      {editable ? (
        multiline ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={6} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm" />
        ) : (
          <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm" />
        )
      ) : (
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-surface-2 p-3 text-sm leading-relaxed">{value || <span className="text-muted-foreground">—</span>}</div>
      )}
    </div>
  );
}
