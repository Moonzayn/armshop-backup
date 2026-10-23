import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { loadCatalog } from "./data/products";

/* Load the live catalog first so every component renders with real data. */
async function boot() {
  await loadCatalog();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void boot();
