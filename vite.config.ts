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

/**
 * 📡 Mode hors ligne (règle « l'appli s'ouvre toujours, même sans réseau », 2026-11-02) : après chaque construction,
 * écrit dans dist/sw.js la liste de TOUS les fichiers de l'appli à garder en mémoire dès l'installation (toutes les pages,
 * styles, polices, icônes) + un numéro de version. Les audios et PDF de public/ restent sur le réseau (trop lourds).
 */
const offlinePrecache = () => {
  let outDir = "dist";
  return {
    name: "dinislam-offline-precache",
    apply: "build" as const,
    configResolved(c: { root: string; build: { outDir: string } }) { outDir = path.resolve(c.root, c.build.outDir); },
    closeBundle() {
      const swPath = path.join(outDir, "sw.js");
      if (!fs.existsSync(swPath)) return;
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f);
          if (fs.statSync(full).isDirectory()) walk(full);
          else files.push("/" + path.relative(outDir, full).split(path.sep).join("/"));
        }
      };
      walk(outDir);
      const skip = /(^\/sw\.js$|^\/version\.json$|\.map$|\.woff$|^\/audio\/|^\/pdf\/|^\/videos\/|^\/robots\.txt$|^\/placeholder\.svg$)/;
      const list = files.filter((f) => !skip.test(f)).map((f) => (f === "/index.html" ? "/" : f)).sort();
      const version = (process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "") + Date.now().toString(36);
      const sw = fs.readFileSync(swPath, "utf8").replace("__BUILD_VERSION__", version);
      fs.writeFileSync(swPath, `self.__PRECACHE = ${JSON.stringify(list)};\n` + sw);
      const size = list.reduce((t, f) => t + fs.statSync(path.join(outDir, f === "/" ? "index.html" : f.slice(1))).size, 0);
      console.log(`[offline-precache] ${list.length} fichiers gardés en mémoire hors ligne (${(size / 1048576).toFixed(1)} Mo, version ${version})`);
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), buildVersion(), offlinePrecache()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "react", replacement: path.resolve(__dirname, "node_modules/react") },
      { find: "react-dom", replacement: path.resolve(__dirname, "node_modules/react-dom") },
      // Lecteur PDF (cours Nourania) : version « anciens appareils » de pdf.js, qui apporte elle-même les fonctions
      // manquantes sur les vieux iPad/Safari (ex. Promise.withResolvers). Sans ça, la page Nourania plantait (2026-10-14).
      { find: /^pdfjs-dist$/, replacement: path.resolve(__dirname, "node_modules/pdfjs-dist/legacy/build/pdf.mjs") },
    ],
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
