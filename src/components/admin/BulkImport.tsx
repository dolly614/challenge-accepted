import { useMemo, useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, FileArchive, Trash2, RotateCcw, RefreshCw } from "lucide-react";
import {
  extractPdfTextFromBuffer,
  parseDayFromFilename,
  titleFromFilename,
  saveChapter,
  getChapter,
  deleteChapter,
  deleteClassChapters,
  resetAllChapters,
} from "@/lib/chapters";
import { TOTAL_DAYS } from "@/lib/data/challenge";

type RowStatus = "pending" | "ok" | "skip" | "error";
type Row = { name: string; day: number | null; status: RowStatus; message?: string; chars?: number };

export function BulkImport({ onDone }: { onDone?: () => void }) {
  const [cls, setCls] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [overwrite, setOverwrite] = useState(true);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const pdfRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const reimportRef = useRef<HTMLInputElement>(null);

  function update(name: string, patch: Partial<Row>) {
    setRows(prev => prev.map(r => (r.name === name ? { ...r, ...patch } : r)));
  }

  async function processEntries(entries: { name: string; buffer: ArrayBuffer }[]) {
    const seenDays = new Set<number>();
    const initial: Row[] = entries.map(e => {
      const day = parseDayFromFilename(e.name);
      let status: RowStatus = "pending";
      let message: string | undefined;
      if (!day) { status = "skip"; message = "Day number filename mein nahi mila"; }
      else if (seenDays.has(day)) { status = "skip"; message = `Day ${day} duplicate`; }
      else if (!overwrite && getChapter(cls, day)) { status = "skip"; message = `Day ${day} pehle se hai (overwrite off)`; }
      else seenDays.add(day);
      return { name: e.name, day, status, message };
    });
    setRows(initial);

    for (const e of entries) {
      const row = initial.find(r => r.name === e.name)!;
      if (row.status === "skip" || !row.day) continue;
      try {
        const text = await extractPdfTextFromBuffer(e.buffer);
        if (!text) throw new Error("Empty PDF text");
        const title = titleFromFilename(e.name) || `Day ${row.day}`;
        saveChapter(cls, row.day, text, title);
        update(e.name, { status: "ok", chars: text.length, message: `Saved ✓ (${title})` });
      } catch (err: any) {
        update(e.name, { status: "error", message: err?.message || String(err) });
      }
    }
    onDone?.();
  }

  async function handlePdfs(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const entries = await Promise.all(
        Array.from(files).map(async f => ({ name: f.name, buffer: await f.arrayBuffer() })),
      );
      await processEntries(entries);
    } finally {
      setBusy(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
  }

  async function handleZip(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const entries: { name: string; buffer: ArrayBuffer }[] = [];
      const tasks: Promise<void>[] = [];
      zip.forEach((path, entry) => {
        if (entry.dir) return;
        if (!/\.pdf$/i.test(path)) return;
        const name = path.split("/").pop() || path;
        tasks.push(entry.async("arraybuffer").then(buf => { entries.push({ name, buffer: buf }); }));
      });
      await Promise.all(tasks);
      if (!entries.length) {
        setRows([{ name: file.name, day: null, status: "error", message: "ZIP mein koi PDF nahi mila" }]);
        return;
      }
      entries.sort((a, b) => a.name.localeCompare(b.name));
      await processEntries(entries);
    } catch (e: any) {
      setRows([{ name: file.name, day: null, status: "error", message: e?.message || String(e) }]);
    } finally {
      setBusy(false);
      if (zipRef.current) zipRef.current.value = "";
    }
  }

  const okCount = rows.filter(r => r.status === "ok").length;
  const failedDays = useMemo(
    () => Array.from(new Set(rows.filter(r => r.status === "error" && r.day).map(r => r.day as number))),
    [rows],
  );

  function toggleDay(d: number) {
    setSelectedDays(prev => {
      const n = new Set(prev);
      if (n.has(d)) n.delete(d); else n.add(d);
      return n;
    });
  }

  async function handleReimport(files: FileList | null) {
    if (!files || !files.length) return;
    const allow = new Set<number>([...failedDays, ...selectedDays]);
    if (!allow.size) {
      alert("Pehle failed rows ya days select karo (re-import ke liye).");
      return;
    }
    setBusy(true);
    try {
      const all = await Promise.all(
        Array.from(files).map(async f => ({ name: f.name, buffer: await f.arrayBuffer() })),
      );
      const filtered = all.filter(e => {
        const d = parseDayFromFilename(e.name);
        return d && allow.has(d);
      });
      if (!filtered.length) {
        alert("In files mein selected/failed days ke liye koi PDF nahi mili.");
        return;
      }
      await processEntries(filtered);
      setSelectedDays(new Set());
    } finally {
      setBusy(false);
      if (reimportRef.current) reimportRef.current.value = "";
    }
  }

  function handleDeleteClass() {
    if (!confirm(`Class ${cls} ke saare chapters delete karein? Yeh undo nahi hoga.`)) return;
    const n = deleteClassChapters(cls);
    setRows([]); setSelectedDays(new Set());
    alert(`✓ Class ${cls} se ${n} chapters delete ho gaye.`);
    onDone?.();
  }

  function handleResetAll() {
    if (!confirm("SAARE classes ke chapters delete karein? Yeh undo nahi hoga.")) return;
    resetAllChapters();
    setRows([]); setSelectedDays(new Set());
    alert("✓ Sab chapters reset ho gaye.");
    onDone?.();
  }

  return (
    <div className="mt-8 rounded-3xl border-2 border-dashed border-primary/30 bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <FileArchive className="h-5 w-5 text-primary"/>
        <h2 className="text-xl font-bold">Bulk Import — Pure 30 Days Ek Saath</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Ek class select karo, fir 30 PDFs ek saath upload karo ya ek ZIP daalo.
        Filename se day number auto-detect hota hai (e.g. <code className="rounded bg-muted px-1">day-01.pdf</code>,
        <code className="ml-1 rounded bg-muted px-1">Day 5 - Algebra.pdf</code>,
        <code className="ml-1 rounded bg-muted px-1">05_intro.pdf</code>).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Class</label>
          <select value={cls} onChange={e => setCls(parseInt(e.target.value))}
            className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(c => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
        </div>
        <label className={`flex h-11 cursor-pointer items-center justify-center gap-2 self-end rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft ${busy ? "pointer-events-none opacity-60" : "hover:opacity-90"}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <UploadCloud className="h-4 w-4"/>}
          Upload PDFs (multi-select)
          <input ref={pdfRef} type="file" accept="application/pdf" multiple className="hidden"
            onChange={e => handlePdfs(e.target.files)}/>
        </label>
        <label className={`flex h-11 cursor-pointer items-center justify-center gap-2 self-end rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground shadow-soft ${busy ? "pointer-events-none opacity-60" : "hover:opacity-90"}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileArchive className="h-4 w-4"/>}
          Upload ZIP
          <input ref={zipRef} type="file" accept=".zip,application/zip" className="hidden"
            onChange={e => handleZip(e.target.files?.[0] || null)}/>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} />
          Overwrite existing days
        </label>
        <button type="button" onClick={handleDeleteClass}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-destructive px-4 text-xs font-semibold text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5"/> Delete Class {cls} Chapters
        </button>
        <button type="button" onClick={handleResetAll}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-destructive px-4 text-xs font-semibold text-destructive hover:bg-destructive/10">
          <RotateCcw className="h-3.5 w-3.5"/> Reset All Classes
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold">Selective Re-import — Class {cls}</div>
          <div className="text-xs text-muted-foreground">
            {failedDays.length > 0 && <>Failed: {failedDays.join(", ")} • </>}
            Selected: {selectedDays.size}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-10">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map(d => {
            const present = !!getChapter(cls, d);
            const failed = failedDays.includes(d);
            const sel = selectedDays.has(d);
            return (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`h-9 rounded-lg border text-xs font-semibold transition ${
                  sel ? "border-primary bg-primary text-primary-foreground"
                    : failed ? "border-destructive text-destructive"
                    : present ? "border-secondary/50 bg-secondary/10 text-secondary"
                    : "border-border text-muted-foreground"
                }`}
                title={`Day ${d}${present ? " • present" : ""}${failed ? " • failed" : ""}`}>
                {d}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-soft ${busy ? "pointer-events-none opacity-60" : "hover:opacity-90"}`}>
            <RefreshCw className="h-3.5 w-3.5"/> Re-import Selected/Failed
            <input ref={reimportRef} type="file" accept="application/pdf" multiple className="hidden"
              onChange={e => handleReimport(e.target.files)} />
          </label>
          {selectedDays.size > 0 && (
            <>
              <button type="button" onClick={() => {
                if (!confirm(`${selectedDays.size} selected days delete karein?`)) return;
                selectedDays.forEach(d => deleteChapter(cls, d));
                setSelectedDays(new Set());
                onDone?.();
              }}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-destructive px-4 text-xs font-semibold text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5"/> Delete Selected
              </button>
              <button type="button" onClick={() => setSelectedDays(new Set())}
                className="text-xs font-medium text-muted-foreground underline">
                Clear selection
              </button>
            </>
          )}
          {failedDays.length > 0 && (
            <button type="button" onClick={() => setSelectedDays(new Set(failedDays))}
              className="text-xs font-medium text-destructive underline">
              Select failed ({failedDays.length})
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Tip: Day boxes click karke select karo, fir sirf un days ke PDFs upload karo. Filename se day match hoga (e.g. <code className="rounded bg-muted px-1">day-07.pdf</code>).
        </p>
      </div>

      {rows.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
          <div className="flex items-center justify-between bg-muted/40 px-4 py-2 text-xs font-semibold">
            <span>{rows.length} files • {okCount} saved • Class {cls}</span>
            <span className="text-muted-foreground">{okCount}/{TOTAL_DAYS} days covered</span>
          </div>
          <ul className="max-h-72 divide-y divide-border overflow-y-auto text-sm">
            {rows.map(r => (
              <li key={r.name} className="flex items-center gap-3 px-4 py-2">
                <StatusIcon s={r.status}/>
                <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.day ? `Day ${r.day}` : "—"}
                </span>
                <span className="hidden shrink-0 truncate text-xs text-muted-foreground sm:inline-block sm:max-w-[40%]">
                  {r.message || (r.chars ? `${r.chars} chars` : "")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ s }: { s: RowStatus }) {
  if (s === "ok") return <CheckCircle2 className="h-4 w-4 text-secondary"/>;
  if (s === "error") return <AlertCircle className="h-4 w-4 text-destructive"/>;
  if (s === "skip") return <AlertCircle className="h-4 w-4 text-muted-foreground"/>;
  return <Loader2 className="h-4 w-4 animate-spin text-primary"/>;
}