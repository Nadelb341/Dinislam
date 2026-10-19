import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installMoodToasts } from "./lib/moodToasts";

// Émojis selon le ton, le sujet et la saison sur tous les petits messages (2026-10-19)
installMoodToasts();

const bootstrap = async () => {
  if ("serviceWorker" in navigator) {
    if (import.meta.env.PROD) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
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
