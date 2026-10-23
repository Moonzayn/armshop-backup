import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  HelpCircle,
  LayoutGrid,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { CATEGORIES } from "@/data/products";
import { cn } from "@/utils/cn";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/i18n";
import { CategoryArt } from "./ProductArt";
import { Logo, PrimaryButton } from "./ui";

/* Language switch (ID default / EN). */
export function LangSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border p-0.5 text-[11px] font-extrabold",
        dark ? "border-white/15 text-white/60" : "border-ink-950/10 bg-white text-ink-400"
      )}
      role="group"
      aria-label="Language / Bahasa"
    >
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition-colors",
            lang === l ? "bg-accent-400 text-ink-950" : "hover:text-current"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Navbar() {
  const { count, setCartOpen, setSearchOpen, setAccountOpen } = useStore();
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const onHome = location.pathname === "/";
  const dark = onHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setCatOpen(false);
  }, [location]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const linkCls = (active: boolean) =>
    cn(
      "link-underline text-[13px] font-semibold transition-colors",
      dark ? (active ? "text-accent-300" : "text-white/75 hover:text-white") : active ? "text-ink-950" : "text-ink-500 hover:text-ink-950"
    );

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] transition-all duration-500",
          dark ? "bg-transparent" : "border-b border-ink-950/[0.07] bg-paper/85 shadow-[0_1px_0_rgba(10,10,12,0.02)] backdrop-blur-xl"
        )}
      >
        <nav className="container-x flex h-[68px] items-center justify-between gap-4" aria-label="Main navigation">
          <Logo dark={dark} />

          {/* desktop links */}
          <div className="hidden items-center gap-7 lg:flex">
            <NavLink to="/shop" className={({ isActive }) => cn(linkCls(isActive), isActive && "is-active")}>
              {t("Semua Produk")}
            </NavLink>

            <div ref={catRef} className="relative">
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
                className={cn("inline-flex items-center gap-1", linkCls(location.search.includes("cat=")))}
              >
                {t("Kategori")}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", catOpen && "rotate-180")} strokeWidth={2.6} />
              </button>

              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-full mt-4 w-[560px] -translate-x-1/2 rounded-3xl border border-ink-950/[0.08] bg-white p-4 shadow-lift"
                  >
                    <div className="grid grid-cols-3 gap-1.5">
                      {CATEGORIES.map((c) => (
                        <Link
                          key={c.id}
                          to={`/shop?cat=${c.id}`}
                          className="group flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-ink-950/[0.04]"
                        >
                          <CategoryArt category={c.id} className="h-10 w-10 shrink-0" />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-bold text-ink-950">{c.short}</span>
                            <span className="line-clamp-2 text-[11px] leading-snug text-ink-400">{c.blurb}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      to="/shop"
                      className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-ink-950 py-3 text-xs font-bold text-white transition-opacity hover:opacity-85"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" /> {t("Lihat semua katalog")}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NavLink to="/help" className={({ isActive }) => cn(linkCls(isActive), isActive && "is-active", "inline-flex items-center gap-1.5")}>
              <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.6} /> {t("Bantuan")}
            </NavLink>
          </div>

          {/* actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="mr-1 hidden xl:inline-flex">
              <LangSwitch dark={dark} />
            </span>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t("Cari produk")}
              className={cn(
                "group inline-flex h-10 items-center gap-2.5 rounded-full border pl-3.5 pr-2 text-[13px] font-medium transition-all duration-300",
                dark
                  ? "border-white/15 bg-white/[0.06] text-white/60 hover:border-white/30 hover:text-white"
                  : "border-ink-950/10 bg-white text-ink-400 hover:border-ink-950/25 hover:text-ink-900"
              )}
            >
              <Search className="h-4 w-4" strokeWidth={2.3} />
              <span className="hidden md:inline">{t("Cari produk digital…")}</span>
              <kbd
                className={cn(
                  "hidden rounded-md px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-wide md:inline",
                  dark ? "bg-white/10 text-white/70" : "bg-ink-950/[0.06] text-ink-500"
                )}
              >
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              aria-label={t("Akun")}
              className={cn(
                "hidden h-10 w-10 place-items-center rounded-full border transition-all duration-300 sm:grid",
                dark ? "border-white/15 text-white/75 hover:border-white/35 hover:text-white" : "border-ink-950/10 bg-white text-ink-500 hover:border-ink-950/25 hover:text-ink-950"
              )}
            >
              <UserRound className="h-[17px] w-[17px]" strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={t("Buka keranjang, {count} item", { count })}
              className={cn(
                "relative grid h-10 w-10 place-items-center rounded-full border transition-all duration-300",
                dark ? "border-white/15 text-white hover:border-accent-400/60 hover:text-accent-300" : "border-ink-950/10 bg-white text-ink-900 hover:border-accent-600/50"
              )}
            >
              <ShoppingBag className="h-[17px] w-[17px]" strokeWidth={2.2} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-400 px-1 text-[10px] font-extrabold text-ink-950 shadow-sm"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("Buka menu")}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full border lg:hidden",
                dark ? "border-white/15 text-white" : "border-ink-950/10 bg-white text-ink-900"
              )}
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile menu                                                        */
/* ------------------------------------------------------------------ */

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setSearchOpen } = useStore();
  const { t } = useLang();
  const navigate = useNavigate();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-y-auto bg-paper shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-ink-950/[0.07] px-5 py-4">
              <Logo />
              <button aria-label="Close menu" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-ink-950/[0.05]">
                <X className="h-4.5 w-4.5" strokeWidth={2.4} />
              </button>
            </div>

            <div className="px-5 py-5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setSearchOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-ink-950/10 bg-white px-4 py-3.5 text-sm font-medium text-ink-400"
              >
                <Search className="h-4 w-4" /> {t("Cari produk digital…")}
              </button>

              <nav className="mt-6 space-y-1" aria-label="Mobile">
                {[
                  { to: "/", label: t("Beranda") },
                  { to: "/shop", label: t("Semua Produk") },
                  { to: "/help", label: t("Pusat Bantuan") },
                ].map((l) => (
                  <Link key={l.label} to={l.to} className="block rounded-xl px-3 py-3 font-display text-lg font-bold text-ink-950 transition-colors hover:bg-ink-950/[0.04]">
                    {l.label}
                  </Link>
                ))}
              </nav>

              <p className="mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">{t("Kategori")}</p>
              <div className="grid grid-cols-1 gap-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/shop?cat=${c.id}`);
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ink-950/[0.04]"
                  >
                    <CategoryArt category={c.id} className="h-9 w-9" />
                    <span>
                      <span className="block text-sm font-bold text-ink-950">{c.name}</span>
                      <span className="line-clamp-1 text-[11px] text-ink-400">{c.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 px-3">
                <PrimaryButton className="w-full" onClick={() => { onClose(); navigate("/shop"); }}>
                  {t("Jelajahi produk")}
                </PrimaryButton>
                <div className="mt-5 flex justify-center">
                  <LangSwitch />
                </div>
                <p className="mt-4 text-center text-[11px] text-ink-400">{t("Katalog resmi La Cukai Shop — harga sinkron dengan bot Telegram")}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Account dialog — orders run through the Telegram bot               */
/* ------------------------------------------------------------------ */

export function AccountDialog() {
  const { accountOpen, setAccountOpen } = useStore();
  const { t } = useLang();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAccountOpen(false);
    if (accountOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [accountOpen, setAccountOpen]);

  return (
    <AnimatePresence>
      {accountOpen && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={t("Akun")}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setAccountOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-lift sm:p-9"
          >
            <button aria-label={t("Tutup")} onClick={() => setAccountOpen(false)} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-ink-950/[0.05] text-ink-500 hover:bg-ink-950/10">
              <X className="h-4.5 w-4.5" strokeWidth={2.4} />
            </button>
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-ink-950 text-accent-400">
              <UserRound className="h-5.5 w-5.5" strokeWidth={2.2} />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink-950">{t("Pesan lewat Telegram")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {t("Semua pemesanan & pembayaran La Cukai Shop ditangani lewat bot Telegram @lacukbot — pembayaran QRIS, pesanan tercatat, dan dibantu admin sampai selesai. Keranjangmu di web ini tersimpan di browser ini, jadi kamu bisa menyusun pesanan di sini lalu menyelesaikannya di bot.")}
            </p>
            <a
              href="https://t.me/lacukbot"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-400 px-6 font-display text-sm font-bold text-ink-950 shadow-[0_10px_30px_-10px_rgba(56,189,248,0.55)] transition-all duration-300 hover:bg-accent-300 active:scale-[0.98]"
            >
              {t("Buka Bot Telegram @lacukbot")}
            </a>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-400">
              {t("Belum punya Telegram? Unduh gratis di telegram.org, lalu cari @lacukbot.")}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
