/**
 * 🌙 Dates de la 5ᵉ saison « Ramadan » et des deux Aïds (Nadia, 2026-11-15) : calculées toutes seules (calendrier hégirien
 * de l'appareil, Intl « islamic »), et MODIFIABLES par Nadia (bouclier › Décorations saisons › 🌙 Ramadan) si l'annonce
 * de la lune donne un autre jour : le décor part alors exactement ce jour-là, ni avant ni après.
 * - Ramadan : du 1ᵉʳ jour (dès la veille au soir si `veille`) jusqu'à la veille de l'Aïd.
 * - Aïd el-Fitr (« Aïd Sghir ») : 1 jour, même décor en plus festif.
 * - Aïd el-Adha (« Aïd Kebir ») : 3 jours, avec les moutons.
 */
export type DatesRamadan = { debut: string; aidFitr: string; aidAdha: string };
export type PeriodeRamadan = { mode: 'ramadan' | 'fitr' | 'adha'; jour: number; debut: string; aidFitr: string; aidAdha: string } | null;

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const jourDe = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const ajouter = (s: string, n: number) => { const d = jourDe(s); d.setDate(d.getDate() + n); return iso(d); };
const ecart = (a: string, b: string) => Math.round((jourDe(b).getTime() - jourDe(a).getTime()) / 86400000);

function hegire(d: Date): { m: number; j: number } | null {
  try {
    const p = new Intl.DateTimeFormat('en-u-ca-islamic', { month: 'numeric', day: 'numeric' }).formatToParts(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12));
    return { m: Number(p.find((x) => x.type === 'month')?.value), j: Number(p.find((x) => x.type === 'day')?.value) };
  } catch { return null; }
}
/** Prochain jour (à partir de `depuis`) qui tombe le `j` du mois hégirien `m` */
function prochain(m: number, j: number, depuis: Date): string | null {
  const d = new Date(depuis.getFullYear(), depuis.getMonth(), depuis.getDate());
  for (let i = 0; i < 400; i++) { const h = hegire(d); if (h && h.m === m && h.j === j) return iso(d); d.setDate(d.getDate() + 1); }
  return null;
}

/** Dates calculées : le Ramadan en cours ou le prochain, et l'Aïd el-Adha en cours ou le prochain */
export function datesAutomatiques(maintenant = new Date()): DatesRamadan {
  const auj = iso(maintenant);
  // On part 40 jours en arrière pour retrouver un Ramadan déjà commencé
  const recul = new Date(maintenant); recul.setDate(recul.getDate() - 40);
  let debut = prochain(9, 1, recul) ?? '';
  let aidFitr = debut ? (prochain(10, 1, jourDe(debut)) ?? ajouter(debut, 30)) : '';
  if (aidFitr && ecart(aidFitr, auj) > 0) { // déjà fini : le suivant
    debut = prochain(9, 1, jourDe(ajouter(aidFitr, 1))) ?? '';
    aidFitr = debut ? (prochain(10, 1, jourDe(debut)) ?? ajouter(debut, 30)) : '';
  }
  const recul2 = new Date(maintenant); recul2.setDate(recul2.getDate() - 3);
  const aidAdha = prochain(12, 10, recul2) ?? '';
  return { debut, aidFitr, aidAdha };
}

/** Dates retenues : celles de Nadia si elle en a écrit (et qu'elles ne sont pas déjà dépassées), sinon le calcul */
export function datesRetenues(choix: Partial<DatesRamadan> | undefined, maintenant = new Date()): DatesRamadan {
  const auto = datesAutomatiques(maintenant), auj = iso(maintenant);
  const ok = (s: string | undefined, garde: number) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && ecart(s, auj) <= garde;
  return {
    debut: ok(choix?.debut, 45) ? choix!.debut! : auto.debut,
    aidFitr: ok(choix?.aidFitr, 3) ? choix!.aidFitr! : auto.aidFitr,
    aidAdha: ok(choix?.aidAdha, 4) ? choix!.aidAdha! : auto.aidAdha,
  };
}

/**
 * Ce qu'on fête maintenant (ou rien). `veilleDes` = heure (« HH:MM ») du Maghrib de la veille : avec l'option « dès la veille
 * au soir », le décor du Ramadan s'allume à ce moment-là.
 */
export function periodeRamadan(d: DatesRamadan, maintenant = new Date(), veilleDes: string | null = null): PeriodeRamadan {
  const auj = iso(maintenant);
  if (d.aidAdha && ecart(d.aidAdha, auj) >= 0 && ecart(d.aidAdha, auj) <= 2) return { mode: 'adha', jour: ecart(d.aidAdha, auj) + 1, ...d };
  if (d.aidFitr && auj === d.aidFitr) return { mode: 'fitr', jour: 1, ...d };
  if (!d.debut || !d.aidFitr) return null;
  if (ecart(d.debut, auj) >= 0 && ecart(auj, d.aidFitr) > 0) return { mode: 'ramadan', jour: ecart(d.debut, auj) + 1, ...d };
  if (veilleDes && ecart(auj, d.debut) === 1) {
    const [h, m] = veilleDes.split(':').map(Number);
    if (maintenant.getHours() * 60 + maintenant.getMinutes() >= h * 60 + m) return { mode: 'ramadan', jour: 0, ...d };
  }
  return null;
}
