import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft">
            <Trophy className="h-5 w-5" />
          </div>
          <span className="text-base sm:text-lg">30 Days <span className="text-primary">Challenge</span></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
          <Link to="/leaderboard" className="text-muted-foreground hover:text-foreground">Leaderboard</Link>
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
          <Link to="/teacher" className="text-muted-foreground hover:text-foreground">Teacher</Link>
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">Admin</Link>
        </nav>
        <Link
          to="/register"
          className="inline-flex h-10 items-center rounded-full bg-gradient-hero px-5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.03]"
        >
          Register FREE
        </Link>
      </div>
    </header>
  );
}
