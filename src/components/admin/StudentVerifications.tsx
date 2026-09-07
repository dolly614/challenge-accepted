import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
import {
  listPendingVerifications, reviewStudentVerification, getSignedFileUrl, type Student,
} from "@/lib/registration";

export function StudentVerifications() {
  const [rows, setRows] = useState<Student[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try { setRows(await listPendingVerifications()); } catch { setRows([]); }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function open(bucket: "verification-documents" | "student-photos", path: string) {
    const url = await getSignedFileUrl(bucket, path);
    window.open(url, "_blank", "noopener");
  }

  async function review(s: Student, approve: boolean) {
    setBusy(s.id);
    try {
      await reviewStudentVerification(s.id, approve, reason[s.id]);
      setRows(r => r.filter(x => x.id !== s.id));
    } finally { setBusy(null); }
  }

  return (
    <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Student ID Verifications</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{rows.length} pending</span>
      </div>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Abhi koi pending verification nahi hai.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map(s => (
            <div key={s.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{s.student_name || "—"} · Class {s.class || "—"}</div>
                  <div className="text-xs text-muted-foreground">{s.school_name} · {s.mobile_number} {s.email ? `· ${s.email}` : ""}</div>
                </div>
                <div className="flex gap-2">
                  {s.document_url && (
                    <button onClick={() => void open("verification-documents", s.document_url!)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold">
                      <FileText className="h-3 w-3" /> Document
                    </button>
                  )}
                  {s.photo_url && (
                    <button onClick={() => void open("student-photos", s.photo_url!)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold">
                      <FileText className="h-3 w-3" /> Photo
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={reason[s.id] ?? ""}
                  onChange={(e) => setReason(r => ({ ...r, [s.id]: e.target.value }))}
                  placeholder="Rejection reason (optional)"
                  className="h-9 flex-1 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
                <button disabled={busy === s.id} onClick={() => void review(s, true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-secondary px-4 text-xs font-semibold text-secondary-foreground disabled:opacity-60">
                  <CheckCircle2 className="h-3 w-3" /> Approve
                </button>
                <button disabled={busy === s.id} onClick={() => void review(s, false)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-destructive px-4 text-xs font-semibold text-destructive-foreground disabled:opacity-60">
                  <XCircle className="h-3 w-3" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
