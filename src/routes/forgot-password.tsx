import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BrandMark } from "@/components/site/BrandMark";
import { requestPasswordReset } from "@/lib/auth.functions";
import { CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Uyanix 30 Days Challenge" },
      { name: "description", content: "Apna registered email enter karein aur password reset link paayein." },
    ],
  }),
  component: ForgotPasswordPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return;
    setBusy(true);
    try {
      await requestPasswordReset({
        data: { email: email.trim(), redirectTo: `${window.location.origin}/reset-password` },
      });
    } catch {
      /* response is identical either way — never disclose account existence */
    }
    setBusy(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center text-center">
          <BrandMark size={56} />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Forgot Password? 🔐</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Koi baat nahi! Apna registered email enter karein.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          {sent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/10 p-4 text-sm text-secondary">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Agar ye email registered hai, to password reset link bhej diya gaya hai.</span>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Email check karein aur reset link open karein.
              </p>
              <Link
                to="/login"
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border bg-background text-sm font-semibold hover:bg-accent"
              >
                ← Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Registered Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.02] disabled:opacity-60"
              >
                {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>) : "Send Reset Link →"}
              </button>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
