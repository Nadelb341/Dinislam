import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsOver20 } from '@/hooks/useIsOver20';
import AppLayout from '@/components/layout/AppLayout';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, FileText, Music, Lock, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';

const AllahNamesPage = () => {
  const { user, isAdmin } = useAuth();
  const isOver20 = useIsOver20();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [mediaOpen, setMediaOpen] = useState<'video' | 'audio' | 'pdf' | null>(null);

  const { data: names = [], isLoading } = useQuery({
    queryKey: ['allah-names'],
    queryFn: async () => {
      const { data, error } = await supabase.from('allah_names').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['allah-name-progress', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
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
      const { data, error } = await (supabase as any).from('allah_name_media')
        .select('*')
        .eq('name_id', selected.id);
      if (error) throw error;
      return (data || []) as Array<{ id: string; media_type: string; file_url: string; file_name: string }>;
    },
  });

  const validatedIds = new Set((progress as any[]).filter((p: any) => p.is_validated).map((p: any) => p.name_id));
  const validatedCount = validatedIds.size;
  const totalCount = names.length;

  const isNameAccessible = (index: number): boolean => {
    if (isAdmin || isOver20) return true;
    if (index === 0) return true;
    const prevName = (names as any[])[index - 1];
    return validatedIds.has(prevName?.id);
  };

  const validateMutation = useMutation({
    mutationFn: async (nameId: number) => {
      const { error } = await (supabase as any)
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
      toast.success('Nom mémorisé ! ✅');
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
  });

  const getMedia = (type: string) => selectedMedia.find((m: any) => m.media_type === type);
  const isSelectedValidated = selected ? validatedIds.has(selected.id) : false;

  const openName = (name: any, index: number) => {
    if (!isNameAccessible(index)) {
      toast.info('Mémorise le nom précédent d\'abord ! 🔒');
      return;
    }
    setSelected(name);
    setMediaOpen(null);
  };

  return (
    <AppLayout title="99 Noms d'Allah">
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

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'hsl(222 50% 12%)' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(names as any[]).map((name: any, index: number) => {
                const accessible = isNameAccessible(index);
                const validated = validatedIds.has(name.id);
                return (
                  <button
                    key={name.id}
                    onClick={() => openName(name, index)}
                    className="relative flex flex-col items-center rounded-2xl p-4 active:scale-95 transition-all duration-200 overflow-hidden text-left border"
                    style={{
                      background: accessible
                        ? 'linear-gradient(145deg, hsl(222 55% 11%), hsl(222 65% 8%))'
                        : 'hsl(222 40% 8%)',
                      borderColor: validated
                        ? 'rgba(34,197,94,0.4)'
                        : accessible
                          ? 'rgba(217, 119, 6, 0.2)'
                          : 'rgba(217,119,6,0.07)',
                      minHeight: '148px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                      opacity: accessible ? 1 : 0.45,
                    }}
                  >
                    {/* Order badge */}
                    <span
                      className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ color: 'hsl(38 92% 55%)', background: 'rgba(217,119,6,0.18)' }}
                    >
                      {name.display_order}
                    </span>

                    {/* Lock or check icon */}
                    {validated ? (
                      <span className="absolute top-2 right-2">
                        <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(142 70% 45%)' }} />
                      </span>
                    ) : !accessible ? (
                      <span className="absolute top-2 right-2">
                        <Lock className="h-3.5 w-3.5" style={{ color: 'hsl(222 20% 40%)' }} />
                      </span>
                    ) : null}

                    {/* Image or decorative element */}
                    {name.image_url ? (
                      <img
                        src={name.image_url}
                        alt={name.name_french}
                        className="w-full h-14 object-cover rounded-xl mb-2 mt-4 opacity-80"
                      />
                    ) : (
                      <div className="w-full flex items-center justify-center mt-5 mb-1">
                        <svg width="44" height="28" viewBox="0 0 44 28" fill="none" opacity={accessible ? 0.3 : 0.12}>
                          <path d="M2 28 Q2 6 22 2 Q42 6 42 28" stroke="hsl(38 92% 55%)" strokeWidth="1.5" fill="none"/>
                          <line x1="2" y1="28" x2="42" y2="28" stroke="hsl(38 92% 55%)" strokeWidth="1.5"/>
                        </svg>
                      </div>
                    )}

                    <p className="font-arabic text-2xl font-bold text-center leading-tight w-full mt-1" style={{ color: 'hsl(0 0% 95%)' }}>
                      {accessible ? name.name_arabic : '﹖'}
                    </p>
                    {name.transliteration && accessible && (
                      <p className="text-xs font-semibold text-center mt-1" style={{ color: 'hsl(38 92% 58%)' }}>
                        {name.transliteration}
                      </p>
                    )}
                    <p className="text-[11px] text-center mt-0.5 leading-tight" style={{ color: 'hsl(222 15% 65%)' }}>
                      {accessible ? name.name_french : '🔒 Verrouillé'}
                    </p>

                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: validated
                        ? 'linear-gradient(90deg, transparent, hsl(142 70% 45%), transparent)'
                        : 'linear-gradient(90deg, transparent, hsl(38 92% 50%), transparent)'
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      {selected && (
        <Dialog open onOpenChange={() => { setSelected(null); setMediaOpen(null); }}>
          <DialogContent
            className="max-w-md max-h-[90vh] overflow-y-auto p-0 border-0"
            style={{
              background: 'linear-gradient(180deg, hsl(222 65% 9%) 0%, hsl(222 75% 6%) 100%)',
              border: '1px solid rgba(217,119,6,0.25)',
            }}
          >
            <button
              onClick={() => { setSelected(null); setMediaOpen(null); }}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(217,119,6,0.2)', color: 'hsl(38 92% 58%)' }}
            >
              <X className="h-4 w-4" />
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
                  <img src={selected.image_url} alt={selected.name_french}
                    className="w-full h-40 object-cover rounded-2xl mb-4 opacity-90" />
                )}

                <p className="font-arabic text-5xl font-bold leading-tight mb-3" style={{ color: 'hsl(0 0% 97%)' }}>
                  {selected.name_arabic}
                </p>

                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-px w-12" style={{ background: 'hsl(38 92% 50%)' }} />
                  <span style={{ color: 'hsl(38 92% 58%)' }}>✦</span>
                  <div className="h-px w-12" style={{ background: 'hsl(38 92% 50%)' }} />
                </div>

                {selected.transliteration && (
                  <p className="text-lg font-bold mb-1" style={{ color: 'hsl(38 92% 58%)' }}>
                    {selected.transliteration}
                  </p>
                )}
                <p className="text-base text-white/75">{selected.name_french}</p>
              </div>

              {selected.explanation && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.18)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: 'hsl(38 92% 58%)' }}>Explication</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(222 15% 72%)' }}>{selected.explanation}</p>
                </div>
              )}

              {/* Validation button */}
              {!isAdmin && (
                <div className="pt-1">
                  {isSelectedValidated ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <CheckCircle2 className="h-5 w-5" style={{ color: 'hsl(142 70% 45%)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'hsl(142 70% 50%)' }}>Nom mémorisé ✅</span>
                    </div>
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

              {/* Media */}
              {(getMedia('video') || getMedia('audio') || getMedia('pdf')) && (
                <div className="space-y-2">
                  <p className="text-xs font-bold" style={{ color: 'hsl(38 92% 58%)' }}>Ressources</p>
                  <div className="flex flex-wrap gap-2">
                    {getMedia('video') && (
                      <Button size="sm" onClick={() => setMediaOpen('video')} className="gap-2 text-xs border" variant="outline"
                        style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)', borderColor: 'rgba(217,119,6,0.3)' }}>
                        <Play className="h-3.5 w-3.5" /> Vidéo
                      </Button>
                    )}
                    {getMedia('audio') && (
                      <Button size="sm" onClick={() => setMediaOpen('audio')} className="gap-2 text-xs border" variant="outline"
                        style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)', borderColor: 'rgba(217,119,6,0.3)' }}>
                        <Music className="h-3.5 w-3.5" /> Audio
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
                    <video controls className="w-full rounded-xl mt-2" style={{ maxHeight: '200px' }}>
                      <source src={getMedia('video')!.file_url} />
                    </video>
                  )}
                  {mediaOpen === 'audio' && getMedia('audio') && (
                    <audio controls className="w-full mt-2">
                      <source src={getMedia('audio')!.file_url} />
                    </audio>
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
