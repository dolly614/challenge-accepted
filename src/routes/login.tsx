import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { LogIn, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Uyanix" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Logged in!");
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(String(result.error.message ?? result.error)); setBusy(false); return; }
    if (result.redirected) return;
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-content-center rounded-xl bg-primary/10 text-primary"><LogIn className="h-5 w-5"/></div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Login to continue</p>
            </div>
          </div>

          <button onClick={onGoogle} disabled={busy}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-semibold hover:bg-accent disabled:opacity-60">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border"/> OR <div className="h-px flex-1 bg-border"/>
          </div>

          <form onSubmit={onEmailLogin} className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Email</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                <Mail className="h-4 w-4 text-muted-foreground"/>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                  className="h-11 w-full bg-transparent text-sm outline-none" placeholder="you@example.com"/>
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Password</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                <Lock className="h-4 w-4 text-muted-foreground"/>
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                  className="h-11 w-full bg-transparent text-sm outline-none" placeholder="••••••••"/>
              </div>
            </label>
            <button type="submit" disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60">
              {busy ? "Please wait..." : "Login"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-primary transition">
              Forgot password?
            </Link>
            <span className="text-muted-foreground">
              New here? <Link to="/signup" className="font-semibold text-primary">Create an account</Link>
            </span>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}