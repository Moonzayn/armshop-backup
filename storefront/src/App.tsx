import { useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { StoreProvider } from "@/context/StoreContext";
import { LangProvider } from "@/i18n";
import { AccountDialog, Navbar } from "@/components/Navbar";
import { SearchDialog } from "@/components/SearchDialog";
import { CartDrawer } from "@/components/CartDrawer";
import { QuickView } from "@/components/QuickView";
import { Toasts } from "@/components/Toasts";
import { Footer } from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import ProductPage from "@/pages/ProductPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderPage from "@/pages/OrderPage";
import { HelpPage, NotFoundPage, PrivacyPage, TermsPage } from "@/pages/InfoPages";

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, search]);
  return null;
}

function Routed() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<CatalogPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:ref" element={<OrderPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Footer />
        </motion.div>
      </AnimatePresence>

      {/* global overlays */}
      <SearchDialog />
      <CartDrawer />
      <QuickView />
      <AccountDialog />
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <StoreProvider>
        <HashRouter>
          <ScrollToTop />
          <Routed />
        </HashRouter>
      </StoreProvider>
    </LangProvider>
  );
}
