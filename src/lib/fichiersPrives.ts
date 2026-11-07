import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * 🔒 Fichiers privés (2026-11-07, audit idée 4 « voix privées ») : voix et photos des enfants.
 * Ces 4 espaces de stockage vont devenir PRIVÉS : une adresse « publique » n'y marchera plus.
 * En base, on garde l'adresse publique (elle contient le chemin du fichier) ; AU MOMENT d'afficher ou de jouer,
 * on la remplace par un lien signé (valable 1 h). Un lien signé marche aussi tant que l'espace est encore public :
 * le code fonctionne avant ET après le passage en privé.
 * Tout autre lien (blob:, data:, espaces publics comme sourate-content, module-cards, coran-pages, alphabet-content…)
 * est rendu tel quel.
 */
export const ESPACES_PRIVES = ['recitations', 'messages-audio', 'devoirs-audios', 'devoirs-fichiers'] as const;
export type EspacePrive = (typeof ESPACES_PRIVES)[number];

const estEspacePrive = (e: string): e is EspacePrive => (ESPACES_PRIVES as readonly string[]).includes(e);

/** Durée du lien signé (secondes) et durée pendant laquelle on le réutilise (un peu moins, pour ne jamais servir un lien périmé) */
const DUREE_LIEN_S = 3600;
export const GARDE_MS = 50 * 60 * 1000;

const ADRESSE = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?#]+)\/([^?#]+)/;

/** Reconnaît une adresse d'un des 4 espaces privés et rend { espace, chemin } (chemin décodé, sans « ?… ») ; sinon null */
export function cheminPrive(url: string | null | undefined): { espace: EspacePrive; chemin: string } | null {
  if (!url || /^(blob:|data:)/.test(url)) return null;
  const m = url.match(ADRESSE);
  if (!m) return null;
  const espace = m[1];
  if (!estEspacePrive(espace)) return null;
  let chemin = m[2];
  try { chemin = decodeURIComponent(chemin); } catch { /* chemin mal encodé : gardé tel quel */ }
  chemin = chemin.replace(/^\/+/, '');
  return chemin ? { espace, chemin } : null;
}

/* ---------- Mémoire des liens signés ---------- */
const memoire = new Map<string, { url: string; jusqua: number }>();
const cle = (espace: EspacePrive, chemin: string) => `${espace}/${chemin}`;

/** Lien déjà prêt (synchrone) : adresse non privée → elle-même ; lien signé encore frais → lui ; sinon undefined */
export function lienPretTout(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const p = cheminPrive(url);
  if (!p) return url;
  const m = memoire.get(cle(p.espace, p.chemin));
  return m && m.jusqua > Date.now() ? m.url : undefined;
}

/* ---------- Signature groupée : toutes les demandes d'un même instant partent en une seule fois par espace ---------- */
type Attente = { chemin: string; fini: (u: string | null) => void };
let lot: Map<EspacePrive, Attente[]> | null = null;
const enCours = new Map<string, Promise<string | null>>();

async function signerLot(espace: EspacePrive, attentes: Attente[]) {
  const chemins = [...new Set(attentes.map((a) => a.chemin))];
  const res = new Map<string, string | null>();
  try {
    if (chemins.length === 1) {
      const { data, error } = await supabase.storage.from(espace).createSignedUrl(chemins[0], DUREE_LIEN_S);
      res.set(chemins[0], error ? null : data?.signedUrl ?? null);
    } else {
      const { data, error } = await supabase.storage.from(espace).createSignedUrls(chemins, DUREE_LIEN_S);
      if (!error) (data || []).forEach((d) => { if (d.path) res.set(d.path, d.error ? null : d.signedUrl ?? null); });
    }
  } catch { /* hors connexion, refus… : on rendra l'adresse d'origine */ }
  const jusqua = Date.now() + GARDE_MS;
  attentes.forEach((a) => {
    const u = res.get(a.chemin) ?? null;
    if (u) memoire.set(cle(espace, a.chemin), { url: u, jusqua });
    a.fini(u);
  });
}

function signer(espace: EspacePrive, chemin: string): Promise<string | null> {
  const k = cle(espace, chemin);
  const deja = enCours.get(k);
  if (deja) return deja;
  const p = new Promise<string | null>((fini) => {
    if (!lot) {
      lot = new Map();
      setTimeout(() => {
        const l = lot; lot = null;
        l?.forEach((attentes, e) => { void signerLot(e, attentes); });
      }, 10);
    }
    const liste = lot.get(espace) ?? [];
    liste.push({ chemin, fini });
    lot.set(espace, liste);
  }).finally(() => { enCours.delete(k); });
  enCours.set(k, p);
  return p;
}

/**
 * Adresse lisible d'un fichier : lien signé pour les 4 espaces privés, adresse d'origine sinon.
 * Si la signature échoue (hors connexion, droit manquant…), on rend l'adresse d'origine (jamais d'erreur).
 */
export async function urlLisible(url: string): Promise<string> {
  const pret = lienPretTout(url);
  if (pret) return pret;
  const p = cheminPrive(url);
  if (!p) return url;
  return (await signer(p.espace, p.chemin)) ?? url;
}

/** Plusieurs adresses d'un coup (les signatures partent groupées par espace) */
export function urlsLisibles(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map((u) => urlLisible(u)));
}

/**
 * Hook : adresse lisible, ou undefined tant que le lien signé n'est pas prêt (ne rien jouer/afficher pendant ce temps).
 * Adresse non privée : rendue tout de suite, sans aucune requête.
 */
export function useUrlLisible(url: string | null | undefined): string | undefined {
  const prive = !!cheminPrive(url);
  const { data } = useQuery({
    queryKey: ['url-lisible', url],
    queryFn: () => urlLisible(url as string),
    enabled: prive,
    initialData: () => (prive ? lienPretTout(url) : undefined),
    staleTime: GARDE_MS,
    gcTime: GARDE_MS,
    retry: false,
    networkMode: 'always',
  });
  if (!url) return undefined;
  return prive ? data : url;
}

/** Pour les tests */
export function _viderMemoireFichiersPrives() { memoire.clear(); enCours.clear(); }
