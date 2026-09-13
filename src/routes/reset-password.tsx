import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BrandMark } from "@/components/site/BrandMark";
import { supabase } from "@/integrations/supabase/client";
import { logAuthEvent } from "@/lib/auth.functions";
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Create New Password — Uyanix 30 Days Challenge" },
      { name: "description", content: "Apna naya secure password set karein aur dobara login karein." },
    ],
  }),
  component: ResetPasswordPage,
});

type Phase = "checking" | "form" | "invalid" | "done";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The provider validates the recovery session; the page never trusts the URL alone.
  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (data.user) setPhase("form");
      else {
        setPhase("invalid");
        void logAuthEvent({ data: { event: "PASSWORD_RESET_INVALID", success: false } });
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setPhase("form");
    });
    const t = setTimeout(() => { void check(); }, 400);
    return () => { active = false; clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Password kam se kam 6 characters ka hona chahiye."); return; }
    if (password !== confirm) { setError("Password aur Confirm Password same hone chahiye."); return; }
    setBusy(true);
    const { data, error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      setError("Password update nahi ho paya. Dobara try karein.");
      return;
    }
    void logAuthEvent({ data: { event: "PASSWORD_CHANGED", userId: data.user?.id ?? null } });
    // Recovery session must not stay reusable.
    await supabase.auth.signOut();
    setBusy(false);
    setPhase("done");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center text-center">
          <BrandMark size={56} />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Create New Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Apna naya secure password set karein.</p>
        </div>

        {phase === "checking" && (
          <div className="mt-8 flex flex-col items-center gap-2 rounded-3xl border border-border bg-card p-8 shadow-card">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        )}

        {phase === "invalid" && (
          <div className="mt-8 rounded-3xl border border-destructive/40 bg-destructive/5 p-8 text-center shadow-card">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-3 text-xl font-bold">Reset Link Expired</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ye password reset link valid nahi hai ya expire ho chuka hai.
            </p>
            <Link
              to="/forgot-password"
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Request New Link →
            </Link>
          </div>
        )}

        {phase === "done" && (
          <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-12 w-12 text-secondary" />
            <h2 className="mt-3 text-xl font-bold">Password Updated Successfully! 🎉</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Aap ab apne naye password se login kar sakte hain.
            </p>
            <button
              onClick={() => navigate({ to: "/login", replace: true })}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Login Now →
            </button>
          </div>
        )}

        {phase === "form" && (
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">New Password</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full bg-transparent text-sm outline-none"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Confirm New Password</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-11 w-full bg-transparent text-sm outline-none"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || password.length < 6 || password !== confirm}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.02] disabled:opacity-60"
              >
                {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>) : "Update Password →"}
              </button>
            </form>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
