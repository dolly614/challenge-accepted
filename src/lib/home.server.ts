// Server-only data access for the public homepage.
// Returns ONLY safe, public aggregate/marketing fields — never private student data.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type RegistrationStatus = "open" | "closed" | "upcoming";

export type HomeData = {
  config: {
    batch: string;
    status: RegistrationStatus;
    opensAt: string;
    closesAt: string;
    serverNow: string;
  };
  stats: { studentsRegistered: number; citiesCovered: number };
  testimonials: { name: string; cls: string; text: string; emoji: string }[];
  faqs: { q: string; a: string }[];
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// Short-lived cache: public marketing data only, never user-specific.
// Registration availability itself is always re-checked server-side before any write.
const TTL_MS = 60_000;
let cache: { at: number; data: HomeData } | null = null;

export async function loadHomeData(): Promise<HomeData> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return { ...cache.data, config: { ...cache.data.config, serverNow: new Date().toISOString() } };
  }

  const sb = publicClient();
  const [statusRes, statsRes, testiRes, faqRes] = await Promise.all([
    sb.rpc("registration_status" as never),
    sb.from("homepage_stats").select("students_registered, cities_covered").maybeSingle(),
    sb
      .from("testimonials")
      .select("display_name, class_info, quote, emoji")
      .eq("is_approved", true)
      .order("order_index", { ascending: true }),
    sb.from("faqs").select("question, answer").eq("is_published", true).order("order_index", { ascending: true }),
  ]);

  const status = (statusRes.data ?? {}) as Record<string, string>;
  const now = new Date().toISOString();

  const data: HomeData = {
    config: {
      batch: status["batch"] ?? "Batch 1",
      status: (status["status"] as RegistrationStatus) ?? "open",
      opensAt: status["opensAt"] ?? now,
      closesAt: status["closesAt"] ?? new Date(Date.now() + 7 * 86400000).toISOString(),
      serverNow: status["serverNow"] ?? now,
    },
    stats: {
      studentsRegistered: statsRes.data?.students_registered ?? 0,
      citiesCovered: statsRes.data?.cities_covered ?? 0,
    },
    testimonials: (testiRes.data ?? []).map((t) => ({
      name: t.display_name,
      cls: t.class_info,
      text: t.quote,
      emoji: t.emoji,
    })),
    faqs: (faqRes.data ?? []).map((f) => ({ q: f.question, a: f.answer })),
  };

  cache = { at: Date.now(), data };
  return data;
}

/** Authoritative check used before any registration-affecting write. */
export async function assertRegistrationOpen(): Promise<void> {
  cache = null;
  const { config } = await loadHomeData();
  if (config.status !== "open") {
    const { conflict } = await import("./api/errors");
    throw conflict("Registration is not open right now.");
  }
}
