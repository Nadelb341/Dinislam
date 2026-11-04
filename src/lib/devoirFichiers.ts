import { supabase } from '@/integrations/supabase/client';
import { compressDocument } from '@/lib/compressImage';
import { MATIERES, matiereOf } from '@/lib/devoirMatieres';

/**
 * 📎 Documents et photos des devoirs (2026-11-04, choix A de Nadia) : stockage public `devoirs-fichiers`
 * (comme les audios des devoirs). Professeur : dossier `prof/<lot>/…` ; élève : `<son id>/rendus/…` (photos de son travail, idée 2).
 * Les photos sont compressées avant l'envoi (règle de l'appli), les PDF / Word restent tels quels.
 */
export type PieceJointe = { path: string; name: string; type: string };

export const asPJ = (v: unknown): PieceJointe[] =>
  Array.isArray(v) ? (v as PieceJointe[]).filter((a) => a && typeof a.path === 'string') : [];

export const urlPJ = (path: string) => supabase.storage.from('devoirs-fichiers').getPublicUrl(path).data.publicUrl;

export async function deposerFichierDevoir(dossier: string, file: File): Promise<PieceJointe> {
  const f = await compressDocument(file);
  const safe = (f.name || 'fichier').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80);
  const path = `${dossier}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`;
  const { error } = await supabase.storage.from('devoirs-fichiers').upload(path, f, { contentType: f.type || undefined });
  if (error) throw error;
  return { path, name: file.name || safe, type: f.type || file.type || '' };
}

/* ---------- Lignes du formulaire « Par matière », réglées pour chaque groupe ---------- */
export interface LigneDevoir {
  /** type de la matière (lignes habituelles) ou `perso_<…>` (ligne ajoutée par le professeur) */
  key: string;
  /** valeur `devoirs.type` (« autre » pour une ligne personnelle) */
  type: string;
  emoji: string;
  label: string;
  actif: boolean;
  perso?: boolean;
  exemple?: string;
}
export interface ReglagesGroupeDevoirs { max_devoirs: number | null; lignes: LigneDevoir[] }

export const lignesHabituelles = (): LigneDevoir[] =>
  MATIERES.map((m) => ({ key: m.type, type: m.type, emoji: m.emoji, label: m.label, actif: true, exemple: m.exemple }));

/** Lignes enregistrées + matières habituelles qui manqueraient (ajoutées à la fin, actives) */
export function fusionLignes(saved: unknown): LigneDevoir[] {
  const list = Array.isArray(saved) ? (saved as LigneDevoir[]).filter((l) => l && typeof l.key === 'string') : [];
  const base = lignesHabituelles();
  // Jamais réglé (ou seulement des lignes à soi) : les matières habituelles d'abord, les lignes personnelles ensuite
  if (!list.some((l) => base.some((b) => b.key === l.key))) {
    return [...base, ...list.map((l) => ({ ...l, type: 'autre', perso: true, actif: l.actif !== false }))];
  }
  const out = list.map((l) => {
    const b = base.find((x) => x.key === l.key);
    return b ? { ...b, actif: l.actif !== false } : { ...l, type: 'autre', perso: true, actif: l.actif !== false };
  });
  base.forEach((b) => { if (!out.some((l) => l.key === b.key)) out.push(b); });
  return out;
}

/** Emoji et nom affichés d'un devoir (une ligne personnelle garde les siens) */
export function matiereDe(d: { type: string; matiere_label?: string | null; matiere_emoji?: string | null }) {
  const m = matiereOf(d.type);
  return { emoji: d.matiere_emoji || m.emoji, label: d.matiere_label || m.label };
}

/** 🎨 Idée 7 : un fond de couleur par matière, pour reconnaître la ligne sans savoir lire */
const FONDS: Record<string, string> = {
  nourania: 'bg-violet-100 dark:bg-violet-950/50', sourate: 'bg-emerald-100 dark:bg-emerald-950/50', recitation: 'bg-rose-100 dark:bg-rose-950/50',
  allah_names: 'bg-amber-100 dark:bg-amber-950/50', alphabet: 'bg-sky-100 dark:bg-sky-950/50', invocations: 'bg-teal-100 dark:bg-teal-950/50',
  priere: 'bg-indigo-100 dark:bg-indigo-950/50', coran: 'bg-lime-100 dark:bg-lime-950/50',
};
export const fondMatiere = (type: string) => FONDS[type] ?? 'bg-orange-100 dark:bg-orange-950/50';

/** Lundi 00:00 de la semaine en cours (compte des devoirs d'un groupe pour le maximum) */
export function lundiCourant(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
