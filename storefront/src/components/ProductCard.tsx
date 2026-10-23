import { Link } from "react-router-dom";
import { Eye, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { categoryById, type Product } from "@/data/products";
import { compactID, discountPercent, formatIDR } from "@/lib/format";
import { cn } from "@/utils/cn";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/i18n";
import { ProductArt } from "./ProductArt";
import { DeliveryChip, ProductBadge, Rating, StockChip } from "./ui";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addItem, setQuickView } = useStore();
  const { t } = useLang();
  const cat = categoryById(product.category);
  const pct = discountPercent(product.price, product.compareAt);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-950/[0.07] bg-white shadow-card hover-ring hover:shadow-lift"
    >
      {/* artwork */}
      <div className="relative p-3 pb-0">
        <Link to={`/product/${product.slug}`} className="block" aria-label={product.name} tabIndex={-1}>
          <ProductArt
            product={product}
            className="aspect-[4/3] w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        </Link>

        {/* badges */}
        <div className="pointer-events-none absolute left-5 top-5 flex flex-col items-start gap-1.5">
          {product.badge && <ProductBadge badge={product.badge} />}
          {pct && (
            <span className="rounded-full bg-deal-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-sm">
              −{pct}%
            </span>
          )}
        </div>

        {/* quick view */}
        <button
          type="button"
          onClick={() => setQuickView(product.id)}
          aria-label={t("Lihat cepat {name}", { name: product.name })}
          className="absolute bottom-3 right-3 z-10 inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[11px] font-bold text-ink-950 opacity-0 shadow-lift backdrop-blur transition-all duration-300 hover:bg-white group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={2.4} />
          {t("Lihat cepat")}
        </button>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{cat.short}</span>
          <DeliveryChip type={product.delivery.type} />
        </div>

        <Link to={`/product/${product.slug}`} className="mt-1.5 block">
          <h3 className={cn("line-clamp-2 min-h-[2.5em] font-display text-[15px] font-bold leading-snug text-ink-950 transition-colors group-hover:text-ink-700", priority && "text-base")}>
            {product.name}
          </h3>
        </Link>

        {(product.reviewCount > 0 || product.sold > 0) && (
          <div className="mt-2 flex items-center gap-2">
            {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} />}
            {product.sold > 0 && (
              <span className="text-[11px] font-medium text-ink-400">
                {product.reviewCount > 0 ? "· " : ""}{compactID(product.sold)} {t("terjual")}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-ink-950/[0.06] pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-lg font-extrabold tracking-tight text-ink-950">
                {formatIDR(product.price)}
              </span>
              {product.compareAt && (
                <span className="text-xs font-medium text-ink-400 line-through">{formatIDR(product.compareAt)}</span>
              )}
            </div>
            <StockChip status={product.stock.status} count={product.stock.count} />
          </div>

          <button
            type="button"
            onClick={() => addItem(product.id)}
            aria-label={t("Tambah {name} ke keranjang", { name: product.name })}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-950 text-white transition-all duration-300 hover:bg-accent-400 hover:text-ink-950 hover:shadow-[0_8px_20px_-6px_rgba(56,189,248,0.6)] active:scale-90"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
