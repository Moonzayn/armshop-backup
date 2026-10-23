import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Flame,
  Headset,
  Info,
  PackageCheck,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORIES,
  bestSellers,
  deals,
  newArrivals,
  productsByCategory,
  trending,
} from "@/data/products";
import { cn } from "@/utils/cn";
import { useLang } from "@/i18n";
import { CategoryArt } from "./ProductArt";
import { ProductCard } from "./ProductCard";
import { Reveal, SectionHeading } from "./ui";

/* ------------------------------------------------------------------ */
/*  Lime marquee band                                                  */
/* ------------------------------------------------------------------ */

export function MarqueeBand() {
  const items = CATEGORIES.map((c) => c.name);
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === "b"}>
      {items.map((label, i) => (
        <span key={`${key}-${i}`} className="flex items-center">
          <span className="whitespace-nowrap font-display text-sm font-extrabold uppercase tracking-[0.14em] text-ink-950">{label}</span>
          <Check className="mx-6 h-4 w-4 text-ink-950/60" strokeWidth={3.2} />
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative z-10 overflow-hidden border-y border-ink-950/10 bg-accent-400 py-3.5" aria-label="Store categories">
      <div className="flex w-max animate-marquee gap-0">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Categories grid                                                    */
/* ------------------------------------------------------------------ */

export function CategoriesSection() {
  const { t } = useLang();
  return (
    <section id="categories" className="container-x scroll-mt-24 py-20 sm:py-28">
      <Reveal>
        <SectionHeading
          eyebrow={t("Kategori pilihan")}
          title={
            <>
              {t("Semua serba digital,")} <span className="serif-accent text-accent-700">{t("tertata rapi.")}</span>
            </>
          }
          sub={t("Koleksi terfokus sesuai kebutuhanmu — temukan yang kamu cari dalam hitungan detik.")}
        />
      </Reveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c, i) => {
          const count = productsByCategory(c.id).length;
          return (
            <Reveal key={c.id} delay={(i % 3) * 90}>
              <Link
                to={`/shop?cat=${c.id}`}
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-ink-950/[0.07] bg-white p-5 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(120deg, ${c.gradient[0]}10, ${c.gradient[1]}14)` }}
                />
                <CategoryArt category={c.id} className="h-14 w-14 shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
                <span className="relative min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-[15px] font-bold tracking-tight text-ink-950">{c.name}</span>
                    <span className="shrink-0 rounded-full bg-ink-950/[0.05] px-2 py-0.5 text-[10px] font-bold text-ink-500">{t("{count} produk", { count })}</span>
                  </span>
                  <span className="mt-1 line-clamp-1 block text-xs text-ink-400">{c.blurb}</span>
                </span>
                <ArrowUpRight className="relative h-4.5 w-4.5 shrink-0 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-950" strokeWidth={2.4} />
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Best sellers grid                                                  */
/* ------------------------------------------------------------------ */

export function ViewAllLink({ to }: { to: string }) {
  const { t } = useLang();
  return (
    <Link
      to={to}
      className="group hidden items-center gap-2 rounded-full border border-ink-950/12 py-2.5 pl-5 pr-3 text-[13px] font-bold text-ink-950 transition-all hover:border-ink-950/30 hover:bg-white sm:inline-flex"
    >
      {t("Lihat semua")}
      <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-950 text-white transition-transform duration-300 group-hover:translate-x-0.5">
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
      </span>
    </Link>
  );
}

export function BestSellersSection() {
  const { t } = useLang();
  return (
    <section className="bg-paper-2/60 py-20 sm:py-28" aria-label={t("Terlaris")}>
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={t("Terlaris")}
            title={
              <>
                {t("Produk")} <span className="serif-accent text-accent-700">{t("paling laris.")}</span>
              </>
            }
            sub={t("Diurutkan dari data penjualan toko — diperbarui mengikuti katalog.")}
            action={<ViewAllLink to="/shop?sort=popular" />}
          />
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bestSellers(8).map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 70}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center sm:hidden">
          <ViewAllLink to="/shop?sort=popular" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust indicators                                                   */
/* ------------------------------------------------------------------ */

export function TrustSection() {
  const { t } = useLang();
  const TRUST: { icon: LucideIcon; title: string; body: string }[] = [
    {
      icon: ShoppingBag,
      title: t("Pemesanan mudah"),
      body: t("Dari keranjang ke konfirmasi dalam hitungan menit. Keranjangmu tersimpan di perangkat ini, jadi bisa dilanjutkan kapan pun."),
    },
    {
      icon: Wallet,
      title: t("Harga transparan"),
      body: t("Semua harga dalam rupiah dan dirinci sebelum kamu membayar — subtotal dan total jelas, tanpa biaya tersembunyi."),
    },
    {
      icon: Headset,
      title: t("Dukungan responsif"),
      body: t("Admin siap membantu lewat bot Telegram @lacukbot — untuk pertanyaan sebelum membeli maupun kendala setelah pesanan."),
    },
    {
      icon: ShieldCheck,
      title: t("Pembayaran aman"),
      body: t("Pembayaran lewat QRIS di bot Telegram resmi kami. Halaman web ini tidak pernah meminta atau menyimpan data pembayaranmu."),
    },
  ];
  return (
    <section className="container-x py-20 sm:py-28" aria-label={t("Kenapa belanja di sini")}>
      <Reveal>
        <SectionHeading
          eyebrow={t("Kenapa La Cukai Shop")}
          title={
            <>
              {t("Dibangun di atas")} <span className="serif-accent text-accent-700">{t("kejelasan")}</span>{t(", bukan klaim.")}
            </>
          }
          sub={t("Tanpa lencana karangan atau logo pinjaman — hanya janji operasional yang memang kami jalankan.")}
        />
      </Reveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t, i) => (
          <Reveal key={t.title} delay={i * 80}>
            <div className="group h-full rounded-2xl border border-ink-950/[0.07] bg-white p-6 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-ink-950 text-accent-400 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                <t.icon className="h-5 w-5" strokeWidth={2.1} />
              </div>
              <h3 className="font-display text-[15px] font-bold text-ink-950">{t.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{t.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Deals band (dark)                                                  */
/* ------------------------------------------------------------------ */

export function DealsSection() {
  const { t } = useLang();
  const items = deals(8);
  if (items.length === 0) return null;
  return (
    <section className="relative overflow-hidden bg-ink-950 py-20 text-white sm:py-28" aria-label={t("Promo")}>
      <div className="dot-grid absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -right-40 top-[-30%] h-[460px] w-[460px] rounded-full bg-deal-500/[0.1] blur-[110px]" />
      <div className="container-x relative">
        <Reveal>
          <SectionHeading
            dark
            eyebrow={t("Harga turun")}
            title={
              <>
                {t("Penawaran")} <span className="serif-accent text-accent-300">{t("minggu ini.")}</span>
              </>
            }
            sub={t("Produk dengan harga coret — selama persediaan masih ada.")}
            action={<ViewAllLink to="/shop?deals=1" />}
          />
        </Reveal>
      </div>
      <Reveal delay={120}>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:px-8 lg:px-[max(3rem,calc((100vw-1320px)/2+3rem))]">
          {items.map((p) => (
            <div key={p.id} className="w-[290px] shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
          <div className="flex w-[290px] shrink-0 snap-start items-center justify-center rounded-2xl border border-dashed border-white/15 p-6 text-center">
            <Link to="/shop?deals=1" className="group inline-flex flex-col items-center gap-3 text-white/70 transition-colors hover:text-accent-300">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-white/15 transition-colors group-hover:border-accent-400/60">
                <ArrowRight className="h-5 w-5" strokeWidth={2.3} />
              </span>
              <span className="text-sm font-bold">{t("Lihat semua promo")}</span>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Trending / New arrivals tabs                                       */
/* ------------------------------------------------------------------ */

export function TrendingNewSection() {
  const { t } = useLang();
  const [tab, setTab] = useState<"trending" | "new">("trending");
  const items = tab === "trending" ? trending(4) : newArrivals(4);
  return (
    <section className="container-x py-20 sm:py-28" aria-label={t("Sedang tren dan baru")}>
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-14">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-700">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" /> {t("Sinyal segar")}
            </p>
            <h2 className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink-950 sm:text-[2.6rem]">
              {t("Yang lagi")} <span className="serif-accent text-accent-700">{t("ramai sekarang.")}</span>
            </h2>
          </div>

          <div className="inline-flex rounded-full border border-ink-950/10 bg-white p-1">
            {(
              [
                { id: "trending", label: t("Sedang tren"), icon: Flame },
                { id: "new", label: t("Baru datang"), icon: Sparkles },
              ] as const
            ).map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                aria-pressed={tab === tb.id}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors",
                  tab === tb.id ? "text-white" : "text-ink-500 hover:text-ink-950"
                )}
              >
                {tab === tb.id && (
                  <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-ink-950" transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} />
                )}
                <tb.icon className="relative h-3.5 w-3.5" strokeWidth={2.5} />
                <span className="relative">{tb.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How it works (3 steps)                                             */
/* ------------------------------------------------------------------ */

export function TestimonialsSection() {
  const { t } = useLang();
  const steps: { icon: LucideIcon; title: string; body: string }[] = [
    {
      icon: ShoppingBag,
      title: t("Pilih produkmu"),
      body: t("Telusuri katalog, bandingkan harga, dan masukkan produk yang kamu butuhkan ke keranjang."),
    },
    {
      icon: QrCode,
      title: t("Checkout & bayar QRIS"),
      body: t("Isi data singkat di halaman checkout, lalu selesaikan pembayaran QRIS lewat bot Telegram @lacukbot."),
    },
    {
      icon: PackageCheck,
      title: t("Produk dikirim"),
      body: t("Setelah pembayaran terkonfirmasi, produk dikirim otomatis atau diproses admin — sesuai label di halaman produknya."),
    },
  ];
  return (
    <section className="bg-paper-2/60 py-20 sm:py-28" aria-label={t("Cara belanja")}>
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={t("Cara belanja")}
            title={
              <>
                {t("Belanja di sini")} <span className="serif-accent text-accent-700">{t("gampang.")}</span>
              </>
            }
            sub={t("Tiga langkah dari katalog sampai produk di tanganmu.")}
          />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <div className="group relative h-full rounded-2xl border border-ink-950/[0.07] bg-white p-6 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                <span className="absolute right-5 top-4 font-display text-4xl font-extrabold text-ink-950/[0.06]">{i + 1}</span>
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-ink-950 text-accent-400 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <s.icon className="h-5 w-5" strokeWidth={2.1} />
                </div>
                <h3 className="font-display text-[15px] font-bold text-ink-950">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA band                                                           */
/* ------------------------------------------------------------------ */

export function CtaSection() {
  const { t } = useLang();
  return (
    <section className="container-x pb-24 pt-4 sm:pb-32">
      <Reveal>
        <div className="dot-grid relative overflow-hidden rounded-[2.5rem] bg-ink-950 px-7 py-16 text-center text-white sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-400/[0.12] blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[#4e5ff2]/[0.14] blur-[90px]" />
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            {t("Produk yang kamu cari belum ada?")} <span className="serif-accent text-accent-300">{t("Minta saja.")}</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
            {t("Restok dan produk baru mengikuti permintaan pelanggan. Sampaikan kebutuhanmu — yang paling sering diminta kami dahulukan.")}
          </p>
          <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://t.me/lacukbot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-[52px] items-center gap-2 rounded-full bg-accent-400 px-7 font-display text-[15px] font-bold text-ink-950 transition-all hover:bg-accent-300 active:scale-[0.98]"
            >
              <Headset className="h-4.5 w-4.5" strokeWidth={2.3} />
              {t("Minta produk ke admin")}
            </a>
            <Link
              to="/shop"
              className="inline-flex h-[52px] items-center gap-2 rounded-full border border-white/18 px-7 font-display text-[15px] font-bold text-white transition-all hover:border-accent-400/60 hover:text-accent-300 active:scale-[0.98]"
            >
              {t("Lihat semua produk")}
              <ArrowRight className="h-4.5 w-4.5" strokeWidth={2.4} />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
