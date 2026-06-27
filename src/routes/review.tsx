import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listReviewQueue } from "@/lib/content.functions";
import { ContentCard } from "./generate";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Review · BrandPulse" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const listFn = useServerFn(listReviewQueue);
  const q = useQuery({ queryKey: ["review"], queryFn: () => listFn() });
  const items = q.data ?? [];
  return (
    <AppShell title="Review queue" subtitle={`${items.length} item${items.length === 1 ? "" : "s"} waiting`} back="/">
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            All clear. Nothing to review.
          </div>
        ) : (
          items.map((it) => <ContentCard key={it.id} item={it} />)
        )}
      </div>
    </AppShell>
  );
}
