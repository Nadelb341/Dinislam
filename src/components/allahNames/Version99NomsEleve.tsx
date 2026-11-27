import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { ageDe, CHOIX_VERSION, estChoixVersion, versionPourEleve, type ChoixVersion } from '@/lib/ficheEnfant';

/**
 * 🧒🧑 Fiche élève (enseignante) : « 99 noms : version enfant / adulte » (Nadia, 27/11).
 * « Selon l'âge » = 3-6 ans petit, 7-12 enfant, 13+ adulte, âge inconnu = enfant. Écriture hors ligne possible.
 */
const NOMS: Record<'petit' | 'enfant' | 'adulte', string> = { petit: '🧸 petit (3-6 ans)', enfant: '🧒 enfant', adulte: '🧑 adulte' };

export function Version99NomsEleve({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const cle = ['version-99-noms', 'admin', userId];
  const { data } = useQuery({
    queryKey: cle,
    queryFn: async () => {
      const [profil, choix] = await Promise.all([
        supabase.from('profiles').select('age, date_of_birth').eq('user_id', userId).maybeSingle(),
        supabase.from('allah_names_version_eleve').select('version').eq('user_id', userId).maybeSingle(),
      ]);
      const c = choix.data?.version;
      return { age: ageDe(profil.data), choix: (estChoixVersion(c) ? c : 'auto') as ChoixVersion };
    },
  });
  const choix = data?.choix ?? 'auto';
  const resultat = versionPourEleve(data?.age ?? null, choix);

  const changer = async (v: ChoixVersion) => {
    if (v === choix) return;
    try {
      const r = await ecrireOuGarder({ table: 'allah_names_version_eleve', op: 'upsert', rows: [{ user_id: userId, version: v, updated_at: new Date().toISOString() }] });
      queryClient.setQueryData(cle, { age: data?.age ?? null, choix: v });
      toast.success(r === 'ok' ? '✅ Enregistré' : '✅ Enregistré sur l\'appareil : envoi au retour du réseau');
    } catch (e) { toast.error((e as Error).message || 'Erreur'); }
  };

  return (
    <div className="space-y-2 border-t pt-4">
      <h4 className="font-semibold text-foreground">🌟 99 noms : version enfant / adulte</h4>
      <div className="flex flex-wrap gap-2">
        {CHOIX_VERSION.map((c) => (
          <button key={c.cle} type="button" onClick={() => void changer(c.cle)} aria-pressed={choix === c.cle}
            className={choix === c.cle
              ? 'rounded-full border-2 border-primary bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground'
              : 'rounded-full border-2 border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground'}>
            {c.libelle}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Voit la version <b>{NOMS[resultat]}</b>
        {choix === 'auto' && (data?.age == null ? ' (âge inconnu : version enfant)' : ` (${data.age} ans)`)}.
      </p>
    </div>
  );
}
