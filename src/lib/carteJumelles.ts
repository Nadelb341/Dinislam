/**
 * 👯 Cartes jumelles de la Prière (Nadia, 2026-11-26 : « dans mon compte j'ai les bonnes images, les autres utilisateurs
 * ont les anciennes… que ça n'arrive plus ») : chaque carte existe en 3 exemplaires, un par groupe d'âge (petits / jeunes /
 * adultes, `group_key` de la carte du haut). Une jumelle = même chemin de titres (ex. « lodo › 2 - dire bismilah ») dans un
 * AUTRE groupe. Changer le titre, l'image ou le cadrage d'une carte change aussi ses jumelles.
 */
export interface CarteArbre { id: string; title: string | null; parent_id: string | null; group_key: string | null }

const racine = <T extends CarteArbre>(c: T, toutes: T[]) => {
  let x = c;
  for (let i = 0; x.parent_id && i < 20; i++) { const p = toutes.find((y) => y.id === x.parent_id); if (!p) break; x = p; }
  return x;
};
const chemin = <T extends CarteArbre>(c: T, toutes: T[]) => {
  const t: string[] = [];
  let x: T | undefined = c;
  for (let i = 0; x && i < 20; i++) { t.unshift((x.title ?? '').trim().toLowerCase()); x = x.parent_id ? toutes.find((y) => y.id === x!.parent_id) : undefined; }
  return t.join(' › ');
};

/** Les ids des jumelles de `carte` dans les autres groupes d'âge (à calculer AVANT de changer le titre) */
export function jumelles<T extends CarteArbre>(carte: T, toutes: T[]): string[] {
  const k = chemin(carte, toutes), g = racine(carte, toutes).group_key;
  return toutes.filter((c) => c.id !== carte.id && racine(c, toutes).group_key !== g && chemin(c, toutes) === k).map((c) => c.id);
}

/**
 * Les zones de contenu (fiche, vidéo, quiz…) sont PARTAGÉES par les 3 jumelles : on les range toutes sous la carte du
 * groupe « petits » (là où Nadia travaille), sinon sous la carte elle-même. Un seul quiz à valider par vidéo.
 */
export function idZonesPartagees<T extends CarteArbre>(carte: T, toutes: T[]): string {
  const ids = [carte.id, ...jumelles(carte, toutes)];
  const petits = ids.find((id) => { const c = toutes.find((x) => x.id === id); return c && racine(c, toutes).group_key === 'petits'; });
  return petits ?? carte.id;
}
