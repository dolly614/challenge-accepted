import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  kind: z.enum(["school_id_card", "school_dress_photo"]),
  image: z.string().max(8_000_000).regex(/^data:(image\/(png|jpeg)|application\/pdf);base64,/),
});

export type DocCheck = { ok: boolean; message: string };

// Server checks that the upload really is a school ID card / a photo in school uniform.
// A plain/simple photo is rejected so it can never be submitted for verification.
export const checkVerificationDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }): Promise<DocCheck> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, message: "Verification service abhi available nahi hai." };

    const isPdf = data.image.startsWith("data:application/pdf");
    const task = data.kind === "school_id_card"
      ? "Is this a genuine school student ID card (shows student name and school name)? A normal photo, selfie or any other document is NOT valid."
      : "Is this a photo of a student wearing a school uniform/school dress (e.g. school shirt, tie, badge, school logo, typical uniform)? A normal/casual/simple photo in home or regular clothes is NOT valid.";
    const prompt = `${task}\nReply ONLY JSON: {"valid":bool,"reason":string} where reason is one short Hinglish sentence.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            isPdf
              ? { type: "input_file", filename: "document.pdf", file_data: data.image }
              : { type: "input_image", image_url: data.image },
          ],
        }],
      }),
    });
    if (!res.ok) {
      console.error("doc check failed", res.status);
      if (res.status === 429) return { ok: false, message: "Verification abhi busy hai, thodi der baad try karein." };
      return { ok: false, message: "Document check nahi ho paya. Dobara try karein." };
    }
    const json = (await res.json()) as { output_text?: string; output?: { content?: { text?: string }[] }[] };
    const raw = json.output_text ?? json.output?.flatMap((o) => o.content ?? []).map((c) => c.text ?? "").join("") ?? "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return { ok: false, message: "Document check nahi ho paya. Dobara try karein." };
    try {
      const p = JSON.parse(m[0]) as { valid?: boolean; reason?: string };
      if (p.valid) return { ok: true, message: "" };
      return {
        ok: false,
        message: data.kind === "school_id_card"
          ? "Ye valid School ID Card nahi lag raha. Sahi ID card ki photo upload karein."
          : "Ye photo school dress me nahi hai. School dress (uniform) pehne hue photo upload karein.",
      };
    } catch {
      return { ok: false, message: "Document check nahi ho paya. Dobara try karein." };
    }
  });
