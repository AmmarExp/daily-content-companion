import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { listProjects } from "@/lib/projects.functions";
import { listSchedules, upsertSchedule, deleteSchedule } from "@/lib/schedules.functions";
import { AppShell } from "@/components/AppShell";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const search = z.object({ project: z.string().optional() });

export const Route = createFileRoute("/schedule")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Schedule · BrandPulse" }] }),
  component: SchedulePage,
});

const DAYS = ["Daily", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SchedulePage() {
  const router = useRouter();
  const { project: filter } = Route.useSearch();
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const schedQ = useQuery({ queryKey: ["schedules"], queryFn: () => listSchedules() });
  const upsertFn = useServerFn(upsertSchedule);
  const delFn = useServerFn(deleteSchedule);

  const projects = projectsQ.data ?? [];
  const schedules = (schedQ.data ?? []).filter((s) => !filter || s.project_id === filter);

  type ScheduleInput = {
    id?: string;
    project_id: string;
    day_of_week: number;
    posts_per_day: number;
    slot_time: string;
    platform_mode: "x" | "linkedin" | "both";
    topic_mode: string;
    image_required: boolean;
    active: boolean;
  };

  const [adding, setAdding] = useState<string | null>(null); // project_id when adding

  const save = useMutation({
    mutationFn: (v: ScheduleInput) => upsertFn({ data: v }),
    onSuccess: () => {
      toast.success("Saved");
      setAdding(null);
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => router.invalidate(),
  });

  return (
    <AppShell title="Schedule" subtitle="When to generate content">
      <div className="space-y-4">
        {projects
          .filter((p) => !filter || p.id === filter)
          .map((p) => {
            const ps = schedules.filter((s) => s.project_id === p.id);
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: p.brand_color }}>
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="font-medium">{p.name}</div>
                  </div>
                  <button
                    onClick={() => setAdding(p.id)}
                    className="tap flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    <Plus className="h-3 w-3" /> Slot
                  </button>
                </div>
                {ps.length === 0 && adding !== p.id ? (
                  <p className="text-xs text-muted-foreground">No slots — add one to enable daily generation.</p>
                ) : null}
                <div className="space-y-2">
                  {ps.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-2.5">
                      <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
                        <select
                          value={s.day_of_week}
                          onChange={(e) => save.mutate({ ...s, platform_mode: s.platform_mode as "x" | "linkedin" | "both", day_of_week: Number(e.target.value) })}
                          className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
                        >
                          {DAYS.map((d, i) => (
                            <option key={i} value={i}>{d}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={s.slot_time}
                          onChange={(e) => save.mutate({ ...s, platform_mode: s.platform_mode as "x" | "linkedin" | "both", slot_time: e.target.value })}
                          className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
                        />
                        <select
                          value={s.platform_mode}
                          onChange={(e) => save.mutate({ ...s, platform_mode: e.target.value as "x" | "linkedin" | "both" })}
                          className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
                        >
                          <option value="x">X only</option>
                          <option value="linkedin">LinkedIn only</option>
                          <option value="both">Both</option>
                        </select>
                        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-xs">
                          <input type="checkbox" checked={s.image_required} onChange={(e) => save.mutate({ ...s, platform_mode: s.platform_mode as "x" | "linkedin" | "both", image_required: e.target.checked })} />
                          Image
                        </label>
                      </div>
                      <button onClick={() => del.mutate(s.id)} className="tap grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {adding === p.id ? (
                    <AddSlotForm
                      projectId={p.id}
                      onCancel={() => setAdding(null)}
                      onSave={(v) => save.mutate(v)}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Add a project first.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function AddSlotForm({ projectId, onCancel, onSave }: { projectId: string; onCancel: () => void; onSave: (v: { project_id: string; day_of_week: number; posts_per_day: number; slot_time: string; platform_mode: "x" | "linkedin" | "both"; topic_mode: string; image_required: boolean; active: boolean }) => void }) {
  const [v, setV] = useState({
    project_id: projectId,
    day_of_week: 0,
    posts_per_day: 1,
    slot_time: "09:00",
    platform_mode: "both" as "x" | "linkedin" | "both",
    topic_mode: "auto",
    image_required: true,
    active: true,
  });
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-2.5">
      <select value={v.day_of_week} onChange={(e) => setV({ ...v, day_of_week: Number(e.target.value) })} className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs">
        {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
      </select>
      <input type="time" value={v.slot_time} onChange={(e) => setV({ ...v, slot_time: e.target.value })} className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs" />
      <select value={v.platform_mode} onChange={(e) => setV({ ...v, platform_mode: e.target.value as "x" | "linkedin" | "both" })} className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs">
        <option value="x">X only</option><option value="linkedin">LinkedIn only</option><option value="both">Both</option>
      </select>
      <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-xs">
        <input type="checkbox" checked={v.image_required} onChange={(e) => setV({ ...v, image_required: e.target.checked })} /> Image
      </label>
      <button onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-xs">Cancel</button>
      <button onClick={() => onSave(v)} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Add slot</button>
    </div>
  );
}
