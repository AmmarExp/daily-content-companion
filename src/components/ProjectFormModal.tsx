import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export type ProjectFormValues = {
  id?: string;
  name: string;
  website_url?: string | null;
  short_description?: string | null;
  target_audience?: string | null;
  main_cta?: string | null;
  brand_tone?: string | null;
  primary_language: string;
  brand_color: string;
  master_brief?: string | null;
  writing_prompt?: string | null;
};

export function ProjectFormModal({
  open,
  onOpenChange,
  initial,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<ProjectFormValues>;
  onSave: (v: ProjectFormValues) => void;
  saving?: boolean;
}) {
  const [v, setV] = useState<ProjectFormValues>({
    name: "",
    primary_language: "en",
    brand_color: "#6366f1",
    master_brief: "",
    ...initial,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open) {
      setV({
        name: "",
        primary_language: "en",
        brand_color: "#6366f1",
        master_brief: "",
        ...initial,
      });
      setShowAdvanced(false);
    }
  }, [open, initial]);

  const set = <K extends keyof ProjectFormValues>(k: K, val: ProjectFormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{initial?.id ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!v.name.trim()) return;
            onSave(v);
          }}
          className="space-y-4"
        >
          <Field label="Name">
            <input
              autoFocus
              value={v.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
              placeholder="Acme Co"
              required
            />
          </Field>

          <Field
            label="Project Master Brief"
            hint="Paste everything: brand, positioning, features, tone, audience, offers. The app reads it and extracts the rest."
          >
            <textarea
              value={v.master_brief ?? ""}
              onChange={(e) => set("master_brief", e.target.value)}
              rows={10}
              className="input min-h-[180px] font-mono text-[13px] leading-relaxed"
              placeholder="Paste the full project brief here…"
            />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-primary">
              <Sparkles className="h-3 w-3" /> Auto-extracted on save
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Language">
              <select
                value={v.primary_language}
                onChange={(e) => set("primary_language", e.target.value)}
                className="input"
              >
                <option value="en">English</option>
                <option value="ar">العربية (Saudi/Gulf)</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </Field>
            <Field label="Brand color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={v.brand_color}
                  onChange={(e) => set("brand_color", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent"
                />
                <input
                  value={v.brand_color}
                  onChange={(e) => set("brand_color", e.target.value)}
                  className="input flex-1"
                />
              </div>
            </Field>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-xs font-medium text-primary"
          >
            {showAdvanced ? "Hide" : "Show"} advanced fields
          </button>

          {showAdvanced ? (
            <div className="space-y-3 rounded-2xl border border-border bg-surface-2 p-3">
              <Field label="Website URL">
                <input value={v.website_url ?? ""} onChange={(e) => set("website_url", e.target.value)} className="input" placeholder="https://" />
              </Field>
              <Field label="Short description">
                <input value={v.short_description ?? ""} onChange={(e) => set("short_description", e.target.value)} className="input" />
              </Field>
              <Field label="Target audience">
                <input value={v.target_audience ?? ""} onChange={(e) => set("target_audience", e.target.value)} className="input" />
              </Field>
              <Field label="Main CTA">
                <input value={v.main_cta ?? ""} onChange={(e) => set("main_cta", e.target.value)} className="input" />
              </Field>
              <Field label="Brand tone">
                <input value={v.brand_tone ?? ""} onChange={(e) => set("brand_tone", e.target.value)} className="input" />
              </Field>
            </div>
          ) : null}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save project"}
            </button>
          </div>
        </form>
        <style>{`
          .input {
            width: 100%;
            background: var(--color-surface-2);
            border: 1px solid var(--color-border);
            border-radius: 12px;
            padding: 12px 14px;
            font-size: 14px;
            color: var(--color-foreground);
            outline: none;
            transition: border-color 0.15s;
          }
          .input:focus { border-color: var(--color-primary); }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </label>
  );
}
