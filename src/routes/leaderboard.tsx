import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useState } from "react";
import { leaderboardSample } from "@/lib/data/challenge";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — 30 Days Challenge" }] }),
  component: Lb,
});

function Lb() {
  const [filter, setFilter] = useState("all");
  const filtered = leaderboardSample.filter(r => {
    if (filter === "all") return true;
    if (filter === "1-5") return r.cls <= 5;
    if (filter === "6-8") return r.cls >= 6 && r.cls <= 8;
    if (filter === "9-12") return r.cls >= 9;
    return true;
  });

  const groups = [
    { id: "all", l: "All Classes" },
    { id: "1-5", l: "Class 1–5" },
    { id: "6-8", l: "Class 6–8" },
    { id: "9-12", l: "Class 9–12" },
  ];

  const rowBg = (rank: number) =>
    rank === 1 ? "bg-gradient-gold/40" :
    rank === 2 ? "bg-gradient-silver/60" :
    rank === 3 ? "bg-gradient-bronze/30" : "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">🏆 Live Leaderboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Apna rank dekho aur top par pahunchne ki tayari karo!</p>
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold hover:bg-accent">
            <RefreshCw className="h-4 w-4"/> Refresh
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {groups.map(g => (
            <button key={g.id} onClick={() => setFilter(g.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === g.id ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-accent"}`}>
              {g.l}
            </button>
          ))}
        </div>
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Rank</th><th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Class</th><th className="px-4 py-3">City</th>
                <th className="px-4 py-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.rank} className={`border-t border-border ${rowBg(r.rank)}`}>
                  <td className="px-4 py-4 text-base font-bold">{r.badge} #{r.rank}</td>
                  <td className="px-4 py-4 font-semibold">{r.name}</td>
                  <td className="px-4 py-4">Class {r.cls}</td>
                  <td className="px-4 py-4 text-muted-foreground">{r.city}</td>
                  <td className="px-4 py-4 text-right font-bold">{r.score}/30</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Footer />
    </div>
  );
}
