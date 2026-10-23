import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Check,
  Clock3,
  Flame,
  Info,
  Minus,
  PackageSearch,
  Plus,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { tr, useLang } from "@/i18n";
import type { Badge as BadgeType, StockStatus } from "@/data/products";

/* ------------------------------------------------------------------ */
/*  Logo                                                               */
/* ------------------------------------------------------------------ */

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <Link to="/" aria-label="La Cukai Shop — home" className="group inline-flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-400 shadow-[0_6px_18px_-6px_rgba(56,189,248,0.7)] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <Check className="h-5 w-5 text-ink-950" strokeWidth={3.4} />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-ink-950 bg-accent-400" />
      </span>
      {!compact && (
        <span className={cn("font-display text-[17px] font-bold leading-none tracking-tight", dark ? "text-white" : "text-ink-950")}>
          La Cukai
          <span className={cn("mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.22em]", dark ? "text-white/50" : "text-ink-400")}>
            Shop · Digital
          </span>
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Badges & chips                                                     */
/* ------------------------------------------------------------------ */

const badgeStyles: Record<BadgeType, { label: string; icon: LucideIcon; cls: string }> = {
  "best-seller": { label: "Terlaris", icon: BadgeCheck, cls: "bg-accent-400 text-ink-950" },
  popular: { label: "Populer", icon: Flame, cls: "bg-ink-950 text-white" },
  new: { label: "Baru", icon: Sparkles, cls: "bg-white text-ink-950 border border-ink-950/10" },
};

export function ProductBadge({ badge, className }: { badge: BadgeType; className?: string }) {
  const { t } = useLang();
  const s = badgeStyles[badge];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] shadow-sm", s.cls, className)}>
      <s.icon className="h-3 w-3" strokeWidth={2.6} />
      {t(s.label)}
    </span>
  );
}

export function StockChip({ status, count }: { status: StockStatus; count?: number }) {
  const { t } = useLang();
  if (status === "in")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-good-600">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute h-full w-full animate-pulse-dot rounded-full bg-good-600" />
        </span>
        {t("Stok tersedia")}
      </span>
    );
  if (status === "low")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-warn-400">
        <span className="h-1.5 w-1.5 rounded-full bg-warn-400" />
        {t("Stok menipis")}{count ? ` · ${t("sisa {count}", { count })}` : ""}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-400">
      <Clock3 className="h-3 w-3" />
      {t("Pre-order")}
    </span>
  );
}

export function DeliveryChip({ type, light = false, className }: { type: "instant" | "manual"; light?: boolean; className?: string }) {
  const { t } = useLang();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
        type === "instant"
          ? "bg-accent-400/15 text-accent-600 ring-1 ring-accent-500/40"
          : light
            ? "bg-white/10 text-white/80 ring-1 ring-white/20"
            : "bg-ink-950/[0.05] text-ink-500 ring-1 ring-ink-950/10",
        className
      )}
    >
      {type === "instant" ? <Zap className="h-3 w-3" strokeWidth={2.6} /> : <Clock3 className="h-3 w-3" strokeWidth={2.6} />}
      {type === "instant" ? t("Otomatis") : t("Manual")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Rating stars                                                       */
/* ------------------------------------------------------------------ */

export function Rating({ value, count, size = "sm", showCount = true }: { value: number; count?: number; size?: "sm" | "md"; showCount?: boolean }) {
  const pct = Math.min(100, (value / 5) * 100);
  const starCls = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  const row = (filled: boolean) => (
    <div className="flex gap-0.5" aria-hidden={!filled}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn(starCls, filled ? "fill-amber-400 text-amber-400" : "fill-ink-950/10 text-ink-950/10")} />
      ))}
    </div>
  );
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={tr("Rating {value} dari 5", { value }) + (count ? tr(" dari {count} ulasan", { count }) : "")}>
      <span className="relative inline-block">
        {row(false)}
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
          {row(true)}
        </span>
      </span>
      <span className={cn("font-semibold text-ink-900", size === "sm" ? "text-xs" : "text-sm")}>{value.toFixed(1)}</span>
      {showCount && count !== undefined && <span className="text-xs text-ink-400">({count.toLocaleString("id-ID")})</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Quantity stepper                                                   */
/* ------------------------------------------------------------------ */

export function QtyStepper({ qty, onChange, small = false }: { qty: number; onChange: (q: number) => void; small?: boolean }) {
  const { t } = useLang();
  return (
    <div className={cn("inline-flex items-center rounded-full border border-ink-950/12 bg-white", small ? "h-8" : "h-11")}>
      <button
        type="button"
        aria-label={t("Kurangi jumlah")}
        onClick={() => onChange(qty - 1)}
        className={cn("grid h-full place-items-center rounded-l-full text-ink-500 transition-colors hover:bg-ink-950/[0.05] hover:text-ink-950 disabled:opacity-30", small ? "w-8" : "w-11")}
        disabled={qty <= 1}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.6} />
      </button>
      <span className={cn("grid place-items-center font-display font-bold tabular-nums", small ? "w-7 text-xs" : "w-10 text-sm")} aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        aria-label={t("Tambah jumlah")}
        onClick={() => onChange(qty + 1)}
        className={cn("grid h-full place-items-center rounded-r-full text-ink-500 transition-colors hover:bg-ink-950/[0.05] hover:text-ink-950", small ? "w-8" : "w-11")}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */

export function PrimaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...rest}
      className={cn(
        "group/btn inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-400 px-6 font-display text-sm font-bold text-ink-950 shadow-[0_10px_30px_-10px_rgba(56,189,248,0.55)] transition-all duration-300 hover:bg-accent-300 hover:shadow-[0_14px_36px_-8px_rgba(56,189,248,0.65)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  dark = false,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; dark?: boolean }) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full border px-6 font-display text-sm font-bold transition-all duration-300 active:scale-[0.98]",
        dark
          ? "border-white/20 text-white hover:border-accent-400/60 hover:text-accent-300"
          : "border-ink-950/15 text-ink-900 hover:border-ink-950/40 hover:bg-ink-950/[0.03]",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Section heading                                                    */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  sub,
  dark = false,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  dark?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-14">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className={cn("mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]", dark ? "text-accent-300" : "text-accent-700")}>
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            {eyebrow}
          </p>
        )}
        <h2 className={cn("font-display text-3xl font-bold leading-[1.08] tracking-tight sm:text-[2.6rem]", dark ? "text-white" : "text-ink-950")}>{title}</h2>
        {sub && <p className={cn("mt-3 max-w-xl text-sm leading-relaxed sm:text-[15px]", dark ? "text-white/55" : "text-ink-500")}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll reveal                                                      */
/* ------------------------------------------------------------------ */

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", visible && "is-visible", className)} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon = PackageSearch,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-950/15 bg-white/60 px-8 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink-950/[0.05] text-ink-400">
        <Icon className="h-6 w-6" strokeWidth={2.2} />
      </div>
      <h3 className="font-display text-lg font-bold text-ink-950">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton card                                                      */
/* ------------------------------------------------------------------ */

export function ProductSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-ink-950/[0.06] bg-white p-3">
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="mt-4 space-y-2.5 px-1 pb-1">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-4 w-2/5" />
            <div className="flex items-center justify-between pt-1">
              <div className="skeleton h-5 w-20" />
              <div className="skeleton h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
