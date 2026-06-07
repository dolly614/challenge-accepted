import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Shield, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Admin Login — Uyanix" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, role, loading, roleLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !roleLoading && user && role === "admin") {
      navigate({ to: "/admin", replace: true });
    }
  }, [user, role, loading, roleLoading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const signedInUser = data.user;
    if (!signedInUser) {
      toast.error("Login complete nahi hua. Dobara try karein.");
      return;
    }

    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", signedInUser.id);

    if (roleError) {
      toast.error("Admin access verify nahi ho pa raha. Dobara try karein.");
      return;
    }

    const isAdmin = (roles ?? []).some((entry) => entry.role === "admin");

    if (isAdmin) {
      toast.success("Welcome admin");
      navigate({ to: "/admin", replace: true });
      return;
    }

    toast.error("Aapke account ko admin access nahi hai");
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Admin Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sirf admin accounts is page se login kar sakte hain.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4"/> Email</span>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                placeholder="admin@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4"/> Password</span>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit" disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {busy ? "Logging in…" : "Login as Admin"}
            </button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Student? <Link to="/login" className="text-primary font-semibold">Normal login</Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}