import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ShoppingBag, X, Zap } from "lucide-react";
import { PRODUCTS, categoryById } from "@/data/products";
import { formatIDR } from "@/lib/format";
import { cn } from "@/utils/cn";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/i18n";
import { ProductArt } from "./ProductArt";
import { DeliveryChip, ProductBadge, QtyStepper, Rating, StockChip } from "./ui";

export function QuickView() {
  const { quickView, setQuickView, addItem, setCartOpen } = useStore();
  const { t } = useLang();
  const navigate = useNavigate();
  const product = useMemo(() => PRODUCTS.find((p) => p.id === quickView) ?? null, [quickView]);

  const [variantId, setVariantId] = useState<string | undefined>();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setVariantId(product?.variants?.[0]?.id);
    setQty(1);
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setQuickView(null);
    if (quickView) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [quickView, setQuickView]);

  const variant = product?.variants?.find((v) => v.id === variantId) ?? product?.variants?.[0];
  const unit = variant?.price ?? product?.price ?? 0;

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={t("Lihat cepat — {name}", { name: product.name })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button aria-label={t("Tutup lihat cepat")} className="absolute inset-0 cursor-default bg-ink-950/50 backdrop-blur-sm" onClick={() => setQuickView(null)} />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-lift md:grid-cols-[0.9fr_1.1fr]"
          >
            <button
              aria-label={t("Tutup")}
              onClick={() => setQuickView(null)}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-ink-950/[0.05] text-ink-600 transition-colors hover:bg-ink-950/10 hover:text-ink-950"
            >
              <X className="h-4.5 w-4.5" strokeWidth={2.4} />
            </button>

            <div className="relative bg-ink-950/[0.02] p-5">
              <ProductArt product={product} className="aspect-square w-full" rounded="rounded-2xl" />
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-ink-950/[0.07] bg-white px-4 py-3">
                <DeliveryChip type={product.delivery.type} />
                <span className="text-right text-xs font-medium leading-tight text-ink-500">
                  {product.delivery.label}
                  <span className="block text-[11px] text-ink-400">{product.delivery.eta}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {product.badge && <ProductBadge badge={product.badge} />}
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">{categoryById(product.category).name}</span>
              </div>

              <h2 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-ink-950">{product.name}</h2>
              <p className="mt-1.5 text-sm text-ink-500">{product.tagline}</p>

              <div className="mt-3 flex items-center gap-3">
                {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} size="md" />}
                <StockChip status={product.stock.status} count={product.stock.count} />
              </div>

              {product.variants && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-500">{t("Paket")}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        className={cn(
                          "rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200",
                          (variantId ?? product.variants![0].id) === v.id
                            ? "border-ink-950 bg-ink-950 text-white shadow-card"
                            : "border-ink-950/12 bg-white text-ink-700 hover:border-ink-950/40"
                        )}
                      >
                        <span className="block text-xs font-bold">{v.label}</span>
                        <span className={cn("block text-[11px]", (variantId ?? product.variants![0].id) === v.id ? "text-white/70" : "text-ink-400")}>
                          {formatIDR(v.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ul className="mt-5 space-y-1.5">
                {product.includes.slice(0, 3).map((inc) => (
                  <li key={inc} className="flex items-start gap-2 text-[13px] text-ink-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" strokeWidth={3} />
                    {inc}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <span className="font-display text-3xl font-extrabold tracking-tight text-ink-950">{formatIDR(unit * qty)}</span>
                    {qty > 1 && <span className="ml-2 text-xs text-ink-400">{formatIDR(unit)} × {qty}</span>}
                  </div>
                  <QtyStepper qty={qty} onChange={setQty} small />
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      addItem(product.id, variant?.id, qty);
                      setQuickView(null);
                      setCartOpen(true);
                    }}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent-400 font-display text-sm font-bold text-ink-950 transition-all hover:bg-accent-300 active:scale-[0.98]"
                  >
                    <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
                    {t("Tambah ke keranjang")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addItem(product.id, variant?.id, qty, true);
                      setQuickView(null);
                      navigate("/checkout");
                    }}
                    className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-ink-950 px-5 font-display text-sm font-bold text-white transition-all hover:opacity-85 active:scale-[0.98]"
                  >
                    <Zap className="h-4 w-4" strokeWidth={2.5} />
                    {t("Beli sekarang")}
                  </button>
                </div>
                <Link
                  to={`/product/${product.slug}`}
                  onClick={() => setQuickView(null)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 transition-colors hover:text-ink-950"
                >
                  {t("Lihat detail lengkap")} <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
