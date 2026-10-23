import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Check,
  ClipboardList,
  Info,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  PackageOpen,
  QrCode,
  UserRound,
} from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { formatIDR } from "@/lib/format";
import { cn } from "@/utils/cn";
import { useStore } from "@/context/StoreContext";
import { ProductArt } from "@/components/ProductArt";
import { DeliveryChip, EmptyState } from "@/components/ui";
import { tr, useLang } from "@/i18n";

interface FormState {
  name: string;
  email: string;
  whatsapp: string;
  notes: string;
  agree: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

export default function CheckoutPage() {
  const { t } = useLang();
  const { lines, subtotal, discount, total, promo, count, createWebOrder, clearCart, toast, applyPromo, removePromo } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ name: "", email: "", whatsapp: "", notes: "", agree: false });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [placing, setPlacing] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  async function onApplyPromo(e: React.FormEvent) {
    e.preventDefault();
    const cd = promoInput.trim();
    if (!cd || applyingPromo) return;
    setApplyingPromo(true);
    const ok = await applyPromo(cd);
    setApplyingPromo(false);
    if (ok) setPromoInput("");
  }
  
  const instantCount = useMemo(() => lines.filter((l) => l.deliveryType === "instant").reduce((s2, l) => s2 + l.qty, 0), [lines]);
  const manualCount = useMemo(() => lines.filter((l) => l.deliveryType !== "instant").reduce((s2, l) => s2 + l.qty, 0), [lines]);

  const validate = (state: FormState): Errors => {
    const e: Errors = {};
    if (state.name.trim().length < 2) e.name = tr("Isi nama lengkapmu (min. 2 karakter).");
    if (!/^\S+@\S+\.\S+$/.test(state.email.trim())) e.email = tr("Isi email yang valid — detail pengiriman dikirim ke sini.");
    if (state.whatsapp.trim() && !/^\+?[0-9\s-]{8,16}$/.test(state.whatsapp.trim()))
      e.whatsapp = tr("Isi nomor WhatsApp yang valid (angka saja, mis. 0812 3456 7890), atau kosongkan.");
    if (!state.agree) e.agree = tr("Centang dulu persetujuannya untuk melanjutkan pembayaran.");
    return e;
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (touched[key]) setErrors(validate(next));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(form);
    setErrors(e);
    setTouched({ name: true, email: true, whatsapp: true, agree: true });
    if (Object.keys(e).length > 0) return;
    setPlacing(true);
    try {
      const data = await createWebOrder({
        name: form.name.trim(),
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      clearCart();
      navigate(`/order/${data.orderId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : tr("Gagal membuat pesanan. Coba lagi."), "error");
      setPlacing(false);
    }
  };

  if (lines.length === 0) {
    return (
      <main className="container-x grid min-h-screen place-items-center pb-20 pt-[110px]">
        <div className="w-full max-w-lg">
          <EmptyState
            icon={PackageOpen}
            title={t("Belum ada yang bisa di-checkout")}
            body={t("Keranjangmu masih kosong. Tambahkan produk dulu — pilihanmu tersimpan di perangkat ini.")}
            action={
              <Link to="/shop" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-950 px-7 font-display text-sm font-bold text-white hover:opacity-85">
                {t("Jelajahi katalog")} <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  const err = (key: keyof FormState) => touched[key] && errors[key];

  return (
    <main className="min-h-screen pb-24 pt-[96px]">
      <div className="container-x max-w-5xl">
        <Link to="/shop" className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-ink-400 transition-colors hover:text-ink-950">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("Lanjut belanja")}
        </Link>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">Checkout</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-500">
              <Lock className="h-3.5 w-3.5 text-accent-600" /> {t("Pembayaran QRIS aman — terkonfirmasi otomatis setelah kamu membayar.")}
            </p>
          </div>
          <p className="rounded-full bg-ink-950/[0.05] px-4 py-2 text-xs font-bold text-ink-600">{count} {t("item")} · {formatIDR(total)}</p>
        </div>

        <form onSubmit={submit} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
          {/* left column */}
          <div className="space-y-6">
            {/* step 1: contact */}
            <section aria-label={t("Kontak & pengiriman")} className="rounded-3xl border border-ink-950/[0.07] bg-white p-6 shadow-card sm:p-8">
              <header className="mb-6 flex items-center gap-3.5">
                <StepDot n={1} />
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-950">{t("Kontak & pengiriman")}</h2>
                  <p className="text-xs text-ink-400">{t("Produk digital dikirim ke kontak ini.")}</p>
                </div>
              </header>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("Nama lengkap")} error={err("name")} icon={UserRound}>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    onBlur={() => { setTouched((t) => ({ ...t, name: true })); setErrors(validate(form)); }}
                    placeholder={t("mis. Rizky Pratama")}
                    autoComplete="name"
                    aria-invalid={Boolean(err("name"))}
                    className={inputCls(Boolean(err("name")))}
                  />
                </Field>
                <Field label={t("Alamat email")} error={err("email")} icon={Mail}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    onBlur={() => { setTouched((t) => ({ ...t, email: true })); setErrors(validate(form)); }}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    aria-invalid={Boolean(err("email"))}
                    className={inputCls(Boolean(err("email")))}
                  />
                </Field>
                <Field label={t("WhatsApp (opsional)")} error={err("whatsapp")} icon={MessageCircle} hint={t("Dipakai untuk update produk yang diproses manual.")}>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                    onBlur={() => { setTouched((t) => ({ ...t, whatsapp: true })); setErrors(validate(form)); }}
                    placeholder="0812 3456 7890"
                    autoComplete="tel"
                    aria-invalid={Boolean(err("whatsapp"))}
                    className={inputCls(Boolean(err("whatsapp")))}
                  />
                </Field>
                <Field label={t("Catatan pesanan (opsional)")} icon={ClipboardList} hint={t("Contoh: data yang dibutuhkan untuk memproses pesananmu.")}>
                  <input
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder={t("Ada yang perlu kami tahu?")}
                    className={inputCls(false)}
                  />
                </Field>
              </div>

              {(instantCount > 0 || manualCount > 0) && (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {instantCount > 0 && (
                    <p className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3.5 py-2 text-[11px] font-bold text-accent-700 ring-1 ring-accent-500/30">
                      <Check className="h-3.5 w-3.5" /> {t("{n} pengiriman instan ke emailmu", { n: instantCount })}
                    </p>
                  )}
                  {manualCount > 0 && (
                    <p className="inline-flex items-center gap-2 rounded-full bg-ink-950/[0.04] px-3.5 py-2 text-[11px] font-bold text-ink-600 ring-1 ring-ink-950/10">
                      <Loader2 className="h-3.5 w-3.5" /> {t("{n} item diproses manual oleh tim kami", { n: manualCount })}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* step 2: payment via Telegram bot */}
            <section aria-label={t("Pembayaran")} className="rounded-3xl border border-ink-950/[0.07] bg-white p-6 shadow-card sm:p-8">
              <header className="mb-6 flex items-center gap-3.5">
                <StepDot n={2} />
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-950">{t("Pembayaran")}</h2>
                  <p className="text-xs text-ink-400">{t("Kode QR tampil setelah pesanan dibuat di halaman ini.")}</p>
                </div>
              </header>

              <div className="flex items-start gap-3.5 rounded-2xl border border-accent-600/25 bg-accent-50 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-950 text-accent-400">
                  <QrCode className="h-4.5 w-4.5" strokeWidth={2.2} />
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-ink-950">{t("QRIS — semua e-wallet & m-banking")}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-500">{t("Satu kode QR untuk semua aplikasi pembayaran. Pembayaran terverifikasi otomatis oleh sistem.")}</span>
                </span>
              </div>

              <ol className="mt-6 space-y-3.5">
                {[
                  t("Klik tombol Bayar di halaman ini — kode QRIS pesananmu dibuat."),
                  t("Pindai kode QR dengan e-wallet atau m-banking apa pun."),
                  t("Pembayaran terkonfirmasi otomatis — pesanan langsung diteruskan untuk diproses."),
                ].map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[13px] leading-relaxed text-ink-600">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-950 font-display text-[11px] font-extrabold text-accent-400">{idx + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>

              <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-ink-400">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t("Pembayaran diproses aman melalui KlikQRIS. Nominal yang kamu bayar sudah termasuk kode unik kecil untuk pencocokan otomatis — bukan biaya tambahan.")}
              </p>
            </section>
          </div>

          {/* right: summary */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-ink-950/[0.07] bg-white p-6 shadow-card sm:p-7">
              <h2 className="font-display text-lg font-bold text-ink-950">{t("Ringkasan pesanan")}</h2>

              <ul className="mt-5 max-h-[280px] space-y-3.5 overflow-y-auto pr-1">
                {lines.map((l) => {
                  const p = PRODUCTS.find((x) => x.id === l.productId);
                  return (
                    <li key={l.key} className="flex items-center gap-3">
                      {p && <ProductArt product={p} className="h-11 w-14 shrink-0" rounded="rounded-lg" compact />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-ink-950">{l.name}</p>
                        <p className="flex items-center gap-1.5 text-[11px] text-ink-400">
                          {l.variantLabel ? `${l.variantLabel} · ` : ""}×{l.qty}
                          <DeliveryChip type={l.deliveryType} className="scale-[0.82] origin-left" />
                        </p>
                      </div>
                      <span className="shrink-0 font-display text-[13px] font-extrabold tabular-nums text-ink-950">{formatIDR(l.unitPrice * l.qty)}</span>
                    </li>
                  );
                })}
              </ul>

              <dl className="mt-6 space-y-2 border-t border-ink-950/[0.08] pt-5 text-[13px]">
                <div className="flex justify-between text-ink-500">
                  <dt>{t("Subtotal")}</dt>
                  <dd className="font-semibold tabular-nums text-ink-900">{formatIDR(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-ink-500">
                  <dt>{t("Biaya layanan")}</dt>
                  <dd className="font-semibold text-good-600">{t("Gratis")}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-accent-700">
                    <dt className="inline-flex items-center gap-1.5"><BadgePercent className="h-3.5 w-3.5" /> {promo?.code}</dt>
                    <dd className="font-semibold tabular-nums">−{formatIDR(discount)}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between pt-2">
                  <dt className="font-display text-sm font-bold text-ink-950">{t("Total bayar")}</dt>
                  <dd className="font-display text-[26px] font-extrabold tabular-nums tracking-tight text-ink-950">{formatIDR(total)}</dd>
                </div>
              </dl>

              {/* promo */}
              {promo ? (
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-emerald-400/10 px-3 py-2 text-sm ring-1 ring-emerald-300/30">
                  <span className="inline-flex items-center gap-1.5 text-emerald-200">
                    <BadgePercent className="h-4 w-4" /> {t("Kode promo")}: <b>{promo.code}</b>
                  </span>
                  <button type="button" onClick={removePromo} className="text-xs font-semibold text-rose-300 hover:text-rose-200">
                    {t("Hapus")}
                  </button>
                </div>
              ) : (
                <form onSubmit={onApplyPromo} className="mt-4">
                  <label className="text-xs font-medium text-ink-300">{t("Punya kode promo?")}</label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder={t("Kode promo")}
                      className="min-w-0 flex-1 rounded-xl bg-navy-900/70 px-3 py-2 text-sm uppercase text-white ring-1 ring-white/10 outline-none placeholder:normal-case placeholder:text-ink-400 focus:ring-accent-400"
                    />
                    <button
                      type="submit"
                      disabled={applyingPromo || !promoInput.trim()}
                      className="shrink-0 rounded-xl bg-accent-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {applyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Pakai")}
                    </button>
                  </div>
                </form>
              )}

              {/* consent */}
              <label className={cn("mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors", err("agree") ? "border-deal-500/50 bg-deal-500/[0.04]" : "border-ink-950/[0.08] bg-ink-950/[0.015]")}>
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => set("agree", e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-ink-950"
                />
                <span className="text-xs leading-relaxed text-ink-600">
                  {t("Saya menyetujui")}{" "}
                  <Link to="/terms" className="font-bold text-ink-950 underline underline-offset-2">{t("Syarat & Ketentuan")}</Link> {t("dan")}{" "}
                  <Link to="/privacy" className="font-bold text-ink-950 underline underline-offset-2">{t("Kebijakan Privasi")}</Link>
                  {t(", dan memahami pesanan diproses setelah pembayaran QRIS terkonfirmasi.")}
                </span>
              </label>
              {err("agree") && <p className="mt-2 text-xs font-semibold text-deal-500">{errors.agree}</p>}

              <button
                type="submit"
                disabled={placing}
                className="mt-5 inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-accent-400 font-display text-[15px] font-bold text-ink-950 shadow-[0_14px_34px_-10px_rgba(56,189,248,0.6)] transition-all hover:bg-accent-300 active:scale-[0.99] disabled:opacity-60"
              >
                {placing ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" strokeWidth={2.6} />
                    {t("Membuat tagihan QRIS…")}
                  </>
                ) : (
                  <>
                    <QrCode className="h-4.5 w-4.5" strokeWidth={2.5} />
                    {t("Bayar dengan QRIS · {total}", { total: formatIDR(total) })}
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-400">
                {t("Kode QR pembayaran tampil di halaman berikutnya. Tagihan berlaku 60 menit.")}
              </p>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 flex items-start gap-2.5 rounded-2xl border border-ink-950/[0.07] bg-white p-4 text-xs leading-relaxed text-ink-500 shadow-card"
            >
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" />
              {t("Data kontakmu hanya dipakai untuk memproses pesanan ini dan tidak dibagikan ke pihak lain.")}
            </motion.p>
          </aside>
        </form>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function StepDot({ n }: { n: number }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-950 font-display text-sm font-extrabold text-accent-400">
      {n}
    </span>
  );
}

function Field({
  label,
  error,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string | false;
  hint?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-ink-500">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" strokeWidth={2.2} />
        {children}
      </span>
      {error ? (
        <span className="mt-1.5 block text-xs font-semibold text-deal-500">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[11px] text-ink-400">{hint}</span>
      ) : null}
    </label>
  );
}

function inputCls(invalid: boolean) {
  return cn(
    "h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-ink-950 placeholder:text-ink-300 focus:outline-none transition-colors",
    invalid ? "border-deal-500/60 focus:border-deal-500" : "border-ink-950/12 focus:border-accent-600"
  );
}
