import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';
import { loadDraft, saveDraft, clearDraft } from '@/hooks/useDraftRecovery';
import type { Json, TablesInsert } from '@/integrations/supabase/types';
import type { LigneDevoir, PieceJointe } from '@/lib/devoirFichiers';

/**
 * 📚 Devoirs élève par élève (Nadia, 2026-11-11 : maquette A + Q1-A, Q2-A, Q3-A, Q4-B + les 9 idées).
 * - Chaque élève a SON formulaire (Par matière / Devoir détaillé) dans sa carte de la liste.
 * - Un devoir par élève (assigned_to 'student') ; « 📋 Donner aussi à… » = même devoir pour d'autres élèves.
 * - Q2-A : plusieurs éléments choisis sur une ligne (ex. 3 invocations) = un devoir (et un 💎) par élément.
 * - Brouillon PAR ÉLÈVE (idée 4) dans `draft_dinislam_homework` { v: 2, parEleve: { [id]: FormEleve } }.
 * - Sans réseau (idée 9) : la distribution est gardée sur l'appareil et part au retour du réseau.
 */
export interface Cible { v: string; l: string }
export interface FormEleve {
  parMatiere: boolean;
  lignes: Record<string, string>;
  cibles: Record<string, Cible[]>;
  audios: Record<string, boolean>;
  pj: Record<string, PieceJointe[]>;
  consignes: Record<string, string>;
  // Devoir détaillé
  titre: string; type: string; description: string; lien_lecon: string; etapes: string;
  ciblesDetail: Cible[]; audio_requis: boolean;
  /** 📋 Donner aussi à… (Q1-A) */
  aussi: string[];
  /** Ligne « 📚 Devoirs à préparer » d'où vient ce devoir : cochée une fois le devoir donné */
  source_task_id?: string;
}

export const formVide = (): FormEleve => ({
  parMatiere: true, lignes: {}, cibles: {}, audios: {}, pj: {}, consignes: {},
  titre: '', type: 'recitation', description: '', lien_lecon: '', etapes: '', ciblesDetail: [], audio_requis: false, aussi: [],
});

export const formRempli = (f: FormEleve | undefined | null) => !!f && (
  Object.values(f.lignes || {}).some((v) => v?.trim()) || !!f.titre?.trim()
  || Object.values(f.pj || {}).some((a) => a?.length) || Object.values(f.consignes || {}).some(Boolean));

// ——— Brouillon par élève ———
export const CLE_BROUILLON = 'dinislam_homework';
export interface BrouillonDevoirs { v: 2; parEleve: Record<string, FormEleve & { nom?: string }> }

export function lireBrouillons(): BrouillonDevoirs {
  const d = loadDraft<BrouillonDevoirs | Record<string, unknown>>(CLE_BROUILLON);
  if (d && (d as BrouillonDevoirs).v === 2) return d as BrouillonDevoirs;
  return { v: 2, parEleve: {} }; // ancien brouillon (formulaire commun) : plus utilisé depuis le 2026-11-11
}
export function brouillonDe(eleveId: string): FormEleve {
  const f = lireBrouillons().parEleve[eleveId];
  return f ? { ...formVide(), ...f } : formVide();
}
export function enregistrerBrouillon(eleveId: string, nom: string, f: FormEleve) {
  const b = lireBrouillons();
  if (formRempli(f)) b.parEleve[eleveId] = { ...f, nom };
  else delete b.parEleve[eleveId];
  if (Object.keys(b.parEleve).length) saveDraft(CLE_BROUILLON, b); else clearDraft(CLE_BROUILLON);
}

// ——— Devoirs à créer à partir d'un formulaire ———
export interface ItemDevoir {
  titre: string; type: string; cible: string; audio: boolean; pj: PieceJointe[]; consigne: string | null;
  label: string | null; emoji: string | null; description: string | null; lien_lecon: string | null; etapes: string[];
}

/** Q2-A : une ligne avec 3 éléments choisis = 3 devoirs (« consigne : élément ») */
export function itemsDuFormulaire(f: FormEleve, lignes: LigneDevoir[]): ItemDevoir[] {
  const base = { description: null, lien_lecon: null, etapes: [] as string[] };
  if (!f.parMatiere) {
    const titre = f.titre.trim();
    if (!titre) return [];
    const det = { pj: f.pj.detail || [], consigne: f.consignes.detail || null, label: null, emoji: null, description: f.description.trim() || null,
      lien_lecon: f.lien_lecon.trim() || null, etapes: f.etapes.split('\n').map((l) => l.trim()).filter(Boolean), audio: f.audio_requis, type: f.type };
    return f.ciblesDetail.length
      ? f.ciblesDetail.map((c) => ({ ...det, titre: f.ciblesDetail.length > 1 ? `${titre} : ${c.l}` : titre, cible: c.v }))
      : [{ ...det, titre, cible: '' }];
  }
  return lignes.filter((m) => (f.lignes[m.key] || '').trim()).flatMap((m) => {
    const texte = (f.lignes[m.key] || '').trim();
    const commun = { ...base, type: m.type, audio: !!f.audios[m.key], pj: f.pj[m.key] || [], consigne: f.consignes[m.key] || null,
      label: m.perso ? m.label : null, emoji: m.perso ? m.emoji : null };
    const cibles = m.perso ? [] : (f.cibles[m.key] || []);
    return cibles.length
      ? cibles.map((c) => ({ ...commun, titre: cibles.length > 1 ? `${texte} : ${c.l}` : texte, cible: c.v }))
      : [{ ...commun, titre: texte, cible: '' }];
  });
}

// ——— Donner les devoirs (avec file hors ligne) ———
export interface Distribution {
  eleveIds: string[];
  items: ItemDevoir[];
  date_limite: string;
  /** Préparé à l'avance : visible (et notifié) à l'heure du cours */
  visible_a: string | null;
  source_task_id?: string;
  created_by: string | null;
  cree_le: string;
}

const FILE = 'dinislam_devoirs_en_attente';
export const EVT_DEVOIRS_ATTENTE = 'dinislam:devoirs-attente';
const lireFile = (): Distribution[] => { try { return JSON.parse(localStorage.getItem(FILE) || '[]'); } catch { return []; } };
const ecrireFile = (l: Distribution[]) => {
  try { if (l.length) localStorage.setItem(FILE, JSON.stringify(l)); else localStorage.removeItem(FILE); } catch { /* stockage indisponible */ }
  try { window.dispatchEvent(new Event(EVT_DEVOIRS_ATTENTE)); } catch { /* hors navigateur */ }
};
export const distributionsEnAttente = () => lireFile();
const horsLigne = (msg: string) =>
  (typeof navigator !== 'undefined' && navigator.onLine === false) || /fetch|network|load failed|hors connexion|timeout|aborted/i.test(msg);

async function envoyer(d: Distribution) {
  const lignes: TablesInsert<'devoirs'>[] = d.eleveIds.flatMap((sid) => d.items.map((it) => ({
    titre: it.titre, type: it.type, cible_module: it.cible ? it.type : null, cible_id: it.cible || null, audio_requis: it.audio,
    consigne_audio_url: it.consigne, pieces_jointes: it.pj as unknown as Json, matiere_label: it.label, matiere_emoji: it.emoji,
    description: it.description, lien_lecon: it.lien_lecon, etapes: it.etapes, date_limite: d.date_limite || null,
    visible_a: d.visible_a, assigned_to: 'student', student_id: sid, created_by: d.created_by,
  })));
  const { error } = await supabase.from('devoirs').insert(lignes);
  if (error) throw new Error(error.message);
  if (d.source_task_id) {
    const now = new Date().toISOString();
    await supabase.from('admin_tasks').update({ done: true, done_at: now, updated_at: now }).eq('id', d.source_task_id).eq('done', false).then(() => {}, () => {});
  }
  // 📓 Une seule notification par distribution (texte choisi par Nadia)
  const liste = d.items.map((it) => it.titre).join(' · ');
  if (d.visible_a && new Date(d.visible_a) > new Date()) {
    const v = new Date(d.visible_a);
    const p = (n: number) => String(n).padStart(2, '0');
    const jour = `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
    await supabase.from('scheduled_notifications').insert({
      module: 'devoirs', message: liste, start_date: jour, end_date: jour,
      send_time: `${p(v.getHours())}:${p(v.getMinutes())}`, recipients: d.eleveIds, is_active: true, created_by: d.created_by,
    }).then(() => {}, () => {});
  } else {
    sendPushNotification({ userIds: d.eleveIds, title: '📓 Tes nouveaux devoirs sont prêts !', category: 'hw_new', body: liste, data: { url: '/?open=devoirs' } });
  }
}

/** 'ok' | 'en_attente' (hors ligne : gardé, envoyé au retour du réseau) ; lève une erreur si la base refuse */
export async function donnerDevoirs(d: Omit<Distribution, 'cree_le'>): Promise<'ok' | 'en_attente'> {
  const dist: Distribution = { ...d, cree_le: new Date().toISOString() };
  try {
    await envoyer(dist);
    return 'ok';
  } catch (e) {
    if (!horsLigne((e as Error).message || '')) throw e;
    ecrireFile([...lireFile(), dist]);
    return 'en_attente';
  }
}

let enCours = false;
export async function envoyerDevoirsEnAttente(): Promise<number> {
  if (enCours) return 0;
  const l = lireFile();
  if (!l.length) return 0;
  enCours = true;
  let n = 0;
  const reste: Distribution[] = [];
  try {
    for (const d of l) {
      try { await envoyer(d); n++; } catch (e) {
        if (horsLigne((e as Error).message || '')) reste.push(d);
        else console.error('[Devoirs] distribution refusée par la base', d, e);
      }
    }
  } finally { ecrireFile(reste); enCours = false; }
  return n;
}
