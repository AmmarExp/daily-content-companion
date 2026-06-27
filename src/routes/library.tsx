import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listContent } from "@/lib/content.functions";
import { listProjects } from "@/lib/projects.functions";
import { ContentCard } from "./generate";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Library · BrandPulse" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const [project, setProject] = useState("");
  const [platform, setPlatform] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const listFn = useServerFn(listContent);
  const q = useQuery({
    queryKey: ["library", project, platform, favOnly],
    queryFn: () =>
      listFn({
        data: {
          project_id: project || undefined,
          platform: platform || undefined,
          favorites_only: favOnly || undefined,
          include_archived: false,
          limit: 100,
        },
      }),
  });
  const items = q.data ?? [];

  return (
    <AppShell title="Library" subtitle="All generated content">
      <div className="flex flex-wrap gap-2">
        <select value={project} onChange={(e) => setProject(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-xs">
          <option value="">All projects</option>
          {(projectsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-xs">
          <option value="">All platforms</option>
          <option value="x">X</option>
          <option value="linkedin">LinkedIn</option>
          <option value="both">Both</option>
        </select>
        <button onClick={() => setFavOnly((f) => !f)} className={`rounded-xl px-3 py-2 text-xs font-medium ${favOnly ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>
          ⭐ Favorites
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </div>
        ) : (
          items.map((it) => <ContentCard key={it.id} item={it} />)
        )}
      </div>
    </AppShell>
  );
}
