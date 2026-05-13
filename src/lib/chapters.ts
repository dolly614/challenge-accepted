const KEY = "chapters_v1";

export type Chapter = {
  title?: string;
  content: string;
  updatedAt: number;
};

type Store = Record<string, Chapter>; // key = `${cls}_${day}`

function read(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export const keyFor = (cls: number | string, day: number | string) => `${cls}_${day}`;

export function getChapter(cls: number, day: number): Chapter | null {
  return read()[keyFor(cls, day)] || null;
}
export function getAllChapters(): Store { return read(); }

export function saveChapter(cls: number, day: number, content: string, title?: string) {
  const s = read();
  s[keyFor(cls, day)] = { content, title, updatedAt: Date.now() };
  write(s);
}
export function deleteChapter(cls: number, day: number) {
  const s = read();
  delete s[keyFor(cls, day)];
  write(s);
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  // Configure worker (Vite-friendly)
  try {
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return extractPdfTextFromBuffer(await file.arrayBuffer());
}

export async function extractPdfTextFromBuffer(buf: ArrayBuffer): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    try {
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    } catch {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strs = content.items.map((it: any) => ("str" in it ? it.str : "")).filter(Boolean);
    text += strs.join(" ") + "\n\n";
  }
  return text.trim();
}

/** Parse a day number (1-30) from a filename like "day-01.pdf", "Day 5 - Algebra.pdf", "05_intro.pdf" */
export function parseDayFromFilename(name: string): number | null {
  const base = name.replace(/\.[^.]+$/, "");
  const patterns = [
    /day[\s_-]*0*(\d{1,2})/i,
    /^0*(\d{1,2})[\s_.-]/,
    /[\s_-]0*(\d{1,2})$/,
    /^0*(\d{1,2})$/,
  ];
  for (const re of patterns) {
    const m = base.match(re);
    if (m) {
      const n = parseInt(m[1]);
      if (n >= 1 && n <= 30) return n;
    }
  }
  return null;
}

/** Derive a chapter title from filename: strip "day N", extension, separators */
export function titleFromFilename(name: string): string {
  let t = name.replace(/\.[^.]+$/, "");
  t = t.replace(/day[\s_-]*0*\d{1,2}/i, "");
  t = t.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return t;
}