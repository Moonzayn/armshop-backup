import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  CreditCard,
  Loader2,
  PackageCheck,
  PackageSearch,
  QrCode,
  RefreshCw,
  Send,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import { useStore } from "@/context/StoreContext";
import { EmptyState } from "@/components/ui";
import { cn } from "@/utils/cn";
import { tr, useLang } from "@/i18n";

const BOT_URL = "https://t.me/lacukbot";

interface WebOrderItem {
  product_name: string;
  qty: number;
  price: number;
}

interface WebOrder {
  orderId: string;
  status: string;
  items: WebOrderItem[];
  amount: number;
  discount: number;
  total: number;
  qrisImage: string;
  qrisUrl: string;
  expiredAt: string | null;
  paidAt: string | null;
  customer: { name: string; email: string; contact: string };
  deliveredText: string;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function OrderPage() {
  const { t, lang } = useLang();
  const { ref } = useParams();
  const { toast } = useStore();
  const [order, setOrder] = useState<WebOrder | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const statusRef = useRef<string>("");

  const load = useCallback(async (silent = false) => {
    if (!ref) return;
    if (!silent) setChecking(true);
    try {
      const res = await fetch(`/api/storefront/order/${encodeURIComponent(ref)}`);
      if (res.status === 404) {
        setState("notfound");
        return;
      }
      const data = (await res.json()) as WebOrder;
      setOrder(data);
      statusRef.current = data.status;
      setState("ok");
    } catch {
      setState((prev) => (prev === "ok" ? prev : "error"));
    } finally {
      if (!silent) setChecking(false);
    }
  }, [ref]);

  useEffect(() => {
    load();
  }, [load]);

  /* polling status selama pending */
  useEffect(() => {
    if (state !== "ok") return;
    const iv = window.setInterval(() => {
      if (statusRef.current === "pending") load(true);
    }, 5000);
    return () => window.clearInterval(iv);
  }, [state, load]);

  /* tick countdown */
  useEffect(() => {
    if (order?.status !== "pending") return;
    const iv = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, [order?.status]);

  useEffect(() => {
    document.title = order
      ? `${tr("Pesanan")} ${order.orderId} — La Cukai Shop`
      : `${tr("Pesanan tidak ditemukan")} — La Cukai Shop`;
  }, [order, lang]);

  if (state === "loading") {
    return (
      <main className="container-x grid min-h-screen place-items-center pb-20 pt-[110px]">
        <p className="flex items-center gap-2.5 text-sm font-semibold text-ink-500">
          <Loader2 className="h-4.5 w-4.5 animate-spin text-accent-600" /> {t("Memuat pesanan…")}
        </p>
      </main>
    );
  }

  if (state === "notfound" || state === "error" || !order) {
    return (
      <main className="container-x grid min-h-screen place-items-center pb-20 pt-[110px]">
        <div className="w-full max-w-lg">
          <EmptyState
            icon={PackageSearch}
            title={t("Referensi pesanan tidak ditemukan")}
            body={t("Kode pesanan ini tidak ada di sistem kami. Periksa lagi kodenya, atau hubungi admin lewat bot Telegram bila kamu sudah membayar.")}
            action={
              <Link to="/shop" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-950 px-7 font-display text-sm font-bold text-white hover:opacity-85">
                {t("Kembali ke katalog")} <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.orderId);
      setCopied(true);
      toast(t("Referensi pesanan disalin"));
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast(t("Gagal menyalin — salin kodenya manual"), "error");
    }
  };

  const paid = order.status === "paid";
  const pending = order.status === "pending";
  const dead = order.status === "expired" || order.status === "cancelled";
  const remainMs = order.expiredAt ? new Date(order.expiredAt).getTime() - now : 0;
  const qrSrc = order.qrisImage || order.qrisUrl;
  const contactEcho = order.customer.contact || order.customer.email;

  return (
    <main className="min-h-screen pb-24 pt-[110px]">
      <div className="container-x max-w-3xl">
        {/* header */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="text-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.55, delay: 0.15, type: "spring", bounce: 0.45 }}
            className={cn(
              "mx-auto grid h-16 w-16 place-items-center rounded-full",
              paid
                ? "bg-accent-400 shadow-[0_16px_40px_-10px_rgba(56,189,248,0.7)]"
                : dead
                  ? "bg-ink-950/[0.06]"
                  : "bg-ink-950"
            )}
          >
            {paid ? (
              <Check className="h-7 w-7 text-ink-950" strokeWidth={3.4} />
            ) : dead ? (
              <TriangleAlert className="h-6.5 w-6.5 text-ink-400" strokeWidth={2.2} />
            ) : (
              <QrCode className="h-6.5 w-6.5 text-accent-400" strokeWidth={2.2} />
            )}
          </motion.span>
          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
            {paid ? t("Pembayaran diterima.") : dead ? t("Tagihan sudah tidak berlaku.") : t("Selesaikan pembayaranmu.")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
            {paid
              ? t("Terima kasih, {name} — pembayaranmu sudah terkonfirmasi. Detail pesananmu ada di bawah.", { name: order.customer.name.split(" ")[0] || "" })
              : dead
                ? t("Tagihan QRIS untuk pesanan ini sudah kedaluwarsa atau dibatalkan. Buat pesanan baru dari katalog bila masih berminat.")
                : t("Pindai kode QR di bawah dengan e-wallet atau m-banking apa pun. Status halaman ini terkonfirmasi otomatis begitu pembayaran masuk.")}
          </p>

          <button
            type="button"
            onClick={copy}
            className="group mt-7 inline-flex items-center gap-3 rounded-2xl border border-ink-950/12 bg-white px-6 py-4 shadow-card transition-all hover:border-ink-950/30"
            aria-label={t("Salin referensi pesanan")}
          >
            <span className="font-mono text-2xl font-bold tracking-[0.14em] text-ink-950">{order.orderId}</span>
            <span className={cn("grid h-9 w-9 place-items-center rounded-full transition-colors", copied ? "bg-accent-400 text-ink-950" : "bg-ink-950/[0.05] text-ink-500 group-hover:bg-ink-950 group-hover:text-white")}>
              {copied ? <Check className="h-4 w-4" strokeWidth={3} /> : <Copy className="h-4 w-4" strokeWidth={2.3} />}
            </span>
          </button>
        </motion.div>

        {/* panel QRIS (pending) */}
        {pending && (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="mt-8 rounded-3xl border border-ink-950/[0.07] bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="shrink-0 rounded-2xl border border-ink-950/[0.08] bg-white p-3">
                {qrSrc ? (
                  <img src={qrSrc} alt={t("Kode QRIS pembayaran")} className="h-52 w-52 rounded-xl object-contain" />
                ) : (
                  <div className="grid h-52 w-52 place-items-center rounded-xl bg-ink-950/[0.03] text-ink-400">
                    <QrCode className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">{t("Total yang harus dibayar")}</p>
                <p className="mt-1.5 font-display text-4xl font-extrabold tracking-tight text-ink-950">{formatIDR(order.total)}</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-400">
                  {t("Bayar sesuai nominal persis ini — sudah termasuk kode unik untuk pencocokan otomatis, bukan biaya tambahan.")}
                </p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-warn-400/[0.12] px-4 py-2 text-xs font-bold text-ink-700">
                  <Clock3 className="h-3.5 w-3.5 text-warn-400" strokeWidth={2.4} />
                  {t("Selesaikan dalam")} <span className="font-mono text-[13px] tabular-nums">{fmtCountdown(remainMs)}</span>
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                  <button
                    type="button"
                    onClick={() => load()}
                    disabled={checking}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-950 px-5 font-display text-[13px] font-bold text-white transition-all hover:opacity-85 disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-4 w-4", checking && "animate-spin")} />
                    {checking ? t("Memeriksa…") : t("Saya sudah bayar — periksa status")}
                  </button>
                  <p className="flex items-center gap-1.5 text-[11px] text-ink-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> {t("Status diperiksa otomatis tiap beberapa detik.")}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* panel lunas */}
        {paid && (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="mt-8 rounded-3xl border border-accent-600/25 bg-accent-50 p-6 sm:p-7">
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold text-ink-950">
              <PackageCheck className="h-5 w-5 text-accent-600" strokeWidth={2.2} /> {t("Status pesanan")}
            </h2>
            {order.deliveredText ? (
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-700">{order.deliveredText}</pre>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{t("Pesananmu sedang diproses. Kamu akan dihubungi lewat kontak yang kamu isi saat checkout.")}</p>
            )}
            {contactEcho && (
              <p className="mt-3 text-xs text-ink-500">
                {t("Kontak terdaftar:")} <strong className="text-ink-900">{contactEcho}</strong>
              </p>
            )}
          </motion.section>
        )}

        {/* items */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} aria-label={t("Isi pesanan")} className="mt-6 rounded-3xl border border-ink-950/[0.07] bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-lg font-bold text-ink-950">{t("Isi pesanan")}</h2>
          <ul className="mt-5 divide-y divide-ink-950/[0.06]">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-bold text-ink-950">{item.product_name}</p>
                  <p className="mt-1 text-xs text-ink-400">{t("Jumlah")} {item.qty}</p>
                </div>
                <span className="shrink-0 font-display text-sm font-extrabold tabular-nums text-ink-950">{formatIDR(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-1.5 border-t border-ink-950/[0.08] pt-5 text-[13px]">
            <div className="flex justify-between text-ink-500">
              <dt>{t("Subtotal")}</dt>
              <dd className="tabular-nums">{formatIDR(order.amount)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-accent-700">
                <dt>{t("Diskon promo")}</dt>
                <dd className="tabular-nums">−{formatIDR(order.discount)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1.5">
              <dt className="font-display text-sm font-bold text-ink-950">{paid || dead ? t("Total") : t("Total bayar")}</dt>
              <dd className="font-display text-xl font-extrabold tabular-nums text-ink-950">{formatIDR(order.total)}</dd>
            </div>
            {pending && (
              <p className="pt-1 text-right text-[11px] text-ink-400">{t("Termasuk kode unik — lihat nominal besar di panel QR di atas.")}</p>
            )}
          </dl>
        </motion.section>

        {/* langkah berikutnya */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} aria-label={t("Cara menyelesaikan pesanan")} className="mt-6 rounded-3xl border border-ink-950/[0.07] bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-lg font-bold text-ink-950">{paid ? t("Langkah selanjutnya") : t("Cara menyelesaikan pesanan")}</h2>
          <ol className="mt-6 space-y-5">
            {(paid
              ? [
                  { icon: CreditCard, title: t("Pembayaran terkonfirmasi"), body: t("Sistem menerima pembayaranmu secara otomatis — tidak perlu mengirim bukti transfer.") },
                  { icon: PackageCheck, title: t("Pesanan diproses"), body: t("Produk digital dikirim otomatis; produk manual diproses admin dan kamu dihubungi lewat kontak terdaftar.") },
                  { icon: Send, title: t("Butuh bantuan?"), body: t("Hubungi admin lewat bot Telegram @lacukbot dan sertakan kode pesananmu.") },
                ]
              : [
                  { icon: QrCode, title: t("Pindai kode QR"), body: t("Gunakan e-wallet atau m-banking apa pun — nominalnya harus sama persis dengan total di panel QR.") },
                  { icon: Timer, title: t("Konfirmasi otomatis"), body: t("Begitu pembayaran masuk, halaman ini berubah sendiri dan pesanan diteruskan untuk diproses.") },
                  { icon: Send, title: t("Lewat batas waktu?"), body: t("Buat pesanan baru dari katalog, atau hubungi admin lewat bot Telegram @lacukbot bila kamu merasa sudah membayar.") },
                ]
            ).map((step, i) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ink-950 text-accent-400">
                  <step.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink-950">{i + 1}. {step.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-500">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/shop" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-950 px-7 font-display text-sm font-bold text-white hover:opacity-85">
              {t("Lanjut belanja")} <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={BOT_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full border border-ink-950/15 px-6 font-display text-sm font-bold text-ink-700 transition-colors hover:border-ink-950/40">
              <Send className="h-4 w-4" /> {t("Hubungi admin")}
            </a>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
