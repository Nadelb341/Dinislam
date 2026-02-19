import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Play, FileText, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AllahNamesPage = () => {
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

  const getMedia = (type: string) => selectedMedia.find((m: any) => m.media_type === type);

  return (
    <AppLayout title="99 Noms d'Allah">
      {/* Dark deep-blue background with arabesque overlay */}
      <div
        className="min-h-screen relative"
        style={{
          background: 'linear-gradient(180deg, hsl(222 60% 8%) 0%, hsl(222 75% 5%) 100%)',
        }}
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
          <div className="text-center py-6">
            <p
              className="font-arabic text-4xl mb-3 leading-relaxed"
              style={{ color: 'hsl(38 92% 65%)' }}
            >
              أسماء الله الحسنى
            </p>
            <h1 className="font-bold text-xl mb-1 text-white">
              Les 99 Noms d'Allah
            </h1>
            <p className="text-sm" style={{ color: 'hsl(222 20% 55%)' }}>
              {names.length} noms • Explorez les significations divines
            </p>
            {/* Gold divider */}
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
              {names.map((name: any) => (
                <button
                  key={name.id}
                  onClick={() => setSelected(name)}
                  className="relative flex flex-col items-center rounded-2xl p-4 active:scale-95 transition-all duration-200 overflow-hidden text-left border"
                  style={{
                    background: 'linear-gradient(145deg, hsl(222 55% 11%), hsl(222 65% 8%))',
                    borderColor: 'rgba(217, 119, 6, 0.2)',
                    minHeight: '148px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Order badge */}
                  <span
                    className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ color: 'hsl(38 92% 55%)', background: 'rgba(217,119,6,0.18)' }}
                  >
                    {name.display_order}
                  </span>

                  {/* Custom image or decorative element */}
                  {name.image_url ? (
                    <img
                      src={name.image_url}
                      alt={name.name_french}
                      className="w-full h-14 object-cover rounded-xl mb-2 mt-4 opacity-80"
                    />
                  ) : (
                    <div className="w-full flex items-center justify-center mt-5 mb-1">
                      <svg width="44" height="28" viewBox="0 0 44 28" fill="none" opacity="0.3">
                        <path d="M2 28 Q2 6 22 2 Q42 6 42 28" stroke="hsl(38 92% 55%)" strokeWidth="1.5" fill="none"/>
                        <line x1="2" y1="28" x2="42" y2="28" stroke="hsl(38 92% 55%)" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  )}

                  {/* Arabic name */}
                  <p
                    className="font-arabic text-2xl font-bold text-center leading-tight w-full mt-1"
                    style={{ color: 'hsl(0 0% 95%)' }}
                  >
                    {name.name_arabic}
                  </p>

                  {/* Transliteration in amber/gold */}
                  {name.transliteration && (
                    <p
                      className="text-xs font-semibold text-center mt-1"
                      style={{ color: 'hsl(38 92% 58%)' }}
                    >
                      {name.transliteration}
                    </p>
                  )}

                  {/* French translation */}
                  <p
                    className="text-[11px] text-center mt-0.5 leading-tight"
                    style={{ color: 'hsl(222 15% 65%)' }}
                  >
                    {name.name_french}
                  </p>

                  {/* Bottom amber accent line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: 'linear-gradient(90deg, transparent, hsl(38 92% 50%), transparent)' }}
                  />
                </button>
              ))}
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
            {/* Close button */}
            <button
              onClick={() => { setSelected(null); setMediaOpen(null); }}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(217,119,6,0.2)', color: 'hsl(38 92% 58%)' }}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="text-center pt-2">
                <span
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
                  style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)' }}
                >
                  Nom #{selected.display_order}
                </span>

                {selected.image_url && (
                  <img
                    src={selected.image_url}
                    alt={selected.name_french}
                    className="w-full h-40 object-cover rounded-2xl mb-4 opacity-90"
                  />
                )}

                {/* Arabic calligraphy */}
                <p className="font-arabic text-5xl font-bold leading-tight mb-3" style={{ color: 'hsl(0 0% 97%)' }}>
                  {selected.name_arabic}
                </p>

                {/* Gold divider */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-px w-12" style={{ background: 'hsl(38 92% 50%)' }} />
                  <span style={{ color: 'hsl(38 92% 58%)' }}>✦</span>
                  <div className="h-px w-12" style={{ background: 'hsl(38 92% 50%)' }} />
                </div>

                {/* Transliteration */}
                {selected.transliteration && (
                  <p className="text-lg font-bold mb-1" style={{ color: 'hsl(38 92% 58%)' }}>
                    {selected.transliteration}
                  </p>
                )}

                {/* French */}
                <p className="text-base text-white/75">
                  {selected.name_french}
                </p>
              </div>

              {/* Explanation */}
              {selected.explanation && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(217,119,6,0.07)',
                    border: '1px solid rgba(217,119,6,0.18)',
                  }}
                >
                  <p className="text-xs font-bold mb-2" style={{ color: 'hsl(38 92% 58%)' }}>
                    Explication
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(222 15% 72%)' }}>
                    {selected.explanation}
                  </p>
                </div>
              )}

              {/* Media buttons */}
              {(getMedia('video') || getMedia('audio') || getMedia('pdf')) && (
                <div className="space-y-2">
                  <p className="text-xs font-bold" style={{ color: 'hsl(38 92% 58%)' }}>Ressources</p>
                  <div className="flex flex-wrap gap-2">
                    {getMedia('video') && (
                      <Button
                        size="sm"
                        onClick={() => setMediaOpen('video')}
                        className="gap-2 text-xs border"
                        style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)', borderColor: 'rgba(217,119,6,0.3)' }}
                        variant="outline"
                      >
                        <Play className="h-3.5 w-3.5" /> Vidéo
                      </Button>
                    )}
                    {getMedia('audio') && (
                      <Button
                        size="sm"
                        onClick={() => setMediaOpen('audio')}
                        className="gap-2 text-xs border"
                        style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)', borderColor: 'rgba(217,119,6,0.3)' }}
                        variant="outline"
                      >
                        <Music className="h-3.5 w-3.5" /> Audio
                      </Button>
                    )}
                    {getMedia('pdf') && (
                      <Button
                        size="sm"
                        onClick={() => setMediaOpen('pdf')}
                        className="gap-2 text-xs border"
                        style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)', borderColor: 'rgba(217,119,6,0.3)' }}
                        variant="outline"
                      >
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
                    <a
                      href={getMedia('pdf')!.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-center py-3 rounded-xl text-sm font-bold"
                      style={{ background: 'rgba(217,119,6,0.15)', color: 'hsl(38 92% 58%)' }}
                    >
                      📄 Ouvrir le PDF
                    </a>
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
