import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgePercent, ShieldCheck, ShoppingBag, Ticket, Trash2, X, Zap } from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { formatIDR } from "@/lib/format";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/i18n";
import { ProductArt } from "./ProductArt";
import { DeliveryChip, EmptyState, QtyStepper } from "./ui";

export function CartDrawer() {
  const {
    cartOpen, setCartOpen, lines, subtotal, discount, total, promo,
    setQty, removeItem, applyPromo, removePromo, clearCart,
  } = useStore();
  const [code, setCode] = useState("");
  const { t } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    if (cartOpen) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, setCartOpen]);

  const submitPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (await applyPromo(code)) setCode("");
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div className="fixed inset-0 z-[85]" role="dialog" aria-modal="true" aria-label={t("Keranjang belanja")}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />

          <motion.aside
            initial={{ x: "104%" }}
            animate={{ x: 0 }}
            exit={{ x: "104%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-paper shadow-lift"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-ink-950/[0.07] bg-white px-6 py-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-ink-950">{t("Keranjangmu")}</h2>
                <p className="text-xs text-ink-400">{lines.length === 0 ? t("Masih kosong") : t("{n} produk · tersimpan di perangkat ini", { n: lines.length })}</p>
              </div>
              <button aria-label={t("Tutup keranjang")} onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-ink-950/[0.05] text-ink-600 transition-colors hover:bg-ink-950/10 hover:text-ink-950">
                <X className="h-4.5 w-4.5" strokeWidth={2.4} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                  icon={ShoppingBag}
                  title={t("Keranjangmu kosong")}
                  body={t("Produk digital pilihan tinggal sejauh satu ketukan. Keranjangmu tersimpan di perangkat ini untuk kunjungan berikutnya.")}
                  action={
                    <button
                      type="button"
                      onClick={() => { setCartOpen(false); navigate("/shop"); }}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-950 px-6 font-display text-sm font-bold text-white transition-opacity hover:opacity-85"
                    >
                      {t("Lihat produk")} <ArrowRight className="h-4 w-4" />
                    </button>
                  }
                />
              </div>
            ) : (
              <>
                {/* lines */}
                <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => {
                      const product = PRODUCTS.find((p) => p.id === l.productId);
                      return (
                        <motion.li
                          key={l.key}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
                          className="flex gap-3.5 rounded-2xl border border-ink-950/[0.06] bg-white p-3.5 shadow-card"
                        >
                          {product && <ProductArt product={product} className="h-[72px] w-[92px] shrink-0" rounded="rounded-xl" compact />}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-bold text-ink-950">{l.name}</p>
                                {l.variantLabel && <p className="mt-0.5 text-[11px] font-medium text-ink-400">{l.variantLabel}</p>}
                              </div>
                              <button
                                aria-label={t("Hapus {name}", { name: l.name })}
                                onClick={() => removeItem(l.key)}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-300 transition-colors hover:bg-deal-500/10 hover:text-deal-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                              </button>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <QtyStepper small qty={l.qty} onChange={(q) => setQty(l.key, q)} />
                              <span className="font-display text-sm font-extrabold tabular-nums text-ink-950">{formatIDR(l.unitPrice * l.qty)}</span>
                            </div>
                            <div className="mt-2">
                              <DeliveryChip type={l.deliveryType} />
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>

                {/* footer */}
                <div className="border-t border-ink-950/[0.07] bg-white px-6 pb-6 pt-4">
                  {/* promo */}
                  {promo ? (
                    <div className="mb-4 flex items-center justify-between rounded-xl border border-accent-600/40 bg-accent-50 px-4 py-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-accent-700">
                        <BadgePercent className="h-4 w-4" /> {promo.code} — {promo.blurb}
                      </span>
                      <button onClick={removePromo} className="text-[11px] font-bold text-ink-400 underline-offset-2 hover:text-ink-950 hover:underline">
                        {t("Hapus")}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={submitPromo} className="mb-4 flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                        <input
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          placeholder={t("Kode promo")}
                          aria-label={t("Kode promo")}
                          className="h-11 w-full rounded-xl border border-ink-950/12 bg-white pl-10 pr-3 text-[13px] font-semibold tracking-wide text-ink-950 placeholder:font-normal placeholder:text-ink-300 focus:border-accent-600 focus:outline-none"
                        />
                      </div>
                      <button type="submit" className="h-11 rounded-xl bg-ink-950 px-4 text-xs font-bold text-white transition-opacity hover:opacity-85">
                        {t("Pakai")}
                      </button>
                    </form>
                  )}

                  {/* totals */}
                  <dl className="space-y-1.5 text-[13px]">
                    <div className="flex justify-between text-ink-500">
                      <dt>Subtotal</dt>
                      <dd className="font-semibold tabular-nums text-ink-900">{formatIDR(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-ink-500">
                      <dt>{t("Biaya layanan")}</dt>
                      <dd className="font-semibold text-good-600">{t("Gratis")}</dd>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-accent-700">
                        <dt>{t("Diskon promo")}</dt>
                        <dd className="font-semibold tabular-nums">−{formatIDR(discount)}</dd>
                      </div>
                    )}
                    <div className="mt-2 flex items-baseline justify-between border-t border-ink-950/[0.08] pt-3">
                      <dt className="font-display text-sm font-bold text-ink-950">Total</dt>
                      <dd className="font-display text-2xl font-extrabold tabular-nums tracking-tight text-ink-950">{formatIDR(total)}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => { setCartOpen(false); navigate("/checkout"); }}
                    className="mt-4 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-accent-400 font-display text-[15px] font-bold text-ink-950 shadow-[0_12px_30px_-10px_rgba(56,189,248,0.6)] transition-all hover:bg-accent-300 active:scale-[0.99]"
                  >
                    <Zap className="h-4.5 w-4.5" strokeWidth={2.5} />
                    {t("Lanjut ke checkout")}
                  </button>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
                      <ShieldCheck className="h-3.5 w-3.5" /> {t("Pembayaran diproses di bot Telegram")}
                    </p>
                    <button onClick={clearCart} className="text-[11px] font-bold text-ink-400 underline-offset-2 hover:text-deal-500 hover:underline">
                      {t("Kosongkan")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
