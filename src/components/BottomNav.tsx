import { Link, useRouterState } from "@tanstack/react-router";
import { Home, FolderKanban, Sparkles, Library, Settings } from "lucide-react";

type NavItem = {
  to: "/" | "/projects" | "/generate" | "/library" | "/settings";
  label: string;
  icon: typeof Home;
  exact?: boolean;
  primary?: boolean;
};
const items: NavItem[] = [
  { to: "/", label: "Today", icon: Home, exact: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/generate", label: "Generate", icon: Sparkles, primary: true },
  { to: "/library", label: "Library", icon: Library },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pt-1.5">
        {items.map(({ to, label, icon: Icon, exact, primary }) => {
          const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`tap flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl transition-all ${
                    primary
                      ? "brand-gradient text-primary-foreground shadow-lg shadow-primary/20"
                      : active
                        ? "bg-primary/10"
                        : ""
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
