import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, CreditCard, PackageCheck, Plus, Search, Send, ShieldCheck } from "lucide-react";
import { SITE_FAQS, SITE_FAQS_EN } from "@/data/products";
import { cn } from "@/utils/cn";
import { EmptyState, Reveal } from "@/components/ui";
import { useLang } from "@/i18n";

const BOT_URL = "https://t.me/lacukbot";
const CHANNEL_URL = "https://t.me/+7k-ttlDu8BJlYWVl";

/* ------------------------------------------------------------------ */
/*  Shared layout                                                      */
/* ------------------------------------------------------------------ */

function PageShell({ eyebrow, title, sub, children }: { eyebrow: string; title: ReactNode; sub?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen pb-24 pt-[96px]">
      <div className="container-x max-w-4xl">
        <Reveal>
          <header className="mb-12">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-700">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" /> {eyebrow}
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink-950 sm:text-5xl">{title}</h1>
            {sub && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-500">{sub}</p>}
          </header>
        </Reveal>
        {children}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Help center                                                        */
/* ------------------------------------------------------------------ */

export function HelpPage() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState<number | null>(0);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    document.title = `${t("Pusat Bantuan")} — La Cukai Shop`;
  }, [t, lang]);

  const faqs = lang === "en" ? SITE_FAQS_EN : SITE_FAQS;
  const shown = faqs.filter((f) => (f.q + " " + f.a).toLowerCase().includes(filter.toLowerCase()));

  return (
    <PageShell
      eyebrow={t("Pusat Bantuan")}
      title={
        <>
          {t("Ada yang bisa")} <span className="serif-accent text-accent-700">{t("kami bantu?")}</span>
        </>
      }
      sub={t("Jawaban untuk pertanyaan yang paling sering diajukan. Masih bingung? Admin siap membantu lewat bot Telegram.")}
    >
      {/* search */}
      <Reveal>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-300" strokeWidth={2.3} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("Cari pertanyaan… mis. pembayaran, pengiriman, refund")}
            className="h-14 w-full rounded-full border border-ink-950/10 bg-white pl-12 pr-5 text-sm text-ink-950 shadow-card placeholder:text-ink-300 focus:border-accent-600 focus:outline-none"
          />
        </label>
      </Reveal>

      {/* how to buy */}
      <Reveal delay={60}>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Compass, title: t("Pilih produk"), body: t("Jelajahi katalog di situs ini atau langsung di bot @lacukbot.") },
            { icon: CreditCard, title: t("Bayar QRIS di bot"), body: t("Checkout & pembayaran dilakukan di bot Telegram — aman dan terverifikasi otomatis.") },
            { icon: PackageCheck, title: t("Pesanan diproses"), body: t("Produk digital terkirim otomatis; produk manual diproses admin sesuai estimasi.") },
          ].map((s2) => (
            <div key={s2.title} className="rounded-3xl border border-ink-950/[0.07] bg-white p-6 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink-950 text-accent-400">
                <s2.icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <h3 className="mt-4 font-display text-[15px] font-bold text-ink-950">{s2.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{s2.body}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* FAQ */}
      <Reveal delay={100}>
        <h2 className="mb-5 mt-12 font-display text-xl font-bold text-ink-950">{t("Pertanyaan umum")}</h2>
        {shown.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t("Tidak ada hasil")}
            body={t("Tidak ada pertanyaan yang cocok dengan pencarianmu. Coba kata kunci lain, atau tanya langsung ke admin lewat bot Telegram.")}
          />
        ) : (
          <div className="divide-y divide-ink-950/[0.07] rounded-3xl border border-ink-950/[0.07] bg-white shadow-card">
            {shown.map((f, i) => {
              const expanded = open === i;
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : i)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-display text-[15px] font-bold text-ink-950">{f.q}</span>
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
                        <p className="px-6 pb-5 text-sm leading-relaxed text-ink-600">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </Reveal>

      {/* contact */}
      <Reveal delay={140}>
        <div className="mt-10 flex flex-col items-start gap-4 rounded-3xl bg-ink-950 p-7 text-white sm:flex-row sm:items-center sm:p-8">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-accent-400">
            <Send className="h-5.5 w-5.5" strokeWidth={2.1} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold">{t("Ngobrol dengan admin")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/60">
              {t("Semua bantuan ditangani lewat bot Telegram @lacukbot — mulai chat, pilih menu bantuan/tiket, dan admin akan membalas di sana. Info stok & promo terbaru ada di channel La Cukai Notif.")}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <a href={BOT_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-accent-400 px-6 font-display text-sm font-bold text-ink-950 transition-colors hover:bg-accent-300">
              <Send className="h-4 w-4" /> @lacukbot
            </a>
            <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 font-display text-sm font-bold text-white transition-colors hover:border-white/50">
              {t("Channel Notif")}
            </a>
          </div>
        </div>
      </Reveal>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Legal pages                                                        */
/* ------------------------------------------------------------------ */

function LegalSection({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-ink-950/[0.07] py-7 first:border-t-0 first:pt-0">
      <h2 className="flex items-baseline gap-3 font-display text-lg font-bold text-ink-950">
        <span className="font-mono text-sm font-bold text-accent-600">{n}</span> {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-600">{children}</div>
    </section>
  );
}

interface LegalBlock {
  title: string;
  body: string[];
}

const TERMS_ID: LegalBlock[] = [
  {
    title: "Tentang layanan",
    body: [
      "La Cukai Shop adalah toko produk digital. Situs web ini menampilkan katalog produk; seluruh transaksi — checkout, pembayaran, dan pengiriman — dilakukan melalui bot Telegram resmi kami, @lacukbot.",
      "Dengan menggunakan situs ini dan bot kami, kamu menyetujui syarat & ketentuan berikut.",
    ],
  },
  {
    title: "Harga & ketersediaan",
    body: [
      "Harga dan stok di situs ini disinkronkan dari katalog bot dan dapat berubah sewaktu-waktu. Harga yang berlaku adalah harga pada saat pembayaran dikonfirmasi di bot.",
      "Jika terjadi perbedaan antara tampilan situs dan katalog bot, data di bot yang menjadi acuan.",
    ],
  },
  {
    title: "Pembayaran",
    body: [
      "Pembayaran dilakukan lewat QRIS di dalam bot Telegram @lacukbot dan terverifikasi secara otomatis. Situs web ini tidak meminta, memproses, maupun menyimpan pembayaran apa pun.",
      "Simpan bukti pembayaran dan kode referensi pesananmu sampai pesanan selesai diproses.",
    ],
  },
  {
    title: "Pengiriman",
    body: [
      "Produk bertanda pengiriman instan dikirim otomatis setelah pembayaran terkonfirmasi. Produk yang diproses manual dikerjakan admin dalam estimasi waktu yang tertera di halaman produk.",
      "Pastikan data yang kamu berikan saat checkout di bot (mis. nomor WhatsApp atau data tujuan) sudah benar; kesalahan data dari pembeli dapat menunda pengiriman.",
    ],
  },
  {
    title: "Garansi & refund",
    body: [
      "Jika produk tidak dapat digunakan karena kesalahan dari sisi kami, kami akan mengganti produk atau mengembalikan dana sesuai ketentuan garansi masing-masing produk.",
      "Klaim dilakukan lewat menu bantuan/tiket di bot @lacukbot dengan menyertakan referensi pesanan. Refund diproses ke metode pembayaran asal atau sesuai kesepakatan dengan admin.",
    ],
  },
  {
    title: "Ringkasan pesanan di situs web",
    body: [
      "Fitur keranjang dan ringkasan pesanan di situs ini hanya tersimpan lokal di browser kamu sebagai referensi pribadi. Ringkasan tersebut bukan bukti pembelian — bukti pembelian adalah transaksi yang terkonfirmasi di bot Telegram.",
    ],
  },
];

const TERMS_EN: LegalBlock[] = [
  {
    title: "About the service",
    body: [
      "La Cukai Shop is a digital goods store. This website displays the product catalog; all transactions — checkout, payment, and delivery — take place through our official Telegram bot, @lacukbot.",
      "By using this site and our bot, you agree to the following terms.",
    ],
  },
  {
    title: "Prices & availability",
    body: [
      "Prices and stock on this site are synced from the bot catalog and may change at any time. The price that applies is the one shown when payment is confirmed in the bot.",
      "If this site and the bot catalog ever differ, the bot catalog is authoritative.",
    ],
  },
  {
    title: "Payment",
    body: [
      "Payment is made via QRIS inside the Telegram bot @lacukbot and is verified automatically. This website never requests, processes, or stores any payment.",
      "Keep your payment proof and order reference until your order is fully processed.",
    ],
  },
  {
    title: "Delivery",
    body: [
      "Products marked as instant delivery are sent automatically once payment is confirmed. Manually processed products are prepared by our admin within the estimate shown on the product page.",
      "Make sure the details you provide during bot checkout (e.g. WhatsApp number or destination data) are correct; incorrect buyer-provided data may delay delivery.",
    ],
  },
  {
    title: "Warranty & refunds",
    body: [
      "If a product cannot be used due to an error on our side, we will replace the product or refund you according to each product's warranty terms.",
      "Claims are made through the help/ticket menu in the @lacukbot bot, including your order reference. Refunds are processed to the original payment method or as agreed with the admin.",
    ],
  },
  {
    title: "Order summaries on this website",
    body: [
      "The cart and order summary features on this site are stored only locally in your browser as a personal reference. They are not proof of purchase — proof of purchase is the transaction confirmed in the Telegram bot.",
    ],
  },
];

const PRIVACY_ID: LegalBlock[] = [
  {
    title: "Data yang tersimpan di situs ini",
    body: [
      "Situs ini tidak memiliki akun pengguna dan tidak mengirim data ke server kami. Keranjang belanja, ringkasan pesanan, dan preferensi bahasa hanya tersimpan di localStorage browser kamu, di perangkat kamu sendiri.",
    ],
  },
  {
    title: "Menghapus data lokal",
    body: ["Kamu bisa menghapus seluruh data lokal kapan saja dengan membersihkan data situs (site data) untuk armshop.my.id di pengaturan browser."],
  },
  {
    title: "Transaksi di bot Telegram",
    body: [
      "Saat kamu bertransaksi lewat bot @lacukbot, data yang kamu berikan di sana (nama, kontak, dan detail pesanan) digunakan hanya untuk memproses pesanan dan memberikan bantuan.",
      "Interaksi di Telegram juga tunduk pada kebijakan privasi Telegram, dan pembayaran QRIS diproses oleh penyedia pembayaran sesuai ketentuannya.",
    ],
  },
  {
    title: "Kontak",
    body: ["Pertanyaan soal privasi dapat diajukan lewat menu bantuan/tiket di bot Telegram @lacukbot."],
  },
];

const PRIVACY_EN: LegalBlock[] = [
  {
    title: "Data stored by this site",
    body: [
      "This site has no user accounts and sends no data to our servers. Your cart, order summaries, and language preference are stored only in your browser's localStorage, on your own device.",
    ],
  },
  {
    title: "Deleting local data",
    body: ["You can erase all local data at any time by clearing site data for armshop.my.id in your browser settings."],
  },
  {
    title: "Transactions in the Telegram bot",
    body: [
      "When you transact through the @lacukbot bot, the details you provide there (name, contact, and order details) are used only to process your order and provide support.",
      "Interactions on Telegram are also subject to Telegram's privacy policy, and QRIS payments are processed by the payment provider under its own terms.",
    ],
  },
  {
    title: "Contact",
    body: ["Privacy questions can be sent through the help/ticket menu in the Telegram bot @lacukbot."],
  },
];

export function TermsPage() {
  const { t, lang } = useLang();
  useEffect(() => {
    document.title = `${t("Syarat & Ketentuan")} — La Cukai Shop`;
  }, [t, lang]);
  const blocks = lang === "en" ? TERMS_EN : TERMS_ID;
  return (
    <PageShell
      eyebrow={t("Legal")}
      title={
        <>
          {t("Syarat &")} <span className="serif-accent text-accent-700">{t("Ketentuan.")}</span>
        </>
      }
      sub={t("Ketentuan yang berlaku untuk katalog situs ini dan transaksi melalui bot Telegram @lacukbot.")}
    >
      <Reveal>
        <div className="rounded-3xl border border-ink-950/[0.07] bg-white p-7 shadow-card sm:p-9">
          {blocks.map((b, i) => (
            <LegalSection key={b.title} n={String(i + 1).padStart(2, "0")} title={b.title}>
              {b.body.map((p2) => (
                <p key={p2.slice(0, 24)}>{p2}</p>
              ))}
            </LegalSection>
          ))}
          <p className="mt-8 flex items-start gap-2.5 border-t border-ink-950/[0.07] pt-6 text-xs leading-relaxed text-ink-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
            {t("Terakhir diperbarui: Oktober 2026. Ketentuan dapat berubah; versi terbaru selalu tersedia di halaman ini.")}
          </p>
        </div>
      </Reveal>
    </PageShell>
  );
}

export function PrivacyPage() {
  const { t, lang } = useLang();
  useEffect(() => {
    document.title = `${t("Kebijakan Privasi")} — La Cukai Shop`;
  }, [t, lang]);
  const blocks = lang === "en" ? PRIVACY_EN : PRIVACY_ID;
  return (
    <PageShell
      eyebrow={t("Legal")}
      title={
        <>
          {t("Kebijakan")} <span className="serif-accent text-accent-700">{t("Privasi.")}</span>
        </>
      }
      sub={t("Penjelasan singkat tentang data apa yang tersimpan saat kamu memakai situs ini dan bot kami.")}
    >
      <Reveal>
        <div className="rounded-3xl border border-ink-950/[0.07] bg-white p-7 shadow-card sm:p-9">
          {blocks.map((b, i) => (
            <LegalSection key={b.title} n={String(i + 1).padStart(2, "0")} title={b.title}>
              {b.body.map((p2) => (
                <p key={p2.slice(0, 24)}>{p2}</p>
              ))}
            </LegalSection>
          ))}
          <p className="mt-8 flex items-start gap-2.5 border-t border-ink-950/[0.07] pt-6 text-xs leading-relaxed text-ink-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
            {t("Terakhir diperbarui: Oktober 2026.")}
          </p>
        </div>
      </Reveal>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/*  404                                                                */
/* ------------------------------------------------------------------ */

export function NotFoundPage() {
  const { t } = useLang();
  useEffect(() => {
    document.title = `${t("Halaman tidak ditemukan")} — La Cukai Shop`;
  }, [t]);
  return (
    <main className="container-x grid min-h-screen place-items-center pb-20 pt-[110px]">
      <div className="max-w-md text-center">
        <p className="font-display text-8xl font-extrabold text-ink-950/10">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink-950">{t("Halaman ini tidak ada")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">{t("Tautannya mungkin sudah berubah atau halamannya sudah dipindahkan.")}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-950 px-7 font-display text-sm font-bold text-white hover:opacity-85">
            <Compass className="h-4 w-4" /> {t("Ke beranda")}
          </Link>
          <Link to="/shop" className="inline-flex h-12 items-center rounded-full border border-ink-950/15 px-7 font-display text-sm font-bold text-ink-950 transition-colors hover:border-ink-950/40">
            {t("Lihat katalog")}
          </Link>
        </div>
      </div>
    </main>
  );
}
