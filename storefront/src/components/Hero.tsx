import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, BadgeCheck, QrCode, ShieldCheck, Zap } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { PRODUCTS, CATEGORIES, bestSellers } from "@/data/products";
import { formatIDR } from "@/lib/format";
import { useLang } from "@/i18n";
import { ProductArt } from "./ProductArt";

const ease = [0.22, 1, 0.36, 1] as const;

function Headline() {
  const { t } = useLang();
  const words = t("Dunia Digitalmu,").split(" ");
  return (
    <h1 className="font-display text-[13vw] font-extrabold leading-[0.98] tracking-[-0.03em] text-white sm:text-7xl lg:text-[5.4rem]">
      {words.map((w, i) => (
        <span key={w} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.09, ease }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
      <span className="inline-block overflow-hidden pb-2 align-bottom">
        <motion.span
          className="serif-accent inline-block text-accent-300"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, delay: 0.15 + words.length * 0.09, ease }}
        >
          {t("Lebih Simpel.")}
        </motion.span>
      </span>
    </h1>
  );
}

export function Hero() {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [par, setPar] = useState({ x: 0, y: 0 });
  const featured = bestSellers(1)[0] ?? PRODUCTS[0];

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPar({
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    });
  }, []);

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="dot-grid relative overflow-hidden bg-ink-950 pb-16 pt-[120px] sm:pb-24 sm:pt-[150px]"
      aria-label="Intro"
    >
      {/* ambience */}
      <div className="pointer-events-none absolute -left-40 top-[-20%] h-[560px] w-[560px] rounded-full bg-accent-400/[0.09] blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-[-30%] h-[480px] w-[480px] rounded-full bg-[#4e5ff2]/[0.12] blur-[120px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />

      <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
        {/* copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.05] py-1.5 pl-1.5 pr-4 backdrop-blur"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-400 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-ink-950">
              <Zap className="h-3 w-3" strokeWidth={2.8} /> {t("Baru")}
            </span>
            <span className="text-xs font-medium text-white/65">
              {featured ? <>{featured.name} · {formatIDR(featured.price)}</> : t("Katalog resmi La Cukai Shop")}
            </span>
          </motion.div>

          <Headline />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease }}
            className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/60 sm:text-base"
          >
            {t("Temukan produk digital pilihan — domain, layanan, dan kebutuhan online lainnya — dalam satu tempat. Harga transparan dalam rupiah, pembayaran QRIS lewat bot Telegram, dan pengiriman yang jelas statusnya.")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.78, ease }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/shop"
              className="group inline-flex h-[54px] items-center gap-2.5 rounded-full bg-accent-400 pl-7 pr-5 font-display text-[15px] font-bold text-ink-950 shadow-[0_14px_40px_-10px_rgba(56,189,248,0.65)] transition-all duration-300 hover:bg-accent-300 active:scale-[0.98]"
            >
              {t("Jelajahi Produk")}
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-950 text-accent-400 transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
              </span>
            </Link>
            <Link
              to="/shop?sort=popular"
              className="inline-flex h-[54px] items-center gap-2 rounded-full border border-white/18 px-7 font-display text-[15px] font-bold text-white transition-all duration-300 hover:border-accent-400/60 hover:text-accent-300 active:scale-[0.98]"
            >
              <BadgeCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
              {t("Produk Terlaris")}
            </Link>
          </motion.div>

          {/* stats */}
          <motion.dl
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
            className="mt-12 flex flex-wrap items-center gap-x-9 gap-y-5 border-t border-white/[0.08] pt-7"
          >
            {[
              { k: `${PRODUCTS.length}`, v: t("produk digital") },
              { k: `${CATEGORIES.length}`, v: t("kategori pilihan") },
              { k: "24/7", v: t("akses katalog") },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-[26px] font-extrabold tracking-tight text-white">{s.k}</dt>
                <dd className="mt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-white/40">{s.v}</dd>
              </div>
            ))}
            <div className="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 sm:flex">
              <ShieldCheck className="h-4 w-4 text-accent-400" strokeWidth={2.3} />
              <span className="text-[11px] font-semibold text-white/55">{t("Pembayaran aman via QRIS di bot Telegram")}</span>
            </div>
          </motion.dl>
        </div>

        {/* visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease }}
          className="relative mx-auto w-full max-w-[520px]"
          style={{ transform: `translate3d(${par.x * -8}px, ${par.y * -6}px, 0)` }}
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]">
            <img src={heroImg} alt={t("Ilustrasi produk digital La Cukai Shop")} className="aspect-square w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />
            <div className="dot-grid absolute inset-0 opacity-30" />
          </div>

          {/* floating: product tile */}
          {featured && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0, ease }}
            className="absolute -left-4 top-8 sm:-left-10"
            style={{ transform: `translate3d(${par.x * 14}px, ${par.y * 12}px, 0)` }}
          >
            <div className="animate-float rounded-2xl border border-white/12 bg-white/[0.08] p-3 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <ProductArt product={featured} className="h-11 w-14" rounded="rounded-lg" compact />
                <div>
                  <p className="max-w-[180px] truncate text-[11px] font-bold text-white">{featured.name}</p>
                  <p className="text-[11px] font-semibold text-accent-300">{formatIDR(featured.price)}</p>
                </div>
              </div>
            </div>
          </motion.div>
          )}

          {/* floating: delivery chip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.15, ease }}
            className="absolute -right-2 top-1/2 sm:-right-6"
            style={{ transform: `translate3d(${par.x * 20}px, ${par.y * -14}px, 0)` }}
          >
            <div className="animate-float-slow flex items-center gap-2.5 rounded-full border border-white/12 bg-ink-900/80 py-2.5 pl-3 pr-4 backdrop-blur-xl">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-400 text-ink-950">
                <Zap className="h-3.5 w-3.5" strokeWidth={2.8} />
              </span>
              <span className="text-[11px] font-bold text-white">{t("Pengiriman jelas statusnya")}</span>
            </div>
          </motion.div>

          {/* floating: rating chip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3, ease }}
            className="absolute -bottom-5 left-8"
            style={{ transform: `translate3d(${par.x * -16}px, ${par.y * 18}px, 0)` }}
          >
            <div className="animate-float rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-3 backdrop-blur-xl" style={{ animationDelay: "1.2s" }}>
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                <QrCode className="h-3.5 w-3.5 text-accent-300" /> {t("Bayar pakai QRIS")}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-white/45">{t("E-wallet & m-banking apa pun")}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="container-x relative mt-16 hidden justify-center lg:flex"
      >
        <a href="#categories" className="flex flex-col items-center gap-2 text-white/35 transition-colors hover:text-accent-300" aria-label="Scroll to categories">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{t("Gulir")}</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}
