import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  type Balance, type Commission, type Referral, type Teacher, type Withdrawal,
  balance, getCurrentTeacher, listCommissions, listReferrals, listWithdrawals,
  MIN_WITHDRAW, rankFrom, registerTeacher, requestWithdrawal,
} from "@/lib/teachers";
import { supabase } from "@/integrations/supabase/client";
import {
  Award, BadgeCheck, Banknote, Copy, GraduationCap, IndianRupee, LogOut, QrCode, Share2, ShieldAlert,
  Sparkles, TrendingUp, UserCheck, Users, Wallet,
} from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [
    { title: "Teacher Portal — Uyanix 30 Days Challenge" },
    { name: "description", content: "Earn ₹10–₹20 per verified student you refer to the Uyanix 30 Days Challenge." },
  ]}),
  component: TeacherPortalGuarded,
});

function TeacherPortalGuarded() {
  return <RequireAuth><TeacherPortal /></RequireAuth>;
}

function TeacherPortal() {
  const [teacher, setTeacher] = useState<Teacher | undefined>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void getCurrentTeacher().then(t => { setTeacher(t); setHydrated(true); });
  }, []);

  if (!hydrated) {
    return <div className="min-h-screen bg-background"><Header /><div className="mx-auto max-w-6xl px-4 py-20 sm:px-6" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {teacher
        ? <Dashboard teacher={teacher} onLogout={() => { void supabase.auth.signOut(); }} />
        : <AuthCard onAuth={(t) => setTeacher(t)} />}
      <Footer />
    </div>
  );
}

/* --------------------------- ONBOARDING --------------------------- */

function AuthCard({ onAuth }: { onAuth: (t: Teacher) => void }) {
  return (
    <section className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
      <div className="md:col-span-2 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Teacher Earnings Program
        </div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Refer karein, kamayein <span className="text-gradient">₹20/student</span> tak</h1>
        <p className="text-muted-foreground">Apne students ko Uyanix 30 Days Challenge mein invite karein aur paid signup pe seedha commission paayein. UPI ya bank withdraw — minimum ₹{MIN_WITHDRAW}.</p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-secondary"/> Sirf verified paid signup pe commission</li>
          <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-secondary"/> 1–50: ₹10 · 51–200: ₹15 · 200+: ₹20</li>
          <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-secondary"/> Real-time analytics + leaderboard</li>
          <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-secondary"/> Anti-fraud: duplicate / self-referral block</li>
        </ul>
      </div>
      <div className="md:col-span-3">
        <div className="rounded-3xl border border-border bg-card/70 p-6 shadow-card backdrop-blur">
          <div className="mb-5 inline-flex rounded-full border border-border bg-background p-1 text-xs font-semibold">
            <span className="rounded-full bg-gradient-hero px-4 py-1.5 text-primary-foreground">Teacher Profile</span>
          </div>
          <RegisterForm onAuth={onAuth} />
        </div>
      </div>
    </section>
  );
}

const fieldCls = "h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-ring/30 transition focus:border-primary focus:ring-2";

function RegisterForm({ onAuth }: { onAuth: (t: Teacher) => void }) {
  const [f, setF] = useState({ name: "", phone: "", kycType: "aadhaar", kycNumber: "", upi: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const upd = (k: string) => (e: any) => setF(s => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const t = await registerTeacher({
        name: f.name, phone: f.phone, upi: f.upi,
        kycType: f.kycType, kycNumber: f.kycNumber,
      });
      onAuth(t);
    } catch (e: any) { setErr(e.message || "Kuch galat ho gaya. Dobara try karein."); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full Name"><input className={fieldCls} required value={f.name} onChange={upd("name")} placeholder="Priya Verma"/></Field>
      <Field label="Phone (10-digit)"><input className={fieldCls} required value={f.phone} onChange={upd("phone")} pattern="[0-9]{10}"/></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="KYC Type">
          <select className={fieldCls} value={f.kycType} onChange={upd("kycType")}>
            <option value="aadhaar">Aadhaar</option><option value="pan">PAN</option>
          </select>
        </Field>
        <div className="sm:col-span-2"><Field label="KYC Number (optional)"><input className={fieldCls} value={f.kycNumber} onChange={upd("kycNumber")}/></Field></div>
      </div>
      <Field label="UPI ID (for payouts)"><input className={fieldCls} value={f.upi} onChange={upd("upi")} placeholder="name@upi"/></Field>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <button disabled={busy} className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50">Create Teacher Account</button>
      <p className="text-xs text-muted-foreground">Aapke login account se hi teacher profile banta hai. Approval admin team check ke baad 24h mein ho jaata hai.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}

/* --------------------------- DASHBOARD --------------------------- */

function Dashboard({ teacher, onLogout }: { teacher: Teacher; onLogout: () => void }) {
  const [refs, setRefs] = useState<Referral[]>([]);
  const [coms, setComs] = useState<Commission[]>([]);
  const [wds, setWds] = useState<Withdrawal[]>([]);
  const [bal, setBal] = useState<Balance>({ earned: 0, withdrawn: 0, available: 0 });

  const load = useCallback(async () => {
    const [r, c, w, b] = await Promise.all([
      listReferrals(teacher.id), listCommissions(teacher.id), listWithdrawals(teacher.id), balance(teacher.id),
    ]);
    setRefs(r); setComs(c); setWds(w); setBal(b);
  }, [teacher.id]);

  useEffect(() => { void load(); }, [load]);

  const link = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${teacher.code}` : `/register?ref=${teacher.code}`;
  const paidCount = refs.filter(x => x.paid && !x.refunded).length;
  const pendingCount = refs.filter(x => !x.paid).length;
  const conv = refs.length ? Math.round((paidCount / refs.length) * 100) : 0;
  const r = rankFrom(paidCount);

  // simple per-day chart for last 14 days
  const days = useMemo(() => {
    const arr: { d: string; v: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(); day.setDate(day.getDate() - i); day.setHours(0,0,0,0);
      const next = day.getTime() + 86400000;
      const v = refs.filter(x => {
        const ts = new Date(x.created_at).getTime();
        return ts >= day.getTime() && ts < next;
      }).length;
      arr.push({ d: day.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), v });
    }
    return arr;
  }, [refs]);
  const max = Math.max(1, ...days.map(d => d.v));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold">
            <Award className="h-3.5 w-3.5 text-primary"/> {r.rank}
            {teacher.status !== "approved" && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-600">Status: {teacher.status}</span>}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Hi, {teacher.name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground">Aapka referral code: <span className="font-mono font-semibold text-foreground">{teacher.code}</span></p>
        </div>
        <button onClick={onLogout} className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold">
          <LogOut className="h-4 w-4"/> Logout
        </button>
      </div>

      {teacher.status === "pending" && (
        <div className="mt-6 rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          Aapka account abhi <b>review mein</b> hai. Approval ke baad referrals pe commission start ho jaayega. Sample/demo data dashboard pe nahi dikhega.
        </div>
      )}

      {/* stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5"/>} label="Referred Students" value={String(refs.length)} hint={`${pendingCount} pending`}/>
        <Stat icon={<UserCheck className="h-5 w-5"/>} label="Paid & Active" value={String(paidCount)} hint={`${conv}% conversion`}/>
        <Stat icon={<Wallet className="h-5 w-5"/>} label="Available Balance" value={`₹${bal.available}`} hint={`Total earned ₹${bal.earned}`}/>
        <Stat icon={<TrendingUp className="h-5 w-5"/>} label="This Month" value={`₹${monthEarn(coms)}`} hint="From verified payouts"/>
      </div>

      {/* main grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <ReferralCard link={link} code={teacher.code}/>
        <RankCard rank={r.rank} next={r.next} progress={r.progress} active={paidCount}/>
        <WithdrawCard teacher={teacher} bal={bal} onDone={load}/>
      </div>

      {/* chart */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Daily Signups (last 14 days)</h2>
            <p className="text-xs text-muted-foreground">Track kab aapke students join karte hain</p>
          </div>
          <IndianRupee className="h-5 w-5 text-primary"/>
        </div>
        <div className="mt-6 flex h-40 items-end gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-gradient-hero transition-all" style={{ height: `${(d.v / max) * 100}%`, minHeight: 4 }} title={`${d.v} signups`}/>
              <div className="text-[10px] text-muted-foreground">{d.d.split(" ")[0]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* tables */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Recent Referrals" icon={<GraduationCap className="h-4 w-4"/>}>
          {refs.length === 0 && <Empty msg="Abhi tak koi referral nahi. Apna link share karein."/>}
          {refs.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Student</th><th className="py-2">Class</th><th className="py-2">Status</th><th className="py-2 text-right">Earned</th></tr></thead>
              <tbody>
                {refs.slice(0, 8).map(x => {
                  const c = coms.find(c => c.referral_id === x.id);
                  return (
                    <tr key={x.id} className="border-t border-border">
                      <td className="py-2"><div className="font-medium">{x.student_name}</div><div className="text-xs text-muted-foreground">{x.student_email}</div></td>
                      <td className="py-2">{x.student_class}</td>
                      <td className="py-2">{x.fraud_flags.length ? <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">flagged</span> : x.paid ? <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs text-secondary">paid</span> : <span className="text-xs">pending</span>}</td>
                      <td className="py-2 text-right font-semibold">{c?.amount ? `₹${c.amount}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="Withdrawal History" icon={<Banknote className="h-4 w-4"/>}>
          {wds.length === 0 && <Empty msg="Koi withdrawal request nahi."/>}
          {wds.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Date</th><th className="py-2">Method</th><th className="py-2">Status</th><th className="py-2 text-right">Amount</th></tr></thead>
              <tbody>
                {wds.map(w => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="py-2 text-xs">{new Date(w.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="py-2 uppercase text-xs">{w.method}</td>
                    <td className="py-2"><Badge tone={w.status === "paid" ? "secondary" : w.status === "rejected" ? "destructive" : "muted"}>{w.status}</Badge></td>
                    <td className="py-2 text-right font-semibold">₹{w.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-accent/40 p-5 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-primary"/>
          <p><b className="text-foreground">Compliance:</b> Self-referral, duplicate device/email/phone, refunded payments aur fake accounts pe commission cancel ho jaata hai. Chain / sub-affiliate referral allowed nahi hai. <Link to="/admin" className="underline">Admin</Link> manual review bhi karta hai.</p>
        </div>
      </div>
    </section>
  );
}

function monthEarn(coms: Commission[]) {
  const now = new Date(); const m = now.getMonth(); const y = now.getFullYear();
  return coms.filter(c => { const d = new Date(c.created_at); return d.getMonth() === m && d.getFullYear() === y && c.status !== "cancelled"; })
    .reduce((a, c) => a + Number(c.amount), 0);
}

/* ---- subcomponents ---- */
function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-card backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">{icon}{title}</div>
      {children}
    </div>
  );
}
function Empty({ msg }: { msg: string }) { return <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">{msg}</div>; }
function Badge({ tone, children }: { tone: "secondary" | "destructive" | "muted"; children: React.ReactNode }) {
  const cls = tone === "secondary" ? "bg-secondary/20 text-secondary" : tone === "destructive" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

function ReferralCard({ link, code }: { link: string; code: string }) {
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { QRCode.toDataURL(link, { margin: 1, width: 220 }).then(setQr).catch(() => {}); }, [link]);
  const msg = encodeURIComponent(`Join Uyanix 30 Days Challenge with my code ${code} → ${link}`);
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card lg:col-span-1">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold"><QrCode className="h-4 w-4"/> Your Referral</div>
      {qr && <img src={qr} alt="QR" className="mx-auto h-40 w-40 rounded-xl border border-border bg-white p-2"/>}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background p-2 text-xs">
        <span className="truncate font-mono">{link}</span>
        <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-primary"><Copy className="h-3 w-3"/>{copied ? "Copied" : "Copy"}</button>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
        <a target="_blank" rel="noreferrer" href={`https://wa.me/?text=${msg}`} className="rounded-lg border border-border py-2 text-center hover:bg-accent">WhatsApp</a>
        <a target="_blank" rel="noreferrer" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${msg}`} className="rounded-lg border border-border py-2 text-center hover:bg-accent">Telegram</a>
        <a target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} className="rounded-lg border border-border py-2 text-center hover:bg-accent">Facebook</a>
        <button onClick={() => { if (navigator.share) navigator.share({ url: link, title: "Uyanix 30 Days Challenge", text: "Join with my code " + code }); }}
          className="rounded-lg border border-border py-2 hover:bg-accent inline-flex items-center justify-center gap-1"><Share2 className="h-3 w-3"/>More</button>
      </div>
    </div>
  );
}

function RankCard({ rank, next, progress, active }: { rank: string; next?: string; progress: number; active: number }) {
  return (
    <div className="rounded-3xl border border-border bg-gradient-hero p-6 text-primary-foreground shadow-soft">
      <div className="text-xs font-semibold uppercase opacity-80">Current Rank</div>
      <div className="mt-1 text-2xl font-extrabold">{rank}</div>
      <div className="mt-1 text-xs opacity-80">{active} active paid students</div>
      {next && (
        <>
          <div className="mt-5 text-xs opacity-80">Next: <b>{next}</b></div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}/>
          </div>
        </>
      )}
      <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] opacity-90">
        <div>1–50<br/><b>₹10/student</b></div>
        <div>51–200<br/><b>₹15/student</b></div>
        <div>200+<br/><b>₹20/student</b></div>
      </div>
    </div>
  );
}

function WithdrawCard({ teacher, bal, onDone }: { teacher: Teacher; bal: Balance; onDone: () => void | Promise<void> }) {
  const [amount, setAmount] = useState(MIN_WITHDRAW);
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [destination, setDestination] = useState(teacher.upi || "");
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await requestWithdrawal(teacher.id, Number(amount), method, destination);
      setMsg({ k: "ok", t: "Withdrawal requested. Admin approval ke baad 1–3 din mein process." });
      await onDone();
    } catch (e: any) { setMsg({ k: "err", t: e.message || "Request fail ho gayi." }); }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2 text-sm font-bold"><Wallet className="h-4 w-4"/> Withdraw Earnings</div>
      <div className="mt-2 text-xs text-muted-foreground">Available: <b className="text-foreground">₹{bal.available}</b> · Min ₹{MIN_WITHDRAW}</div>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setMethod("upi")} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${method === "upi" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>UPI</button>
          <button type="button" onClick={() => setMethod("bank")} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${method === "bank" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Bank</button>
        </div>
        <input className={fieldCls} placeholder={method === "upi" ? "name@upi" : "Account number / IFSC"} value={destination} onChange={e => setDestination(e.target.value)} required/>
        <input className={fieldCls} type="number" min={MIN_WITHDRAW} step={50} value={amount} onChange={e => setAmount(Number(e.target.value))} required/>
        {msg && <p className={`text-xs ${msg.k === "ok" ? "text-secondary" : "text-destructive"}`}>{msg.t}</p>}
        <button disabled={bal.available < MIN_WITHDRAW} className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50">Request Payout</button>
      </form>
    </div>
  );
}
