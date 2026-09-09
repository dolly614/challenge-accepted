// Server-only authorization helpers.
// The real security boundary: never rely on frontend role/route guards.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { forbidden, internalError, rateLimited, unauthenticated } from "./errors";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Db = SupabaseClient<Database>;

/** Throws unless the caller is signed in AND their account is active. */
export async function requireActiveUser(supabase: Db, userId: string | undefined): Promise<string> {
  if (!userId) throw unauthenticated();
  const { data, error } = await supabase.rpc("is_account_active", { _user_id: userId });
  if (error) throw internalError(error);
  if (!data) throw forbidden("This account is suspended or blocked.");
  return userId;
}

/** Throws unless the caller holds the given role (verified in the database). */
export async function requireRole(supabase: Db, userId: string | undefined, role: AppRole): Promise<string> {
  const id = await requireActiveUser(supabase, userId);
  const { data, error } = await supabase.rpc("has_role", { _user_id: id, _role: role });
  if (error) throw internalError(error);
  if (!data) throw forbidden();
  return id;
}

export const requireAdmin = (supabase: Db, userId?: string) => requireRole(supabase, userId, "admin");
export const requireTeacher = (supabase: Db, userId?: string) => requireRole(supabase, userId, "teacher");
export const requireStudent = (supabase: Db, userId?: string) => requireRole(supabase, userId, "student");

/** Object-level authorization: the row must belong to the caller (or caller is admin). */
export async function requireOwnership(
  supabase: Db,
  userId: string | undefined,
  ownerId: string | null | undefined,
): Promise<void> {
  const id = await requireActiveUser(supabase, userId);
  if (ownerId && ownerId === id) return;
  const { data } = await supabase.rpc("has_role", { _user_id: id, _role: "admin" });
  if (!data) throw forbidden();
}

/** Trusted application time — never use the browser clock for business logic. */
export async function serverNow(supabase: Db): Promise<Date> {
  const { data, error } = await supabase.rpc("server_now");
  if (error || !data) throw internalError(error ?? "no server time");
  return new Date(data as unknown as string);
}

/** Server-side rate limiting. Throws 429 when the bucket is exhausted. */
export async function enforceRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    _bucket: bucket,
    _identifier: identifier,
    _limit: limit,
    _window_seconds: windowSeconds,
  });
  if (error) throw internalError(error);
  if (!data) throw rateLimited();
}

/** Append-only audit trail for security-sensitive actions. Never throws to the caller. */
export async function audit(entry: {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  result?: "success" | "failure";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("write_audit_log", {
      _actor: entry.actorId ?? null,
      _action: entry.action,
      _target_type: entry.targetType ?? null,
      _target_id: entry.targetId ?? null,
      _result: entry.result ?? "success",
      _metadata: (entry.metadata ?? {}) as never,
    });
  } catch (e) {
    console.error("[audit] failed to write", e);
  }
}
