import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';
import { elevesQuiVoient, memeAcces, texteChangement, textePeriode, versBase, type Acces, type CarteBase, type Eleve } from '@/lib/cartesAcces';

/**
 * 🗂️ Enregistrer qui voit une carte (Nadia, 2026-11-11) — SEUL chemin d'écriture : page « Qui voit quoi »,
 * fenêtre « Afficher à… », menu ⋮ de l'accueil, fiche élève.
 * - écrit learning_modules (is_active + dates) et module_visibility ;
 * - écrit une ligne dans le journal (idée 7) ;
 * - prévient SEULEMENT les élèves qui gagnent la carte maintenant (idée 6, catégorie « act ») ;
 *   une ouverture programmée dans le futur est annoncée par la tâche planifiée `cartes-programmees` ;
 * - 📡 sans réseau (idée 10) : le changement est gardé sur l'appareil et envoyé au retour du réseau.
 */
export interface CarteAEnregistrer extends CarteBase { id: string; title: string; builtin_path: string | null }
export interface Periode { ouverte_du: string | null; ouverte_jusquau: string | null }

interface Envoi {
  moduleId: string; titre: string; url: string;
  carte: { is_active: boolean; ouverte_du?: string | null; ouverte_jusquau?: string | null; ouverture_annoncee_le?: string | null };
  visibilite: ReturnType<typeof versBase>;
  journal: string; prevenir: string[]; cree_le: string;
}

const CLE = 'dinislam_acces_cartes_en_attente';
export const EVT_ATTENTE = 'dinislam:acces-cartes-attente';

function lireAttente(): Envoi[] {
  try { return JSON.parse(localStorage.getItem(CLE) || '[]'); } catch { return []; }
}
function ecrireAttente(l: Envoi[]) {
  try { if (l.length) localStorage.setItem(CLE, JSON.stringify(l)); else localStorage.removeItem(CLE); } catch { /* stockage indisponible */ }
  try { window.dispatchEvent(new Event(EVT_ATTENTE)); } catch { /* hors navigateur (tests) */ }
}
export const nombreEnAttente = () => lireAttente().length;
/** Changements pas encore envoyés (pour les afficher tout de suite, même hors ligne) */
export const changementsEnAttente = () => lireAttente().map((e) => ({ moduleId: e.moduleId, carte: e.carte, visibilite: e.visibilite }));

const estHorsLigne = (msg: string) =>
  (typeof navigator !== 'undefined' && navigator.onLine === false) || /fetch|network|load failed|hors connexion|timeout|aborted/i.test(msg);

async function envoyer(e: Envoi) {
  const { visibilite } = e;
  const r1 = await supabase.from('learning_modules').update(e.carte).eq('id', e.moduleId);
  if (r1.error) throw new Error(r1.error.message);
  const r2 = await supabase.from('module_visibility').upsert({
    module_id: e.moduleId, visibility_type: visibilite.visibility_type, user_ids: visibilite.user_ids, group_ids: visibilite.group_ids,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'module_id' });
  if (r2.error) throw new Error(r2.error.message);
  if (e.journal) await supabase.from('cartes_journal').insert({ module_id: e.moduleId, carte: e.titre, quoi: e.journal, cree_le: e.cree_le }).then(() => {}, () => {});
  if (e.prevenir.length) {
    sendPushNotification({
      userIds: e.prevenir, category: 'act', tag: `carte-${e.moduleId.slice(0, 8)}`,
      title: `🎉 {prenom}, nouvelle carte : ${e.titre} !`,
      body: `La carte « ${e.titre} » est maintenant ouverte pour toi sur Dinislam.`,
      data: { url: e.url },
    });
  }
}

/** Renvoie 'ok' | 'en_attente' (gardé sur l'appareil) ; lève une erreur pour un vrai refus de la base */
export async function enregistrerAcces(p: {
  carte: CarteAEnregistrer; avant: Acces; apres: Acces; periode?: Periode;
  eleves: Eleve[]; nomGroupe: (id: string) => string; nomEleve: (id: string) => string;
}): Promise<'ok' | 'en_attente' | 'rien'> {
  const { carte, avant, apres, periode } = p;
  const datesChangent = !!periode && (periode.ouverte_du !== (carte.ouverte_du ?? null) || periode.ouverte_jusquau !== (carte.ouverte_jusquau ?? null));
  if (memeAcces(avant, apres) && !datesChangent) return 'rien';

  const apresCarte: CarteBase = { is_active: apres.mode === 'tous', ouverte_du: periode ? periode.ouverte_du : carte.ouverte_du, ouverte_jusquau: periode ? periode.ouverte_jusquau : carte.ouverte_jusquau };
  const voyaient = elevesQuiVoient(carte, avant, p.eleves);
  const verront = elevesQuiVoient(apresCarte, apres, p.eleves);
  const prevenir = [...verront].filter((id) => !voyaient.has(id));

  const lignes = [texteChangement(avant, apres, p.nomGroupe, p.nomEleve)];
  if (datesChangent) lignes.push(textePeriode(apresCarte) ? `⏰ Ouverte ${textePeriode(apresCarte)}` : '⏰ Plus de dates d\'ouverture');
  const base = versBase(apres);
  const envoi: Envoi = {
    moduleId: carte.id, titre: carte.title, url: carte.builtin_path || '/',
    carte: {
      is_active: base.is_active,
      ...(periode ? {
        ouverte_du: periode.ouverte_du, ouverte_jusquau: periode.ouverte_jusquau,
        // Ouverture dans le futur → la tâche planifiée l'annoncera le jour venu ; sinon c'est annoncé ici
        ...(datesChangent ? { ouverture_annoncee_le: periode.ouverte_du && Date.parse(periode.ouverte_du) > Date.now() ? null : new Date().toISOString() } : {}),
      } : {}),
    },
    visibilite: base, journal: lignes.filter(Boolean).join(' · '), prevenir, cree_le: new Date().toISOString(),
  };

  try {
    await envoyer(envoi);
    return 'ok';
  } catch (e) {
    const msg = (e as Error).message || '';
    if (!estHorsLigne(msg)) throw e;
    // Le plus récent gagne : un seul changement en attente par carte (on garde les élèves à prévenir des deux)
    const attente = lireAttente();
    const ancien = attente.find((x) => x.moduleId === carte.id);
    if (ancien) envoi.prevenir = [...new Set([...ancien.prevenir, ...envoi.prevenir])].filter((id) => verront.has(id));
    ecrireAttente([...attente.filter((x) => x.moduleId !== carte.id), envoi]);
    return 'en_attente';
  }
}

let envoiEnCours = false;
/** Envoie les changements gardés hors ligne (au retour du réseau, à l'ouverture). Renvoie le nombre envoyé. */
export async function envoyerAccesEnAttente(): Promise<number> {
  if (envoiEnCours) return 0;
  const attente = lireAttente();
  if (!attente.length) return 0;
  envoiEnCours = true;
  let envoyes = 0;
  const reste: Envoi[] = [];
  try {
    for (const e of attente) {
      try { await envoyer(e); envoyes++; } catch (err) {
        if (estHorsLigne((err as Error).message || '')) reste.push(e);
        else console.error('[Qui voit quoi] changement refusé par la base', e.titre, err);
      }
    }
  } finally {
    ecrireAttente(reste);
    envoiEnCours = false;
  }
  return envoyes;
}
