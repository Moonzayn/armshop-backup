import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CornerDownLeft, Search, TrendingUp, X } from "lucide-react";
import { CATEGORIES, PRODUCTS, searchProducts } from "@/data/products";
import { formatIDR } from "@/lib/format";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/i18n";
import { ProductArt } from "./ProductArt";

function buildSuggestions(): string[] {
  const fromProducts = PRODUCTS.slice(0, 4).map((p) =>
    p.name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).join(" ")
  );
  const fromCats = CATEGORIES.map((c) => c.short);
  return [...new Set([...fromProducts, ...fromCats])].filter(Boolean).slice(0, 7);
}

export function SearchDialog() {
  const { searchOpen, setSearchOpen } = useStore();
  const { t } = useLang();
  const SUGGESTIONS = buildSuggestions();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => searchProducts(q, 6), [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setQ("");
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [searchOpen]);

  const go = (path: string) => {
    setSearchOpen(false);
    navigate(path);
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[10vh]"
          role="dialog"
          aria-modal="true"
          aria-label={t("Cari produk")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />

          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-ink-950/[0.07] px-5">
              <Search className="h-4.5 w-4.5 shrink-0 text-ink-400" strokeWidth={2.3} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`);
                }}
                placeholder={t("Cari produk digital…")}
                aria-label={t("Cari di katalog")}
                className="h-14 w-full bg-transparent text-[15px] text-ink-950 placeholder:text-ink-300 focus:outline-none"
              />
              {q ? (
                <button aria-label={t("Hapus pencarian")} onClick={() => setQ("")} className="grid h-7 w-7 place-items-center rounded-full bg-ink-950/[0.05] text-ink-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="hidden shrink-0 rounded-md bg-ink-950/[0.06] px-2 py-1 text-[10px] font-bold text-ink-400 sm:inline">ESC</kbd>
              )}
            </div>

            <div className="max-h-[54vh] overflow-y-auto p-3">
              {!q.trim() && (
                <div className="p-2">
                  <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">
                    <TrendingUp className="h-3 w-3" /> {t("Populer saat ini")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQ(s)}
                        className="rounded-full border border-ink-950/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-600 transition-all hover:border-ink-950/30 hover:text-ink-950"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="mb-3 mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">{t("Telusuri kategori")}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORIES.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => go(`/shop?cat=${c.id}`)}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink-700 transition-colors hover:bg-ink-950/[0.04]"
                      >
                        {c.name}
                        <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {q.trim() && results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="font-display text-sm font-bold text-ink-950">{t("Tidak ada hasil untuk “{q}”", { q })}</p>
                  <p className="mt-1.5 text-xs text-ink-400">{t("Coba kata kunci lain atau telusuri katalog lengkapnya.")}</p>
                  <button
                    type="button"
                    onClick={() => go("/shop")}
                    className="mt-5 inline-flex h-10 items-center rounded-full bg-ink-950 px-5 text-xs font-bold text-white hover:opacity-85"
                  >
                    {t("Lihat semua produk")}
                  </button>
                </div>
              )}

              {results.length > 0 && (
                <ul className="space-y-0.5">
                  {results.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => go(`/product/${p.slug}`)}
                        className="flex w-full items-center gap-3.5 rounded-2xl p-2.5 text-left transition-colors hover:bg-ink-950/[0.04]"
                      >
                        <ProductArt product={p} className="h-12 w-16 shrink-0" rounded="rounded-lg" compact />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink-950">{p.name}</span>
                          <span className="text-xs text-ink-400">{formatIDR(p.price)} · {p.delivery.label}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-ink-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {q.trim() && (
              <button
                type="button"
                onClick={() => go(`/shop?q=${encodeURIComponent(q.trim())}`)}
                className="flex w-full items-center justify-between border-t border-ink-950/[0.07] bg-ink-950/[0.02] px-5 py-3.5 text-[13px] font-bold text-ink-900 transition-colors hover:bg-ink-950 hover:text-white"
              >
                {t("Lihat semua hasil untuk “{q}”", { q: q.trim() })}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold opacity-70">
                  Enter <CornerDownLeft className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
