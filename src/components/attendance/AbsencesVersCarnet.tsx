import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useCarnet } from '@/components/carnet/useCarnet';
import { useConvocations } from '@/components/convocations/useConvocations';
import { CarnetEditeur } from '@/components/carnet/CarnetEditeur';

export interface AbsenceNotee { studentId: string; nom: string; date: string }

const prenom = (nom: string) => nom.trim().split(/\s+/)[0] || nom;

/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L16) — Présence, côté enseignante : pour chaque absence (🔴) des dernières séances,
 * « 📒 Écrire au carnet de cet élève » ouvre l'éditeur du carnet avec un message déjà écrit (à relire, modifiable),
 * adressé à cet élève seul, signature d'un parent demandée. Hors ligne : le message est gardé et envoyé au retour du réseau.
 */
export function AbsencesVersCarnet({ absences }: { absences: AbsenceNotee[] }) {
  const { user } = useAuth();
  const [ouverte, setOuverte] = useState<AbsenceNotee | null>(null);
  const { data: carnet } = useCarnet(user?.id ?? null, true);
  const { data: classe } = useConvocations(true);
  if (!absences.length) return null;

  const jour = (d: string) => format(parseISO(d), 'EEEE d MMMM', { locale: fr });
  return (
    <div className="rounded-2xl border-2 border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/20 p-3 space-y-2">
      <p className="text-sm font-extrabold text-red-800 dark:text-red-200">🔴 Absences des dernières séances</p>
      {absences.map((a) => (
        <div key={`${a.studentId}-${a.date}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-card px-3 py-2">
          <span className="flex-1 min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{a.nom} · {jour(a.date)}</span>
          <button type="button" onClick={() => setOuverte(a)}
            className="shrink-0 rounded-full bg-amber-500 text-white px-3 py-1.5 text-xs font-extrabold active:scale-95 transition-transform">
            📒 Écrire au carnet de cet élève
          </button>
        </div>
      ))}
      {ouverte && (
        <CarnetEditeur message={null} modeles={carnet?.modeles ?? []} classe={classe} onClose={() => setOuverte(null)}
          initial={{
            emoji: '📅', cible: 'eleves', student_ids: [ouverte.studentId], signature: true,
            titre: `Absence du ${jour(ouverte.date)}`,
            texte: `Bonjour, ${prenom(ouverte.nom)} était absent(e) au cours du ${jour(ouverte.date)}. Merci de me dire pourquoi, et de revoir la leçon à la maison. Merci !`,
          }} />
      )}
    </div>
  );
}
