import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PRODUCTS, type ProductVariant } from "@/data/products";
import { orderRef } from "@/lib/format";
import { tr } from "@/i18n";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CartItem {
  productId: string;
  variantId?: string;
  qty: number;
}

export interface CartLine {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  variantLabel?: string;
  unitPrice: number;
  qty: number;
  deliveryLabel: string;
  deliveryType: "instant" | "manual";
  monogram: string;
  category: string;
  gradient?: [string, string];
}

export interface AppliedPromo {
  code: string;
  discount: number;
  blurb: string;
}

export interface OrderSnapshotItem {
  name: string;
  variantLabel?: string;
  qty: number;
  unitPrice: number;
  deliveryLabel: string;
  deliveryType: "instant" | "manual";
}

export interface DemoOrder {
  ref: string;
  items: OrderSnapshotItem[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  total: number;
  customer: { name: string; email: string; whatsapp?: string; notes?: string };
  createdAt: string;
  mode: "demo";
}

interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
}

interface Store {
  cart: CartItem[];
  lines: CartLine[];
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  promo: AppliedPromo | null;
  addItem: (productId: string, variantId?: string, qty?: number, silent?: boolean) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  applyPromo: (code: string) => Promise<boolean>;
  createWebOrder: (customer: DemoOrder["customer"]) => Promise<{ orderId: string; total: number; discount: number }>;
  removePromo: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  accountOpen: boolean;
  setAccountOpen: (v: boolean) => void;
  toasts: Toast[];
  toast: (message: string, kind?: Toast["kind"]) => void;
  lastOrder: DemoOrder | null;
  placeDemoOrder: (customer: DemoOrder["customer"]) => DemoOrder;
  getOrder: (ref: string) => DemoOrder | null;
  quickView: string | null; // product id
  setQuickView: (id: string | null) => void;
}

const StoreContext = createContext<Store | null>(null);

const CART_KEY = "lcs_cart_v1";
const PROMO_KEY = "lcs_promo_v1";
const ORDERS_KEY = "lcs_orders_v1";
const LAST_ORDER_KEY = "lcs_last_order_v1";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function variantOf(p: (typeof PRODUCTS)[number], variantId?: string): ProductVariant | undefined {
  return p.variants?.find((v) => v.id === variantId) ?? p.variants?.[0];
}

/* ------------------------------------------------------------------ */

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => readJSON<CartItem[]>(CART_KEY, []));
  const [promoCode, setPromoCode] = useState<string | null>(() => readJSON<string | null>(PROMO_KEY, null));
  const [promoCheck, setPromoCheck] = useState<{ code: string; discount: number } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [quickView, setQuickView] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const [lastOrder, setLastOrder] = useState<DemoOrder | null>(() => readJSON<DemoOrder | null>(LAST_ORDER_KEY, null));

  /* persistence */
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch { /* storage unavailable */ }
  }, [cart]);
  useEffect(() => {
    try {
      if (promoCode) localStorage.setItem(PROMO_KEY, JSON.stringify(promoCode));
      else localStorage.removeItem(PROMO_KEY);
    } catch { /* ignore */ }
  }, [promoCode]);

  const toast = useCallback((message: string, kind: Toast["kind"] = "success") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, kind, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  /* cart operations */
  const addItem = useCallback(
    (productId: string, variantId?: string, qty = 1, silent = false) => {
      const p = PRODUCTS.find((x) => x.id === productId);
      if (!p) return;
      const variant = variantOf(p, variantId);
      setCart((c) => {
        const key = (i: CartItem) => `${i.productId}::${i.variantId ?? ""}`;
        const target = `${productId}::${variant?.id ?? ""}`;
        const existing = c.find((i) => key(i) === target);
        if (existing) return c.map((i) => (key(i) === target ? { ...i, qty: Math.min(99, i.qty + qty) } : i));
        return [...c, { productId, variantId: variant?.id, qty }];
      });
      if (!silent) toast(tr("{name} ditambahkan ke keranjang", { name: p.name }));
    },
    [toast]
  );

  const setQty = useCallback((key: string, qty: number) => {
    setCart((c) =>
      qty <= 0
        ? c.filter((i) => `${i.productId}::${i.variantId ?? ""}` !== key)
        : c.map((i) => (`${i.productId}::${i.variantId ?? ""}` === key ? { ...i, qty: Math.min(99, qty) } : i))
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setCart((c) => c.filter((i) => `${i.productId}::${i.variantId ?? ""}` !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setPromoCode(null);
    setPromoCheck(null);
  }, []);

  /* derived lines */
  const lines = useMemo<CartLine[]>(() => {
    return cart
      .map((i) => {
        const p = PRODUCTS.find((x) => x.id === i.productId);
        if (!p) return null;
        const variant = variantOf(p, i.variantId);
        return {
          key: `${i.productId}::${i.variantId ?? ""}`,
          productId: p.id,
          variantId: variant?.id,
          name: p.name,
          variantLabel: p.variants ? variant?.label : undefined,
          unitPrice: variant?.price ?? p.price,
          qty: i.qty,
          deliveryLabel: p.delivery.label,
          deliveryType: p.delivery.type,
          monogram: p.art.monogram,
          category: p.category,
          gradient: p.art.gradient,
        };
      })
      .filter(Boolean) as CartLine[];
  }, [cart]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0), [lines]);
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  const promo = useMemo<AppliedPromo | null>(() => {
    if (!promoCode || !promoCheck || promoCheck.code !== promoCode) return null;
    return { code: promoCheck.code, discount: promoCheck.discount, blurb: "" };
  }, [promoCode, promoCheck]);

  const discount = promo?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const applyPromo = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/storefront/promo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code.trim(), amount: subtotal }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          toast(data?.error || tr("Kode promo tidak valid."), "error");
          return false;
        }
        setPromoCode(data.code);
        setPromoCheck({ code: data.code, discount: data.discount });
        toast(tr("Promo {code} terpasang — kamu hemat {amount}", { code: data.code, amount: "Rp" + Number(data.discount).toLocaleString("id-ID") }));
        return true;
      } catch {
        toast(tr("Gagal memeriksa kode promo. Coba lagi."), "error");
        return false;
      }
    },
    [subtotal, toast]
  );

  /* validasi ulang promo tersimpan saat halaman dimuat ulang */
  useEffect(() => {
    if (!promoCode || promoCheck || subtotal <= 0) return;
    let alive = true;
    fetch("/api/storefront/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode, amount: subtotal }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!alive) return;
        if (ok) setPromoCheck({ code: d.code, discount: d.discount });
        else setPromoCode(null);
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoCode, subtotal > 0]);

  const removePromo = useCallback(() => { setPromoCode(null); setPromoCheck(null); }, []);

  /* buat order web asli (invoice QRIS KlikQRIS lewat backend toko) */
  const createWebOrder = useCallback(
    async (customer: DemoOrder["customer"]) => {
      const res = await fetch("/api/storefront/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.productId, qty: l.qty })),
          customer,
          voucher: promo?.code || "",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || tr("Gagal membuat pesanan. Coba lagi."));
      return data as { orderId: string; total: number; discount: number };
    },
    [lines, promo]
  );

  /* demo orders */
  const placeDemoOrder = useCallback(
    (customer: DemoOrder["customer"]): DemoOrder => {
      const order: DemoOrder = {
        ref: orderRef(),
        items: lines.map((l) => ({
          name: l.name,
          variantLabel: l.variantLabel,
          qty: l.qty,
          unitPrice: l.unitPrice,
          deliveryLabel: l.deliveryLabel,
          deliveryType: l.deliveryType,
        })),
        subtotal,
        discount,
        promoCode: promo?.code,
        total,
        customer,
        createdAt: new Date().toISOString(),
        mode: "demo",
      };
      try {
        const existing = readJSON<DemoOrder[]>(ORDERS_KEY, []);
        localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...existing].slice(0, 20)));
        localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
      } catch { /* ignore */ }
      setLastOrder(order);
      // cart is cleared by the caller after navigation lands
      return order;
    },
    [lines, subtotal, discount, total, promo]
  );

  const getOrder = useCallback((ref: string): DemoOrder | null => {
    const local = readJSON<DemoOrder[]>(ORDERS_KEY, []);
    return local.find((o) => o.ref === ref) ?? null;
  }, []);

  const value: Store = {
    cart,
    lines,
    count,
    subtotal,
    discount,
    total,
    promo,
    addItem,
    setQty,
    removeItem,
    clearCart,
    applyPromo,
    createWebOrder,
    removePromo,
    cartOpen,
    setCartOpen,
    searchOpen,
    setSearchOpen,
    accountOpen,
    setAccountOpen,
    toasts,
    toast,
    lastOrder,
    placeDemoOrder,
    getOrder,
    quickView,
    setQuickView,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
