import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Uyanix" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    } else {
      toast.error("Invalid or expired reset link.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated successfully!");
    setTimeout(() => navigate({ to: "/login" }), 1200);
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card text-center">
            <h1 className="text-xl font-bold">Invalid Link</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Yeh reset link invalid ya expire ho gaya hai.
            </p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-content-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Set new password</h1>
              <p className="text-sm text-muted-foreground">
                Apna naya password neeche daalein.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                New password
              </span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full bg-transparent text-sm outline-none"
                  placeholder="••••••••"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                Confirm password
              </span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full bg-transparent text-sm outline-none"
                  placeholder="••••••••"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {busy ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
}
