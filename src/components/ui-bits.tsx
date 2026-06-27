export function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    x: { label: "X", cls: "bg-foreground text-background" },
    linkedin: { label: "in", cls: "bg-[#0a66c2] text-white" },
    both: { label: "X · in", cls: "bg-primary/15 text-primary" },
  };
  const m = map[platform] ?? { label: platform, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-bold tracking-wide ${m.cls}`}>
      {m.label}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    ready: "bg-success",
    approved: "bg-success",
    generating: "bg-warning animate-pulse",
    pending: "bg-muted-foreground/50",
    failed: "bg-destructive",
    rejected: "bg-destructive/70",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status] ?? "bg-muted-foreground/50"}`} />;
}
