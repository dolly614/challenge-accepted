import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Upload, Save, Trash2, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { getAllChapters, getChapter, saveChapter, deleteChapter, extractPdfText } from "@/lib/chapters";
import { getTopicsForClass, TOTAL_DAYS } from "@/lib/data/challenge";

export function ChaptersManager() {
  const [cls, setCls] = useState(1);
  const [day, setDay] = useState(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const all = useMemo(() => getAllChapters(), [tick]);
  const topics = getTopicsForClass(cls);
  const defaultTopic = topics[day - 1] || `Day ${day}`;

  useEffect(() => {
    const ch = getChapter(cls, day);
    setTitle(ch?.title || "");
    setContent(ch?.content || "");
    setMsg(null);
  }, [cls, day, tick]);

  async function handlePdf(file: File) {
    setBusy(true); setMsg(null);
    try {
      const text = await extractPdfText(file);
      setContent(prev => prev ? prev + "\n\n" + text : text);
      if (!title) setTitle(file.name.replace(/\.pdf$/i, ""));
      setMsg(`✓ ${file.name} se ${text.length} characters extract hue. Ab Save dabao.`);
    } catch (e: any) {
      setMsg(`PDF read nahi ho saka: ${e?.message || e}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSave() {
    if (!content.trim()) { setMsg("Content khali hai."); return; }
    saveChapter(cls, day, content.trim(), title.trim() || undefined);
    setMsg(`✓ Class ${cls} • Day ${day} chapter save ho gaya.`);
    setTick(t => t + 1);
  }
  function handleDelete() {
    if (!confirm(`Class ${cls} Day ${day} chapter delete karein?`)) return;
    deleteChapter(cls, day);
    setTick(t => t + 1);
    setMsg("🗑 Deleted.");
  }

  const filledDays = (c: number) =>
    Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).filter(d => all[`${c}_${d}`]);

  return (
    <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary"/>
        <h2 className="text-xl font-bold">Chapters Manager</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Class 1 se 12 tak ke liye 30 din ka content add karo — PDF upload se ya copy-paste se.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class</label>
          <select value={cls} onChange={e => setCls(parseInt(e.target.value))}
            className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(c => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day</label>
          <select value={day} onChange={e => setDay(parseInt(e.target.value))}
            className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
            {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map(d => {
              const has = !!all[`${cls}_${d}`];
              return <option key={d} value={d}>Day {d} {has ? "✓" : ""} — {getTopicsForClass(cls)[d-1]}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chapter Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder={defaultTopic}
          className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary"/>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90">
          {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}
          {busy ? "Reading PDF…" : "Upload PDF"}
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePdf(f); }}/>
        </label>
        <span className="text-xs text-muted-foreground">ya neeche directly paste karo</span>
      </div>

      <div className="mt-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chapter Content</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Yahan chapter ka content paste karo ya PDF upload karke auto-fill karo…"
          rows={12}
          className="mt-1 w-full rounded-xl border border-input bg-background p-4 text-sm outline-none focus:border-primary"/>
        <div className="mt-1 text-right text-xs text-muted-foreground">{content.length} chars</div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={handleSave}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground shadow-soft">
          <Save className="h-4 w-4"/> Save Chapter
        </button>
        {getChapter(cls, day) && (
          <button onClick={handleDelete}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-destructive px-5 text-sm font-semibold text-destructive">
            <Trash2 className="h-4 w-4"/> Delete
          </button>
        )}
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary"/> Coverage Overview
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(c => {
            const filled = filledDays(c).length;
            const pct = Math.round((filled / TOTAL_DAYS) * 100);
            return (
              <button key={c} onClick={() => setCls(c)}
                className={`rounded-xl border p-3 text-left transition hover:border-primary ${c === cls ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Class {c}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {filled === TOTAL_DAYS && <CheckCircle2 className="h-3 w-3 text-secondary"/>}
                    {filled}/{TOTAL_DAYS}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-hero" style={{ width: `${pct}%` }}/>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}