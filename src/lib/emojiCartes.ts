/** Emoji + fond pastel de secours de chaque carte de l'accueil (par « slug » : chemin sans « / »).
 * Sorti d'Index.tsx le 2026-11-15 pour servir aussi aux tuiles du bouclier › ✅ Corrections (une seule liste). */
export const MODULE_EMOJI_FALLBACK: Record<string, { emoji: string; bgColor: string }> = {
  "ramadan": { emoji: "🌙", bgColor: "#fff7ed" },
  "alphabet": { emoji: "أ", bgColor: "#eff6ff" },
  "invocations": { emoji: "🤲", bgColor: "#f5f3ff" },
  "priere": { emoji: "🕌", bgColor: "#ecfeff" },
  "grammaire": { emoji: "📖", bgColor: "#f0fdf4" },
  "99-noms": { emoji: "✨", bgColor: "#fffbeb" },
  // 2026-11-03 : la carte s'appelle /allah-names (slug « allah-names ») → elle affichait 📚 (emoji de secours)
  "allah-names": { emoji: "✨", bgColor: "#fffbeb" },
  "sourates": { emoji: "📿", bgColor: "#eef2ff" },
  "nourania": { emoji: "🌟", bgColor: "#fefce8" },
  "vocabulaire": { emoji: "💬", bgColor: "#fdf2f8" },
  "lecture-coran": { emoji: "📖", bgColor: "#f0fdfa" },
  "darija": { emoji: "🗣️", bgColor: "#fff7ed" },
  "dictionnaire": { emoji: "📚", bgColor: "#f5f3ff" },
  "dhikr": { emoji: "📿", bgColor: "#f0fdf4" },
  "hadiths": { emoji: "🕊️", bgColor: "#eef2ff" },
  "histoires-prophetes": { emoji: "⭐", bgColor: "#fffbeb" },
  "coran": { emoji: "📗", bgColor: "#f0fdf4" },
  "cahier-texte": { emoji: "📝", bgColor: "#eff6ff" },
  "registre-presence": { emoji: "✅", bgColor: "#f0fdf4" },
};
