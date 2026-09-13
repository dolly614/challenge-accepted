import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BrandMark } from "@/components/site/BrandMark";
import { supabase } from "@/integrations/supabase/client";
import { resolveLoginEmail, logAuthEvent } from "@/lib/auth.functions";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Uyanix 30 Days Challenge" },
      { name: "description", content: "Apne Uyanix account me login karein aur 30 Days Challenge continue karein." },
    ],
  }),
  component: LoginPage,
});

const LOGIN_ERROR = "Mobile/Email ya Password sahi nahi hai.";

async function destinationFor(userId: string): Promise<string> {
  const db = supabase as any;
  const { data: roleRows } = await db.from("user_roles").select("role").eq("user_id", userId);
  const roles = ((roleRows ?? []) as { role: string }[]).map((r) => r.role);
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("teacher")) return "/teacher";

  const { data: student } = await db
    .from("students").select("verification_status").eq("user_id", userId).maybeSingle();
  return student?.verification_status === "verified" ? "/dashboard" : "/register";
}

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || busy) return;
    void destinationFor(user.id).then((to) => navigate({ to, replace: true }));
  }, [user, busy, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { email } = await resolveLoginEmail({ data: { identifier } });
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) {
        void logAuthEvent({ data: { event: "LOGIN_FAILED", success: false } });
        setError(LOGIN_ERROR);
        setBusy(false);
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("uyanix:remember", remember ? "1" : "0");
      }
      void logAuthEvent({ data: { event: "LOGIN_SUCCESS", userId: data.user.id } });
      const to = await destinationFor(data.user.id);
      navigate({ to, replace: true });
    } catch {
      setError(LOGIN_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center text-center">
          <BrandMark size={56} />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Welcome Back! 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Apne Uyanix account me login karein</p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Mobile Number or Email</span>
              <input
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
                placeholder="Enter mobile number or email"
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Password</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full bg-transparent text-sm outline-none"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="font-semibold text-primary">
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.02] disabled:opacity-60"
            >
              {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Logging in...</>) : "Login →"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Naya account?{" "}
            <Link to="/register" className="font-semibold text-primary">Register FREE</Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
