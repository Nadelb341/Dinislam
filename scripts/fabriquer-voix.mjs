#!/usr/bin/env node
/**
 * 🎙️ Fabrique UNE SEULE FOIS les voix des tout-petits et du mot arabe du jour (choix de Nadia du 26/11), puis refait l'index
 * `src/data/voixFabriquees.ts`. Seules les NOUVELLES phrases sont fabriquées : un fichier déjà là n'est jamais refait.
 *
 *   node scripts/fabriquer-voix.mjs                 → lit la base (lecture seule), fabrique ce qui manque, refait l'index
 *   node scripts/fabriquer-voix.mjs --base x.json   → prend les textes de la base dans un fichier (même forme que la requête)
 *   node scripts/fabriquer-voix.mjs --nettoyer      → efface aussi les fichiers qui ne servent plus (sinon : juste listés)
 *
 * Outils (gratuits) : EDGE_TTS = chemin de `edge-tts` (pip install edge-tts), FFMPEG = chemin de ffmpeg,
 * SUPABASE_WORKDIR = dossier lié à la base (celui qui a `supabase/.temp`), par défaut le dossier courant.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEBIT = '-15%';
const VOIX = {
  jamal: { ar: 'ar-MA-JamalNeural', fr: 'fr-FR-RemyMultilingualNeural' },
  hamed: { ar: 'ar-SA-HamedNeural', fr: 'fr-FR-HenriNeural' },
};
const EDGE_TTS = process.env.EDGE_TTS || 'edge-tts';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const args = process.argv.slice(2);
const option = (nom) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : null; };

/** ⚠️ Même règle que `normaliserTexteVoix` de src/lib/voixFabriquees.ts : les changer ENSEMBLE */
function normaliser(texte) {
  return texte.normalize('NFC')
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{1F3FB}-\u{1F3FF}]|\uFE0F|\u200D|\u20E3/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ——— 1. Les textes de la base (SELECT seulement) ———
const SQL = `select json_build_object(
  'fiches', (select json_agg(json_build_object('rubrique', rubrique, 'titre', titre, 'arabe', arabe)) from public.petits_fiches),
  'quiz', (select json_agg(json_build_object('rubrique', f.rubrique, 'question', q.question, 'choix', q.choix))
     from public.petits_quiz q left join public.petits_fiches f on f.id = q.fiche_id),
  'quizvideos', (select json_agg(json_build_object('rubrique', coalesce(f.rubrique, hv.rubrique), 'questions', qv.questions))
     from public.quiz_videos qv
     join public.histoires_videos hv on qv.cible = 'histoire_video:' || hv.id::text
     left join public.petits_fiches f on f.id = hv.fiche_id)
) as tout;`;

function lireBase() {
  const fichier = option('--base');
  let brut;
  if (fichier) brut = fs.readFileSync(fichier, 'utf8');
  else {
    const sql = path.join(os.tmpdir(), `fabriquer-voix-${process.pid}.sql`);
    fs.writeFileSync(sql, SQL);
    const workdir = process.env.SUPABASE_WORKDIR || process.cwd();
    brut = execFileSync('supabase', ['--workdir', workdir, 'db', 'query', '--linked', '-f', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    fs.rmSync(sql, { force: true });
  }
  const json = JSON.parse(brut.slice(brut.indexOf('{')));
  return json.rows?.[0]?.tout ?? json;
}

// ——— 2. Les mots arabes du jour (écrits dans le code du cache-cache) ———
function motsArabesDuJour() {
  const src = fs.readFileSync(path.join(RACINE, 'src/components/saisons/jeuxSaisonLogique.ts'), 'utf8');
  const mots = [];
  for (const liste of ['MOTS_ARABES', 'MOTS_RAMADAN']) {
    const debut = src.indexOf(`export const ${liste}`);
    const bloc = src.slice(debut, src.indexOf('];', debut));
    for (const m of bloc.matchAll(/arabe:\s*'([^']+)'/g)) mots.push(m[1]);
  }
  if (!mots.length) throw new Error('Aucun mot arabe du jour trouvé dans jeuxSaisonLogique.ts');
  return mots;
}

// ——— 3. Qui dit quoi ———
// Cartes des tout-petits : la carte « Histoires des Prophètes » des grands (rubrique prophetes) n'est PAS fabriquée
// (même lecteur, mais ce n'est pas une carte des tout-petits) ; les invocations des tout-petits gardent la voix du téléphone.
const RUBRIQUES_HORS_PETITS = new Set(['prophetes', 'douas']);
const estPetit = (r) => !!r && !RUBRIQUES_HORS_PETITS.has(r);

function phrases(base) {
  const liste = [];
  const ajouter = (voix, langue, texte) => { const cle = normaliser(texte || ''); if (cle) liste.push({ voix, langue, cle }); };
  for (const f of base.fiches ?? []) {
    if (!estPetit(f.rubrique)) continue;
    if (f.arabe?.trim()) ajouter('jamal', 'ar', f.arabe); else ajouter('jamal', 'fr', f.titre);
  }
  for (const q of base.quiz ?? []) {
    if (!estPetit(q.rubrique)) continue;
    ajouter('jamal', 'fr', q.question);
    for (const c of q.choix ?? []) ajouter('jamal', 'fr', c.texte);
  }
  for (const qv of base.quizvideos ?? []) {
    if (!estPetit(qv.rubrique)) continue;
    for (const q of qv.questions ?? []) {
      ajouter('jamal', 'fr', q.question);
      for (const c of q.choix ?? []) ajouter('jamal', 'fr', typeof c === 'string' ? c : c?.texte);
    }
  }
  for (const mot of motsArabesDuJour()) ajouter('hamed', 'ar', mot);
  const vus = new Set();
  return liste.filter((p) => { const k = `${p.voix}|${p.langue}|${p.cle}`; if (vus.has(k)) return false; vus.add(k); return true; });
}

const nomFichier = (voix, langue, cle) =>
  createHash('sha1').update(`${VOIX[voix][langue]}|${DEBIT}|${cle}`).digest('hex').slice(0, 12) + '.mp3';

// ——— 4. Fabriquer ce qui manque ———
function fabriquer(p, cible) {
  const tmp = path.join(os.tmpdir(), `voix-${process.pid}-${path.basename(cible)}`);
  execFileSync(EDGE_TTS, ['--voice', VOIX[p.voix][p.langue], `--rate=${DEBIT}`, '--text', p.cle, '--write-media', tmp], { stdio: 'ignore' });
  const petit = `${tmp}.48k.mp3`;
  try {
    execFileSync(FFMPEG, ['-nostdin', '-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-b:a', '48k', petit], { stdio: 'ignore' });
    // On garde le plus léger (edge-tts donne déjà souvent du mono 48 kb/s)
    const choisi = fs.statSync(petit).size < fs.statSync(tmp).size ? petit : tmp;
    fs.copyFileSync(choisi, cible);
  } catch { fs.copyFileSync(tmp, cible); }
  fs.rmSync(tmp, { force: true }); fs.rmSync(petit, { force: true });
}

const base = lireBase();
const aDire = phrases(base);
const index = { jamal: { ar: {}, fr: {} }, hamed: { ar: {}, fr: {} } };
let nouveaux = 0, echecs = 0;
for (const p of aDire) {
  const dossier = path.join(RACINE, 'public/sons/voix', p.voix);
  fs.mkdirSync(dossier, { recursive: true });
  const nom = nomFichier(p.voix, p.langue, p.cle);
  const cible = path.join(dossier, nom);
  if (!fs.existsSync(cible)) {
    try { fabriquer(p, cible); nouveaux++; process.stdout.write(`+ ${p.voix} ${p.langue} ${p.cle}\n`); }
    catch (e) { echecs++; console.error(`✖ ${p.voix} ${p.langue} « ${p.cle} » : ${e.message}`); continue; }
  }
  index[p.voix][p.langue][p.cle] = nom;
}

// Fichiers qui ne servent plus (texte changé ou retiré)
const utiles = new Set(Object.entries(index).flatMap(([v, l]) => Object.values(l).flatMap((m) => Object.values(m).map((n) => `${v}/${n}`))));
for (const v of Object.keys(VOIX)) {
  const dossier = path.join(RACINE, 'public/sons/voix', v);
  if (!fs.existsSync(dossier)) continue;
  for (const f of fs.readdirSync(dossier)) {
    if (!f.endsWith('.mp3') || utiles.has(`${v}/${f}`)) continue;
    if (args.includes('--nettoyer')) { fs.rmSync(path.join(dossier, f)); console.log(`🗑️ retiré : ${v}/${f}`); }
    else console.log(`(ne sert plus : ${v}/${f} — relancer avec --nettoyer pour l'effacer)`);
  }
}

// ——— 5. L'index ———
const trier = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const contenu = `// ⚠️ Fichier écrit par \`node scripts/fabriquer-voix.mjs\` : ne pas le modifier à la main.
// Texte normalisé (sans emoji, espaces resserrés) → fichier dans public/sons/voix/<voix>/.
export type VoixFabriquee = 'jamal' | 'hamed';
export const VOIX_FABRIQUEES: Record<VoixFabriquee, { ar: Record<string, string>; fr: Record<string, string> }> = ${JSON.stringify(
  { jamal: { ar: trier(index.jamal.ar), fr: trier(index.jamal.fr) }, hamed: { ar: trier(index.hamed.ar), fr: trier(index.hamed.fr) } }, null, 2)};
`;
fs.writeFileSync(path.join(RACINE, 'src/data/voixFabriquees.ts'), contenu);

const compte = (v, l) => Object.keys(index[v][l]).length;
let taille = 0;
for (const u of utiles) taille += fs.statSync(path.join(RACINE, 'public/sons/voix', u)).size;
console.log(`\nJamal : ${compte('jamal', 'ar')} en arabe, ${compte('jamal', 'fr')} en français · Hamed : ${compte('hamed', 'ar')} en arabe, ${compte('hamed', 'fr')} en français`);
console.log(`${nouveaux} nouveau(x) fichier(s), ${echecs} échec(s), ${(taille / 1048576).toFixed(2)} Mo en tout.`);
if (echecs) process.exitCode = 1;
