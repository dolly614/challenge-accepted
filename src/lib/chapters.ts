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
  const buf = await file.arrayBuffer();
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