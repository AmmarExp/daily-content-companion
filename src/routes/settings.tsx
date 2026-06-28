import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getSettings, saveSettings } from "@/lib/settings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · BrandPulse" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const saveFn = useServerFn(saveSettings);
  type S = NonNullable<typeof q.data>;
  const [s, setS] = useState<S | null>(null);

  useEffect(() => { if (q.data) setS(q.data as S); }, [q.data]);

  const save = useMutation({
    mutationFn: () => saveFn({
      data: {
        id: s!.id,
        timezone: s!.timezone,
        default_language: s!.default_language,
        default_hashtag_count: s!.default_hashtag_count,
        x_style_mode: s!.x_style_mode,
        linkedin_style_mode: s!.linkedin_style_mode,
        image_aspect_ratio: s!.image_aspect_ratio,
        image_brand_consistency: s!.image_brand_consistency,
        dark_mode_default: s!.dark_mode_default,
        simple_mode: s!.simple_mode,
        tone_strictness: s!.tone_strictness,
        master_prompt: (s as unknown as { master_prompt?: string | null }).master_prompt ?? null,
      },
    }),
    onSuccess: () => { toast.success("Saved"); router.invalidate(); },
  });

  if (!s) return <AppShell title="Settings"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;
  const set = <K extends keyof S>(k: K, v: S[K]) => setS((cur) => cur ? { ...cur, [k]: v } : cur);

  return (
    <AppShell title="Settings" subtitle="App defaults">
      <Group title="General">
        <Field label="Timezone">
          <input value={s.timezone ?? ""} onChange={(e) => set("timezone", e.target.value)} className="input" />
        </Field>
        <Field label="Default language">
          <select value={s.default_language ?? "en"} onChange={(e) => set("default_language", e.target.value)} className="input">
            <option value="en">English</option><option value="ar">العربية</option><option value="fr">Français</option><option value="es">Español</option>
          </select>
        </Field>
      </Group>

      <Group title="Content defaults">
        <Field label="X style">
          <select value={s.x_style_mode ?? "punchy"} onChange={(e) => set("x_style_mode", e.target.value)} className="input">
            <option value="punchy">Punchy</option><option value="insight">Insight</option><option value="story">Micro-story</option>
          </select>
        </Field>
        <Field label="LinkedIn style">
          <select value={s.linkedin_style_mode ?? "professional"} onChange={(e) => set("linkedin_style_mode", e.target.value)} className="input">
            <option value="professional">Professional</option><option value="thought-leader">Thought leader</option><option value="case-study">Case-study</option>
          </select>
        </Field>
        <Field label="Hashtag count">
          <input type="number" min={0} max={10} value={s.default_hashtag_count ?? 3} onChange={(e) => set("default_hashtag_count", Number(e.target.value))} className="input" />
        </Field>
        <Field label="Tone strictness">
          <select value={s.tone_strictness ?? "balanced"} onChange={(e) => set("tone_strictness", e.target.value)} className="input">
            <option value="loose">Loose</option><option value="balanced">Balanced</option><option value="strict">Strict</option>
          </select>
        </Field>
      </Group>

      <Group title="Image defaults">
        <Field label="Aspect ratio">
          <select value={s.image_aspect_ratio ?? "1:1"} onChange={(e) => set("image_aspect_ratio", e.target.value)} className="input">
            <option value="1:1">Square (1:1)</option><option value="16:9">Wide (16:9)</option><option value="4:5">Portrait (4:5)</option>
          </select>
        </Field>
        <Field label="Brand consistency">
          <select value={s.image_brand_consistency ?? "medium"} onChange={(e) => set("image_brand_consistency", e.target.value)} className="input">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </Field>
      </Group>

      <Group title="تحديث البرومت">
        <Field label="البرومت الرئيسي للذكاء الاصطناعي">
          <textarea
            dir="auto"
            rows={10}
            value={(s as unknown as { master_prompt?: string | null }).master_prompt ?? ""}
            onChange={(e) => set("master_prompt" as keyof S, e.target.value as S[keyof S])}
            className="input"
            style={{ minHeight: 220, lineHeight: 1.6, fontFamily: "inherit" }}
            placeholder="اكتب هنا البرومت التوجيهي الذي سيستخدمه الذكاء الاصطناعي لكتابة المنشورات وتوليد برومت الصور..."
          />
        </Field>
      </Group>



      <button onClick={() => save.mutate()} disabled={save.isPending} className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {save.isPending ? "Saving…" : "Save settings"}
      </button>

      <style>{`.input{width:100%;background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:12px;padding:12px 14px;font-size:14px;color:var(--color-foreground);outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
    </AppShell>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
