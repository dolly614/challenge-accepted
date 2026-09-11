import { createFileRoute } from "@tanstack/react-router";
import { loadHomeData } from "@/lib/home.server";
import { enforceRateLimit } from "@/lib/api/guards.server";
import { toErrorResponse } from "@/lib/api/errors";

export const Route = createFileRoute("/api/public/home")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const ip =
            request.headers.get("cf-connecting-ip") ??
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "unknown";
          await enforceRateLimit("public_home", ip, 60, 60);
          const data = await loadHomeData();
          return new Response(JSON.stringify({ ok: true, data }), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "public, max-age=60",
            },
          });
        } catch (error) {
          return toErrorResponse(error);
        }
      },
    },
  },
});
