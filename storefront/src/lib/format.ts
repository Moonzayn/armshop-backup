import { tr } from "@/i18n";

/** Format a number as Indonesian rupiah, e.g. 25000 -> "Rp25.000" */
export function formatIDR(value: number): string {
  return "Rp" + Math.round(value).toLocaleString("id-ID");
}

/** Compact sold counter, e.g. 3200 -> "3,2rb" */
export function compactID(value: string | number): string {
  if (typeof value === "string") return value;
  if (value >= 1000) {
    const v = (value / 1000).toFixed(1).replace(".", ",").replace(",0", "");
    return `${v}rb`;
  }
  return String(value);
}

/** Deterministic pseudo-random from a string seed (for stable demo picks). */
export function seededIndex(seed: string, mod: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % mod;
}

export function orderRef(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `LCS-${s}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return tr("baru saja");
  if (m < 60) return tr("{n} menit lalu", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return tr("{n} jam lalu", { n: h });
  const d = Math.floor(h / 24);
  return tr("{n} hari lalu", { n: d });
}

export function discountPercent(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
