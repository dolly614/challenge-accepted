import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useState } from "react";
import { leaderboardSample } from "@/lib/data/challenge";
import { Download, Lock, Users, IndianRupee, GraduationCap, Gift, FileText } from "lucide-react";
import { ChaptersManager } from "@/components/admin/ChaptersManager";
import { BulkImport } from "@/components/admin/BulkImport";
import { TeachersPanel } from "@/components/admin/TeachersPanel";
import { BrandPanel } from "@/components/admin/BrandPanel";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Uyanix 30 Days Challenge" }] }),
  component: Admin,
});

function Admin() {
  const { user, role, loading } = useAuth();
  const [paid, setPaid] = useState<Record<number, boolean>>({});

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user || role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
            <Lock className="h-8 w-8 text-primary"/>
            <h1 className="mt-3 text-2xl font-bold">Admin Access Required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {user
                ? "Aapke account ko admin role assign nahi hai. Owner se request karein."
                : "Please login with an admin account."}
            </p>
            {!user && (
              <Link to="/login" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft">
                Login
              </Link>
            )}
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  function exportCsv() {
    const rows = [["Rank","Name","Class","City","Score","PrizePaid"], ...leaderboardSample.map(r => [r.rank, r.name, r.cls, r.city, r.score, paid[r.rank] ? "Yes":"No"])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "students.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold sm:text-4xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage registrations, revenue and prizes.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/admin/exams" className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-hero px-5 text-sm font-semibold text-primary-foreground shadow-soft">
            <FileText className="h-4 w-4"/> Manage Exams & Questions
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Users className="h-5 w-5"/>} label="Total Registrations" value="12,847"/>
          <Stat icon={<IndianRupee className="h-5 w-5"/>} label="Total Revenue" value="₹12,71,853"/>
          <Stat icon={<GraduationCap className="h-5 w-5"/>} label="Exams Completed" value="9,432"/>
          <Stat icon={<Gift className="h-5 w-5"/>} label="Prizes to Distribute" value="3"/>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Top Students</h2>
            <button onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground">
              <Download className="h-4 w-4"/> Export CSV
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-3 py-2">Rank</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Class</th><th className="px-3 py-2">City</th><th className="px-3 py-2">Score</th><th className="px-3 py-2 text-right">Prize</th></tr>
              </thead>
              <tbody>
                {leaderboardSample.map(r => (
                  <tr key={r.rank} className="border-t border-border">
                    <td className="px-3 py-3 font-bold">#{r.rank}</td>
                    <td className="px-3 py-3 font-medium">{r.name}</td>
                    <td className="px-3 py-3">Class {r.cls}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.city}</td>
                    <td className="px-3 py-3 font-semibold">{r.score}/30</td>
                    <td className="px-3 py-3 text-right">
                      {r.rank <= 3 ? (
                        <button onClick={() => setPaid(p => ({ ...p, [r.rank]: !p[r.rank] }))}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${paid[r.rank] ? "bg-secondary text-secondary-foreground" : "border border-border hover:bg-accent"}`}>
                          {paid[r.rank] ? "✓ Paid" : "Mark Paid"}
                        </button>
                      ) : <span className="text-xs text-muted-foreground">Gift</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <BulkImport />
        <ChaptersManager />
        <TeachersPanel />
        <BrandPanel />
      </section>
      <Footer />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
