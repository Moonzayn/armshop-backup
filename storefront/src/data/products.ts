/* ------------------------------------------------------------------ */
/*  La Cukai Shop — live catalog                                       */
/*  Products & categories are loaded at runtime from the shop backend  */
/*  (GET /api/storefront on the lacukai-bot service) and hydrated      */
/*  into the module-level PRODUCTS / CATEGORIES below before the app   */
/*  renders. Only products outside the VCC & account lines are served  */
/*  by that endpoint.                                                  */
/* ------------------------------------------------------------------ */

export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  blurb: string;
  gradient: [string, string];
}

/* Blue-family gradients assigned per category (theme: blue). */
const BLUE_GRADIENTS: [string, string][] = [
  ["#0b2447", "#2563eb"],
  ["#082f3f", "#0ea5e9"],
  ["#101d42", "#38bdf8"],
  ["#0a1e3c", "#6366f1"],
  ["#0b2a4a", "#22a8f2"],
  ["#0d2149", "#3b82f6"],
];

export let CATEGORIES: Category[] = [];

export const categoryById = (id: CategoryId): Category =>
  CATEGORIES.find((c) => c.id === id) ??
  CATEGORIES[0] ?? { id, name: id, short: id, blurb: "", gradient: BLUE_GRADIENTS[0] };

/* ------------------------------------------------------------------ */

export interface ProductVariant {
  id: string;
  label: string;
  detail?: string;
  price: number;
  compareAt?: number;
}

export type Badge = "best-seller" | "popular" | "new";
export type StockStatus = "in" | "low" | "preorder";
export type DeliveryType = "instant" | "manual";

export interface Faq {
  q: string;
  a: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  tagline: string;
  description: string;
  price: number;
  compareAt?: number;
  variants?: ProductVariant[];
  badge?: Badge;
  rating: number;
  reviewCount: number;
  sold: number;
  stock: { status: StockStatus; count?: number };
  delivery: { type: DeliveryType; label: string; eta: string };
  includes: string[];
  requirements?: string[];
  compatibility?: string;
  faqs: Faq[];
  tags: string[];
  art: { monogram: string; gradient?: [string, string] };
  addedAt: number; // higher = newer
  tosText?: string;
}

export let PRODUCTS: Product[] = [];

/* ------------------------------------------------------------------ */

interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  sold: number;
  stock: { status: StockStatus; count?: number };
  delivery: { type: DeliveryType; label: string; eta: string };
  includes: string[];
  faqs: Faq[];
  tags: string[];
  createdAt: string | null;
  tosText?: string;
}

function stripEmoji(s: string): string {
  return s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, "").trim();
}

function shortName(name: string): string {
  const clean = stripEmoji(name);
  const words = clean.split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).join(" ") || clean || name).slice(0, 18);
}

function monogramOf(name: string): string {
  const clean = stripEmoji(name).replace(/[^A-Za-z0-9 ]/g, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "LC";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Fetch the live catalog and hydrate PRODUCTS / CATEGORIES. */
export async function loadCatalog(): Promise<void> {
  try {
    const res = await fetch("/api/storefront", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      categories: { id: string; name: string }[];
      products: ApiProduct[];
    };
    CATEGORIES = (data.categories ?? []).map((c, i) => ({
      id: c.id,
      name: c.name,
      short: shortName(c.name),
      blurb: "",
      gradient: BLUE_GRADIENTS[i % BLUE_GRADIENTS.length],
    }));
    const gradFor = (catId: string): [string, string] => {
      const idx = CATEGORIES.findIndex((c) => c.id === catId);
      return BLUE_GRADIENTS[(idx >= 0 ? idx : hashStr(catId)) % BLUE_GRADIENTS.length];
    };
    PRODUCTS = (data.products ?? []).map((p, i, arr) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      tagline: p.tagline,
      description: p.description,
      price: p.price,
      compareAt: p.originalPrice ?? undefined,
      tosText: p.tosText || undefined,
      rating: 0,
      reviewCount: 0,
      sold: p.sold ?? 0,
      stock: p.stock,
      delivery: p.delivery,
      includes: p.includes ?? [],
      faqs: p.faqs ?? [],
      tags: p.tags ?? [],
      art: { monogram: monogramOf(p.name), gradient: gradFor(p.category) },
      addedAt: arr.length - i,
    }));
  } catch (err) {
    console.error("Gagal memuat katalog:", err);
    CATEGORIES = [];
    PRODUCTS = [];
  }
}

/* ------------------------------------------------------------------ */

export const productBySlug = (slug: string): Product | undefined =>
  PRODUCTS.find((p) => p.slug === slug);

export const productsByCategory = (id: CategoryId): Product[] =>
  PRODUCTS.filter((p) => p.category === id);

export const relatedProducts = (product: Product, count = 4): Product[] => {
  const same = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id);
  const rest = PRODUCTS.filter((p) => p.category !== product.category && p.id !== product.id)
    .sort((a, b) => b.sold - a.sold);
  return [...same, ...rest].slice(0, count);
};

export const bestSellers = (count = 8): Product[] =>
  [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, count);

export const trending = (count = 8): Product[] =>
  [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, count);

export const newArrivals = (count = 8): Product[] =>
  [...PRODUCTS].sort((a, b) => b.addedAt - a.addedAt).slice(0, count);

export const deals = (count = 8): Product[] =>
  PRODUCTS.filter((p) => p.compareAt).sort((a, b) => (b.compareAt! - b.price) / b.compareAt! - (a.compareAt! - a.price) / a.compareAt!).slice(0, count);

export function searchProducts(query: string, limit = 6): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored = PRODUCTS.map((p) => {
    const hay = `${p.name} ${categoryById(p.category).name} ${p.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (p.name.toLowerCase().includes(t)) score += 3;
      else if (hay.includes(t)) score += 1;
    }
    return { p, score };
  }).filter((s) => s.score > 0);
  return scored.sort((a, b) => b.score - a.score || b.p.sold - a.p.sold).slice(0, limit).map((s) => s.p);
}

/* ------------------------------------------------------------------ */
/*  Reviews — the live store does not collect public reviews yet, so   */
/*  this stays empty (no fabricated ratings anywhere in the UI).       */
/* ------------------------------------------------------------------ */

export interface Review {
  name: string;
  meta: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

export function reviewsFor(_productId: string, _count = 3): Review[] {
  return [];
}

export const TESTIMONIALS: { name: string; role: string; quote: string; rating: number }[] = [];

/* ------------------------------------------------------------------ */
/*  Promo codes — vouchers live in the Telegram bot checkout, so the   */
/*  web storefront does not validate codes.                            */
/* ------------------------------------------------------------------ */

export interface Promo {
  code: string;
  kind: "percent" | "flat";
  value: number;
  minSpend?: number;
  cap?: number;
  blurb: string;
}

export const PROMOS: Promo[] = [];

export function validatePromo(_code: string, _subtotal: number): { ok: true; promo: Promo; discount: number } | { ok: false; error: string } {
  return { ok: false, error: "Kode promo dipakai saat checkout di bot Telegram @lacukbot." };
}

/* ------------------------------------------------------------------ */
/*  Help-center FAQs (truthful copy, both languages)                   */
/* ------------------------------------------------------------------ */

export const SITE_FAQS: Faq[] = [
  { q: "Bagaimana cara memesan?", a: "Pilih produk, tambahkan ke keranjang, lalu lanjutkan ke checkout di halaman ini dan bayar langsung dengan QRIS di halaman pembayaran. Setelah pembayaran terkonfirmasi, pesananmu diteruskan ke admin untuk diproses." },
  { q: "Pembayarannya lewat apa?", a: "Pembayaran dilakukan langsung di halaman pembayaran web ini menggunakan QRIS (diterbitkan via KlikQRIS) — bisa dipindai dari e-wallet atau m-banking apa pun. Status pembayaran terkonfirmasi otomatis." },
  { q: "Bagaimana produk saya dikirim?", a: "Produk bertanda 'Pengiriman otomatis' dikirim sistem setelah pembayaran terkonfirmasi. Produk bertanda 'Diproses admin' disiapkan manual oleh tim kami setelah pembayaran terkonfirmasi, dan kamu dihubungi lewat WhatsApp/email yang kamu isi saat checkout." },
  { q: "Apakah harga di web sama dengan di bot?", a: "Sama. Katalog web ini membaca data yang sama dengan katalog di bot Telegram dan panel admin, jadi harga dan ketersediaannya selalu sinkron." },
  { q: "Kalau ada kendala dengan pesanan saya?", a: "Hubungi admin lewat bot Telegram @lacukbot dan sertakan kode pesananmu. Kami bantu sampai pesananmu selesai." },
  { q: "Bisakah meminta produk yang belum ada di katalog?", a: "Bisa — sampaikan lewat bot Telegram @lacukbot. Permintaan yang sering masuk akan kami pertimbangkan untuk ditambahkan ke katalog." },
];

export const SITE_FAQS_EN: Faq[] = [
  { q: "How do I place an order?", a: "Pick a product, add it to your cart, continue to checkout on this page, and pay directly with QRIS on the payment page. Once payment is confirmed, your order is forwarded to our admin for processing." },
  { q: "How do I pay?", a: "Payment is made right on this website's payment page using QRIS (issued via KlikQRIS) — scannable from any e-wallet or mobile banking app. Payment status is confirmed automatically." },
  { q: "How is my product delivered?", a: "Products marked 'Automatic delivery' are sent by the system once payment is confirmed. Products marked 'Processed by admin' are prepared manually by our team after payment is confirmed, and we will contact you via the WhatsApp/email you provided at checkout." },
  { q: "Are web prices the same as in the bot?", a: "Yes. This web catalog reads the same data as the Telegram bot catalog and the admin panel, so prices and availability stay in sync." },
  { q: "What if something is wrong with my order?", a: "Contact our admin through the @lacukbot Telegram bot and include your order reference. We will help until your order is complete." },
  { q: "Can I request a product that is not listed?", a: "Yes — send your request via the @lacukbot Telegram bot. Frequently requested items will be considered for the catalog." },
];
