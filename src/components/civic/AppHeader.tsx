import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { pathname } = useLocation();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("civiclens:theme");
    const prefers = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(prefers);
    document.documentElement.classList.toggle("dark", prefers);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("civiclens:theme", next ? "dark" : "light"); } catch { /* noop */ }
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60 no-print">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-soft transition group-hover:scale-105">
            <Scale className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight">CivicLens</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">WA public spending</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {pathname !== "/" && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">New question</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </nav>
      </div>
    </header>
  );
}
