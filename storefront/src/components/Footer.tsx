import { Link } from "react-router-dom";
import { ArrowUpRight, Info, QrCode, Send, ShieldCheck } from "lucide-react";
import { CATEGORIES } from "@/data/products";
import { useLang } from "@/i18n";
import { Logo } from "./ui";

const BOT_URL = "https://t.me/lacukbot";
const CHANNEL_URL = "https://t.me/+7k-ttlDu8BJlYWVl";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="relative overflow-hidden bg-ink-950 text-white">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-accent-400/[0.07] blur-3xl" />

      <div className="container-x relative">
        {/* channel strip */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/[0.08] py-12 md:flex-row md:items-center">
          <div className="max-w-md">
            <h3 className="font-display text-2xl font-bold tracking-tight">
              {t("Info stok & produk baru,")} <span className="serif-accent text-accent-300">{t("duluan.")}</span>
            </h3>
            <p className="mt-2 text-sm text-white/50">
              {t("Pengumuman restok dan produk baru dibagikan lewat channel Telegram La Cukai — gratis, tanpa spam.")}
            </p>
          </div>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-accent-400 px-6 font-display text-sm font-bold text-ink-950 transition-all hover:bg-accent-300 active:scale-[0.98]"
          >
            <Send className="h-4.5 w-4.5" strokeWidth={2.3} />
            {t("Gabung Channel Telegram")}
          </a>
        </div>

        {/* columns */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">
              {t("Produk digital pilihan dengan harga rupiah yang transparan, katalog yang selalu sinkron, dan proses pemesanan yang jelas dari awal sampai produk terkirim.")}
            </p>
            <div className="mt-6 space-y-2 text-[13px] text-white/55">
              <p>
                <a href={BOT_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 transition-colors hover:text-accent-300">
                  <Send className="h-4 w-4 text-accent-400" /> {t("Bot Telegram: @lacukbot")}
                </a>
              </p>
              <p>
                <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 transition-colors hover:text-accent-300">
                  <Send className="h-4 w-4 text-accent-400" /> {t("Channel: La Cukai Notif")}
                </a>
              </p>
            </div>
          </div>

          <nav aria-label={t("Katalog")} className="space-y-2.5">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">{t("Katalog")}</p>
            {CATEGORIES.slice(0, 6).map((c) => (
              <p key={c.id}>
                <Link to={`/shop?cat=${c.id}`} className="group inline-flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-accent-300">
                  {c.name}
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </p>
            ))}
          </nav>

          <nav aria-label={t("Toko")} className="space-y-2.5">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">{t("Toko")}</p>
            {[
              { to: "/shop", label: t("Semua produk") },
              { to: "/shop?sort=popular", label: t("Produk terlaris") },
              { to: "/shop?sort=newest", label: t("Baru datang") },
              { to: "/help", label: t("Pusat bantuan & FAQ") },
            ].map((l) => (
              <p key={l.label}>
                <Link to={l.to} className="group inline-flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-accent-300">
                  {l.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </p>
            ))}
          </nav>

          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">{t("Dukungan & legal")}</p>
            <nav aria-label={t("Dukungan")} className="space-y-2.5">
              {[
                { to: "/help", label: t("Tanya Jawab") },
                { to: "/terms", label: t("Syarat & Ketentuan") },
                { to: "/privacy", label: t("Kebijakan Privasi") },
              ].map((l) => (
                <p key={l.label}>
                  <Link to={l.to} className="text-sm text-white/60 transition-colors hover:text-accent-300">{l.label}</Link>
                </p>
              ))}
              <p>
                <a href={BOT_URL} target="_blank" rel="noreferrer" className="text-sm text-white/60 transition-colors hover:text-accent-300">
                  {t("Hubungi admin")}
                </a>
              </p>
            </nav>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-accent-300">
                <QrCode className="h-3.5 w-3.5" /> {t("Pembayaran QRIS")}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/50">
                {t("Semua pembayaran diproses aman lewat QRIS via KlikQRIS — bisa dari e-wallet & m-banking apa pun.")}
              </p>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/[0.08] py-7 md:flex-row md:items-center">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} La Cukai Shop — armshop.my.id</p>
          <p className="flex max-w-xl items-start gap-2 text-[11.5px] leading-relaxed text-white/40">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-400/80" />
            {t("Katalog web ini tersinkron otomatis dengan bot Telegram @lacukbot dan panel admin. Merek-merek yang disebut adalah milik pemiliknya masing-masing.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
