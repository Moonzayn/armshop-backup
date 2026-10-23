import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  ChevronRight,
  Filter,
  PackageSearch,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { CATEGORIES, PRODUCTS, categoryById, type CategoryId, type Product } from "@/data/products";
import { cn } from "@/utils/cn";
import { ProductCard } from "@/components/ProductCard";
import { DeliveryChip, EmptyState, ProductSkeleton } from "@/components/ui";
import { tr, useLang } from "@/i18n";

/* ------------------------------------------------------------------ */

const SORT_IDS = ["relevance", "popular", "price-asc", "price-desc", "newest"] as const;
const SORT_LABELS: Record<string, string> = {
  relevance: "Paling relevan",
  popular: "Terlaris",
  "price-asc": "Harga: rendah ke tinggi",
  "price-desc": "Harga: tinggi ke rendah",
  newest: "Terbaru",
};

const PRICE_BUCKETS = [
  { id: "all", label: "Semua harga" },
  { id: "u25", label: "Di bawah Rp25.000", test: (p: number) => p < 25000 },
  { id: "b25", label: "Rp25.000 – Rp50.000", test: (p: number) => p >= 25000 && p < 50000 },
  { id: "b50", label: "Rp50.000 – Rp100.000", test: (p: number) => p >= 50000 && p < 100000 },
  { id: "o100", label: "Di atas Rp100.000", test: (p: number) => p >= 100000 },
] as const;

type DeliveryFilter = "instant" | "manual";

function score(p: Product, q: string): number {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = `${p.name} ${categoryById(p.category).name} ${p.tags.join(" ")}`.toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (p.name.toLowerCase().includes(t)) s += 3;
    else if (hay.includes(t)) s += 1;
  }
  return terms.length ? s : 1;
}

/* ------------------------------------------------------------------ */

export default function CatalogPage() {
  const { t, lang } = useLang();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const rawCat = params.get("cat") ?? "";
  const cat = CATEGORIES.some((c) => c.id === rawCat) ? rawCat : "";
  const dealsOnly = params.get("deals") === "1";
  const sortParam = params.get("sort") ?? "relevance";
  const sort = (SORT_IDS as readonly string[]).includes(sortParam) ? sortParam : "relevance";

  const [query, setQuery] = useState(q);
  const [deliveries, setDeliveries] = useState<DeliveryFilter[]>([]);
  const [bucket, setBucket] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => setQuery(q), [q]);

  useEffect(() => {
    document.title = cat
      ? `${categoryById(cat as CategoryId).name} — La Cukai Shop`
      : q
        ? `${tr("Pencarian")}: ${q} — La Cukai Shop`
        : dealsOnly
          ? `${tr("Promo & harga turun")} — La Cukai Shop`
          : `${tr("Semua produk")} — La Cukai Shop`;
  }, [cat, q, dealsOnly, lang]);

  /* simulate fetch for skeleton states */
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(t);
  }, [q, cat, dealsOnly, sort, deliveries, bucket]);

  const patch = (patch_: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch_)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: false });
  };

  const results = useMemo(() => {
    let list = PRODUCTS.slice();
    if (cat) list = list.filter((p) => p.category === cat);
    if (dealsOnly) list = list.filter((p) => p.compareAt);
    if (q.trim()) list = list.filter((p) => score(p, q) > 0);
    if (deliveries.length) list = list.filter((p) => deliveries.includes(p.delivery.type));
    const b = PRICE_BUCKETS.find((x) => x.id === bucket);
    if (b && "test" in b) list = list.filter((p) => b.test(p.price));

    switch (sort) {
      case "popular": return list.sort((a, b) => b.sold - a.sold);
      case "price-asc": return list.sort((a, b) => a.price - b.price);
      case "price-desc": return list.sort((a, b) => b.price - a.price);
      case "newest": return list.sort((a, b) => b.addedAt - a.addedAt);
      default:
        return q.trim()
          ? list.sort((a, b) => score(b, q) - score(a, q) || b.sold - a.sold)
          : list.sort((a, b) => b.sold - a.sold);
    }
  }, [q, cat, dealsOnly, sort, deliveries, bucket]);

  const resetAll = () => {
    setDeliveries([]);
    setBucket("all");
    setParams(new URLSearchParams(), { replace: false });
  };

  const heading = cat
    ? categoryById(cat as CategoryId).name
    : dealsOnly
      ? t("Promo & harga turun")
      : q
        ? t("Hasil untuk \"{q}\"", { q })
        : t("Semua produk");

  const hasFilters = Boolean(q || cat || dealsOnly || deliveries.length || bucket !== "all");

  const filtersUI = (
    <div className="space-y-7">
      {/* delivery */}
      <fieldset>
        <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">{t("Pengiriman")}</legend>
        <div className="space-y-2">
          {(["instant", "manual"] as const).map((d) => (
            <label key={d} className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-950/[0.08] bg-white px-3.5 py-3 transition-colors has-[:checked]:border-ink-950 has-[:checked]:bg-ink-950/[0.03]">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={deliveries.includes(d)}
                  onChange={(e) =>
                    setDeliveries((cur) => (e.target.checked ? [...cur, d] : cur.filter((x) => x !== d)))
                  }
                  className="h-4 w-4 accent-ink-950"
                />
                <span className="text-[13px] font-semibold text-ink-900">{d === "instant" ? t("Pengiriman otomatis") : t("Diproses admin")}</span>
              </span>
              <DeliveryChip type={d} />
            </label>
          ))}
        </div>
      </fieldset>

      {/* price */}
      <fieldset>
        <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">{t("Rentang harga")}</legend>
        <div className="space-y-1.5">
          {PRICE_BUCKETS.map((b) => (
            <label key={b.id} className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors", bucket === b.id ? "bg-ink-950 text-white" : "text-ink-600 hover:bg-ink-950/[0.04]")}>
              <input type="radio" name="bucket" checked={bucket === b.id} onChange={() => setBucket(b.id)} className="sr-only" />
              <span className={cn("h-2 w-2 rounded-full border-2 transition-colors", bucket === b.id ? "border-accent-400 bg-accent-400" : "border-ink-300")} />
              {t(b.label)}
            </label>
          ))}
        </div>
      </fieldset>

      {/* categories */}
      <fieldset>
        <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">{t("Kategori")}</legend>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => patch({ cat: null })}
            className={cn("flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors", !cat ? "bg-ink-950 text-white" : "text-ink-600 hover:bg-ink-950/[0.04]")}
          >
            {t("Semua kategori")}
            <span className={cn("text-[11px]", !cat ? "text-white/50" : "text-ink-400")}>{PRODUCTS.length}</span>
          </button>
          {CATEGORIES.map((c) => {
            const n = PRODUCTS.filter((p) => p.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => patch({ cat: c.id })}
                className={cn("flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold transition-colors", cat === c.id ? "bg-ink-950 text-white" : "text-ink-600 hover:bg-ink-950/[0.04]")}
              >
                {c.name}
                <span className={cn("text-[11px]", cat === c.id ? "text-white/50" : "text-ink-400")}>{n}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {hasFilters && (
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-950/15 py-3 text-xs font-bold text-ink-700 transition-colors hover:border-ink-950/40"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {t("Reset semua filter")}
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen pb-24 pt-[100px]">
      <div className="container-x">
        {/* breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs font-medium text-ink-400">
          <Link to="/" className="transition-colors hover:text-ink-950">{t("Beranda")}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink-900">{heading}</span>
        </nav>

        {/* header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">{heading}</h1>
            <p className="mt-2 text-sm text-ink-400">
              {loading ? t("Memuat katalog…") : t("{n} produk · katalog resmi, sinkron dengan bot", { n: results.length })}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
            {/* search */}
            <form
              role="search"
              className="relative min-w-0 flex-1 sm:w-64 sm:flex-none"
              onSubmit={(e) => {
                e.preventDefault();
                patch({ q: query.trim() || null });
              }}
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Cari di katalog…")}
                aria-label={t("Cari di katalog")}
                className="h-11 w-full rounded-full border border-ink-950/12 bg-white pl-10 pr-4 text-[13px] text-ink-950 placeholder:text-ink-300 focus:border-accent-600 focus:outline-none"
              />
            </form>

            {/* sort */}
            <label className="relative inline-flex items-center">
              <ArrowUpDown className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-ink-400" />
              <span className="sr-only">{t("Urutkan produk")}</span>
              <select
                value={sort}
                onChange={(e) => patch({ sort: e.target.value === "relevance" ? null : e.target.value })}
                className="h-11 cursor-pointer appearance-none rounded-full border border-ink-950/12 bg-white pl-9 pr-8 text-[13px] font-semibold text-ink-900 focus:border-accent-600 focus:outline-none"
              >
                {SORT_IDS.map((id) => (
                  <option key={id} value={id}>{t(SORT_LABELS[id])}</option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 h-3.5 w-3.5 rotate-90 text-ink-400" />
            </label>

            {/* mobile filter */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-950 px-4 text-[13px] font-bold text-white lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> {t("Filter")}
            </button>
          </div>
        </div>

        {/* active filter chips */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 flex flex-wrap items-center gap-2 overflow-hidden">
              <Filter className="h-3.5 w-3.5 text-ink-300" />
              {q && <Chip label={t("Pencarian: {q}", { q })} onClear={() => patch({ q: null })} />}
              {cat && <Chip label={categoryById(cat as CategoryId).name} onClear={() => patch({ cat: null })} />}
              {dealsOnly && <Chip label={t("Hanya promo")} onClear={() => patch({ deals: null })} />}
              {deliveries.map((d) => (
                <Chip key={d} label={d === "instant" ? t("Pengiriman otomatis") : t("Diproses admin")} onClear={() => setDeliveries((c) => c.filter((x) => x !== d))} />
              ))}
              {bucket !== "all" && (
                <Chip label={t(PRICE_BUCKETS.find((b) => b.id === bucket)?.label ?? "")} onClear={() => setBucket("all")} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
          {/* sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-ink-950/[0.06] bg-paper-2/50 p-5">{filtersUI}</div>
          </aside>

          {/* grid */}
          <section aria-label="Products">
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <ProductSkeleton count={9} />
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title={t("Tidak ada yang cocok dengan filter itu")}
                body={t("Coba longgarkan rentang harga, hapus kategori, atau pakai kata kunci yang lebih umum.")}
                action={
                  <button
                    type="button"
                    onClick={resetAll}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-950 px-6 font-display text-sm font-bold text-white hover:opacity-85"
                  >
                    <RotateCcw className="h-4 w-4" /> {t("Reset filter")}
                  </button>
                }
              />
            ) : (
              <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {results.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>
        </div>
      </div>

      {/* mobile filter sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={t("Filter")}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-paper p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-ink-950">{t("Filter")}</h2>
                <button aria-label={t("Tutup filter")} onClick={() => setSheetOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-ink-950/[0.05]">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              {filtersUI}
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="mt-7 h-12 w-full rounded-full bg-accent-400 font-display text-sm font-bold text-ink-950"
              >
                {t("Tampilkan {n} hasil", { n: results.length })}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-950 py-1.5 pl-3.5 pr-2 text-[11px] font-bold text-white">
      {label}
      <button aria-label={tr("Hapus filter {label}", { label })} onClick={onClear} className="grid h-4.5 w-4.5 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/30">
        <X className="h-2.5 w-2.5" strokeWidth={3} />
      </button>
    </span>
  );
}
