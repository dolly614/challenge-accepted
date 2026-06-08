import { Link } from "@tanstack/react-router";
import { BrandMark } from "./BrandMark";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, role, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <BrandMark size={36} />
          <span className="text-base sm:text-lg leading-tight">Uyanix <span className="text-primary">30 Days</span></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
          <Link to="/leaderboard" className="text-muted-foreground hover:text-foreground">Leaderboard</Link>
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
          <Link to="/teacher" className="text-muted-foreground hover:text-foreground">Teacher</Link>
          {role === "admin" && (
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">Admin</Link>
          )}
        </nav>
        {user ? (
          <button
            onClick={() => signOut()}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold hover:bg-accent"
          >
            <LogOut className="h-4 w-4"/> Logout
          </button>
        ) : (
          <Link
            to="/register"
            className="inline-flex h-10 items-center rounded-full bg-gradient-hero px-5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.03]"
          >
            Register
          </Link>
        )}
      </div>
    </header>
  );
}
