import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { getTopicsForClass, leaderboardSample, TOTAL_DAYS } from "@/lib/data/challenge";
import { Flame, Lock, Trophy, Award, Share2, CheckCircle2 } from "lucide-react";
import { generateCertificate } from "@/lib/certificate";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { getStudentInfo } from "@/lib/student";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Uyanix 30 Days Challenge" }] }),
  component: DashboardGuarded,
});

function DashboardGuarded() {
  return <RequireAuth><Dashboard /></RequireAuth>;
}

type Student = { name: string; cls: string };

function Dashboard() {
  const [student, setStudent] = useState<Student>({ name: "Student", cls: "5" });
  const [completed, setCompleted] = useState<number[]>([]);
  const today = completed.length + 1;

  useEffect(() => {
    void getStudentInfo().then(setStudent);
    const done = localStorage.getItem("completedDays");
    if (done) { try { setCompleted(JSON.parse(done)); } catch {} }
    else setCompleted([1,2,3,4,5,6,7,8,9,10,11,12]);
  }, []);

  const topics = getTopicsForClass(parseInt(student.cls) || 5);
  const pct = Math.round((completed.length / TOTAL_DAYS) * 100);
  const midExamUnlocked = completed.length >= 15;
  const finalExamUnlocked = completed.length >= TOTAL_DAYS;
  const examUnlocked = midExamUnlocked; // any exam available
  const examScoreRaw = typeof window !== "undefined" ? localStorage.getItem("examScore") : null;
  const examScore = examScoreRaw ? parseInt(examScoreRaw) : null;
  const certificateReady = examScore !== null;

  const handleDownloadCertificate = () => {
    if (!certificateReady) {
      alert("Final exam complete karne ke baad certificate unlock hoga.");
      return;
    }
    generateCertificate({ name: student.name, cls: student.cls, score: examScore ?? undefined });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Hi {student.name} 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Class {student.cls} • Apna progress dekho aur aaj ka task complete karo.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron/20 to-india-green/20 px-4 py-2 text-sm font-semibold">
            <Flame className="h-4 w-4 text-saffron"/> {completed.length} day streak!
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Days Completed" value={`${completed.length}/30`} accent="bg-secondary"/>
          <StatCard label="Progress" value={`${pct}%`} accent="bg-primary"/>
          <StatCard label="Current Rank" value="#7" accent="bg-saffron"/>
        </div>

        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-gradient-hero transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">30-Day Challenge Tracker</h2>
              <span className="text-xs text-muted-foreground">Class {student.cls} curriculum</span>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-10">
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const isDone = completed.includes(day);
                const isToday = day === today && !examUnlocked;
                return (
                  <Link
                    key={day}
                    to="/daily/$day"
                    params={{ day: String(day) }}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-semibold transition hover:scale-105 ${
                      isDone ? "bg-secondary text-secondary-foreground" :
                      isToday ? "bg-primary text-primary-foreground animate-pulse-glow" :
                      "bg-muted text-muted-foreground"
                    }`}
                    title={topics[i]}
                  >
                    {isDone && <CheckCircle2 className="absolute right-1 top-1 h-3 w-3"/>}
                    <span className="text-[10px] opacity-80">Day</span>
                    <span className="text-base">{day}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <Legend color="bg-secondary" label="Completed"/>
              <Legend color="bg-primary" label="Today"/>
              <Legend color="bg-muted" label="Upcoming"/>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-gradient-hero p-6 text-primary-foreground shadow-soft">
              <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Aaj ka task</div>
              <div className="mt-2 text-xl font-bold">Day {today}: {topics[today - 1] || "All done!"}</div>
              <p className="mt-1 text-sm opacity-90">5 MCQs • ~10 mins</p>
              {!examUnlocked ? (
                <Link to="/daily/$day" params={{ day: String(today) }} className="mt-4 inline-flex h-10 items-center rounded-full bg-card px-5 text-sm font-semibold text-primary shadow-soft hover:scale-[1.03]">
                  Start Today's Task →
                </Link>
              ) : (
                <Link to="/exam" search={{ type: finalExamUnlocked ? "final" : "mid" }} className="mt-4 inline-flex h-10 items-center rounded-full bg-card px-5 text-sm font-semibold text-primary shadow-soft hover:scale-[1.03]">
                  Take {finalExamUnlocked ? "Final" : "Mid"} Exam →
                </Link>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Trophy className={`h-4 w-4 ${midExamUnlocked ? "text-saffron" : "text-muted-foreground"}`}/>
                Exams
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Registration FREE hai. Exam fee sirf exam dene ke time pe.</p>
              <div className="mt-3 space-y-2">
                {midExamUnlocked ? (
                  <Link to="/exam" search={{ type: "mid" }} className="flex h-10 w-full items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">Mid Exam (15 Days) · ₹199</Link>
                ) : (
                  <button disabled className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-muted text-xs font-semibold text-muted-foreground"><Lock className="h-3 w-3"/> Mid Exam — Day 15 pe unlock</button>
                )}
                {finalExamUnlocked ? (
                  <Link to="/exam" search={{ type: "final" }} className="flex h-10 w-full items-center justify-center rounded-full bg-gradient-hero text-xs font-semibold text-primary-foreground">Final Exam (30 Days) · ₹199</Link>
                ) : (
                  <button disabled className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-muted text-xs font-semibold text-muted-foreground"><Lock className="h-3 w-3"/> Final Exam — Day 30 pe unlock</button>
                )}
              </div>
            </div>

            <button
              onClick={handleDownloadCertificate}
              disabled={!certificateReady}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-card hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Award className="h-4 w-4 text-primary"/>
              {certificateReady ? "Download Certificate" : "Certificate (after exam)"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`I completed Day ${completed.length} of Uyanix 30 Days Challenge! 🎉 Join me: ${typeof window !== "undefined" ? window.location.origin : ""}`)}`}
              target="_blank" rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary p-4 text-sm font-semibold text-secondary-foreground hover:opacity-90"
            >
              <Share2 className="h-4 w-4"/> Share on WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🏆 Top 10 Leaderboard</h2>
            <Link to="/leaderboard" className="text-sm font-semibold text-primary hover:underline">View full →</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-3 py-2">Rank</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Class</th><th className="px-3 py-2">City</th><th className="px-3 py-2 text-right">Score</th></tr>
              </thead>
              <tbody>
                {leaderboardSample.map(r => (
                  <tr key={r.rank} className={`border-t border-border ${r.rank <= 3 ? "bg-accent/40" : ""}`}>
                    <td className="px-3 py-3 font-bold">{r.badge} {r.rank}</td>
                    <td className="px-3 py-3 font-medium">{r.name}</td>
                    <td className="px-3 py-3">Class {r.cls}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.city}</td>
                    <td className="px-3 py-3 text-right font-semibold">{r.score}/30</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${accent}`}/> {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold">{value}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <div className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${color}`}/> {label}</div>;
}
