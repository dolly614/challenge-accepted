import { useEffect, useState } from "react";
import { Upload, RotateCcw, ImageIcon } from "lucide-react";
import { getBrandLogo, setBrandLogo, resetBrandLogo } from "@/lib/brand";

export function BrandPanel() {
  const [logo, setLogo] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setLogo(getBrandLogo()); }, []);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) { setErr("PNG/JPG/WEBP/SVG only"); return; }
    if (file.size > 2 * 1024 * 1024) { setErr("Max 2MB"); return; }
    const r = new FileReader();
    r.onload = () => { const u = String(r.result); setBrandLogo(u); setLogo(u); };
    r.readAsDataURL(file);
  }

  return (
    <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Brand Logo</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Header, footer aur register pages me apply hoga.</p>
      <div className="mt-5 flex flex-wrap items-center gap-5">
        <img src={logo} alt="Current logo" className="h-20 w-20 rounded-2xl border border-border object-cover shadow-soft" />
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-gradient-hero px-4 text-sm font-semibold text-primary-foreground shadow-soft">
            <Upload className="h-4 w-4" /> Upload new logo
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={onPick} />
          </label>
          <button onClick={() => { resetBrandLogo(); setLogo(getBrandLogo()); }}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-accent">
            <RotateCcw className="h-4 w-4" /> Reset to default
          </button>
        </div>
      </div>
      {err && <p className="mt-2 text-xs font-medium text-destructive">{err}</p>}
      <p className="mt-3 text-[11px] text-muted-foreground">PNG/JPG/WEBP/SVG, max 2MB. Square images dikhte best hain.</p>
    </div>
  );
}
