import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// 📡 Polices incluses dans l'appli : aucune dépendance à Internet pour s'afficher (2026-11-02)
import "@fontsource/tajawal/arabic-300.css";
import "@fontsource/tajawal/latin-300.css";
import "@fontsource/tajawal/arabic-400.css";
import "@fontsource/tajawal/latin-400.css";
import "@fontsource/tajawal/arabic-500.css";
import "@fontsource/tajawal/latin-500.css";
import "@fontsource/tajawal/arabic-700.css";
import "@fontsource/tajawal/latin-700.css";
import "@fontsource/tajawal/arabic-800.css";
import "@fontsource/tajawal/latin-800.css";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/amiri/latin-400.css";
import "@fontsource/amiri/arabic-700.css";
import "@fontsource/amiri/latin-700.css";
import "@fontsource/patrick-hand/latin-400.css";
import "@fontsource/patrick-hand/latin-ext-400.css";
import "@fontsource/cinzel/latin-700.css";
import "@fontsource/cinzel/latin-ext-700.css";
import "./index.css";
import { installMoodToasts } from "./lib/moodToasts";
import { rechargerUneFois } from "./lib/miseAJour";

// 🔄 Un morceau de l'appli introuvable après une mise en ligne : on recharge sur la nouvelle version (2026-10-30)
window.addEventListener("vite:preloadError", (event) => { event.preventDefault(); rechargerUneFois(); });

// Émojis selon le ton, le sujet et la saison sur tous les petits messages (2026-10-19)
installMoodToasts();

const bootstrap = async () => {
  if ("serviceWorker" in navigator) {
    if (import.meta.env.PROD) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.log("SW registration failed:", err));
    } else {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch (err) {
        console.warn("Failed to clear service worker/cache in preview:", err);
      }
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
};

bootstrap();
