import defaultLogo from "@/assets/uyanix-logo.png";

export const BRAND_NAME = "Uyanix";
export const BRAND_FULL = "Uyanix 30 Days Challenge";
const KEY = "uyanix:brand-logo";

export function getBrandLogo(): string {
  if (typeof window === "undefined") return defaultLogo;
  return localStorage.getItem(KEY) || defaultLogo;
}
export function setBrandLogo(dataUrl: string) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, dataUrl);
  window.dispatchEvent(new Event("uyanix:brand"));
}
export function resetBrandLogo() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("uyanix:brand"));
}

export { defaultLogo };
