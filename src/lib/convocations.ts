import { numeroWhatsApp } from '@/lib/bilanTrimestriel';

/**
 * 📨 Convocations (Nadia, 2026-11-11) : variables du message et liens WhatsApp / SMS (1 appui, message déjà écrit).
 * {prénom} {groupe} {jour} {heure} — même rendu que la fonction serveur `convocations-programmees` (à changer ENSEMBLE).
 */
export const VARIABLES = ['{prénom}', '{groupe}', '{jour}', '{heure}'] as const;

export function rendreConvocation(texte: string, v: { prenom: string; groupe: string; jour: string; heure: string }) {
  return texte.replace(/\{pr[ée]nom\}/gi, v.prenom).replace(/\{groupe\}/gi, v.groupe).replace(/\{jour\}/gi, v.jour).replace(/\{heure\}/gi, v.heure);
}

/** « mercredi 18 novembre » et « 13 h 30 » (heure de l'appareil, en France = heure de Paris) */
export const libelleJour = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
export const libelleHeure = (d: Date) => `${d.getHours()} h${d.getMinutes() ? ` ${String(d.getMinutes()).padStart(2, '0')}` : ''}`;

export const prenomDe = (nom: string | null | undefined) => (nom || 'Élève').trim().split(/\s+/)[0];

export const lienWhatsApp = (tel: string, texte: string) => `https://wa.me/${numeroWhatsApp(tel)}?text=${encodeURIComponent(texte)}`;
export const lienSms = (tel: string, texte: string) => `sms:${tel.replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(texte)}`;

/** Destinataire choisi (idée 2) : numéro de l'élève, du parent 1 ou du parent 2 */
export type Destinataire = 'eleve' | 'parent1' | 'parent2';
export const NOM_DESTINATAIRE: Record<Destinataire, string> = { eleve: 'Élève', parent1: 'Parent 1', parent2: 'Parent 2' };
export function numeroPour(p: { phone?: string | null; parent_phone?: string | null; parent2_phone?: string | null }, d: Destinataire): string | null {
  const n = d === 'eleve' ? p.phone : d === 'parent1' ? p.parent_phone : p.parent2_phone;
  return n && n.replace(/[^\d+]/g, '').length >= 6 ? n.trim() : null;
}

/** ISO 1 = lundi … 7 = dimanche (comme group_schedules) */
export const JOURS_ISO = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
