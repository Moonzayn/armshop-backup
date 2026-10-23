import { useEffect } from "react";
import { Hero } from "@/components/Hero";
import { useLang } from "@/i18n";
import {
  BestSellersSection,
  CategoriesSection,
  CtaSection,
  DealsSection,
  MarqueeBand,
  TestimonialsSection,
  TrendingNewSection,
  TrustSection,
} from "@/components/home-sections";

export default function HomePage() {
  const { lang } = useLang();
  useEffect(() => {
    document.title =
      lang === "en"
        ? "La Cukai Shop — Digital Products, Clear Prices, Fast Process"
        : "La Cukai Shop — Produk Digital, Harga Jelas, Proses Cepat";
  }, [lang]);

  return (
    <main>
      <Hero />
      <MarqueeBand />
      <CategoriesSection />
      <BestSellersSection />
      <TrustSection />
      <DealsSection />
      <TrendingNewSection />
      <TestimonialsSection />
      <CtaSection />
    </main>
  );
}
