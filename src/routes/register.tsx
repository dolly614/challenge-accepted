import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { ShieldCheck, Lock, BadgeCheck } from "lucide-react";
import { attributeReferral, getTeacherByCode } from "@/lib/teachers";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s.ref === "string" ? s.ref : undefined }),
  head: () => ({ meta: [{ title: "Register Free — 30 Days Learning Challenge" }, { name: "description", content: "FREE registration. Exam fee sirf tab jab aap challenge complete karein." }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const { ref } = Route.useSearch();
  const [form, setForm] = useState({ name: "", cls: "5", school: "", city: "", mobile: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [referrer, setReferrer] = useState<{ name: string; code: string } | null>(null);

  useEffect(() => {
    if (!ref) return;
    const t = getTeacherByCode(ref);
    if (t) setReferrer({ name: t.name, code: t.code });
  }, [ref]);

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(s => ({ ...s, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("student", JSON.stringify({ ...form, isPaid: false, registeredAt: Date.now() }));
      if (ref) {
        attributeReferral({
          code: ref,
          studentName: form.name, studentEmail: form.email,
          studentPhone: form.mobile, studentClass: form.cls, amount: 0,
        });
      }
    }
    setTimeout(() => nav({ to: "/dashboard" }), 900);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <h1 className="text-3xl font-bold sm:text-4xl">Free Registration 🚀</h1>
          <p className="mt-2 text-muted-foreground">Abhi register karo <b>FREE</b>. Exam fee sirf tab dena jab aap 15-day ya 30-day challenge complete karein.</p>
          {referrer && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-xs font-semibold text-secondary">
              <BadgeCheck className="h-4 w-4"/> Referred by <b className="text-foreground">{referrer.name}</b> · code {referrer.code}
            </div>
          )}
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
            <Field label="Student Full Name"><input required value={form.name} onChange={upd("name")} placeholder="Aarav Sharma" className={fieldCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Class">
                <select value={form.cls} onChange={upd("cls")} className={fieldCls}>
                  {Array.from({ length: 12 }).map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
                </select>
              </Field>
              <Field label="City"><input required value={form.city} onChange={upd("city")} placeholder="Mumbai" className={fieldCls}/></Field>
            </div>
            <Field label="School Name"><input required value={form.school} onChange={upd("school")} placeholder="Delhi Public School" className={fieldCls}/></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Parent Mobile"><input required type="tel" pattern="[0-9]{10}" value={form.mobile} onChange={upd("mobile")} placeholder="9876543210" className={fieldCls}/></Field>
              <Field label="Parent Email"><input required type="email" value={form.email} onChange={upd("email")} placeholder="parent@email.com" className={fieldCls}/></Field>
            </div>
            <Field label="Password"><input required type="password" minLength={6} value={form.password} onChange={upd("password")} placeholder="Min 6 characters" className={fieldCls}/></Field>
            <button disabled={loading} className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.01] disabled:opacity-60">
              <BadgeCheck className="h-4 w-4"/> {loading ? "Creating account..." : "Register FREE & Start Challenge"}
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3"/> Koi payment nahi. Exam time pe pay karein.
            </div>
          </form>
        </div>
        <aside className="md:col-span-2">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="text-sm font-semibold text-primary">Pay-Later Pricing</div>
              <div className="mt-4 flex justify-between text-sm"><span>Registration</span><span className="font-bold text-secondary">FREE</span></div>
              <div className="mt-2 flex justify-between text-sm"><span>15-Day Mid Exam (optional)</span><span>₹49</span></div>
              <div className="mt-2 flex justify-between text-sm"><span>30-Day Final Exam</span><span>₹99</span></div>
              <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">Exam fee sirf tab jab aap exam dena chaho. Challenge complete karne ke baad pay karein.</div>
            </div>
            <div className="rounded-3xl border border-border bg-accent/60 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-secondary"/> Aapko milega:</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>✅ FREE registration — abhi shuru karein</li>
                <li>✅ 15-day Mid exam ya 30-day Final exam — choose karo</li>
                <li>✅ Exam fee sirf challenge complete karne ke baad</li>
                <li>✅ Digital certificate</li>
                <li>✅ Cash prize chance ₹2,000 tak</li>
                <li>✅ Special participation gift</li>
              </ul>
            </div>
          </div>
        </aside>
      </section>
      <Footer />
    </div>
  );
}

const fieldCls = "h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-ring/30 transition focus:border-primary focus:ring-2";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
