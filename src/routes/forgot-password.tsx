import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, KeyRound } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — Uyanix" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent! Check your email.");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-content-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Forgot password?</h1>
              <p className="text-sm text-muted-foreground">
                Apna email daalein, hum aapko reset link bhejenge.
              </p>
            </div>
          </div>

          {sent ? (
            <div className="mt-6 rounded-xl bg-secondary/10 p-4 text-sm text-secondary">
              ✅ Reset link aapke email par bhej diya gaya hai. Kripya apne inbox check
              karein.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Email</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full bg-transparent text-sm outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
              >
                {busy ? "Please wait..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Yaad aa gaya?{" "}
            <Link to="/login" className="font-semibold text-primary">
              Login karein
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
