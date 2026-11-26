import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import PresenceEnClasse from '@/components/home/PresenceEnClasse';
import { useCarnet } from '@/components/carnet/useCarnet';
import { useConvocations } from '@/components/convocations/useConvocations';
import { CarnetEditeur } from '@/components/carnet/CarnetEditeur';
import { dateCarnet, elevesVises, trierCarnet } from '@/lib/carnet';

/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L20) — fiche d'un élève (bouclier) : au même endroit,
 * 📋 sa présence (touchée = page Présence) et 📒 son carnet de liaison : les derniers messages qui lui sont arrivés
 * (lu / pas lu, signé ou non) + « Écrire au carnet de cet élève ». Lecture hors ligne : dernières copies.
 */
export function CarnetPresenceEleve({ eleveId, nom }: { eleveId: string; nom: string | null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ecrire, setEcrire] = useState(false);
  const { data: carnet } = useCarnet(user?.id ?? null, true);
  const { data: classe } = useConvocations(true);

  const messages = useMemo(() => {
    const eleve = (classe?.eleves ?? []).find((e) => e.id === eleveId);
    if (!carnet || !eleve) return [];
    const cible = [{ id: eleve.id, nom: eleve.nom, groupes: eleve.groupes, parents: eleve.parents }];
    return trierCarnet(carnet.messages)
      .filter((m) => new Date(m.envoyer_le).getTime() <= Date.now() && elevesVises(m, cible).length > 0)
      .slice(0, 5)
      .map((m) => {
        const l = carnet.lectures.filter((x) => x.message_id === m.id && (x.user_id === eleve.id || eleve.parents.includes(x.user_id)));
        return { m, lu: l.length > 0, signe: l.some((x) => x.role === 'parent' || eleve.parents.includes(x.user_id)) };
      });
  }, [carnet, classe?.eleves, eleveId]);

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-foreground">📋 Présence et 📒 carnet</h4>
      <PresenceEnClasse eleveId={eleveId} onOuvrir={() => navigate('/attendance')} vide="Pas encore de présence notée." />
      <div className="rounded-xl border-2 border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-1.5">
        <p className="text-sm font-extrabold text-amber-900 dark:text-amber-100">📒 Carnet de liaison</p>
        {!messages.length ? <p className="text-xs text-muted-foreground">Aucun message reçu pour l'instant.</p> : messages.map(({ m, lu, signe }) => (
          <div key={m.id} className="flex items-start gap-2 text-sm">
            <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{m.emoji} {m.titre} <span className="text-[11px] text-muted-foreground">· {dateCarnet(m.envoyer_le)}</span></span>
            <span className="shrink-0 text-[11px] font-bold">{lu ? '👁️ lu' : '· pas lu'}{m.signature ? (signe ? ' · ✍️' : ' · ✍️ à signer') : ''}</span>
          </div>
        ))}
        <button type="button" onClick={() => setEcrire(true)} className="w-full rounded-lg bg-amber-500 text-white px-3 py-2 text-sm font-extrabold">📒 Écrire au carnet de cet élève</button>
      </div>
      {ecrire && (
        <CarnetEditeur message={null} modeles={carnet?.modeles ?? []} classe={classe} onClose={() => setEcrire(false)}
          initial={{ cible: 'eleves', student_ids: [eleveId], titre: nom ? `Pour ${nom.trim().split(/\s+/)[0]}` : '' }} />
      )}
    </div>
  );
}
