import { createServerFn } from "@tanstack/react-start";

type Input = {
  idCard: string;
  photo: string;
  name: string;
  fatherName: string;
  school: string;
  idNumber: string;
};

export type VerifyResult = {
  ok: boolean;
  nameMatch: boolean;
  fatherMatch: boolean;
  schoolMatch: boolean;
  idNumberMatch: boolean;
  photoMatch: boolean;
  idNumberFound: string;
  reason: string;
};

export const verifyStudentId = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }): Promise<VerifyResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI verification service configured nahi hai.");

    const prompt = `You are a strict student ID verification assistant.
Image 1 = the uploaded ID document (school ID card / Aadhaar / birth certificate).
Image 2 = a separate self photo of the student.

Compare with these submitted form values:
- Student name: "${data.name}"
- Father's name: "${data.fatherName}"
- School: "${data.school}"
- ID / document number: "${data.idNumber}"

Return ONLY a JSON object (no markdown) with keys:
{"nameMatch":bool,"fatherMatch":bool,"schoolMatch":bool,"idNumberMatch":bool,"photoMatch":bool,"idNumberFound":string,"reason":string}
Rules:
- nameMatch/fatherMatch/schoolMatch: true if the text on the document reasonably matches (ignore case, spacing, minor spelling).
- idNumberMatch: true only if the document clearly shows a number equal to the submitted one (ignore spaces/dashes). Put what you read in idNumberFound.
- photoMatch: true only if the face on the ID document appears to be the same person as in image 2.
- If a field is not readable on the document, set it false and explain briefly in reason (Hinglish, one short sentence).`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.idCard } },
              { type: "image_url", image_url: { url: data.photo } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Verification abhi busy hai, thodi der baad try karein.");
      if (res.status === 402) throw new Error("AI verification credits khatam ho gaye hain. Admin se contact karein.");
      throw new Error(`Verification fail (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Verification result padha nahi ja saka. Dobara try karein.");
    const parsed = JSON.parse(match[0]) as Partial<VerifyResult>;

    const out = {
      nameMatch: !!parsed.nameMatch,
      fatherMatch: !!parsed.fatherMatch,
      schoolMatch: !!parsed.schoolMatch,
      idNumberMatch: !!parsed.idNumberMatch,
      photoMatch: !!parsed.photoMatch,
      idNumberFound: String(parsed.idNumberFound ?? ""),
      reason: String(parsed.reason ?? ""),
    };
    return { ...out, ok: out.nameMatch && out.fatherMatch && out.idNumberMatch && out.photoMatch };
  });
