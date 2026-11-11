import type { Saison } from '@/lib/saisons';

/** 🎠 Logique des petits jeux de saison (pure, testée dans jeuxSaisonLogique.test.ts) */

/** Le compagnon de la saison : le même personnage que celui qui se promène en bas (choix gardé pendant la visite) */
export function compagnonDe(saison: Saison, userId: string | null): { type: 'automne' | 'hiver' | 'clair'; cle: string; nom: string } {
  const lireS = (k: string) => { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch { return null; } };
  if (saison === 'automne') {
    const p = lireS(`dinislam_tapis_perso_${userId ?? 'invite'}`) === 'ecureuil' ? 'ecureuil' : 'herisson';
    return { type: 'automne', cle: p, nom: p === 'ecureuil' ? 'L\'écureuil' : 'Le hérisson' };
  }
  if (saison === 'hiver') {
    const p = lireS(`dinislam_hiver_perso_${userId ?? 'invite'}`) === 'bonhomme' ? 'bonhomme' : 'pingouin';
    return { type: 'hiver', cle: p, nom: p === 'bonhomme' ? 'Le bonhomme de neige' : 'Le pingouin' };
  }
  return saison === 'printemps' ? { type: 'clair', cle: 'lapin', nom: 'Le lapin' } : { type: 'clair', cle: 'crabe', nom: 'Le crabe' };
}

/** 💬 Ce que dit le compagnon : il encourage à travailler, à faire valider ses devoirs, et à revenir pour qu'il grandisse */
export function messagesCompagnon(c: { prenom: string; nom: string; grandi: boolean; niveau: number; aFaire: number }): string[] {
  const p = c.prenom || 'toi';
  const premier = c.grandi
    ? `Salam ${p} ! Merci d'être venu aujourd'hui : j'ai grandi 🌱 Reviens demain pour que je grandisse encore !`
    : `Salam ${p} ! Je suis content de te revoir 😊 Je grandis un peu chaque jour où tu viens me voir.`;
  const devoirs = c.aFaire > 0
    ? `Il te reste ${c.aFaire} devoir${c.aFaire > 1 ? 's' : ''} à faire. On s'y met ensemble ? 💪`
    : `Tous tes devoirs sont faits, ma shā' Allah ! 🌟`;
  return [
    premier,
    devoirs,
    'Quand tu as fini un devoir, envoie-le à ton professeur pour qu\'il le valide : ton diamant va briller 💎',
    'Un petit peu chaque jour, c\'est ce qu\'Allah aime le plus 💚',
    `Si tu reviens demain, je serai encore plus grand ! ${c.niveau >= 10 ? 'Regarde comme j\'ai déjà poussé 😄' : 'Je compte sur toi 🤞'}`,
    'As-tu révisé ta sourate aujourd\'hui ? Récite-la-moi dans ta tête 📖',
    'Dis « Bismillah » avant de commencer ton travail, et ça ira tout seul 🤲',
    'Une lettre de plus, et tu liras encore mieux l\'arabe ! 🔤',
  ];
}

export interface Question { question: string; grand?: string; options: string[]; bonne: string }

const BANQUE: Question[] = [
  { question: 'Combien de prières obligatoires fait-on chaque jour ?', options: ['3', '5', '7'], bonne: '5' },
  { question: 'Quelle est la première sourate du Coran ?', options: ['Al-Fâtiha', 'An-Nâs', 'Al-Ikhlâs'], bonne: 'Al-Fâtiha' },
  { question: 'Que dit-on avant de manger ?', options: ['Bismillah', 'Allahou Akbar', 'Amîn'], bonne: 'Bismillah' },
  { question: 'Quelle est la dernière sourate du Coran ?', options: ['Al-Falaq', 'An-Nâs', 'Al-Kawthar'], bonne: 'An-Nâs' },
  { question: 'Quelle prière fait-on au lever du jour ?', options: ['Fajr', 'Maghrib', 'Icha'], bonne: 'Fajr' },
  { question: 'Que dit-on après avoir mangé ?', options: ['Al-hamdoulillah', 'Bismillah', 'Salam'], bonne: 'Al-hamdoulillah' },
  { question: 'Combien de lettres compte l\'alphabet arabe ?', options: ['26', '28', '30'], bonne: '28' },
  { question: 'Quel mois jeûne-t-on ?', options: ['Ramadan', 'Chawwal', 'Rajab'], bonne: 'Ramadan' },
  { question: 'Dans quel sens lit-on l\'arabe ?', options: ['De droite à gauche', 'De gauche à droite', 'De haut en bas'], bonne: 'De droite à gauche' },
  { question: 'Quelle prière fait-on au coucher du soleil ?', options: ['Maghrib', 'Dhohr', 'Asr'], bonne: 'Maghrib' },
  { question: 'Que répond-on à « Assalamou alaykoum » ?', options: ['Wa alaykoum assalam', 'Bismillah', 'In shaa Allah'], bonne: 'Wa alaykoum assalam' },
  { question: 'Combien de sourates compte le Coran ?', options: ['99', '114', '120'], bonne: '114' },
  { question: 'Que dit-on quand on éternue ?', options: ['Al-hamdoulillah', 'Astaghfiroullah', 'Amîn'], bonne: 'Al-hamdoulillah' },
  { question: 'Quelle sourate dit « Qoul houwa Allahou ahad » ?', options: ['Al-Ikhlâs', 'Al-Falaq', 'Al-Kâfiroun'], bonne: 'Al-Ikhlâs' },
];

/** Petit hasard stable : la même question toute la journée, et des réponses mélangées toujours de la même façon */
function graine(t: string) { let h = 7; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); }
function melanger<T>(l: T[], g: number): T[] { const a = [...l]; let s = g || 1; for (let i = a.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** ❓ Question du jour : un jour sur deux une de SES lettres apprises (s'il en a au moins 3), sinon une question de la banque */
export function questionDuJour(jour: string, apprises: { letter_arabic: string; name_french: string }[]): Question {
  const g = graine(jour);
  if (apprises.length >= 3 && g % 2 === 0) {
    const l = apprises[g % apprises.length];
    const autres = melanger(apprises.filter((x) => x.name_french !== l.name_french), g).slice(0, 2).map((x) => x.name_french);
    return { question: 'Quelle est cette lettre ?', grand: l.letter_arabic, options: melanger([l.name_french, ...autres], g + 1), bonne: l.name_french };
  }
  const q = BANQUE[g % BANQUE.length];
  return { ...q, options: melanger(q.options, g) };
}
