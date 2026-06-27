import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { listProjects } from "@/lib/projects.functions";
import { listTodayContent } from "@/lib/content.functions";
import { generateContent } from "@/lib/content.functions";
import { AppShell } from "@/components/AppShell";
import { PlatformBadge, StatusDot } from "@/components/ui-bits";
import { Sparkles, ChevronRight, Bell, Plus, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today · BrandPulse Studio" },
      { name: "description", content: "Today's generated marketing content across your projects." },
    ],
  }),
  component: Today,
});

function Today() {
  const router = useRouter();
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const todayQ = useQuery({ queryKey: ["today"], queryFn: () => listTodayContent() });
  const genFn = useServerFn(generateContent);
  const genAll = useMutation({
    mutationFn: async () => {
      const projects = projectsQ.data ?? [];
      for (const p of projects) {
        await genFn({ data: { project_id: p.id, platform: "both", with_image: true } });
      }
    },
    onSuccess: () => {
      toast.success("Generated content for all projects");
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const projects = projectsQ.data ?? [];
  const items = todayQ.data ?? [];
  const ready = items.filter((i) => i.status === "ready").length;
  const pending = items.filter((i) => i.status !== "ready" && i.status !== "failed").length;
  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (!projectsQ.isLoading && projects.length === 0) {
    return (
      <AppShell title="Welcome" subtitle="Let's set up your projects">
        <FirstRun />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Today"
      subtitle={dateStr}
      right={
        <Link
          to="/review"
          className="tap relative grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted"
          aria-label="Review queue"
        >
          <Bell className="h-5 w-5" />
          {pending > 0 ? (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {pending}
            </span>
          ) : null}
        </Link>
      }
    >
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Scheduled" value={items.length} />
        <Stat label="Ready" value={ready} tone="success" />
        <Stat label="Pending" value={pending} tone="warning" />
      </div>

      <button
        onClick={() => genAll.mutate()}
        disabled={genAll.isPending || projects.length === 0}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl brand-gradient px-5 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.98] disabled:opacity-60"
      >
        <Sparkles className="h-5 w-5" />
        {genAll.isPending ? "Generating…" : "Generate today's batch"}
      </button>

      <section className="mt-7">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Projects
        </h2>
        <div className="space-y-2">
          {projects.map((p) => {
            const projItems = items.filter((i) => i.project_id === p.id);
            return (
              <Link
                key={p.id}
                to="/projects/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-base font-bold text-white"
                  style={{ background: p.brand_color || "var(--primary)" }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {projItems.length
                      ? `${projItems.filter((i) => i.status === "ready").length}/${projItems.length} ready today`
                      : "No content yet today"}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today's queue
        </h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Nothing generated yet. Tap the button above.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <TodayCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" }) {
  const toneCls =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className={`font-display text-2xl font-bold ${toneCls}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function TodayCard({ item }: { item: { id: string; topic_title: string | null; platform: string; status: string; scheduled_time: string | null; x_post: string | null; projects: { name: string; brand_color: string } | null } }) {
  return (
    <Link
      to="/generate"
      search={{ id: item.id }}
      className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
    >
      <div className="flex items-center gap-2">
        <StatusDot status={item.status} />
        <span className="text-xs text-muted-foreground">{item.scheduled_time ?? "—"}</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="truncate text-xs font-medium" style={{ color: item.projects?.brand_color ?? undefined }}>
          {item.projects?.name}
        </span>
        <span className="ml-auto"><PlatformBadge platform={item.platform} /></span>
      </div>
      <div className="mt-1.5 line-clamp-2 text-sm font-medium">
        {item.topic_title || item.x_post || "Generating…"}
      </div>
    </Link>
  );
}

function FirstRun() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl brand-gradient p-6 text-primary-foreground">
        <div className="font-display text-2xl font-bold">Welcome to BrandPulse</div>
        <p className="mt-1 text-sm opacity-90">
          Add your first project and paste its master brief. Daily X & LinkedIn posts come next.
        </p>
      </div>
      <Link
        to="/setup"
        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-semibold text-primary-foreground"
      >
        <Plus className="h-5 w-5" /> Set up your projects
      </Link>
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
          <Copy className="h-4 w-4" /> How it works
        </div>
        Paste a single "Master Brief" per project. The app reads it, extracts your brand, and writes
        daily ready-to-copy posts — Arabic or English.
      </div>
    </div>
  );
}
