import { useEffect, useState } from "react";
import { getBrandLogo } from "@/lib/brand";

export function BrandMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  const [src, setSrc] = useState<string>(() => getBrandLogo());
  useEffect(() => {
    const sync = () => setSrc(getBrandLogo());
    sync();
    window.addEventListener("uyanix:brand", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("uyanix:brand", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return (
    <img
      src={src}
      alt="Uyanix logo"
      width={size}
      height={size}
      className={"rounded-xl object-cover shadow-soft ring-1 ring-border " + className}
      style={{ width: size, height: size }}
    />
  );
}
