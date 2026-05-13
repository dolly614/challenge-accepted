import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { Clock, Trophy, Award } from "lucide-react";
import { generateCertificate } from "@/lib/certificate";

export const Route = createFileRoute("/exam")({
  head: () => ({ meta: [{ title: "Final Exam — 30 Days Challenge" }] }),
  component: Exam,
});

const QS = Array.from({ length: 30 }).map((_, i) => ({
  q: `Question ${i + 1}: Sample MCQ for the final exam`,
  opts: ["Option A", "Option B", "Option C", "Option D"],
  a: i % 4,
}));

function Exam() {
  const [answers, setAnswers] = useState<number[]>(Array(30).fill(-1));
  const [time, setTime] = useState(45 * 60);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime(t => {
      if (t <= 1) { clearInterval(id); setDone(true); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [done]);

  const score = answers.reduce((s, a, i) => s + (a === QS[i].a ? 1 : 0), 0);
  const mm = String(Math.floor(time / 60)).padStart(2, "0");
  const ss = String(time % 60).padStart(2, "0");

  if (done) {
    if (typeof window !== "undefined") {
      try { localStorage.setItem("examScore", String(score)); } catch {}
    }
    let student = { name: "Student", cls: "5" };
    if (typeof window !== "undefined") {
      try { const s = localStorage.getItem("student"); if (s) { const p = JSON.parse(s); student = { name: p.name || "Student", cls: String(p.cls || "5") }; } } catch {}
    }
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <Trophy className="mx-auto h-16 w-16 text-saffron"/>
          <h1 className="mt-4 text-4xl font-bold">Exam Complete! 🎉</h1>
          <p className="mt-2 text-muted-foreground">Aapka score</p>
          <div className="mt-4 text-6xl font-extrabold text-gradient">{score}/30</div>
          <p className="mt-3 text-sm text-muted-foreground">Final ranks calculate hone ke baad leaderboard pe dekho.</p>
          <button
            onClick={() => generateCertificate({ name: student.name, cls: student.cls, score })}
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-hero px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:scale-[1.02]"
          >
            <Award className="h-4 w-4"/> Download Your Certificate
          </button>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="text-sm font-semibold">Final Exam • 30 Questions</div>
          <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${time < 300 ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
            <Clock className="h-4 w-4"/> {mm}:{ss}
          </div>
        </div>
      </div>
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
        {QS.map((q, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-sm font-semibold">{q.q}</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.opts.map((o, oi) => (
                <button key={oi} onClick={() => setAnswers(a => a.map((v, idx) => idx === i ? oi : v))}
                  className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${answers[i] === oi ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  {String.fromCharCode(65+oi)}. {o}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button onClick={() => setDone(true)} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft">
          Submit Exam
        </button>
      </section>
      <Footer />
    </div>
  );
}
