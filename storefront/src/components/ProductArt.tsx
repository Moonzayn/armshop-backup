import { Sparkles } from "lucide-react";
import {
  BrainCircuit,
  Clapperboard,
  CreditCard,
  Gamepad2,
  Globe,
  GraduationCap,
  Package,
  PenTool,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { categoryById, type CategoryId, type Product } from "@/data/products";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  vcc: CreditCard,
  vpn: ShieldCheck,
  ai: BrainCircuit,
  design: PenTool,
  streaming: Clapperboard,
  accounts: UserRound,
  edu: GraduationCap,
  gaming: Gamepad2,
  other: Package,
};

const FALLBACK_ICONS: LucideIcon[] = [Globe, Package, CreditCard, ShieldCheck, Sparkles];

/** Resolve an icon for any category id — real catalog ids are dynamic. */
export function categoryIcon(category: CategoryId): LucideIcon {
  const exact = CATEGORY_ICONS[category];
  if (exact) return exact;
  const name = categoryById(category).name.toLowerCase();
  if (name.includes("domain") || name.includes("web")) return Globe;
  if (name.includes("vpn")) return ShieldCheck;
  if (name.includes("ai")) return BrainCircuit;
  if (name.includes("game") || name.includes("topup") || name.includes("top-up")) return Gamepad2;
  if (name.includes("stream") || name.includes("film")) return Clapperboard;
  if (name.includes("desain") || name.includes("design") || name.includes("edit")) return PenTool;
  let h = 0;
  for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return FALLBACK_ICONS[Math.abs(h) % FALLBACK_ICONS.length];
}

/**
 * Deterministic branded artwork for a product — a gradient tile with the
 * category glyph, monogram and light geometry. Acts as the product image.
 */
export function ProductArt({
  product,
  className,
  rounded = "rounded-xl",
  iconClassName,
  compact = false,
}: {
  product: Pick<Product, "art" | "category" | "name">;
  className?: string;
  rounded?: string;
  iconClassName?: string;
  compact?: boolean;
}) {
  const cat = categoryById(product.category);
  const [from, to] = product.art.gradient ?? cat.gradient;
  const Icon = categoryIcon(product.category);

  return (
    <div
      role="img"
      aria-label={`${product.name} — product artwork`}
      className={cn("relative isolate overflow-hidden", rounded, className)}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 130%)` }}
    >
      {/* geometry */}
      <div className="absolute -right-[18%] -top-[30%] h-[75%] w-[60%] rounded-full bg-white/[0.07] blur-[2px]" />
      <div className="absolute -bottom-[45%] -left-[15%] h-[90%] w-[55%] rounded-full border border-white/10" />
      <div className="dot-grid absolute inset-0 opacity-40" />

      {/* icon tile */}
      <div className={cn(
        "absolute grid place-items-center rounded-lg bg-white/12 ring-1 ring-white/20 backdrop-blur-sm",
        compact ? "right-1.5 top-1.5 h-5 w-5 rounded-md" : "right-3 top-3 h-9 w-9"
      )}>
        <Icon className={cn(compact ? "h-3 w-3 text-white/90" : "h-4.5 w-4.5 text-white/90", iconClassName)} strokeWidth={2.1} />
      </div>

      {/* monogram */}
      <div className={cn("absolute select-none", compact ? "bottom-1.5 left-2" : "bottom-2.5 left-3.5")}>
        <span className={cn(
          "font-display font-extrabold leading-none tracking-tight text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]",
          compact ? "text-[13px]" : "text-[26px]"
        )}>
          {product.art.monogram}
        </span>
        {!compact && (
          <span className="mt-1 block text-[8.5px] font-bold uppercase tracking-[0.28em] text-white/45">{cat.short}</span>
        )}
      </div>

      {/* watermark rings */}
      {!compact && (
        <Icon className="pointer-events-none absolute -bottom-6 -right-5 h-28 w-28 rotate-[-14deg] text-white/[0.08]" strokeWidth={1.1} />
      )}

      {/* sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/[0.06]" />
    </div>
  );
}

/** Category tile art (no specific product). */
export function CategoryArt({
  category,
  className,
}: {
  category: CategoryId;
  className?: string;
}) {
  const cat = categoryById(category);
  const Icon = categoryIcon(category);
  const [from, to] = cat.gradient;
  return (
    <div
      aria-hidden
      className={cn("relative grid place-items-center overflow-hidden rounded-2xl", className)}
      style={{ background: `linear-gradient(140deg, ${from}, ${to} 135%)` }}
    >
      <div className="dot-grid absolute inset-0 opacity-40" />
      <Icon className="relative h-7 w-7 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" strokeWidth={1.8} />
      <div className="absolute -right-4 -top-6 h-14 w-14 rounded-full bg-white/10" />
    </div>
  );
}
