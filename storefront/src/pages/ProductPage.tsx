import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  FileText,
  Info,
  ListChecks,
  MessageCircleQuestion,
  MonitorSmartphone,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Zap,
} from "lucide-react";
import { categoryById, productBySlug, relatedProducts, reviewsFor } from "@/data/products";
import { compactID, discountPercent, formatIDR } from "@/lib/format";
import { cn } from "@/utils/cn";
import { useStore } from "@/context/StoreContext";
import { tr, useLang } from "@/i18n";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/ProductCard";
import { DeliveryChip, ProductBadge, QtyStepper, Rating, Reveal, SectionHeading, StockChip } from "@/components/ui";

/* ------------------------------------------------------------------ */

export default function ProductPage() {
  const { t, lang } = useLang();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, setCartOpen, toast } = useStore();

  const product = productBySlug(slug ?? "");
  const [variantId, setVariantId] = useState<string | undefined>(product?.variants?.[0]?.id);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState(0);
  const [tab, setTab] = useState<"overview" | "faq" | "reviews">("overview");

  useEffect(() => {
    setVariantId(product?.variants?.[0]?.id);
    setQty(1);
    setView(0);
    setTab("overview");
    document.title = product ? `${product.name} — La Cukai Shop` : `${tr("Produk tidak ditemukan")} — La Cukai Shop`;
  }, [product, lang]);

  const related = useMemo(() => (product ? relatedProducts(product, 4) : []), [product]);
  const reviews = useMemo(() => (product ? reviewsFor(product.id, 3) : []), [product]);

  if (!product) {
    return (
      <main className="container-x grid min-h-screen place-items-center pb-20 pt-[120px]">
        <div className="max-w-md text-center">
          <p className="font-display text-7xl font-extrabold text-ink-950/10">404</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-ink-950">{t("Produk ini sudah pindah atau tidak pernah ada")}</h1>
          <p className="mt-3 text-sm text-ink-500">{t("Tautannya mungkin sudah usang, atau produknya sudah dihapus dari katalog.")}</p>
          <Link to="/shop" className="mt-7 inline-flex h-12 items-center rounded-full bg-ink-950 px-7 font-display text-sm font-bold text-white hover:opacity-85">
            {t("Kembali ke katalog")}
          </Link>
        </div>
      </main>
    );
  }

  const cat = categoryById(product.category);
  const variant = product.variants?.find((v) => v.id === variantId) ?? product.variants?.[0];
  const unit = variant?.price ?? product.price;
  const compare = variant?.compareAt ?? product.compareAt;
  const pct = discountPercent(unit, compare);
  const galleryFilters = ["", "saturate-[1.35] hue-rotate-[12deg]", "hue-rotate-[-18deg] saturate-[0.9]"];

  const buyNow = () => {
    addItem(product.id, variant?.id, qty, true);
    navigate("/checkout");
  };

  return (
    <main className="min-h-screen pb-28 pt-[96px] lg:pb-20">
      <div className="container-x">
        {/* breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink-400">
          <Link to="/" className="hover:text-ink-950">{t("Beranda")}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/shop" className="hover:text-ink-950">{t("Katalog")}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/shop?cat=${cat.id}`} className="hover:text-ink-950">{cat.name}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="max-w-[220px] truncate text-ink-900">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_480px]">
          {/* left: gallery + tabs */}
          <div>
            {/* gallery */}
            <Reveal>
              <div className="overflow-hidden rounded-3xl border border-ink-950/[0.07] bg-white p-4 shadow-card">
                <div className="relative">
                  <ProductArt product={product} rounded="rounded-2xl" className={cn("aspect-[16/10] w-full transition-all duration-500", galleryFilters[view])} />
                  <div className="absolute left-4 top-4 flex flex-col gap-1.5">
                    {product.badge && <ProductBadge badge={product.badge} />}
                    {pct && <span className="rounded-full bg-deal-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">−{pct}%</span>}
                  </div>
                </div>
                <div className="mt-3 flex gap-3">
                  {galleryFilters.map((fClr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setView(i)}
                      aria-label={t("Tampilan gambar {n}", { n: i + 1 })}
                      aria-pressed={view === i}
                      className={cn("overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-white transition-all", view === i ? "ring-ink-950" : "opacity-70 ring-transparent hover:opacity-100")}
                    >
                      <ProductArt product={product} className={cn("h-16 w-24 rounded-lg", fClr)} rounded="rounded-lg" compact />
                    </button>
                  ))}
                  <div className="ml-auto hidden items-end pb-1 sm:flex">
                    <p className="flex items-center gap-1.5 text-[11px] text-ink-400">
                      <Info className="h-3.5 w-3.5" /> {t("Gambar ilustrasi produk")}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* tabs */}
            <div className="mt-10">
              <div className="flex gap-1 overflow-x-auto border-b border-ink-950/[0.08]" role="tablist" aria-label="Product information">
                {(
                  [
                    { id: "overview", label: t("Ringkasan"), icon: FileText },
                    { id: "faq", label: `FAQ (${product.faqs.length})`, icon: MessageCircleQuestion },
                    { id: "reviews", label: `${t("Ulasan")} (${product.reviewCount})`, icon: Star },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "relative flex shrink-0 items-center gap-2 px-5 py-3.5 text-[13px] font-bold transition-colors",
                      tab === t.id ? "text-ink-950" : "text-ink-400 hover:text-ink-700"
                    )}
                  >
                    <t.icon className="h-4 w-4" strokeWidth={2.3} />
                    {t.label}
                    {tab === t.id && <motion.span layoutId="pdp-tab" className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-ink-950" />}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="py-8"
                >
                  {tab === "overview" && <OverviewTab product={product} />}
                  {tab === "faq" && <FaqTab faqs={product.faqs} />}
                  {tab === "reviews" && <ReviewsTab product={product} reviews={reviews} onWrite={() => toast(t("Fitur ulasan belum tersedia"), "info")} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* right: purchase panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Reveal delay={80}>
              <div className="rounded-3xl border border-ink-950/[0.07] bg-white p-6 shadow-card sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">{cat.name}</span>
                  <StockChip status={product.stock.status} count={product.stock.count} />
                </div>

                <h1 className="mt-2.5 font-display text-[26px] font-bold leading-tight tracking-tight text-ink-950">{product.name}</h1>
                <p className="mt-1.5 text-sm text-ink-500">{product.tagline}</p>

                {(product.reviewCount > 0 || product.sold > 0) && (
                <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} size="md" />}
                  {product.sold > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-400">
                      <BadgeCheck className="h-3.5 w-3.5 text-accent-600" /> {compactID(product.sold)} {t("terjual")}
                    </span>
                  )}
                </div>
                )}

                <div className="mt-5 flex items-baseline gap-2.5 border-y border-ink-950/[0.07] py-4">
                  <span className="font-display text-[34px] font-extrabold leading-none tracking-tight text-ink-950">{formatIDR(unit)}</span>
                  {compare && <span className="text-sm font-medium text-ink-400 line-through">{formatIDR(compare)}</span>}
                  {pct && <span className="rounded-full bg-deal-500/10 px-2 py-0.5 text-[11px] font-bold text-deal-500">{t("Hemat {pct}%", { pct })}</span>}
                </div>

                {/* variants */}
                {product.variants && (
                  <div className="mt-5">
                    <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-500">
                      <ListChecks className="h-3.5 w-3.5" /> {t("Pilih paket")}
                    </p>
                    <div className="space-y-2">
                      {product.variants.map((v) => {
                        const active = (variantId ?? product.variants![0].id) === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setVariantId(v.id)}
                            aria-pressed={active}
                            className={cn(
                              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                              active ? "border-ink-950 bg-ink-950 text-white shadow-card" : "border-ink-950/12 bg-white hover:border-ink-950/35"
                            )}
                          >
                            <span>
                              <span className="flex items-center gap-2 text-[13px] font-bold">
                                {v.label}
                                {v.detail && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", active ? "bg-accent-400 text-ink-950" : "bg-ink-950/[0.06] text-ink-500")}>{v.detail}</span>}
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block font-display text-[15px] font-extrabold tabular-nums">{formatIDR(v.price)}</span>
                              {v.compareAt && <span className={cn("block text-[11px] line-through", active ? "text-white/45" : "text-ink-300")}>{formatIDR(v.compareAt)}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* qty + actions */}
                <div className="mt-6 flex items-center gap-3">
                  <QtyStepper qty={qty} onChange={setQty} />
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Subtotal</p>
                    <p className="font-display text-lg font-extrabold tabular-nums text-ink-950">{formatIDR(unit * qty)}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2.5">
                  <button
                    type="button"
                    onClick={() => { addItem(product.id, variant?.id, qty); setCartOpen(true); }}
                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-accent-400 font-display text-[15px] font-bold text-ink-950 shadow-[0_12px_28px_-10px_rgba(56,189,248,0.55)] transition-all hover:bg-accent-300 active:scale-[0.98]"
                  >
                    <ShoppingBag className="h-4.5 w-4.5" strokeWidth={2.5} /> {t("Tambah ke keranjang")}
                  </button>
                  <button
                    type="button"
                    onClick={buyNow}
                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-ink-950 px-6 font-display text-[15px] font-bold text-white transition-all hover:opacity-85 active:scale-[0.98]"
                  >
                    <Zap className="h-4.5 w-4.5" strokeWidth={2.5} /> {t("Beli sekarang")}
                  </button>
                </div>

                {/* delivery box */}
                <div className={cn("mt-5 flex items-start gap-3 rounded-2xl border p-4", product.delivery.type === "instant" ? "border-accent-600/35 bg-accent-50" : "border-ink-950/10 bg-ink-950/[0.03]")}>
                  {product.delivery.type === "instant" ? (
                    <Zap className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-600" strokeWidth={2.4} />
                  ) : (
                    <Clock3 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-500" strokeWidth={2.4} />
                  )}
                  <div>
                    <p className="text-[13px] font-bold text-ink-950">{product.delivery.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                      {product.delivery.eta.charAt(0).toUpperCase() + product.delivery.eta.slice(1)}.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 border-t border-ink-950/[0.07] pt-5">
                  {[
                    { icon: ShieldCheck, text: t("Dibantu admin sampai pesananmu selesai") },
                    { icon: MonitorSmartphone, text: product.compatibility ?? t("Detail lengkap ada di deskripsi produk") },
                    { icon: Info, text: t("Harga & stok sinkron dengan katalog bot Telegram") },
                  ].map((row) => (
                    <p key={row.text} className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-500">
                      <row.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" strokeWidth={2.4} />
                      {row.text}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
          </aside>
        </div>

        {/* mobile sticky purchase bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-950/10 bg-white/92 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{variant?.label ?? cat.short}</p>
              <p className="font-display text-lg font-extrabold leading-none tabular-nums tracking-tight text-ink-950">{formatIDR(unit * qty)}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => { addItem(product.id, variant?.id, qty); setCartOpen(true); }}
                aria-label={t("Tambah ke keranjang")}
                className="grid h-12 w-12 place-items-center rounded-full border border-ink-950/15 text-ink-950 transition-colors hover:border-ink-950/40"
              >
                <ShoppingBag className="h-4.5 w-4.5" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={buyNow}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-accent-400 px-6 font-display text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300"
              >
                <Zap className="h-4 w-4" strokeWidth={2.6} /> {t("Beli sekarang")}
              </button>
            </div>
          </div>
        </div>

        {/* related */}
        {related.length > 0 && (
        <div className="mt-24">
          <Reveal>
            <SectionHeading
              eyebrow={t("Lanjut jelajahi")}
              title={
                <>
                  {t("Pilihan")} <span className="serif-accent text-accent-700">{t("terkait.")}</span>
                </>
              }
              sub={t("Produk lain dari {cat} dan katalog kami.", { cat: cat.name })}
              action={
                <Link to={`/shop?cat=${cat.id}`} className="hidden items-center gap-2 rounded-full border border-ink-950/12 px-5 py-2.5 text-[13px] font-bold text-ink-950 transition-colors hover:border-ink-950/30 sm:inline-flex">
                  {t("Lihat {cat}", { cat: cat.short })}
                </Link>
              }
            />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

import type { Faq as FaqType, Product, Review } from "@/data/products";

function OverviewTab({ product }: { product: Product }) {
  const { t } = useLang();
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h3 className="font-display text-lg font-bold text-ink-950">{t("Tentang produk ini")}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{product.description}</p>

        {product.requirements && (
          <>
            <h4 className="mt-8 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.1em] text-ink-900">
              <ListChecks className="h-4 w-4 text-accent-600" /> {t("Syarat & catatan")}
            </h4>
            <ul className="mt-3 space-y-2">
              {product.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-600">
                  <Minus className="mt-1.5 h-3 w-3 shrink-0 text-ink-300" strokeWidth={3} />
                  {r}
                </li>
              ))}
            </ul>
          </>
        )}
        {product.compatibility && (
          <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-ink-950/[0.03] p-4 text-[13px] leading-relaxed text-ink-600">
            <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
            <span><strong className="text-ink-900">{t("Kompatibilitas:")}</strong> {product.compatibility}</span>
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-ink-950/[0.07] bg-white p-6 shadow-card">
        <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.1em] text-ink-900">
          <BadgeCheck className="h-4 w-4 text-accent-600" /> {t("Yang kamu dapatkan")}
        </h4>
        {product.includes.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-500">{t("Detail isi paket mengikuti deskripsi produk di samping.")}</p>
        ) : (
        <ul className="mt-4 space-y-3">
          {product.includes.map((inc) => (
            <li key={inc} className="flex items-start gap-3 text-sm leading-relaxed text-ink-700">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-400/20 text-accent-700">
                <Plus className="h-3 w-3" strokeWidth={3.2} />
              </span>
              {inc}
            </li>
          ))}
        </ul>
        )}
        <div className="mt-6 border-t border-ink-950/[0.07] pt-4">
          <DeliveryChip type={product.delivery.type} />
          <p className="mt-2 text-xs text-ink-400">{product.delivery.label} · {product.delivery.eta}. {t("Syarat garansi & refund ada di tab FAQ.")}</p>
        </div>
      </div>
    </div>
  );
}

function FaqTab({ faqs }: { faqs: FaqType[] }) {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-3xl">
      <p className="mb-5 flex items-center gap-2 text-sm text-ink-500">
        <Info className="h-4 w-4 text-accent-600" /> {t("Pertanyaan yang sering diajukan untuk produk ini.")}
      </p>
      <div className="divide-y divide-ink-950/[0.07] rounded-2xl border border-ink-950/[0.07] bg-white shadow-card">
        {faqs.map((f2, i) => {
          const expanded = open === i;
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : i)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-display text-[15px] font-bold text-ink-950">{f2.q}</span>
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-950/[0.05] text-ink-500 transition-transform duration-300", expanded && "rotate-45 bg-ink-950 text-white")}>
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed text-ink-600">{f2.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewsTab({ product, reviews }: { product: Product; reviews: Review[]; onWrite: () => void }) {
  const { t } = useLang();
  if (reviews.length === 0) {
    return (
      <div className="max-w-3xl rounded-2xl border border-dashed border-ink-950/15 bg-paper-2/60 px-6 py-12 text-center">
        <Star className="mx-auto h-8 w-8 text-ink-300" strokeWidth={1.8} />
        <h3 className="mt-4 font-display text-lg font-bold text-ink-950">{t("Belum ada ulasan")}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          {t("Produk ini belum memiliki ulasan pelanggan. Ulasan hanya ditampilkan setelah benar-benar ada — kami tidak menampilkan ulasan contoh.")}
        </p>
      </div>
    );
  }
  return (
    <ul className="max-w-3xl space-y-4">
      {reviews.map((r, i) => (
        <li key={i} className="rounded-2xl border border-ink-950/[0.07] bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-950 font-display text-xs font-extrabold text-accent-400">
                {r.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink-950">{r.name}</p>
                <p className="text-[11px] text-ink-400">{r.meta}</p>
              </div>
            </div>
            <Rating value={r.rating} showCount={false} />
          </div>
          <p className="mt-4 font-display text-[15px] font-bold text-ink-950">{r.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{r.body}</p>
        </li>
      ))}
    </ul>
  );
}
