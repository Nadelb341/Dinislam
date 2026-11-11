import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';

/**
 * 🔤 Ouvrir / fermer une lettre de l'Alphabet à un groupe entier ou à un élève (Nadia, 2026-11-11, maquette B).
 * - groupe : `alphabet_group_unlocks` (vaut aussi pour les futurs membres du groupe, idée 2) ;
 * - élève  : `alphabet_admin_unlocks` (comme avant) ;
 * - idée 3 : notification (catégorie « lesson » = « Note de l'enseignante et nouvelle leçon débloquée ») aux élèves qui la gagnent ;
 * - idée 9 : une ligne dans le journal de « Qui voit quoi » (carte « Alphabet ») ;
 * - idée 10 : sans réseau, gardé sur l'appareil et envoyé au retour du réseau.
 */
export interface OperationLettre {
  sens: 'ouvrir' | 'fermer';
  cible: 'groupe' | 'eleve';
  id: string;
  letterId: number;
  journal: string;
  prevenir: string[];
  titreLettre: string;
  cree_le: string;
}

const CLE = 'dinislam_alphabet_ouvertures_en_attente';
export const EVT_ATTENTE_LETTRES = 'dinislam:alphabet-attente';

function lire(): OperationLettre[] {
  try { return JSON.parse(localStorage.getItem(CLE) || '[]'); } catch { return []; }
}
function ecrire(l: OperationLettre[]) {
  try { if (l.length) localStorage.setItem(CLE, JSON.stringify(l)); else localStorage.removeItem(CLE); } catch { /* stockage indisponible */ }
  try { window.dispatchEvent(new Event(EVT_ATTENTE_LETTRES)); } catch { /* hors navigateur */ }
}
export const operationsLettresEnAttente = () => lire();

const horsLigne = (msg: string) =>
  (typeof navigator !== 'undefined' && navigator.onLine === false) || /fetch|network|load failed|hors connexion|timeout|aborted/i.test(msg);

async function envoyer(o: OperationLettre) {
  const r = o.cible === 'groupe'
    ? (o.sens === 'ouvrir'
      ? await supabase.from('alphabet_group_unlocks').upsert({ group_id: o.id, letter_id: o.letterId }, { onConflict: 'group_id,letter_id', ignoreDuplicates: true })
      : await supabase.from('alphabet_group_unlocks').delete().eq('group_id', o.id).eq('letter_id', o.letterId))
    : (o.sens === 'ouvrir'
      ? await supabase.from('alphabet_admin_unlocks').upsert({ user_id: o.id, letter_id: o.letterId }, { onConflict: 'user_id,letter_id', ignoreDuplicates: true })
      : await supabase.from('alphabet_admin_unlocks').delete().eq('user_id', o.id).eq('letter_id', o.letterId));
  if (r.error) throw new Error(r.error.message);
  await supabase.from('cartes_journal').insert({ module_id: null, carte: 'Alphabet', quoi: o.journal, cree_le: o.cree_le }).then(() => {}, () => {});
  if (o.sens === 'ouvrir' && o.prevenir.length) {
    sendPushNotification({
      userIds: o.prevenir, category: 'lesson', tag: `lettre-${o.letterId}`,
      title: `🔤 {prenom}, nouvelle lettre ouverte : ${o.titreLettre} !`,
      body: 'Écoute ton prof et répète, puis envoie-la pour qu\'elle soit validée.',
      data: { url: '/alphabet' },
    });
  }
}

/** 'ok' | 'en_attente' (hors ligne, gardé) ; lève une erreur si la base refuse */
export async function changerLettre(o: Omit<OperationLettre, 'cree_le'>): Promise<'ok' | 'en_attente'> {
  const op: OperationLettre = { ...o, cree_le: new Date().toISOString() };
  try {
    await envoyer(op);
    return 'ok';
  } catch (e) {
    if (!horsLigne((e as Error).message || '')) throw e;
    // La dernière décision gagne pour une même lettre et une même cible
    ecrire([...lire().filter((x) => !(x.cible === op.cible && x.id === op.id && x.letterId === op.letterId)), op]);
    return 'en_attente';
  }
}

let enCours = false;
export async function envoyerLettresEnAttente(): Promise<number> {
  if (enCours) return 0;
  const l = lire();
  if (!l.length) return 0;
  enCours = true;
  let n = 0;
  const reste: OperationLettre[] = [];
  try {
    for (const o of l) {
      try { await envoyer(o); n++; } catch (e) {
        if (horsLigne((e as Error).message || '')) reste.push(o);
        else console.error('[Alphabet] ouverture refusée par la base', o, e);
      }
    }
  } finally { ecrire(reste); enCours = false; }
  return n;
}
