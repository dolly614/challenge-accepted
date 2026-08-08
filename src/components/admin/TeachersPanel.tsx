import { useCallback, useEffect, useState } from "react";
import {
  balance, listFraud, listTeachers, listWithdrawals, setWithdrawalStatus, updateTeacher,
  type Balance, type FraudLog, type Teacher, type Withdrawal,
} from "@/lib/teachers";
import { Banknote, ShieldAlert, UserCheck, Users } from "lucide-react";

export function TeachersPanel() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [wds, setWds] = useState<Withdrawal[]>([]);
  const [fraud, setFraud] = useState<FraudLog[]>([]);
  const [balances, setBalances] = useState<Record<string, Balance>>({});

  const refresh = useCallback(async () => {
    const [t, w, f] = await Promise.all([listTeachers(), listWithdrawals(), listFraud()]);
    setTeachers(t); setWds(w); setFraud(f);
    const entries = await Promise.all(t.map(async x => [x.id, await balance(x.id)] as const));
    setBalances(Object.fromEntries(entries));
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const total = teachers.length;
  const approved = teachers.filter(t => t.status === "approved").length;
  const pending = teachers.filter(t => t.status === "pending").length;
  const totalPaid = wds.filter(w => w.status === "paid").reduce((a, w) => a + Number(w.amount), 0);

  return (
    <div className="mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teacher Referral System</h2>
          <p className="text-sm text-muted-foreground">Approvals, withdrawals aur fraud alerts manage karein.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Mini icon={<Users className="h-5 w-5"/>} label="Total Teachers" value={String(total)}/>
        <Mini icon={<UserCheck className="h-5 w-5"/>} label="Approved" value={String(approved)} hint={`${pending} pending`}/>
        <Mini icon={<Banknote className="h-5 w-5"/>} label="Commissions Paid" value={`₹${totalPaid}`}/>
        <Mini icon={<ShieldAlert className="h-5 w-5"/>} label="Fraud Alerts" value={String(fraud.length)}/>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-3 text-lg font-bold">Teachers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr>
              <th className="px-2 py-2">Name</th><th className="px-2 py-2">Code</th><th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Balance</th><th className="px-2 py-2">Risk</th><th className="px-2 py-2 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {teachers.map(t => {
                const b = balances[t.id] ?? { earned: 0, withdrawn: 0, available: 0 };
                return (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-2 py-2"><div className="font-medium">{t.name}</div><div className="text-xs text-muted-foreground">{t.email}</div></td>
                    <td className="px-2 py-2 font-mono text-xs">{t.code}</td>
                    <td className="px-2 py-2"><StatusPill s={t.status}/></td>
                    <td className="px-2 py-2">₹{b.available} <span className="text-xs text-muted-foreground">/ ₹{b.earned}</span></td>
                    <td className="px-2 py-2">{t.fraud_score > 40 ? <span className="text-destructive font-semibold">{t.fraud_score}</span> : t.fraud_score}</td>
                    <td className="px-2 py-2 text-right">
                      <div className="inline-flex gap-1">
                        {t.status !== "approved" && <Btn onClick={() => { void updateTeacher(t.id, { status: "approved" }).then(refresh); }}>Approve</Btn>}
                        {t.status !== "rejected" && <Btn tone="warn" onClick={() => { void updateTeacher(t.id, { status: "rejected" }).then(refresh); }}>Reject</Btn>}
                        {t.status === "approved" && <Btn tone="warn" onClick={() => { void updateTeacher(t.id, { status: "suspended" }).then(refresh); }}>Suspend</Btn>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {teachers.length === 0 && <tr><td colSpan={6} className="px-2 py-6 text-center text-xs text-muted-foreground">Koi teacher abhi tak nahi.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-3 text-lg font-bold">Withdrawal Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr>
              <th className="px-2 py-2">Date</th><th className="px-2 py-2">Teacher</th><th className="px-2 py-2">Method</th>
              <th className="px-2 py-2">Destination</th><th className="px-2 py-2">Amount</th><th className="px-2 py-2">Status</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {wds.map(w => {
                const t = teachers.find(x => x.id === w.teacher_id);
                return (
                  <tr key={w.id} className="border-t border-border">
                    <td className="px-2 py-2 text-xs">{new Date(w.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-2 py-2">{t?.name || w.teacher_id}</td>
                    <td className="px-2 py-2 uppercase text-xs">{w.method}</td>
                    <td className="px-2 py-2 font-mono text-xs">{w.destination}</td>
                    <td className="px-2 py-2 font-semibold">₹{w.amount}</td>
                    <td className="px-2 py-2 text-xs">{w.status}</td>
                    <td className="px-2 py-2 text-right">
                      <div className="inline-flex gap-1">
                        {w.status === "requested" && <Btn onClick={() => { void setWithdrawalStatus(w.id, "approved").then(refresh); }}>Approve</Btn>}
                        {w.status !== "paid" && w.status !== "rejected" && <Btn onClick={() => { void setWithdrawalStatus(w.id, "paid").then(refresh); }}>Mark Paid</Btn>}
                        {w.status !== "rejected" && w.status !== "paid" && <Btn tone="warn" onClick={() => { void setWithdrawalStatus(w.id, "rejected").then(refresh); }}>Reject</Btn>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {wds.length === 0 && <tr><td colSpan={7} className="px-2 py-6 text-center text-xs text-muted-foreground">Koi withdrawal request nahi.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-destructive"><ShieldAlert className="h-5 w-5"/> Fraud Log</h3>
        {fraud.length === 0 ? <p className="text-xs text-muted-foreground">All clear ✅</p> : (
          <ul className="space-y-2 text-sm">
            {fraud.map(f => {
              const t = teachers.find(x => x.id === f.teacher_id);
              return (
                <li key={f.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{f.kind}</div>
                    <div className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString("en-IN")}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{t?.name || f.teacher_id} — {f.detail}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Mini({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function StatusPill({ s }: { s: string }) {
  const tone = s === "approved" ? "bg-secondary/20 text-secondary"
    : s === "rejected" || s === "suspended" ? "bg-destructive/15 text-destructive"
    : "bg-amber-500/15 text-amber-600";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{s}</span>;
}

function Btn({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone?: "warn" }) {
  const cls = tone === "warn" ? "border-destructive/40 text-destructive hover:bg-destructive/10" : "border-border hover:bg-accent";
  return <button onClick={onClick} className={`rounded-md border px-2 py-1 text-xs font-semibold ${cls}`}>{children}</button>;
}
