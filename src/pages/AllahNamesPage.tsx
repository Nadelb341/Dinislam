import { LecteurVideo } from '@/components/video/LecteurVideo';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { useTitreCarte } from '@/hooks/useTitreCarte';
import { ImageCadree } from '@/components/shared/ImageCadree';
import { BoutonBesoinAllah } from '@/components/besoinAllah/BesoinAllah';
import { useState, useEffect, useMemo } from 'react';
import { RechercheNoms } from '@/components/allahNames/RechercheNoms';
import { FicheNom } from '@/components/allahNames/FicheNom';
import { TuileNom } from '@/components/allahNames/TuileNom';
import { FicheAdulte } from '@/components/allahNames/FicheAdulte';
import { BoutonAuthenticite } from '@/components/allahNames/BoutonAuthenticite';
import { lireFicheAdulte } from '@/lib/ficheAdulte';
import { FicheEnfant } from '@/components/allahNames/FicheEnfant';
import { lireFicheEnfant, type Version99Noms } from '@/lib/ficheEnfant';
import { useVersion99Noms } from '@/hooks/useVersion99Noms';
import { rechercherNoms } from '@/lib/nomsAllahRecherche';
import SourateRecitationPanel from '@/components/sourates/SourateRecitationPanel';
import { useConfetti } from '@/hooks/useConfetti';
import { withMoodEmojis } from '@/lib/moodEmojis';
import { withName } from '@/lib/encouragements';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsOver20, useIsOver20Ready } from '@/hooks/useIsOver20';
import { useOpenItemFromUrl, lockedItemMessage, MISSING_ITEM_MESSAGE } from '@/hooks/useOpenItemFromUrl';
import AppLayout from '@/components/layout/AppLayout';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, FileText, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

const AllahNamesPage = () => {
  const titrePage = useTitreCarte('/allah-names', '99 Noms d\'Allah');
  const { user, isAdmin } = useAuth();
  const isOver20 = useIsOver20();
  const ageReady = useIsOver20Ready();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Tables<'allah_names'> | null>(null);
  const [mediaOpen, setMediaOpen] = useState<'video' | 'pdf' | null>(null);
  // 🔍 Recherche (demande de Nadia, 27/11) : résultats en direct, calculés sur l'appareil
  const [recherche, setRecherche] = useState('');
  const { fireSuccess } = useConfetti();
  // Moins de 20 ans : chaque nom s'ouvre quand l'enseignante a validé l'audio du nom précédent (2026-10-19)
  const needsAudio = !isAdmin && !isOver20;
  // 🧒🧑 Version des fiches (Nadia, 27/11) : l'élève voit SA version (âge ou choix de l'enseignante) ; l'enseignante bascule
  const { version: versionEleve } = useVersion99Noms();
  const [vueAdmin, setVueAdmin] = useState<Version99Noms>('adulte');
  const vue: Version99Noms = isAdmin ? vueAdmin : (versionEleve ?? 'enfant');

  const { data: names = [], isLoading, isFetched: namesFetched } = useQuery({
    queryKey: ['allah-names'],
    queryFn: async () => {
      const { data, error } = await supabase.from('allah_names').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: progress = [], isFetched: progressFetched } = useQuery({
    queryKey: ['allah-name-progress', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_allah_name_progress')
        .select('name_id, is_validated')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: selectedMedia = [] } = useQuery({
    queryKey: ['allah-name-media', selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from('allah_name_media')
        .select('*')
        .eq('name_id', selected.id);
      if (error) throw error;
      return (data || []) as Array<{ id: string; media_type: string; file_url: string; file_name: string }>;
    },
  });

  // Audios envoyés qui attendent l'écoute de l'enseignante : badge « ⏳ En attente » sur la vignette (2026-10-23)
  const { data: pendingIds = new Set<number>() } = useQuery({
    queryKey: ['allah-name-pending', user?.id, selected?.id ?? null],
    enabled: !!user && !isAdmin,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('sourate_recitations')
        .select('allah_name_id').eq('student_id', user!.id).eq('status', 'pending').not('allah_name_id', 'is', null);
      if (error) throw error;
      return new Set((data || []).map((r) => r.allah_name_id as number));
    },
  });

  const validatedIds = new Set(progress.filter((p) => p.is_validated).map((p) => p.name_id));
  const nomsAffiches = useMemo(() => {
    if (!recherche.trim()) return names.map((nom, index) => ({ nom, index }));
    return rechercherNoms(names, recherche).map((r) => ({ nom: r.nom, index: names.findIndex((n) => n.id === r.nom.id) }));
  }, [names, recherche]);
  const validatedCount = validatedIds.size;
  const totalCount = names.length;

  const isNameAccessible = (index: number): boolean => {
    if (isAdmin || isOver20) return true;
    if (index === 0) return true;
    const prevName = names[index - 1];
    return validatedIds.has(prevName?.id);
  };

  const validateMutation = useMutation({
    mutationFn: async (nameId: number) => {
      const { error } = await supabase
        .from('user_allah_name_progress')
        .upsert({
          user_id: user!.id,
          name_id: nameId,
          is_validated: true,
          validated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,name_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allah-name-progress', user?.id] });
      toast.success(withName(user, 'Nom mémorisé, bravo {prenom} ! ✅'), {
        description: withMoodEmojis('N\'oublie pas que tu dois retenir ce nom par cœur avant de passer au suivant !'),
        duration: 10000,
      });
    },
    onError: (e) => toast.error(e.message || 'Erreur'),
  });

  // « Partagé = instantané » : audio, image ou texte d'un nom changé par l'enseignante → visible tout de suite (2026-10-25)
  useEffect(() => {
    const channel = supabase
      .channel('allah-names-content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'allah_name_media' },
        () => queryClient.invalidateQueries({ queryKey: ['allah-name-media'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'allah_names' },
        () => queryClient.invalidateQueries({ queryKey: ['allah-names'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Audio validé ou corrigé par l'enseignante : message tout de suite (même si la page reste ouverte)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`allah-name-reviews-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sourate_recitations', filter: `student_id=eq.${user.id}`,
      }, (payload) => {
        const rec = payload.new as Tables<'sourate_recitations'>;
        if (rec.allah_name_id == null) return;
        const name = names.find((n) => n.id === rec.allah_name_id);
        const label = name?.transliteration || name?.name_french || 'ce nom';
        if (rec.status === 'validated') {
          queryClient.invalidateQueries({ queryKey: ['allah-name-progress', user.id] });
          fireSuccess();
          toast.success(withName(user, `Bravo {prenom}, ton professeur a validé ${label} !`), {
            description: withMoodEmojis('N\'oublie pas que tu dois retenir ce nom par cœur avant de passer au suivant !'),
            duration: 10000,
          });
        } else if (rec.status === 'corrected') {
          toast(withMoodEmojis(`Ton professeur t'a envoyé une correction pour ${label}`, 'triste'), {
            description: 'Écoute-la, puis refais ton audio 🎙️ Tu vas y arriver 💪',
            duration: 10000,
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, names, queryClient, fireSuccess]);

  const getMedia = (type: string) => selectedMedia.find((m) => m.media_type === type);
  // La fiche ouverte suit les changements (✏️ de l'enseignante, direct) : on relit la dernière version dans la liste
  const ficheSelection = selected ? names.find((n) => n.id === selected.id) : undefined;
  const isSelectedValidated = selected ? validatedIds.has(selected.id) : false;
  // 🌟 27/11 : la fiche ADULTE de Nadia (si elle existe) remplace l'ancienne fiche en 9 parties, gardée pour l'enseignante en bas
  const ficheAdulteLue = lireFicheAdulte((ficheSelection ?? selected)?.fiche_adulte);
  const ficheEnfant = vue === 'adulte' ? null : lireFicheEnfant((ficheSelection ?? selected)?.fiche_enfant);
  // Version enfant affichée → la fiche adulte n'est pas montrée (un enfant ne voit QUE sa version)
  const ficheAdulte = ficheEnfant ? null : ficheAdulteLue;

  const openName = (name, index) => {
    if (!isNameAccessible(index)) {
      toast.info(needsAudio
        ? 'Envoie d\'abord l\'audio du nom précédent 🎙️ Celui-ci s\'ouvrira quand ton professeur l\'aura validé 🔒'
        : 'Mémorise le nom précédent d\'abord ! 🔒');
      return;
    }
    setSelected(name);
    setMediaOpen(null);
  };

  // « Commencer mon travail » d'un devoir : ?item=<id du nom> → la fiche du nom s'ouvre (une fois)
  useOpenItemFromUrl(namesFetched && ageReady && (!user || progressFetched), (item) => {
    const index = names.findIndex((n) => String(n.id) === item.trim());
    if (index < 0) { toast.info(MISSING_ITEM_MESSAGE); return; }
    // Nom verrouillé : l'ouvrir permettrait de l'envoyer / le valider hors de l'ordre → message clair
    if (!isNameAccessible(index)) { toast.info(lockedItemMessage('Ce nom', false)); return; }
    setSelected(names[index]);
    setMediaOpen(null);
  });

  return (
    <AppLayout title={titrePage}>
      <div
        className="min-h-screen relative"
        style={{ background: 'linear-gradient(180deg, hsl(222 60% 8%) 0%, hsl(222 75% 5%) 100%)' }}
      >
        {/* Arabesque texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.045] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='1'%3E%3Cpath d='M40 0l10 17.3H30L40 0zm0 80L30 62.7h20L40 80zM0 40l17.3-10V50L0 40zm80 0L62.7 50V30L80 40zM40 28a12 12 0 1 1 0 24 12 12 0 0 1 0-24z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative z-10 p-4 pb-24 space-y-6">
          {/* Header */}
          <div className="text-center py-4">
            <p className="font-arabic text-4xl mb-3 leading-relaxed" style={{ color: 'hsl(38 92% 65%)' }}>
              أسماء الله الحسنى
            </p>
            <h1 className="font-bold text-xl mb-1 text-white">Les 99 Noms d'Allah</h1>
            <p className="text-sm" style={{ color: 'hsl(222 20% 55%)' }}>
              {validatedCount} / {totalCount} noms mémorisés
            </p>

            {/* Progress bar */}
            {!isAdmin && totalCount > 0 && (
              <div className="mt-3 mx-auto max-w-xs">
                <div className="w-full h-2 rounded-full" style={{ background: 'rgba(217,119,6,0.15)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(validatedCount / totalCount) * 100}%`,
                      background: 'linear-gradient(90deg, hsl(38 92% 50%), hsl(32 98% 44%))',
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, hsl(38 92% 50%))' }} />
              <span style={{ color: 'hsl(38 92% 55%)' }}>✦</span>
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, hsl(38 92% 50%), transparent)' }} />
            </div>
          </div>

          {/* 🔍 Barre de recherche en haut de la carte (demande de Nadia, 27/11) */}
          {!isLoading && names.length > 0 && (
            <RechercheNoms valeur={recherche} onChange={setRecherche} nbResultats={recherche.trim() ? nomsAffiches.length : null} />
          )}

          {/* 🤲 Besoin d'Allah (choix K-L-M de Nadia, 27/11) : émotions → noms à invoquer → histoire animée */}
          <BoutonBesoinAllah isAdmin={isAdmin} userId={user?.id ?? null} nomsBase={names}
            onOuvrirNom={(id) => {
              const index = names.findIndex((n) => n.id === id);
              if (index < 0) { toast.info(MISSING_ITEM_MESSAGE); return; }
              openName(names[index], index);
            }} />

          {/* 📚 Authenticité (27/11) : noms tirés du Coran / de la Sunna authentique / statut discuté, mêmes fiches */}
          <BoutonAuthenticite noms={names} onOuvrirNom={(id) => {
            const index = names.findIndex((n) => n.id === id);
            if (index < 0) { toast.info(MISSING_ITEM_MESSAGE); return; }
            openName(names[index], index);
          }} />

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'hsl(222 50% 12%)' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {nomsAffiches.map(({ nom: name, index }) => (
                <TuileNom key={name.id} name={name} accessible={isNameAccessible(index)} validated={validatedIds.has(name.id)}
                  pending={pendingIds.has(name.id)} statut={lireFicheAdulte(name.fiche_adulte)?.statut ?? null} onOpen={() => openName(name, index)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      {selected && (
        <Dialog open onOpenChange={() => { setSelected(null); setMediaOpen(null); }}>
          <DialogContent
            className="max-w-md md:max-w-xl max-h-[90vh] overflow-y-auto p-0 border-0"
            style={{
              background: 'linear-gradient(180deg, hsl(222 65% 9%) 0%, hsl(222 75% 6%) 100%)',
              border: '1px solid rgba(217,119,6,0.25)',
            }}
          >
            <button
              onClick={() => { setSelected(null); setMediaOpen(null); }}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-[#EF4444] text-white shadow-md hover:bg-[#DC2626]"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" strokeWidth={2.75} />
            </button>

            <div className="p-6 space-y-5">
              <div className="text-center pt-2">
                <span
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
                  style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)' }}
                >
                  Nom #{selected.display_order}
                </span>

                {selected.image_url && (
                  <ImageCadree src={selected.image_url} alt={selected.name_french} cadrages={selected.image_cadrage} emplacement="detail"
                    className="w-full h-40 rounded-2xl mb-4 opacity-90" />
                )}

              </div>

              {/* 🌟 Fiche en 9 parties (Nadia, 27/11) : 1. arabe, 2. translittération, 3. signification… */}
              {/* 🧒🧑 Enseignante : elle voit les 2 versions (les élèves ne voient que la leur) */}
              {isAdmin && (
                <div role="group" aria-label="Version de la fiche" className="flex flex-wrap justify-center gap-2">
                  {([['petit', '🧸 Petit'], ['enfant', '🧒 Enfant'], ['adulte', '🧑 Adulte']] as [Version99Noms, string][]).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setVueAdmin(v)} aria-pressed={vueAdmin === v}
                      className="rounded-full border-2 px-4 py-1.5 text-sm font-extrabold shadow-sm"
                      style={vueAdmin === v
                        ? { background: 'hsl(38 92% 55%)', borderColor: 'white', color: 'hsl(222 65% 9%)' }
                        : { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(217,119,6,0.5)', color: 'white' }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
              {ficheEnfant
                ? <FicheEnfant fiche={ficheEnfant} nameId={selected.id} isAdmin={isAdmin} petit={vue === 'petit'} audioUrl={getMedia('audio')?.file_url ?? null} />
                : ficheAdulte
                  ? <FicheAdulte fiche={ficheAdulte} numero={selected.display_order} nameId={selected.id} isAdmin={isAdmin} partie="entete" />
                  : <FicheNom fiche={ficheSelection ?? selected} isAdmin={isAdmin} debut={1} fin={3} />}

              {/* 🎙️ Enregistrement en HAUT, juste sous le nom : même place que dans les sourates (Nadia, 2026-11-19) */}
              {/* Enseignante : à cet endroit, l'élève voit le bouton pour lui envoyer son audio (2026-10-23) */}
              {isAdmin && (
                <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(217,119,6,0.07)', border: '1px dashed rgba(217,119,6,0.35)', color: 'hsl(222 15% 78%)' }}>
                  🎙️ Ici, l'élève voit le bouton pour t'envoyer son audio de ce nom. Ta validation (bouclier › « 99 noms d'Allah à valider ») ouvre le nom suivant.
                </div>
              )}


              {/* Validation button */}
              {!isAdmin && (
                <div className="pt-1">
                  {isSelectedValidated ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
                      style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.45)' }}>
                      <CheckCircle2 className="h-5 w-5" style={{ color: 'hsl(45 93% 55%)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'hsl(45 93% 62%)' }}>Nom mémorisé ✅</span>
                    </div>
                  ) : needsAudio ? (
                    <SourateRecitationPanel allahNameId={selected.id} sourateName={selected.transliteration || selected.name_french} theme="night" />
                  ) : (
                    <Button
                      className="w-full gap-2 font-semibold"
                      onClick={() => validateMutation.mutate(selected.id)}
                      disabled={validateMutation.isPending}
                      style={{ background: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(32 98% 44%))', color: 'white' }}
                    >
                      <Star className="h-4 w-4" />
                      {validateMutation.isPending ? 'Enregistrement…' : 'J\'ai mémorisé ce nom'}
                    </Button>
                  )}
                </div>
              )}

              {/* 20 ans et plus : ils valident seuls (le nom suivant s'ouvre), l'audio est facultatif (2026-10-23) */}
              {!isAdmin && !needsAudio && (
                <SourateRecitationPanel allahNameId={selected.id} sourateName={selected.transliteration || selected.name_french} theme="night" optional />
              )}


              {/* Prononciation : écouter, puis répéter */}
              {getMedia('audio') && (
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.3)' }}>
                  <p className="text-sm font-bold" style={{ color: 'hsl(38 92% 62%)' }}>🔊 Écoute bien, puis répète</p>
                  <audio key={getMedia('audio')!.file_url} controls preload="none" className="w-full">
                    <source src={getMedia('audio')!.file_url} />
                  </audio>
                </div>
              )}

              {/* … 4. explication détaillée, 5. preuve, 6. moment, 7. invocation, 8. référence et degré, 9. divergences */}
              {ficheAdulte ? (
                <>
                  <FicheAdulte fiche={ficheAdulte} numero={selected.display_order} nameId={selected.id} isAdmin={isAdmin} partie="corps" />
                  {/* L'ancienne fiche (27/11) reste en base : l'enseignante peut la relire, les élèves ne la voient plus */}
                  {isAdmin && (
                    <details className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(217,119,6,0.35)' }}>
                      <summary className="cursor-pointer text-sm font-bold" style={{ color: 'hsl(38 92% 62%)' }}>📜 Ancienne fiche (27/11) — visible seulement de l'enseignante</summary>
                      <div className="mt-3"><FicheNom fiche={ficheSelection ?? selected} isAdmin={isAdmin} debut={1} fin={9} /></div>
                    </details>
                  )}
                </>
              ) : !ficheEnfant && <FicheNom fiche={ficheSelection ?? selected} isAdmin={isAdmin} debut={4} fin={9} />}

              {/* ✏️ Zones de contenu (texte, images, vidéos, PDF) — 2026-11-21 */}
              <ZonesContenu cible={`nom-allah:${selected.id}`} isAdmin={isAdmin} libelle={selected.name_french} />

              {/* Media */}
              {(getMedia('video') || getMedia('pdf')) && (
                <div className="space-y-2">
                  <p className="text-xs font-bold" style={{ color: 'hsl(38 92% 58%)' }}>Ressources</p>
                  <div className="flex flex-wrap gap-2">
                    {getMedia('video') && (
                      <Button size="sm" onClick={() => setMediaOpen('video')} className="gap-2 text-xs border" variant="outline"
                        style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)', borderColor: 'rgba(217,119,6,0.3)' }}>
                        <Play className="h-3.5 w-3.5" /> Vidéo
                      </Button>
                    )}
                    {getMedia('pdf') && (
                      <Button size="sm" onClick={() => setMediaOpen('pdf')} className="gap-2 text-xs border" variant="outline"
                        style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)', borderColor: 'rgba(217,119,6,0.3)' }}>
                        <FileText className="h-3.5 w-3.5" /> PDF
                      </Button>
                    )}
                  </div>
                  {mediaOpen === 'video' && getMedia('video') && (
                    <LecteurVideo className="rounded-xl mt-2" videoClassName="max-h-[200px] object-contain" src={getMedia('video')!.file_url} />
                  )}
                  {mediaOpen === 'pdf' && getMedia('pdf') && (
                    <button
                      onClick={() => window.open(getMedia('pdf')!.file_url, '_blank', 'noopener,noreferrer')}
                      className="block w-full mt-2 text-center py-3 rounded-xl text-sm font-bold"
                      style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)' }}
                    >
                      📄 Ouvrir le PDF
                    </button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
};

export default AllahNamesPage;
