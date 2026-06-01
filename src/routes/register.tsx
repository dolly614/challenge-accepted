import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { ShieldCheck, Lock, BadgeCheck, IdCard, Upload, CheckCircle2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { attributeReferral, getTeacherByCode } from "@/lib/teachers";
import { BrandMark } from "@/components/site/BrandMark";
import Tesseract from "tesseract.js";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s.ref === "string" ? s.ref : undefined }),
  head: () => ({ meta: [{ title: "Register Free — Uyanix 30 Days Challenge" }, { name: "description", content: "FREE registration. Exam fee sirf tab jab aap challenge complete karein." }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const { ref } = Route.useSearch();
  const [form, setForm] = useState({ name: "", cls: "5", school: "", city: "", mobile: "", email: "", password: "" });
  const [idCard, setIdCard] = useState<{ name: string; dataUrl: string } | null>(null);
  const [idError, setIdError] = useState<string | null>(null);
  const [idVerifying, setIdVerifying] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referrer, setReferrer] = useState<{ name: string; code: string } | null>(null);

  useEffect(() => {
    if (!ref) return;
    const t = getTeacherByCode(ref);
    if (t) setReferrer({ name: t.name, code: t.code });
  }, [ref]);

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(s => ({ ...s, [k]: e.target.value }));

  async function onIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setIdError(null);
    setIdVerified(false);
    setIdCard(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setIdError("Sirf PNG / JPG / WEBP image upload karein.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setIdError("File 5MB se kam honi chahiye.");
      return;
    }
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
    setIdVerifying(true);
    try {
      const { data } = await Tesseract.recognize(dataUrl, "eng");
      const text = (data.text || "").replace(/\s+/g, " ");
      // Find all 4-digit years in the document
      const years = (text.match(/\b(19|20)\d{2}\b/g) || []).map(Number);
      const VALID_YEARS = [2024, 2025, 2026, 2027];
      const hasValid = years.some(y => VALID_YEARS.includes(y) || y > 2027);
      const hasOld = years.some(y => y <= 2023);
      if (years.length === 0) {
        setIdError("ID card par koi valid year (2024–2027) nahi mila. Kripya saaf ID card upload karein.");
      } else if (!hasValid && hasOld) {
        const maxYr = Math.max(...years);
        setIdError(`Ye ID card invalid hai ❌ — ispe purana year (${maxYr}) likha hai. Sirf 2024 / 2025 / 2026 / 2027 wala valid ID card hi accept hoga.`);
      } else if (!hasValid) {
        setIdError("Is ID card par valid year (2024 / 2025 / 2026 / 2027) detect nahi ho paya. Kripya naya ID card upload karein.");
      } else {
        setIdCard({ name: file.name, dataUrl });
        setIdVerified(true);
      }
    } catch {
      setIdError("ID card verify nahi ho paya. Dobara try karein ya behtar quality ka photo upload karein.");
    } finally {
      setIdVerifying(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!idCard) {
      setIdError("Verification ke liye ID card ka photo upload karein.");
      return;
    }
    if (!idVerified) {
      setIdError("ID card verify nahi hua. Valid (2026/2027) ID card upload karein.");
      return;
    }
    setLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("student", JSON.stringify({ ...form, idCard, isPaid: false, registeredAt: Date.now() }));
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
          <div className="flex items-center gap-3">
            <BrandMark size={56} />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">Uyanix 30 Days Challenge</div>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Free Registration 🚀</h1>
            </div>
          </div>
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
            <Field label="ID Card Photo (Verification)">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-input bg-background px-4 py-3 text-sm transition hover:border-primary">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="h-4 w-4 text-primary" />
                  {idVerifying ? (
                    <span className="flex items-center gap-1.5 text-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Verifying ID card…</span>
                  ) : idCard ? (
                    <span className="flex items-center gap-1.5 text-foreground"><CheckCircle2 className="h-4 w-4 text-secondary" /> {idCard.name}</span>
                  ) : (
                    <>School ID / Aadhaar / Birth Certificate</>
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Upload className="h-3 w-3" /> {idCard ? "Change" : "Upload"}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={idVerifying} onChange={onIdUpload} />
              </label>
              {idCard && (
                <img src={idCard.dataUrl} alt="ID preview" className="mt-3 h-28 w-auto rounded-lg border border-border object-cover" />
              )}
              {idVerified && !idError && (
                <p className="mt-1.5 text-xs font-medium text-secondary">✅ ID card verified — valid year detected.</p>
              )}
              {idError && <p className="mt-1.5 text-xs font-medium text-destructive">{idError}</p>}
              <p className="mt-1.5 text-[11px] text-muted-foreground">2024, 2025, 2026 ya 2027 wala ID card accept hoga. 2023 ya usse purana invalid maana jayega. JPG / PNG / WEBP, max 5MB.</p>
            </Field>
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
              <div className="mt-2 flex justify-between text-sm"><span>15-Day Mid Exam (optional)</span><span>₹199</span></div>
              <div className="mt-2 flex justify-between text-sm"><span>30-Day Final Exam</span><span>₹199</span></div>
              <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">Exam fee sirf tab jab aap exam dena chaho. Challenge complete karne ke baad pay karein.</div>
            </div>
            <div className="rounded-3xl border border-border bg-accent/60 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-secondary"/> Aapko milega:</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>✅ FREE registration — abhi shuru karein</li>
                <li>✅ 15-day Mid exam ya 30-day Final exam — choose karo</li>
                <li>✅ Exam fee sirf challenge complete karne ke baad</li>
                <li>✅ Digital certificate</li>
                <li>✅ Top 3 winners win Laptop, Tablet & Phone</li>
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
