// Teacher Referral & Earnings — frontend demo store (localStorage-backed)
// NOTE: This is a client-side demo. For production, move to Lovable Cloud
// (Supabase) with RLS, server-verified payments, KYC review, and payouts.

export type TeacherStatus = "pending" | "approved" | "rejected" | "suspended";
export type Rank = "Beginner Teacher" | "Active Mentor" | "Gold Mentor" | "Platinum Mentor" | "Elite Educator";

export type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // demo only — never do this in real apps
  code: string;
  photoUrl?: string;
  kyc?: { type: "aadhaar" | "pan"; number: string };
  status: TeacherStatus;
  fraudScore: number; // 0-100, higher = riskier
  upi?: string;
  bank?: { acc: string; ifsc: string; holder: string };
  createdAt: number;
};

export type Referral = {
  id: string;
  teacherId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentClass: string;
  paid: boolean;
  amount: number; // student paid amount
  refunded: boolean;
  fraudFlags: string[];
  ip: string;
  device: string;
  createdAt: number;
};

export type Commission = {
  id: string;
  teacherId: string;
  referralId: string;
  amount: number;
  status: "pending" | "approved" | "cancelled" | "paid";
  reason?: string;
  createdAt: number;
};

export type Withdrawal = {
  id: string;
  teacherId: string;
  amount: number;
  method: "upi" | "bank";
  destination: string;
  status: "requested" | "approved" | "paid" | "rejected";
  createdAt: number;
  note?: string;
};

export type FraudLog = {
  id: string;
  teacherId?: string;
  referralId?: string;
  kind: string;
  detail: string;
  createdAt: number;
};

const KEY = "tref_v1";
type Store = {
  teachers: Teacher[];
  referrals: Referral[];
  commissions: Commission[];
  withdrawals: Withdrawal[];
  fraud: FraudLog[];
  session?: string; // current teacher id
};

const empty: Store = { teachers: [], referrals: [], commissions: [], withdrawals: [], fraud: [] };

function read(): Store {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}
function write(s: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

function uid(p = "") { return p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

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

export function listTeachers() { return read().teachers; }
export function getTeacher(id: string) { return read().teachers.find(t => t.id === id); }
export function getTeacherByCode(code: string) { return read().teachers.find(t => t.code.toUpperCase() === code.toUpperCase()); }
export function getCurrentTeacher() {
  const s = read();
  return s.session ? s.teachers.find(t => t.id === s.session) : undefined;
}
export function logoutTeacher() { const s = read(); s.session = undefined; write(s); }

export function registerTeacher(input: Omit<Teacher, "id" | "code" | "status" | "fraudScore" | "createdAt"> & { code?: string }): Teacher {
  const s = read();
  if (s.teachers.some(t => t.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("Email already registered");
  }
  // basic fraud heuristics on signup
  const flags: string[] = [];
  if (/\+?\d{10}/.test(input.phone) === false) flags.push("invalid_phone");
  if (/(temp|mailinator|10minute|guerrilla)/i.test(input.email)) flags.push("disposable_email");
  const t: Teacher = {
    ...input,
    id: uid("t_"),
    code: input.code || genReferralCode(input.name),
    status: "pending",
    fraudScore: flags.length * 20,
    createdAt: Date.now(),
  };
  s.teachers.push(t);
  s.session = t.id;
  if (flags.length) s.fraud.push({ id: uid("f_"), teacherId: t.id, kind: "signup_flags", detail: flags.join(","), createdAt: Date.now() });
  write(s);
  return t;
}

export function loginTeacher(email: string, password: string): Teacher {
  const s = read();
  const t = s.teachers.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
  if (!t) throw new Error("Invalid credentials");
  s.session = t.id; write(s);
  return t;
}

export function updateTeacher(id: string, patch: Partial<Teacher>) {
  const s = read();
  s.teachers = s.teachers.map(t => t.id === id ? { ...t, ...patch } : t);
  write(s);
}

/* ---------- REFERRALS & COMMISSIONS ---------- */

export function commissionFor(teacherId: string): number {
  const count = read().referrals.filter(r => r.teacherId === teacherId && r.paid && !r.refunded).length;
  if (count + 1 > 200) return 20;
  if (count + 1 > 50) return 15;
  return 10;
}

export function attributeReferral(opts: {
  code: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentClass: string;
  amount: number;
}): { referral?: Referral; commission?: Commission; reason?: string } {
  const s = read();
  const teacher = s.teachers.find(t => t.code.toUpperCase() === opts.code.toUpperCase());
  if (!teacher) return { reason: "invalid_code" };
  if (teacher.status !== "approved") return { reason: "teacher_not_approved" };

  const flags: string[] = [];
  // self-referral guard
  if (teacher.email.toLowerCase() === opts.studentEmail.toLowerCase() ||
      teacher.phone === opts.studentPhone) flags.push("self_referral");

  const device = deviceFingerprint();
  const ip = "anon"; // client-side; real IP needs server

  // duplicate device / email / phone
  const dup = s.referrals.find(r =>
    r.teacherId === teacher.id && (
      r.device === device ||
      r.studentEmail.toLowerCase() === opts.studentEmail.toLowerCase() ||
      r.studentPhone === opts.studentPhone
    )
  );
  if (dup) flags.push("duplicate_signup");
  if (/(temp|mailinator|10minute|guerrilla)/i.test(opts.studentEmail)) flags.push("disposable_email");

  const ref: Referral = {
    id: uid("r_"),
    teacherId: teacher.id,
    studentName: opts.studentName,
    studentEmail: opts.studentEmail,
    studentPhone: opts.studentPhone,
    studentClass: opts.studentClass,
    paid: true,
    amount: opts.amount,
    refunded: false,
    fraudFlags: flags,
    ip, device,
    createdAt: Date.now(),
  };
  s.referrals.push(ref);

  let commission: Commission | undefined;
  if (flags.includes("self_referral") || flags.includes("duplicate_signup")) {
    commission = { id: uid("c_"), teacherId: teacher.id, referralId: ref.id, amount: 0, status: "cancelled", reason: flags.join(","), createdAt: Date.now() };
    s.fraud.push({ id: uid("f_"), teacherId: teacher.id, referralId: ref.id, kind: "fraud_block", detail: flags.join(","), createdAt: Date.now() });
  } else {
    const rate = (() => {
      const count = s.referrals.filter(r => r.teacherId === teacher.id && r.paid && !r.refunded).length;
      if (count > 200) return 20;
      if (count > 50) return 15;
      return 10;
    })();
    commission = { id: uid("c_"), teacherId: teacher.id, referralId: ref.id, amount: rate, status: "approved", createdAt: Date.now() };
  }
  s.commissions.push(commission);
  write(s);
  return { referral: ref, commission };
}

export function listReferrals(teacherId?: string) {
  const r = read().referrals;
  return teacherId ? r.filter(x => x.teacherId === teacherId) : r;
}

export function listCommissions(teacherId?: string) {
  const c = read().commissions;
  return teacherId ? c.filter(x => x.teacherId === teacherId) : c;
}

export function balance(teacherId: string) {
  const s = read();
  const earned = s.commissions
    .filter(c => c.teacherId === teacherId && (c.status === "approved" || c.status === "paid"))
    .reduce((a, c) => a + c.amount, 0);
  const withdrawn = s.withdrawals
    .filter(w => w.teacherId === teacherId && (w.status === "paid" || w.status === "approved" || w.status === "requested"))
    .reduce((a, w) => a + w.amount, 0);
  return { earned, withdrawn, available: Math.max(0, earned - withdrawn) };
}

export function rankFor(teacherId: string): { rank: Rank; next?: Rank; progress: number } {
  const active = read().referrals.filter(r => r.teacherId === teacherId && r.paid && !r.refunded).length;
  if (active >= 500) return { rank: "Elite Educator", progress: 1 };
  if (active >= 200) return { rank: "Platinum Mentor", next: "Elite Educator", progress: (active - 200) / 300 };
  if (active >= 100) return { rank: "Gold Mentor", next: "Platinum Mentor", progress: (active - 100) / 100 };
  if (active >= 25) return { rank: "Active Mentor", next: "Gold Mentor", progress: (active - 25) / 75 };
  return { rank: "Beginner Teacher", next: "Active Mentor", progress: active / 25 };
}

/* ---------- WITHDRAWALS ---------- */

export const MIN_WITHDRAW = 500;

export function requestWithdrawal(teacherId: string, amount: number, method: "upi" | "bank", destination: string): Withdrawal {
  const { available } = balance(teacherId);
  if (amount < MIN_WITHDRAW) throw new Error(`Minimum payout is ₹${MIN_WITHDRAW}`);
  if (amount > available) throw new Error("Insufficient balance");
  const s = read();
  const w: Withdrawal = { id: uid("w_"), teacherId, amount, method, destination, status: "requested", createdAt: Date.now() };
  s.withdrawals.push(w);
  write(s);
  return w;
}

export function listWithdrawals(teacherId?: string) {
  const w = read().withdrawals;
  return teacherId ? w.filter(x => x.teacherId === teacherId) : w;
}

export function setWithdrawalStatus(id: string, status: Withdrawal["status"]) {
  const s = read();
  s.withdrawals = s.withdrawals.map(w => w.id === id ? { ...w, status } : w);
  if (status === "paid") {
    // mark related commissions as paid up to the amount (FIFO)
    const w = s.withdrawals.find(x => x.id === id)!;
    let remaining = w.amount;
    s.commissions = s.commissions.map(c => {
      if (c.teacherId !== w.teacherId || c.status !== "approved" || remaining <= 0) return c;
      remaining -= c.amount;
      return { ...c, status: "paid" as const };
    });
  }
  write(s);
}

/* ---------- FRAUD ---------- */
export function listFraud() { return read().fraud; }

/* ---------- DEMO SEEDING ---------- */
export function seedDemoIfEmpty() {
  const s = read();
  if (s.teachers.length) return;
  const demo: Teacher = {
    id: "t_demo", name: "Priya Verma", email: "priya@demo.in", phone: "9876500001",
    password: "demo1234", code: "PRIYA001", status: "approved", fraudScore: 0, createdAt: Date.now() - 86400000 * 30,
    upi: "priya@upi",
  };
  s.teachers.push(demo);
  const names = ["Aarav Sharma", "Diya Patel", "Vihaan Singh", "Ananya Reddy", "Arjun Mehta", "Saanvi Iyer", "Kabir Gupta", "Ishaan Joshi"];
  names.forEach((n, i) => {
    const r: Referral = {
      id: uid("r_"), teacherId: demo.id, studentName: n,
      studentEmail: n.toLowerCase().replace(" ", ".") + "@mail.in",
      studentPhone: "98700" + (10000 + i), studentClass: String((i % 12) + 1),
      paid: true, amount: 99, refunded: false, fraudFlags: [],
      ip: "anon", device: "dev_demo" + i, createdAt: Date.now() - 86400000 * (i + 1),
    };
    s.referrals.push(r);
    s.commissions.push({ id: uid("c_"), teacherId: demo.id, referralId: r.id, amount: 10, status: "approved", createdAt: r.createdAt });
  });
  write(s);
}