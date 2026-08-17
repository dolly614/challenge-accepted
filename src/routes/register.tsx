import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { ShieldCheck, Lock, BadgeCheck, IdCard, Upload, CheckCircle2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { attributeReferral, getTeacherByCode } from "@/lib/teachers";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/site/BrandMark";
import Tesseract from "tesseract.js";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): { ref?: string } => (typeof s.ref === "string" ? { ref: s.ref } : {}),
  head: () => ({ meta: [{ title: "Register Free — Uyanix 30 Days Challenge" }, { name: "description", content: "FREE registration. Exam fee sirf tab jab aap challenge complete karein." }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const { ref } = Route.useSearch();
  const [form, setForm] = useState({ name: "", fatherName: "", cls: "5", school: "", city: "", mobile: "", email: "", password: "" });
  const [idCard, setIdCard] = useState<{ name: string; dataUrl: string } | null>(null);
  const [studentPhoto, setStudentPhoto] = useState<{ name: string; dataUrl: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);
  const [idVerifying, setIdVerifying] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [idOcrText, setIdOcrText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [referrer, setReferrer] = useState<{ name: string; code: string } | null>(null);

  useEffect(() => {
    if (!ref) return;
    void getTeacherByCode(ref).then(t => { if (t) setReferrer({ name: t.name, code: t.code }); });
  }, [ref]);

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(s => ({ ...s, [k]: e.target.value }));

  async function onIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setIdError(null);
    setIdVerified(false);
    setIdCard(null);
    setIdOcrText("");
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
      setIdOcrText(text);
      setIdCard({ name: file.name, dataUrl });
      setIdVerified(true);
    } catch {
      setIdError("ID card verify nahi ho paya. Dobara try karein ya behtar quality ka photo upload karein.");
    } finally {
      setIdVerifying(false);
    }
  }

  async function onPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError(null);
    setStudentPhoto(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setPhotoError("Sirf PNG / JPG / WEBP image upload karein.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("File 5MB se kam honi chahiye.");
      return;
    }
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
    setStudentPhoto({ name: file.name, dataUrl });
  }

  function tokensMatch(value: string, ocr: string): boolean {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    const ocrN = norm(ocr);
    const tokens = norm(value).split(" ").filter(t => t.length >= 3);
    if (tokens.length === 0) return false;
    const matched = tokens.filter(t => ocrN.includes(t)).length;
    return matched / tokens.length >= 0.6;
  }

  const [submitError, setSubmitError] = useState<string | null>(null);

  async function uploadDoc(userId: string, kind: "id-card" | "photo", dataUrl: string, fileName: string) {
    const blob = await (await fetch(dataUrl)).blob();
    const ext = (fileName.split(".").pop() || "jpg").toLowerCase();
    await supabase.storage
      .from("student-documents")
      .upload(`${userId}/${kind}.${ext}`, blob, { upsert: true, contentType: blob.type });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!idCard) {
      setIdError("Verification ke liye ID card ka photo upload karein.");
      return;
    }
    if (!idVerified) {
      setIdError("ID card verify nahi hua. Kripya saaf ID card upload karein.");
      return;
    }
    if (!studentPhoto) {
      setPhotoError("Apni ek clear photo upload karein.");
      return;
    }
    const nameOk = tokensMatch(form.name, idOcrText);
    const fatherOk = tokensMatch(form.fatherName, idOcrText);
    const schoolOk = tokensMatch(form.school, idOcrText);
    if (!nameOk || !fatherOk || !schoolOk) {
      const missing = [
        !nameOk && "Student Name",
        !fatherOk && "Father Name",
        !schoolOk && "School Name",
      ].filter(Boolean).join(", ");
      setIdError(`Form ki details ID card se match nahi ho rahi ❌ — mismatch: ${missing}. Bilkul wahi details daalein jo ID card par likhi hain.`);
      return;
    }
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: form.name, class_level: form.cls },
        },
      });
      if (signUpError) throw signUpError;

      const userId = signUpData.user?.id;
      if (userId && signUpData.session) {
        await uploadDoc(userId, "id-card", idCard.dataUrl, idCard.name);
        await uploadDoc(userId, "photo", studentPhoto.dataUrl, studentPhoto.name);
        await supabase.from("profiles").update({
          full_name: form.name,
          class_level: Number(form.cls),
          school: form.school,
          phone: form.mobile,
        }).eq("id", userId);
      }

      if (ref) {
        await attributeReferral({
          code: ref,
          studentName: form.name, studentEmail: form.email,
          studentPhone: form.mobile, studentClass: form.cls, amount: 0,
        });
      }

      // No student data is cached in the browser — everything lives in the RLS-protected profiles table.
      setStep(3);
    } catch (err: any) {
      setSubmitError(err?.message || "Registration fail ho gaya. Dobara try karein.");
    } finally {
      setLoading(false);
    }
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
            <Field label="Father's Full Name"><input required value={form.fatherName} onChange={upd("fatherName")} placeholder="Rajesh Sharma" className={fieldCls} /></Field>
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
                <p className="mt-1.5 text-xs font-medium text-secondary">✅ ID card verified. Ab form ki details ID se match honi chahiye.</p>
              )}
              {idError && <p className="mt-1.5 text-xs font-medium text-destructive">{idError}</p>}
              <p className="mt-1.5 text-[11px] text-muted-foreground">ID card par likha Student Name, Father Name aur School Name form se match hona chahiye. JPG / PNG / WEBP, max 5MB.</p>
            </Field>
            <Field label="Student Photo (Clear face photo)">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-input bg-background px-4 py-3 text-sm transition hover:border-primary">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="h-4 w-4 text-primary" />
                  {studentPhoto ? (
                    <span className="flex items-center gap-1.5 text-foreground"><CheckCircle2 className="h-4 w-4 text-secondary" /> {studentPhoto.name}</span>
                  ) : (
                    <>Apni recent clear photo upload karein</>
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Upload className="h-3 w-3" /> {studentPhoto ? "Change" : "Upload"}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPhotoUpload} />
              </label>
              {studentPhoto && (
                <img src={studentPhoto.dataUrl} alt="Student preview" className="mt-3 h-28 w-28 rounded-lg border border-border object-cover" />
              )}
              {photoError && <p className="mt-1.5 text-xs font-medium text-destructive">{photoError}</p>}
            </Field>
            <button disabled={loading} className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.01] disabled:opacity-60">
              <BadgeCheck className="h-4 w-4"/> {loading ? "Creating account..." : "Register FREE & Start Challenge"}
            </button>
            {submitError && <p className="text-center text-xs font-medium text-destructive">{submitError}</p>}
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
