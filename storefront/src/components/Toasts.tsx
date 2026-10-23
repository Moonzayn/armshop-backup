import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/utils/cn";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-[110] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-auto flex w-fit max-w-full items-center gap-2.5 rounded-full py-3 pl-4 pr-5 text-[13px] font-semibold shadow-lift ring-1 backdrop-blur-md",
                t.kind === "success" && "bg-ink-950/95 text-white ring-white/10",
                t.kind === "error" && "bg-white/95 text-deal-500 ring-deal-500/25",
                t.kind === "info" && "bg-white/95 text-ink-900 ring-ink-950/10"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 shrink-0", t.kind === "success" ? "text-accent-400" : t.kind === "error" ? "text-deal-500" : "text-ink-500")} strokeWidth={2.4} />
              <span className="truncate">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
