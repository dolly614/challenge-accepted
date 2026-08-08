// Teacher Referral & Earnings — backed by Lovable Cloud (Postgres + RLS).
// No credentials, KYC numbers, bank details or balances are stored in the browser.
import { supabase } from "@/integrations/supabase/client";

export type TeacherStatus = "pending" | "approved" | "rejected" | "suspended";
export type Rank = "Beginner Teacher" | "Active Mentor" | "Gold Mentor" | "Platinum Mentor" | "Elite Educator";

export type Teacher = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  kyc_type: string | null;
  kyc_number: string | null;
  upi: string | null;
  bank_acc: string | null;
  bank_ifsc: string | null;
  bank_holder: string | null;
  status: TeacherStatus;
  fraud_score: number;
  created_at: string;
};

export type Referral = {
  id: string;
  teacher_id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  student_class: string;
  amount: number;
  paid: boolean;
  refunded: boolean;
  fraud_flags: string[];
  created_at: string;
};

export type Commission = {
  id: string;
  teacher_id: string;
  referral_id: string | null;
  amount: number;
  status: "pending" | "approved" | "cancelled" | "paid";
  reason: string | null;
  created_at: string;
};

export type Withdrawal = {
  id: string;
  teacher_id: string;
  amount: number;
  method: string;
  destination: string;
  status: "requested" | "approved" | "paid" | "rejected";
  note: string | null;
  created_at: string;
};

export type FraudLog = {
  id: string;
  teacher_id: string | null;
  referral_id: string | null;
  kind: string;
  detail: string;
  created_at: string;
};

export type Balance = { earned: number; withdrawn: number; available: number };

export const MIN_WITHDRAW = 500;

const db = supabase as any;

export function genReferralCode(name: string) {
  const slug = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "TCH";
  return slug + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function deviceFingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  const nav = window.navigator;
  const s = [nav.userAgent, nav.language, screen.width + "x" + screen.height, new Date().getTimezoneOffset()].join("|");
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return "dev_" + Math.abs(h).toString(36);
}

/* ---------- TEACHERS ---------- */

export async function listTeachers(): Promise<Teacher[]> {
  const { data } = await db.from("teachers").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Teacher[];
}

export async function getCurrentTeacher(): Promise<Teacher | undefined> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return undefined;
  const { data } = await db.from("teachers").select("*").eq("user_id", auth.user.id).maybeSingle();
  return (data ?? undefined) as Teacher | undefined;
}

/** Public, safe lookup: returns only the teacher's display name + code. */
export async function getTeacherByCode(code: string): Promise<{ name: string; code: string } | undefined> {
  const { data } = await db.rpc("teacher_by_code", { _code: code });
  return (data?.[0] ?? undefined) as { name: string; code: string } | undefined;
}

export async function registerTeacher(input: {
  name: string; phone: string; upi?: string;
  kycType?: string; kycNumber?: string; code?: string;
}): Promise<Teacher> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Pehle apne account se login karein.");
  const payload = {
    user_id: auth.user.id,
    name: input.name,
    email: auth.user.email ?? "",
    phone: input.phone,
    code: input.code || genReferralCode(input.name),
    upi: input.upi || null,
    kyc_type: input.kycNumber ? (input.kycType ?? "aadhaar") : null,
    kyc_number: input.kycNumber || null,
  };
  const { data, error } = await db.from("teachers").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data as Teacher;
}

/** Teachers may only edit their own contact/payout details; status is admin-controlled. */
export async function updateTeacher(id: string, patch: Partial<Teacher>) {
  const { error } = await db.from("teachers").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- REFERRALS & COMMISSIONS ---------- */

export async function attributeReferral(opts: {
  code: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentClass: string;
  amount: number;
}): Promise<{ ok: boolean; reason?: string }> {
  const { data, error } = await db.rpc("attribute_referral", {
    _code: opts.code,
    _student_name: opts.studentName,
    _student_email: opts.studentEmail,
    _student_phone: opts.studentPhone,
    _student_class: opts.studentClass,
    _amount: opts.amount,
    _device: deviceFingerprint(),
  });
  if (error) return { ok: false, reason: "error" };
  return (data ?? { ok: false }) as { ok: boolean; reason?: string };
}

export async function listReferrals(teacherId?: string): Promise<Referral[]> {
  let q = db.from("teacher_referrals").select("*").order("created_at", { ascending: false });
  if (teacherId) q = q.eq("teacher_id", teacherId);
  const { data } = await q;
  return (data ?? []) as Referral[];
}

export async function listCommissions(teacherId?: string): Promise<Commission[]> {
  let q = db.from("teacher_commissions").select("*").order("created_at", { ascending: false });
  if (teacherId) q = q.eq("teacher_id", teacherId);
  const { data } = await q;
  return (data ?? []) as Commission[];
}

/** Balance is computed server-side from real commission/withdrawal rows. */
export async function balance(teacherId: string): Promise<Balance> {
  const { data } = await db.rpc("teacher_balance", { _teacher_id: teacherId });
  const row = data?.[0];
  return {
    earned: Number(row?.earned ?? 0),
    withdrawn: Number(row?.withdrawn ?? 0),
    available: Number(row?.available ?? 0),
  };
}

export function rankFrom(activePaid: number): { rank: Rank; next?: Rank; progress: number } {
  if (activePaid >= 500) return { rank: "Elite Educator", progress: 1 };
  if (activePaid >= 200) return { rank: "Platinum Mentor", next: "Elite Educator", progress: (activePaid - 200) / 300 };
  if (activePaid >= 100) return { rank: "Gold Mentor", next: "Platinum Mentor", progress: (activePaid - 100) / 100 };
  if (activePaid >= 25) return { rank: "Active Mentor", next: "Gold Mentor", progress: (activePaid - 25) / 75 };
  return { rank: "Beginner Teacher", next: "Active Mentor", progress: activePaid / 25 };
}

/* ---------- WITHDRAWALS ---------- */

export async function requestWithdrawal(teacherId: string, amount: number, method: "upi" | "bank", destination: string): Promise<void> {
  const { error } = await db.from("teacher_withdrawals").insert({
    teacher_id: teacherId, amount, method, destination,
  });
  if (error) throw new Error(error.message);
}

export async function listWithdrawals(teacherId?: string): Promise<Withdrawal[]> {
  let q = db.from("teacher_withdrawals").select("*").order("created_at", { ascending: false });
  if (teacherId) q = q.eq("teacher_id", teacherId);
  const { data } = await q;
  return (data ?? []) as Withdrawal[];
}

export async function setWithdrawalStatus(id: string, status: Withdrawal["status"]) {
  const { error } = await db.from("teacher_withdrawals").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- FRAUD ---------- */
export async function listFraud(): Promise<FraudLog[]> {
  const { data } = await db.from("teacher_fraud_logs").select("*").order("created_at", { ascending: false });
  return (data ?? []) as FraudLog[];
}
