import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Lock, ArrowLeft, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exams/$examId")({
  head: () => ({ meta: [{ title: "Questions — Admin" }] }),
  component: Questions,
});

type Q = {
  id: string;
  exam_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number;
  order_index: number;
};

function Questions() {
  const { examId } = Route.useParams();
  const { user, role, loading } = useAuth();
  const qc = useQueryClient();

  const { data: exam } = useQuery({
    queryKey: ["admin", "exam", examId],
    enabled: role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.from("exams").select("*").eq("id", examId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["admin", "questions", examId],
    enabled: role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").eq("exam_id", examId).order("order_index");
      if (error) throw error;
      return data as Q[];
    },
  });

  const [form, setForm] = useState({
    question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: 0,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
        throw new Error("Sab fields fill karein");
      }
      const { error } = await supabase.from("questions").insert([{
        exam_id: examId,
        ...form,
        order_index: questions.length,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Question added");
      setForm({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: 0 });
      qc.invalidateQueries({ queryKey: ["admin", "questions", examId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "questions", examId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  async function importCsv(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    // Format: question,optionA,optionB,optionC,optionD,correct(1-4)
    const rows = lines.map(l => parseCsvLine(l));
    const start = lines[0].toLowerCase().includes("question") ? 1 : 0;
    const payload = rows.slice(start).map((r, i) => ({
      exam_id: examId,
      question_text: r[0] ?? "",
      option_a: r[1] ?? "",
      option_b: r[2] ?? "",
      option_c: r[3] ?? "",
      option_d: r[4] ?? "",
      correct_option: Math.max(0, Math.min(3, (Number(r[5]) || 1) - 1)),
      order_index: questions.length + i,
    })).filter(p => p.question_text);
    if (!payload.length) { toast.error("CSV empty"); return; }
    const { error } = await supabase.from("questions").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(`${payload.length} questions imported`);
    qc.invalidateQueries({ queryKey: ["admin", "questions", examId] });
  }

  if (loading) return <div className="min-h-screen bg-background"><Header /><div className="p-20 text-center text-sm text-muted-foreground">Loading…</div></div>;
  if (!user || role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card text-center">
            <Lock className="mx-auto h-8 w-8 text-primary"/>
            <h1 className="mt-3 text-2xl font-bold">Admin only</h1>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link to="/admin/exams" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4"/> All exams
        </Link>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{exam?.title ?? "Exam"} — Questions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Class {exam?.class_level} · {exam?.exam_type} · Target {exam?.total_questions} questions · Currently {questions.length}
        </p>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><Upload className="h-5 w-5"/> Bulk CSV Import</h2>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground">
              <Upload className="h-4 w-4"/> Choose CSV
              <input type="file" accept=".csv,text/csv" hidden onChange={e => {
                const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = "";
              }}/>
            </label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Format: <code className="rounded bg-muted px-1">question, option_a, option_b, option_c, option_d, correct(1-4)</code>. Header row optional.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold flex items-center gap-2"><Plus className="h-5 w-5"/> Add Question</h2>
          <textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} placeholder="Question text"
            className="mt-3 min-h-[80px] w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"/>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["option_a","option_b","option_c","option_d"] as const).map((k, i) => (
              <label key={k} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${form.correct_option === i ? "border-primary bg-primary/5" : "border-input"}`}>
                <input type="radio" name="correct" checked={form.correct_option === i} onChange={() => setForm({ ...form, correct_option: i })}/>
                <span className="text-xs font-bold w-5">{String.fromCharCode(65+i)}.</span>
                <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={`Option ${String.fromCharCode(65+i)}`}
                  className="h-9 flex-1 bg-transparent text-sm outline-none"/>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Select radio → correct answer.</p>
          <button onClick={() => add.mutate()} disabled={add.isPending}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-hero px-6 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60">
            <Plus className="h-4 w-4"/> {add.isPending ? "Adding..." : "Add Question"}
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">All Questions ({questions.length})</h2>
          {isLoading ? <p className="mt-3 text-sm text-muted-foreground">Loading…</p> :
           questions.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Koi question nahi hai.</p> :
            <ol className="mt-4 space-y-3">
              {questions.map((q, idx) => (
                <li key={q.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{idx + 1}. {q.question_text}</div>
                      <div className="mt-2 grid gap-1 sm:grid-cols-2 text-xs">
                        {["option_a","option_b","option_c","option_d"].map((k, i) => (
                          <div key={k} className={i === q.correct_option ? "font-semibold text-primary" : "text-muted-foreground"}>
                            {String.fromCharCode(65+i)}. {(q as Q)[k as keyof Q] as string}
                            {i === q.correct_option ? " ✓" : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => { if (confirm("Delete?")) remove.mutate(q.id); }}
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-destructive/40 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3"/>
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          }
        </div>
      </section>
      <Footer />
    </div>
  );
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur); cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}