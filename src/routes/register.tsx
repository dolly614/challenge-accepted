import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useState } from "react";
import { ShieldCheck, CreditCard, Lock } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — 30 Days Learning Challenge" }, { name: "description", content: "Apna registration sirf ₹99 mein complete karein." }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", cls: "5", school: "", city: "", mobile: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(s => ({ ...s, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("student", JSON.stringify({ ...form, isPaid: true, registeredAt: Date.now() }));
    }
    setTimeout(() => nav({ to: "/dashboard" }), 900);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <h1 className="text-3xl font-bold sm:text-4xl">Apna account banao 🚀</h1>
          <p className="mt-2 text-muted-foreground">Registration sirf ₹99 — 30 din ka content + final exam + certificate.</p>
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
              <CreditCard className="h-4 w-4"/> {loading ? "Processing..." : "Pay ₹99 & Register"}
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3"/> Secured by Razorpay (test mode)
            </div>
          </form>
        </div>
        <aside className="md:col-span-2">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="text-sm font-semibold text-primary">Order Summary</div>
              <div className="mt-4 flex justify-between text-sm"><span>30 Days Challenge Access</span><span>₹99</span></div>
              <div className="mt-2 flex justify-between text-sm text-muted-foreground"><span>Taxes</span><span>Included</span></div>
              <div className="mt-4 border-t border-border pt-4 flex justify-between font-bold"><span>Total</span><span>₹99</span></div>
            </div>
            <div className="rounded-3xl border border-border bg-accent/60 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-secondary"/> Aapko milega:</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>✅ 30 din ka daily learning content</li>
                <li>✅ Final exam (30 MCQs)</li>
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
