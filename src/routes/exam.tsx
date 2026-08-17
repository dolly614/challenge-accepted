import { getStudentInfo } from "@/lib/student";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { Clock, Trophy, Award, CreditCard, Lock, ShieldCheck, CalendarClock } from "lucide-react";
import { generateCertificate } from "@/lib/certificate";

export const Route = createFileRoute("/exam")({
  validateSearch: (s: Record<string, unknown>) => ({ type: s.type === "final" ? "final" as const : "mid" as const }),
  head: () => ({ meta: [{ title: "Exam — Uyanix 30 Days Challenge" }] }),
  component: Exam,
});

const MAX_ATTEMPTS = 3;
const FEE = 199;

type Group = { id: string; label: string; minCls: number; maxCls: number; startDay: number; endDay: number };
const GROUPS: Group[] = [
  { id: "g1", label: "Class 1–5", minCls: 1, maxCls: 5, startDay: 1, endDay: 7 },
  { id: "g2", label: "Class 6–9", minCls: 6, maxCls: 9, startDay: 7, endDay: 14 },
  { id: "g3", label: "Class 10–12", minCls: 10, maxCls: 12, startDay: 14, endDay: 21 },
];

function groupForClass(cls: number): Group | null {
  return GROUPS.find(g => cls >= g.minCls && cls <= g.maxCls) ?? null;
}

function Exam() {
  const { type } = Route.useSearch();
  const totalQs = 15;
  const durationMin = 25;

  const [studentCls, setStudentCls] = useState<number>(5);
  const [studentName, setStudentName] = useState<string>("Student");
  const [attempts, setAttempts] = useState<number>(0);
  const [paidForCurrent, setPaidForCurrent] = useState(false);
  const [paying, setPaying] = useState(false);
  const [today, setToday] = useState<number>(() => new Date().getDate());

  const group = groupForClass(studentCls);
  const monthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
  const attemptsKey = group ? `examAttempts_${group.id}_${monthKey}` : "";
  const paidKey = group ? `examPaidAttempt_${group.id}_${monthKey}` : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    void getStudentInfo().then(info => { setStudentName(info.name); setStudentCls(parseInt(info.cls) || 5); });
    setToday(new Date().getDate());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !attemptsKey) return;
    setAttempts(parseInt(localStorage.getItem(attemptsKey) || "0") || 0);
    setPaidForCurrent(localStorage.getItem(paidKey) === "1");
  }, [attemptsKey, paidKey]);

  const examLabel = group ? `Exam — ${group.label}` : "Exam";
  const inWindow = group ? today >= group.startDay && today <= group.endDay : false;
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);

  const QS = Array.from({ length: totalQs }).map((_, i) => ({
    q: `Question ${i + 1}: Sample MCQ for ${examLabel}`,
    opts: ["Option A", "Option B", "Option C", "Option D"],
    a: i % 4,
  }));

  const [answers, setAnswers] = useState<number[]>(Array(totalQs).fill(-1));
  const [time, setTime] = useState(durationMin * 60);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done || !paidForCurrent) return;
    const id = setInterval(() => setTime(t => {
      if (t <= 1) { clearInterval(id); setDone(true); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [done, paidForCurrent]);

  const score = answers.reduce((s, a, i) => s + (a === QS[i].a ? 1 : 0), 0);
  const mm = String(Math.floor(time / 60)).padStart(2, "0");
  const ss = String(time % 60).padStart(2, "0");

  function handlePay() {
    if (!group || !inWindow || attemptsLeft <= 0) return;
    setPaying(true);
    setTimeout(() => {
      if (typeof window !== "undefined") localStorage.setItem(paidKey, "1");
      setPaidForCurrent(true);
      setPaying(false);
    }, 900);
  }

  function handleSubmit() {
    if (typeof window !== "undefined") {
      const next = attempts + 1;
      localStorage.setItem(attemptsKey, String(next));
      setAttempts(next);
      // consume payment — next attempt needs fresh payment
      localStorage.removeItem(paidKey);
      try { localStorage.setItem("examScore", String(score)); } catch {}
    }
    setPaidForCurrent(false);
    setDone(true);
  }

  // Gate: class-window or no-attempts-left
  if (!group || !inWindow || attemptsLeft <= 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card text-center">
            <CalendarClock className="mx-auto h-12 w-12 text-primary"/>
            <h1 className="mt-4 text-2xl font-bold">{examLabel || "Exam"}</h1>
            {!group && <p className="mt-2 text-sm text-muted-foreground">Aapki class ke liye exam group nahi mila. Profile me class update karein.</p>}
            {group && !inWindow && (
              <p className="mt-2 text-sm text-muted-foreground">
                Aapka ({group.label}) exam window: <b>Date {group.startDay} se {group.endDay} tak</b>. Aaj date {today} hai — is window me hi exam de sakte hain.
              </p>
            )}
            {group && inWindow && attemptsLeft <= 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Aapne is month ke {MAX_ATTEMPTS} attempts use kar liye hain. Agle month try karein.
              </p>
            )}
            <div className="mt-6 grid gap-2 text-xs text-muted-foreground">
              {GROUPS.map(g => (
                <div key={g.id} className="rounded-xl border border-border p-3 text-left">
                  <b>{g.label}:</b> Date {g.startDay}–{g.endDay} · max {MAX_ATTEMPTS} attempts · ₹{FEE}/attempt
                </div>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // type param is preserved but does not change behavior anymore
  void type;

  if (!paidForCurrent && !done) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card text-center">
            <Lock className="mx-auto h-12 w-12 text-primary"/>
            <h1 className="mt-4 text-2xl font-bold">{examLabel}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Window: Date {group.startDay}–{group.endDay}. Attempts left: <b>{attemptsLeft}/{MAX_ATTEMPTS}</b>. Har attempt ke liye alag payment zaruri hai.
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-accent/40 p-5 text-left text-sm">
              <div className="flex justify-between"><span>{examLabel} — Attempt {attempts + 1}</span><span className="font-semibold">₹{FEE}</span></div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{totalQs} MCQs · {durationMin} mins</span><span>Per attempt</span></div>
              <div className="mt-3 border-t border-border pt-3 flex justify-between font-bold"><span>Total</span><span>₹{FEE}</span></div>
            </div>
            <button onClick={handlePay} disabled={paying} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60">
              <CreditCard className="h-4 w-4"/> {paying ? "Processing..." : `Pay ₹${FEE} & Start Attempt ${attempts + 1}`}
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3"/> Secure Razorpay (test mode)
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (done) {
    if (typeof window !== "undefined") {
      try { localStorage.setItem("examScore", String(score)); } catch {}
    }
    const student = { name: studentName, cls: String(studentCls) };
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <Trophy className="mx-auto h-16 w-16 text-saffron"/>
          <h1 className="mt-4 text-4xl font-bold">{examLabel} Complete! 🎉</h1>
          <p className="mt-2 text-muted-foreground">Aapka score</p>
          <div className="mt-4 text-6xl font-extrabold text-gradient">{score}/{totalQs}</div>
          <p className="mt-3 text-sm text-muted-foreground">
            Attempts used: {attempts}/{MAX_ATTEMPTS}. {attempts < MAX_ATTEMPTS && today <= (group?.endDay ?? 0) ? "Aap aur attempt de sakte hain (nayi payment lagegi)." : "Is window ke saare attempts complete."}
          </p>
          <button
            onClick={() => generateCertificate({ name: student.name, cls: student.cls, score })}
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-hero px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:scale-[1.02]"
          >
            <Award className="h-4 w-4"/> Download Your Certificate
          </button>
          {attempts < MAX_ATTEMPTS && group && today <= group.endDay && (
            <button
              onClick={() => { setDone(false); setAnswers(Array(totalQs).fill(-1)); setTime(durationMin*60); }}
              className="mt-3 inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold hover:bg-accent"
            >
              Pay ₹{FEE} & Retake Exam
            </button>
          )}
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
          <div className="text-sm font-semibold">{examLabel} • {totalQs} Questions</div>
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
        <button onClick={handleSubmit} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft">
          Submit Exam
        </button>
      </section>
      <Footer />
    </div>
  );
}
