import Link from "next/link";
import { Building2, Database, Gauge, ListChecks } from "lucide-react";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: Gauge },
  { href: "/companies", label: "企業一覧", icon: Building2 },
  { href: "/jobs", label: "クロール管理", icon: ListChecks },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Japan Company DB</p>
            <p className="text-xs text-muted-foreground">ETL crawler console</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          <Database className="h-5 w-5" />
          <span className="text-sm font-semibold">Japan Company DB</span>
        </div>
      </header>
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

