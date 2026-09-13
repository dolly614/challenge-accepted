// Server-side helpers for the authentication flow.
// Nothing here ever reveals whether an account exists.
import { createServerFn } from "@tanstack/react-start";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginIdentifier = { identifier: string };

function normalise(identifier: string) {
  const raw = (identifier ?? "").trim().slice(0, 254);
  if (!raw) throw new Error("invalid_identifier");
  if (EMAIL_RE.test(raw)) return { kind: "email" as const, value: raw.toLowerCase() };
  const digits = raw.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  if (!/^[6-9]\d{9}$/.test(last10)) throw new Error("invalid_identifier");
  return { kind: "mobile" as const, value: last10 };
}

/**
 * Maps "mobile number or email" to the auth email used by the provider.
 * Unknown mobiles get a deterministic non-existent address so the caller
 * always receives the same generic sign-in failure — no account enumeration.
 */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((data: LoginIdentifier) => data)
  .handler(async ({ data }) => {
    let parsed: ReturnType<typeof normalise>;
    try {
      parsed = normalise(data.identifier);
    } catch {
      return { email: "invalid@uyanix.invalid" };
    }

    const { enforceRateLimit } = await import("@/lib/api/guards.server");
    try {
      await enforceRateLimit("login_lookup", parsed.value, 20, 300);
    } catch {
      return { email: "invalid@uyanix.invalid" };
    }

    if (parsed.kind === "email") return { email: parsed.value };

    const fallback = `${parsed.value}@uyanix.app`;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const db = supabaseAdmin as any;
      const { data: row } = await db
        .from("students")
        .select("user_id")
        .eq("mobile_normalized", `+91${parsed.value}`)
        .maybeSingle();
      if (!row?.user_id) return { email: fallback };
      const { data: userRes } = await db.auth.admin.getUserById(row.user_id);
      return { email: userRes?.user?.email || fallback };
    } catch (e) {
      console.error("[auth] identifier lookup failed");
      return { email: fallback };
    }
  });

export type AuthAuditEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_INVALID";

/** Minimal, secret-free audit trail for authentication events. */
export const logAuthEvent = createServerFn({ method: "POST" })
  .inputValidator((data: { event: AuthAuditEvent; success?: boolean; userId?: string | null }) => data)
  .handler(async ({ data }) => {
    const { audit } = await import("@/lib/api/guards.server");
    await audit({
      actorId: data.userId ?? null,
      action: data.event,
      targetType: "auth",
      result: data.success === false ? "failure" : "success",
    });
    return { ok: true };
  });

/** Server-validated password-reset request. Response never depends on existence. */
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; redirectTo: string }) => data)
  .handler(async ({ data }) => {
    const email = (data.email ?? "").trim().toLowerCase().slice(0, 254);
    const generic = { ok: true as const };
    if (!EMAIL_RE.test(email)) return generic;

    const { enforceRateLimit } = await import("@/lib/api/guards.server");
    try {
      await enforceRateLimit("password_reset", email, 5, 900);
    } catch {
      return generic;
    }

    try {
      const { createClient } = await import("@supabase/supabase-js");
      const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
      const client = createClient(process.env["SUPABASE_URL"]!, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input: any, init: any) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          },
        },
      });
      const redirectTo = /^https?:\/\//.test(data.redirectTo) ? data.redirectTo : undefined;
      await client.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
    } catch {
      console.error("[auth] reset request failed");
    }

    const { audit } = await import("@/lib/api/guards.server");
    await audit({ action: "PASSWORD_RESET_REQUESTED", targetType: "auth" });
    return generic;
  });
