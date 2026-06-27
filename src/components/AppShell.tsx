import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({
  title,
  subtitle,
  back,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-lg pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid max-w-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            {back ? (
              <button
                onClick={() => (back === "back" ? router.history.back() : router.navigate({ to: back as string }))}
                className="tap -ml-2 grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-primary-foreground font-bold font-display">
                B
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold leading-tight">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1">{right}</div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>
    </div>
  );
}
