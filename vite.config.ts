import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Écrit dist/version.json à chaque construction : l'appli (App.tsx › checkAppVersion) compare ce numéro
// et se recharge toute seule après une mise en ligne. Avant le 2026-09-30, ce fichier n'était jamais publié :
// les appareils (surtout l'appli installée sur iPhone) pouvaient rester sur une ancienne version.
const buildVersion = () => ({
  name: "dinislam-build-version",
  apply: "build" as const,
  closeBundle() {
    const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || new Date().toISOString();
    fs.writeFileSync(path.resolve(__dirname, "dist/version.json"), JSON.stringify({ version }));
  },
});

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), buildVersion()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: [
      "react", 
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@radix-ui/react-tooltip",
    ],
  },
  optimizeDeps: {
    force: true,
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@radix-ui/react-tooltip",
      "react-pdf",
    ],
  },
}));
