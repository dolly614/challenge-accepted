import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { getTopicsForClass } from "@/lib/data/challenge";
import { getChapter } from "@/lib/chapters";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Lock } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/daily/$day")({
  head: () => ({ meta: [{ title: "Aaj ka task — Uyanix 30 Days Challenge" }] }),
  component: DailyGuarded,
});

function DailyGuarded() {
  return <RequireAuth><Daily /></RequireAuth>;
}

const sampleQuestions = [
  { q: "Bharat ka rashtriya pakshi kaun hai?", opts: ["Mor", "Kabootar", "Kauwa", "Tota"], a: 0 },
  { q: "Sun rises in the?", opts: ["West", "East", "North", "South"], a: 1 },
  { q: "12 × 8 = ?", opts: ["86", "96", "104", "108"], a: 1 },
  { q: "Capital of India?", opts: ["Mumbai", "Kolkata", "New Delhi", "Chennai"], a: 2 },
  { q: "Water boils at?", opts: ["50°C", "75°C", "100°C", "200°C"], a: 2 },
];

function Daily() {
  const { day } = Route.useParams();
  const dayNum = parseInt(day) || 1;
  const nav = useNavigate();
  const [cls, setCls] = useState(5);
  const [locked, setLocked] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("student");
    let c = 5;
    if (s) try { c = parseInt(JSON.parse(s).cls) || 5; } catch {}
    setCls(c);
    const ch = getChapter(c, dayNum);
    if (ch) { setCustomContent(ch.content); setCustomTitle(ch.title || null); }
    let done: number[] = [];
    try { done = JSON.parse(localStorage.getItem("completedDays") || "[]"); } catch {}
    setCompletedCount(done.length);
    // Sequential gate: day N opens only when days 1..N-1 are all completed
    const allPrevDone = Array.from({ length: dayNum - 1 }, (_, i) => i + 1).every(d => done.includes(d));
    setLocked(!allPrevDone);
  }, [dayNum]);

  const topics = getTopicsForClass(cls);
  const topic = customTitle || topics[dayNum - 1] || "Revision";
  const score = answers.reduce((acc, a, i) => acc + (a === sampleQuestions[i].a ? 1 : 0), 0);

  function submit() {
    setSubmitted(true);
    setConfetti(true);
    const done = JSON.parse(localStorage.getItem("completedDays") || "[]");
    if (!done.includes(dayNum)) done.push(dayNum);
    localStorage.setItem("completedDays", JSON.stringify(done));
    setTimeout(() => setConfetti(false), 3000);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {confetti && <ConfettiBurst />}
      {locked ? (
        <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Day {dayNum} abhi locked hai 🔒</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aapko days step by step complete karne hain. Pehle Day {completedCount + 1} complete karo, uske baad agla din apne aap unlock ho jayega.
          </p>
          <button
            onClick={() => nav({ to: "/daily/$day", params: { day: String(completedCount + 1) } })}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            Day {completedCount + 1} pe jao <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      ) : (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Day {dayNum} of 30</div>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{topic}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Aaj ka task: padhai karo aur 5 sawalon ke jawab do.</p>

        <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4"/> Reading</div>
          {customContent ? (
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{customContent}</div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Today's topic <b className="text-foreground">{topic}</b> humari learning journey ka important part hai.
              Is topic ko samajhne ke liye examples dekho, definitions ko notebook mein likho aur apne friends ke saath
              discuss karo. Yaad rakho — consistency hi kaamyabi ki chaabi hai. Roz thoda padho, har din ek naya concept
              seekho, aur 30 din ke baad aap khud notice karoge ki aap kitne aage badh chuke ho. All the best, champion! 🚀
            </p>
          )}
        </article>

        <div className="mt-8 space-y-4">
          {sampleQuestions.map((q, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-sm font-semibold">Q{i+1}. {q.q}</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.opts.map((o, oi) => {
                  const sel = answers[i] === oi;
                  const correct = submitted && oi === q.a;
                  const wrong = submitted && sel && oi !== q.a;
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers(a => a.map((v, idx) => idx === i ? oi : v))}
                      className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                        correct ? "border-secondary bg-secondary/10 text-secondary-foreground" :
                        wrong ? "border-destructive bg-destructive/10" :
                        sel ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                      }`}
                    >
                      {String.fromCharCode(65+oi)}. {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!submitted ? (
          <button
            disabled={answers.some(a => a < 0)}
            onClick={submit}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
          >
            Submit & Mark Day Complete
          </button>
        ) : (
          <div className="mt-6 rounded-3xl bg-gradient-to-br from-secondary/15 to-primary/15 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-secondary"/>
            <h3 className="mt-3 text-2xl font-bold">Day {dayNum} Complete! 🎉</h3>
            <p className="mt-1 text-muted-foreground">Aapne {score}/5 sawal sahi kiye.</p>
            <button onClick={() => nav({ to: "/dashboard" })} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">
              Go to Dashboard <ArrowRight className="h-4 w-4"/>
            </button>
          </div>
        )}
      </section>
      )}
      <Footer />
    </div>
  );
}

function ConfettiBurst() {
  const colors = ["bg-saffron", "bg-india-green", "bg-primary", "bg-secondary", "bg-gold"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => (
        <span
          key={i}
          className={`absolute h-2 w-2 ${colors[i % colors.length]} rounded-sm`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10px`,
            animation: `fall ${1.5 + Math.random() * 1.5}s ${Math.random()}s linear forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}
