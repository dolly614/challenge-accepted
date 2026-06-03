import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Lock, Calendar, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exams")({
  head: () => ({ meta: [{ title: "Manage Exams — Admin" }] }),
  component: AdminExams,
});

type ExamRow = {
  id: string;
  title: string;
  class_level: number;
  exam_type: "mid" | "final";
  scheduled_date: string;
  shift: "day" | "night";
  start_time: string;
  duration_minutes: number;
  total_questions: number;
  marks_correct: number;
  marks_wrong: number;
  is_published: boolean;
};

function AdminExams() {
  const { user, role, loading } = useAuth();
  const qc = useQueryClient();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["admin", "exams"],
    enabled: role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data as ExamRow[];
    },
  });

  const [form, setForm] = useState({
    title: "",
    class_level: 5,
    exam_type: "mid" as "mid" | "final",
    scheduled_date: "",
    shift: "day" as "day" | "night",
    start_time: "10:00",
    duration_minutes: 60,
    total_questions: 200,
    marks_correct: 1,
    marks_wrong: -0.25,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.scheduled_date) throw new Error("Title aur date zaroori hai");
      const { error } = await supabase.from("exams").insert([form]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exam created");
      setForm({ ...form, title: "", scheduled_date: "" });
      qc.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("exams").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "exams"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card text-center">
            <Lock className="mx-auto h-8 w-8 text-primary"/>
            <h1 className="mt-3 text-2xl font-bold">Admin only</h1>
            <Link to="/login" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-gradient-hero px-6 text-sm font-semibold text-primary-foreground shadow-soft">Login</Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4"/> Back to admin
        </Link>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Manage Exams</h1>
        <p className="mt-1 text-sm text-muted-foreground">Class-wise exam create karein, schedule set karein, questions add karein.</p>

        {/* Create form */}
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold flex items-center gap-2"><Plus className="h-5 w-5"/> Create New Exam</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Title">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Class 5 Mid Exam"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"/>
            </Field>
            <Field label="Class">
              <select value={form.class_level} onChange={e => setForm({ ...form, class_level: Number(e.target.value) })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                {Array.from({ length: 12 }).map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value as "mid" | "final" })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                <option value="mid">Mid (15 days)</option>
                <option value="final">Final (30 days)</option>
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"/>
            </Field>
            <Field label="Shift">
              <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value as "day" | "night" })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                <option value="day">Day</option>
                <option value="night">Night</option>
              </select>
            </Field>
            <Field label="Start Time">
              <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"/>
            </Field>
            <Field label="Duration (min)">
              <input type="number" min={5} value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"/>
            </Field>
            <Field label="Total Questions">
              <input type="number" min={1} value={form.total_questions} onChange={e => setForm({ ...form, total_questions: Number(e.target.value) })}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"/>
            </Field>
            <Field label="Marking (+correct / -wrong)">
              <div className="flex gap-2">
                <input type="number" step="0.25" value={form.marks_correct} onChange={e => setForm({ ...form, marks_correct: Number(e.target.value) })}
                  className="h-11 w-1/2 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"/>
                <input type="number" step="0.25" value={form.marks_wrong} onChange={e => setForm({ ...form, marks_wrong: Number(e.target.value) })}
                  className="h-11 w-1/2 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"/>
              </div>
            </Field>
          </div>
          <button onClick={() => create.mutate()} disabled={create.isPending}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-hero px-6 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60">
            <Plus className="h-4 w-4"/> {create.isPending ? "Creating..." : "Create Exam"}
          </button>
        </div>

        {/* List */}
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="h-5 w-5"/> All Exams</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : exams.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Abhi koi exam nahi hai. Upar form se create karein.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Schedule</th>
                    <th className="px-3 py-2">Shift</th>
                    <th className="px-3 py-2">Qs</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(e => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-3 py-3 font-medium">{e.title}</td>
                      <td className="px-3 py-3">Class {e.class_level}</td>
                      <td className="px-3 py-3 capitalize">{e.exam_type}</td>
                      <td className="px-3 py-3 text-muted-foreground">{e.scheduled_date} · {e.start_time?.slice(0,5)}</td>
                      <td className="px-3 py-3 capitalize">{e.shift}</td>
                      <td className="px-3 py-3">{e.total_questions}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => togglePublish.mutate({ id: e.id, is_published: !e.is_published })}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${e.is_published ? "bg-secondary text-secondary-foreground" : "border border-border"}`}>
                          {e.is_published ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to="/admin/exams/$examId" params={{ examId: e.id }}
                            className="inline-flex h-8 items-center gap-1 rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20">
                            <Pencil className="h-3 w-3"/> Questions
                          </Link>
                          <button onClick={() => { if (confirm("Delete this exam?")) remove.mutate(e.id); }}
                            className="inline-flex h-8 items-center gap-1 rounded-full border border-destructive/40 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}