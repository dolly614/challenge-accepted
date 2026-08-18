// Uyanix 30 Days Challenge — registration & ID verification data layer.
import { supabase } from "@/integrations/supabase/client";

export type VerificationStatus = "not_submitted" | "pending" | "verified" | "rejected";

export interface Student {
  id: string;
  user_id: string;
  student_name: string;
  class: string;
  school_name: string;
  mobile_number: string;
  email: string | null;
  document_type: string | null;
  document_url: string | null;
  photo_url: string | null;
  verification_status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  challenge_started: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterInput {
  studentName: string;
  studentClass: string;
  schoolName: string;
  mobileNumber: string;
  password: string;
  email?: string;
}

export type DocumentType = "school_id_card" | "birth_certificate" | "aadhaar_card";
export type DocBucket = "verification-documents" | "student-photos";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "application/pdf"];

const db = supabase as any;

// Supabase auth always needs an email. If the student leaves "Email" blank we
// derive one from the mobile number so the UI field can stay optional.
function resolveAuthEmail(input: RegisterInput): { authEmail: string; displayEmail: string | null } {
  const typed = input.email?.trim();
  if (typed) {
    if (!EMAIL_REGEX.test(typed)) throw new Error("Sahi email address daalein.");
    return { authEmail: typed, displayEmail: typed };
  }
  const digitsOnly = input.mobileNumber.replace(/\D/g, "");
  if (!digitsOnly) throw new Error("Mobile number daalein.");
  return { authEmail: `${digitsOnly}@uyanix.app`, displayEmail: null };
}

/* ---------------- PAGE 1 — REGISTRATION ---------------- */

export async function registerStudent(input: RegisterInput) {
  const { authEmail, displayEmail } = resolveAuthEmail(input);
  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: {
        role: "student",
        full_name: input.studentName,
        class: input.studentClass,
        class_level: input.studentClass,
        school_name: input.schoolName,
        mobile_number: input.mobileNumber,
        display_email: displayEmail,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function loginStudent(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function sendPasswordResetEmail(email: string, redirectTo?: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ?? `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

/* ---------------- PAGE 2 — ID VERIFICATION ---------------- */

function validateFile(file: File) {
  if (!ALLOWED_MIME.includes(file.type)) throw new Error("Sirf JPG, PNG ya PDF file allowed hai.");
  if (file.size > MAX_FILE_BYTES) throw new Error("File 5MB se kam honi chahiye.");
}

async function uploadToBucket(bucket: DocBucket, file: File) {
  validateFile(file);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Pehle login karein.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export const uploadVerificationDocument = (file: File) => uploadToBucket("verification-documents", file);
export const uploadStudentPhoto = (file: File) => uploadToBucket("student-photos", file);

export async function submitForVerification(
  documentType: DocumentType,
  documentPath: string,
  photoPath: string | null,
): Promise<Student> {
  const { data, error } = await db.rpc("submit_for_verification", {
    p_document_type: documentType,
    p_document_url: documentPath,
    p_photo_url: photoPath,
  });
  if (error) throw error;
  return data as Student;
}

/* ---------------- STATUS ---------------- */

export async function getMyStudentRecord(): Promise<Student | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await db.from("students").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Student | null;
}

export function subscribeToMyVerificationStatus(studentId: string, onChange: (s: Student) => void) {
  const channel = supabase
    .channel(`student-status-${studentId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "students", filter: `id=eq.${studentId}` },
      (payload) => onChange(payload.new as Student),
    )
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

/* ---------------- TEACHER / ADMIN REVIEW ---------------- */

export async function reviewStudentVerification(studentId: string, approve: boolean, rejectionReason?: string): Promise<Student> {
  const { data, error } = await db.rpc("review_student_verification", {
    p_student_id: studentId,
    p_approve: approve,
    p_reason: rejectionReason ?? null,
  });
  if (error) throw error;
  return data as Student;
}

export async function listPendingVerifications(): Promise<Student[]> {
  const { data, error } = await db
    .from("students").select("*")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Student[];
}

/* ---------------- START CHALLENGE ---------------- */

export async function startChallenge(studentId: string): Promise<Student> {
  const { data, error } = await db
    .from("students").update({ challenge_started: true }).eq("id", studentId).select().single();
  if (error) throw error;
  return data as Student;
}

export async function getSignedFileUrl(bucket: DocBucket, path: string, expiresInSeconds = 600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
