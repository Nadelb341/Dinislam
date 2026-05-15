import { useState, useEffect, useRef } from 'react';
import { NPM_VERSETS } from './npmVersets';
import { getCdnAudioUrl } from './cdnAudio';
import { getHoussaryEmbedUrl } from '@/data/houssaryVideos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, BookOpen, FileText, File, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuranVerses } from '@/hooks/useQuranVerses';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SourateRecitationPanel from './SourateRecitationPanel';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';

function LecteurVerset({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [vitesse, setVitesse] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duree, setDuree] = useState(0);
  const [temps, setTemps] = useState(0);
  const [erreur, setErreur] = useState(false);
  const [charge, setCharge] = useState(false);
  const VITESSES = [0.5, 1, 1.5, 2];

  const formatTemps = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setErreur(false);
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      if (audio.readyState < 2) {
        setCharge(true);
        audio.load();
        await new Promise((resolve, reject) => {
          audio.oncanplay = resolve;
          audio.onerror = reject;
          setTimeout(reject, 10000);
        });
        setCharge(false);
      }
      audio.playbackRate = vitesse;
      await audio.play();
      setPlaying(true);
    } catch (e) {
      console.error('Audio error:', e);
      setCharge(false);
      setErreur(true);
      setPlaying(false);
    }
  };

  const changerVitesse = (v: number) => {
    if (audioRef.current) audioRef.current.playbackRate = v;
    setVitesse(v);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duree) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duree;
  };

  if (!audioUrl) return null;

  return (
    <div className="rounded-xl p-3 mt-2"
      style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (!a) return;
          setTemps(a.currentTime);
          setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuree(audioRef.current.duration);
        }}
        onEnded={() => setPlaying(false)}
        onError={() => { setErreur(true); setPlaying(false); setCharge(false); }}
      >
        <source src={audioUrl} />
      </audio>
      {erreur && (
        <p className="text-red-500 text-xs mb-2">
          ⚠️ Impossible de charger l'audio
        </p>
      )}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={togglePlay}
          disabled={charge}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm active:scale-95"
          style={{ backgroundColor: charge ? '#9ca3af' : '#f59e0b' }}
        >
          {charge ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : playing ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
              <rect x="5" y="3" width="4" height="18" rx="1"/>
              <rect x="15" y="3" width="4" height="18" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
              <polygon points="6,3 20,12 6,21"/>
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div
            className="w-full h-2 rounded-full cursor-pointer mb-1"
            style={{ backgroundColor: '#e5e7eb' }}
            onClick={handleProgressClick}
          >
            <div className="h-2 rounded-full"
              style={{ width: `${progress}%`, backgroundColor: '#f59e0b' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{formatTemps(temps)}</span>
            <span>{formatTemps(duree)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-1">
        {VITESSES.map(v => (
          <button key={v} onClick={() => changerVitesse(v)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold active:scale-95"
            style={{
              backgroundColor: vitesse === v ? '#f59e0b' : '#ffffff',
              color: vitesse === v ? '#ffffff' : '#9ca3af',
              border: `1px solid ${vitesse === v ? '#f59e0b' : '#e5e7eb'}`
            }}>
            ×{v}
          </button>
        ))}
      </div>
    </div>
  );
}

function LecteurVideoSourate({ videoUrl }: { videoUrl: string }) {
  const [playing, setPlaying] = useState(false);
  const [src, setSrc] = useState('');

  const buildUrl = (url: string, autoplay: boolean) => {
    const base = url.split('?')[0];
    return `${base}?` + new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      iv_load_policy: '3',
      disablekb: '0',
      fs: '1',
    }).toString();
  };

  useEffect(() => {
    setSrc(buildUrl(videoUrl, false));
    setPlaying(false);
  }, [videoUrl]);

  const togglePlay = () => {
    const newPlaying = !playing;
    setPlaying(newPlaying);
    setSrc(buildUrl(videoUrl, newPlaying));
  };

  if (!videoUrl) return null;

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-2">
        🎬 Vidéo de la sourate
      </p>
      <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={src}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          frameBorder="0"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
        <div className="absolute top-0 left-0 right-0" style={{ height: '55px' }} />
        {!playing && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#f59e0b' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                <polygon points="6,3 20,12 6,21"/>
              </svg>
            </div>
          </div>
        )}
        {playing && (
          <button
            onClick={togglePlay}
            className="absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <rect x="5" y="3" width="4" height="18" rx="1"/>
              <rect x="15" y="3" width="4" height="18" rx="1"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface SourateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourate: {
    number: number;
    name_arabic: string;
    name_french: string;
    verses_count: number;
    revelation_type: string;
  };
  dbId: string | undefined;
  verseProgress: Map<string, boolean>;
  sourateProgress: { is_validated: boolean; is_memorized: boolean; progress_percentage: number } | undefined;
  contents: any[];
  onVerseToggle: (dbId: string, verseNum: number, sourateNumber: number, versesCount: number) => void;
}

const SourateDetailDialog = ({
  open,
  onOpenChange,
  sourate,
  dbId,
  verseProgress,
  sourateProgress,
  contents,
  onVerseToggle,
}: SourateDetailDialogProps) => {
  const { verses, loading: versesLoading } = useQuranVerses(open ? sourate.number : null);
  const [versetsAudio, setVersetsAudio] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  useEffect(() => {
    if (open && dbId) {
      supabase
        .from('sourate_versets_audio' as any)
        .select('*')
        .eq('sourate_id', dbId)
        .order('verset_number', { ascending: true })
        .then(({ data }) => setVersetsAudio(data || []));

      supabase
        .from('sourates')
        .select('video_url' as any)
        .eq('id', dbId)
        .maybeSingle()
        .then(({ data }) => {
          setVideoUrl((data as any)?.video_url || null);
        });

      // Mark targeted content as viewed
      const targetedIds = contents.filter((c: any) => c.target_user_id && !c.viewed_at).map((c: any) => c.id);
      if (targetedIds.length > 0) {
        (supabase as any).from('sourate_content')
          .update({ viewed_at: new Date().toISOString() })
          .in('id', targetedIds)
          .then(() => {});
      }
    }
  }, [open, dbId, contents]);

  if (!dbId) return null;

  let validatedVerses = 0;
  for (let i = 1; i <= sourate.verses_count; i++) {
    if (verseProgress.get(`${dbId}-${i}`)) validatedVerses++;
  }
  const versePercentage = Math.round((validatedVerses / sourate.verses_count) * 100);

  const handlePrintSourate = () => {
    const sourateVerses = NPM_VERSETS[sourate.number];
    const sourateNum = sourate.number === 1000 ? '2-255' : String(sourate.number);

    let content = '';
    if (sourateVerses) {
      content = sourateVerses
        .flatMap(({ parts }) => parts.map(p => `<img src="${p.imageUrl}" class="verse-img" />`))
        .join('\n');
    } else {
      content = `<p class="fallback">Cette sourate n'est pas encore disponible en format image.</p>`;
    }

    const printWindow = window.open('', '_blank', 'width=820,height=960');
    if (!printWindow) {
      toast.error('Popups bloquées — autorisez les popups pour cette page.');
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sourate.name_arabic} — ${sourate.name_french}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #f4ede0;
      font-family: 'Traditional Arabic', 'Amiri', Georgia, serif;
      min-height: 100vh;
    }

    /* ── Barre boutons ── */
    .btn-bar {
      position: fixed; top: 0; left: 0; right: 0; height: 48px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 14px;
      background: rgba(255,252,245,0.97);
      border-bottom: 1px solid #d4a84b;
      z-index: 100;
      direction: ltr;
    }
    .close-btn {
      background: #c0392b; color: #fff; border: none; border-radius: 8px;
      padding: 7px 16px; font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: Arial, sans-serif; letter-spacing: 0.3px;
    }
    .print-btn {
      background: #8b6914; color: #fff; border: none; border-radius: 8px;
      padding: 7px 16px; font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: Arial, sans-serif; letter-spacing: 0.3px;
    }

    /* ── Page centrale ── */
    .page {
      max-width: 680px;
      margin: 60px auto 40px;
      background: #fffdf7;
      border: 1px solid #d4a84b;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(139,105,20,0.15);
    }

    /* ── Bordure géométrique du haut ── */
    .top-border {
      height: 8px;
      background: repeating-linear-gradient(
        90deg,
        #8b6914 0px, #8b6914 10px,
        #c9a84c 10px, #c9a84c 20px,
        #e8d5a3 20px, #e8d5a3 30px,
        #c9a84c 30px, #c9a84c 40px
      );
    }

    /* ── En-tête ── */
    .header {
      background: linear-gradient(160deg, #7a5510 0%, #c9963a 45%, #7a5510 100%);
      padding: 28px 24px 24px;
      text-align: center;
      direction: rtl;
    }
    .header-ornament {
      color: rgba(255,255,255,0.45);
      font-size: 11px;
      letter-spacing: 10px;
      margin-bottom: 14px;
      direction: ltr;
    }
    .sourate-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 40px; height: 40px;
      border: 1.5px solid rgba(255,255,255,0.65);
      border-radius: 50%;
      color: rgba(255,255,255,0.9);
      font-size: 13px; font-weight: 700;
      margin: 0 auto 12px;
      font-family: Arial, sans-serif;
      direction: ltr;
    }
    .sourate-name-ar {
      font-size: 36px; color: #fff;
      text-shadow: 0 2px 6px rgba(0,0,0,0.25);
      margin-bottom: 8px; line-height: 1.2;
    }
    .sourate-name-fr {
      font-size: 13px; color: rgba(255,255,255,0.88);
      font-family: Georgia, serif; direction: ltr;
      margin-bottom: 5px;
    }
    .sourate-meta {
      font-size: 10px; color: rgba(255,255,255,0.6);
      font-family: Arial, sans-serif; direction: ltr;
      letter-spacing: 2px; text-transform: uppercase;
    }
    .header-ornament-bottom {
      color: rgba(255,255,255,0.35);
      font-size: 11px; letter-spacing: 10px;
      margin-top: 14px; direction: ltr;
    }

    /* ── Séparateur arabesque ── */
    .divider {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 12px 20px;
      background: #fef9ec;
      border-bottom: 1px solid #e8d5a3;
      direction: ltr;
    }
    .divider-line {
      flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #c9a84c, transparent);
    }
    .divider-gem { color: #c9a84c; font-size: 14px; }

    /* ── Contenu ── */
    .content {
      padding: 16px 12px 24px;
      background: #fffdf7;
      direction: rtl;
    }
    .verse-img {
      display: block; width: 100%; max-width: 100%;
      margin: 1px auto;
    }

    /* ── Fallback ── */
    .fallback {
      text-align: center; color: #7a5510;
      padding: 40px 20px; line-height: 2.2;
      font-family: Arial, sans-serif; font-size: 14px; direction: ltr;
    }
    .fallback a { color: #c9963a; font-weight: bold; }

    /* ── Pied de page ── */
    .footer {
      text-align: center; padding: 14px;
      background: #fef9ec;
      border-top: 1px solid #e8d5a3;
      direction: rtl;
    }
    .footer-ar {
      font-size: 15px; color: #8b6914; letter-spacing: 2px;
    }
    .footer-sub {
      font-size: 10px; color: #b8956a;
      font-family: Arial, sans-serif; direction: ltr;
      margin-top: 4px; letter-spacing: 1px;
    }

    /* ── Bordure géométrique du bas ── */
    .bottom-border {
      height: 8px;
      background: repeating-linear-gradient(
        90deg,
        #e8d5a3 0px, #e8d5a3 10px,
        #c9a84c 10px, #c9a84c 20px,
        #8b6914 20px, #8b6914 30px,
        #c9a84c 30px, #c9a84c 40px
      );
    }

    @media print {
      .btn-bar { display: none; }
      body { background: white; }
      .page { box-shadow: none; margin: 0; max-width: 100%; border-radius: 0; border: none; }
      .top-border, .bottom-border { display: none; }
    }
  </style>
</head>
<body>

  <div class="btn-bar">
    <button class="close-btn" onclick="window.close()">✕ Fermer</button>
    <button class="print-btn" onclick="window.print()">🖨️ Imprimer / PDF</button>
  </div>

  <div class="page">
    <div class="top-border"></div>

    <div class="header">
      <div class="header-ornament">✦ &nbsp; ◆ &nbsp; ✦</div>
      <div class="sourate-badge">${sourateNum}</div>
      <div class="sourate-name-ar">${sourate.name_arabic}</div>
      <div class="sourate-name-fr">${sourate.name_french}</div>
      <div class="sourate-meta">${sourate.verses_count} versets &nbsp;·&nbsp; ${sourate.revelation_type}</div>
      <div class="header-ornament-bottom">✦ &nbsp; ◆ &nbsp; ✦</div>
    </div>

    <div class="divider">
      <div class="divider-line"></div>
      <span class="divider-gem">❖</span>
      <div class="divider-line"></div>
    </div>

    <div class="content">
      ${content}
    </div>

    <div class="footer">
      <div class="footer-ar">بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم</div>
      <div class="footer-sub">Dinislam · تعليم القرآن الكريم</div>
    </div>

    <div class="bottom-border"></div>
  </div>

</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[85vh] overflow-y-auto p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
              sourateProgress?.is_validated
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-br from-primary to-royal-dark text-primary-foreground'
            )}>
              {sourateProgress?.is_validated ? <Check className="h-5 w-5" /> : sourate.number === 1000 ? '2-255' : sourate.number}
            </div>
            <div>
              <p className="font-arabic text-lg">{sourate.name_arabic}</p>
              <p className="text-sm text-muted-foreground font-normal">{sourate.name_french}</p>
              <p className="text-xs text-muted-foreground/70 font-normal">
                {sourate.verses_count} versets • {sourate.revelation_type} • {validatedVerses}/{sourate.verses_count} validés
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium text-primary">{versePercentage}%</span>
            </div>
            <Progress value={versePercentage} className="h-2" />
          </div>

          {/* Panel récitation élève */}
          {dbId && (
            <SourateRecitationPanel sourateId={dbId} sourateName={sourate.name_french} />
          )}

          {/* Carte Ma sourate en PDF */}
          <div className="rounded-xl p-4 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#15803d' }}>
              <Printer className="h-4 w-4" />
              Ma sourate en PDF
            </p>
            <button
              onClick={handlePrintSourate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
              style={{ backgroundColor: '#16a34a' }}
            >
              <Printer className="h-4 w-4" />
              Télécharger / Imprimer
            </button>
            <p className="text-xs mt-2" style={{ color: '#166534' }}>
              Une fenêtre s'ouvre → choisir "Enregistrer en PDF" ou "Imprimer"
            </p>
          </div>

          {/* Récitation complète — Sheikh El Houssary */}
          {(() => {
            const houssaryUrl = getHoussaryEmbedUrl(sourate.number);
            if (!houssaryUrl) return null;
            return (
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }}>
                <p className="text-sm font-semibold px-4 pt-3 pb-2 flex items-center gap-2" style={{ color: '#6d28d9' }}>
                  🎙️ Récitation complète — Sheikh El Houssary
                </p>
                <div className="aspect-video">
                  <iframe
                    src={houssaryUrl}
                    title={`Récitation El Houssary — ${sourate.name_french}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="w-full h-full"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })()}

          {/* Vidéo YouTube (admin) */}
          {videoUrl && (
            <LecteurVideoSourate videoUrl={videoUrl} />
          )}


          {contents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Ressources</p>
              {contents.map((content: any) => (
                <div key={content.id}>
                  {content.content_type === 'audio' && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                        🎵 {content.file_name || 'Audio de la sourate'}
                      </p>
                      <audio
                        src={content.file_url}
                        controls
                        preload="metadata"
                        className="w-full"
                        style={{ height: '40px' }}
                      />
                    </div>
                  )}
                  {content.content_type === 'youtube' && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">🎬 {content.file_name || 'Vidéo YouTube'}</p>
                      <LecteurVideoSourate videoUrl={content.file_url} />
                    </div>
                  )}
                  {content.content_type === 'video' && (
                    <video controls className="w-full rounded-lg" src={content.file_url}>
                      Votre navigateur ne supporte pas la lecture vidéo.
                    </video>
                  )}
                  {content.content_type === 'pdf' && (
                    <a href={content.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm">{content.file_name}</span>
                    </a>
                  )}
                  {content.content_type === 'image' && (
                    <img src={content.file_url} alt={content.file_name} className="w-full rounded-lg" />
                  )}
                  {content.content_type === 'document' && (
                    <a href={content.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <File className="h-4 w-4" />
                      <span className="text-sm">{content.file_name}</span>
                    </a>
                  )}
                  {content.content_type === 'fichier' && (
                    <a href={content.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm">{content.file_name}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Verses */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Versets</p>
            <div className="grid grid-cols-1 gap-2">
              {NPM_VERSETS[sourate.number] ? (
                NPM_VERSETS[sourate.number].map(({ num, parts }) => {
                  // Bismillah (num=0) : même audio pour toutes les sourates — verset 1 de la Fatiha (CDN Alafasy)
                  if (num === 0) {
                    // Ayat al-Kursi : audio local (ligne 0 = début de l'ayah, pas un bismillah)
                    // Autres sourates : bismillah = verset 1 Al-Fatiha (CDN Alafasy)
                    const bismillahAudio = sourate.number === 1000
                      ? `/audio/ayat-al-kursi/002_e00.mp3`
                      : getCdnAudioUrl(1, 1);
                    return (
                      <div key={0} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-1">
                        {parts.map((part, i) => (
                          <img key={i} src={part.imageUrl} alt="Bismillah" className="w-full object-contain" style={{ maxHeight: '60px' }} />
                        ))}
                        {bismillahAudio && <LecteurVerset audioUrl={bismillahAudio} />}
                      </div>
                    );
                  }

                  // Ayat al-Kursi : audio local hébergé dans /public/audio/ayat-al-kursi/
                  // Autres sourates : CDN Alafasy
                  const cdnAudio = sourate.number === 1000
                    ? `/audio/ayat-al-kursi/002_e${String(num).padStart(2, '0')}.mp3`
                    : getCdnAudioUrl(sourate.number, num);
                  const isVerseValidated = verseProgress.get(`${dbId}-${num}`) || false;
                  const verseData = verses.find(v => v.id === num);
                  return (
                    <div
                      key={num}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg transition-colors border',
                        isVerseValidated
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                          : 'bg-muted/30 border-transparent'
                      )}
                    >
                      <Checkbox
                        checked={isVerseValidated}
                        onCheckedChange={() => onVerseToggle(dbId, num, sourate.number, sourate.verses_count)}
                        className={cn(
                          'h-5 w-5 rounded border-2 mt-1 shrink-0',
                          isVerseValidated ? 'border-green-500 bg-green-500 data-[state=checked]:bg-green-500' : 'border-gold'
                        )}
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        {parts.map((part, i) => (
                          <img key={i} src={part.imageUrl} alt={`Verset ${num}`} className="w-full object-contain" style={{ maxHeight: '80px' }} />
                        ))}
                        {verseData?.transliteration && (
                          <p className="text-xs italic leading-relaxed" style={{ color: '#0f766e' }}>
                            {verseData.transliteration}
                          </p>
                        )}
                        {verseData?.translation_fr && (
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            « {verseData.translation_fr} »
                          </p>
                        )}
                        {cdnAudio && <LecteurVerset audioUrl={cdnAudio} />}
                        <p className={cn(
                          'text-[10px] font-medium',
                          isVerseValidated ? 'text-green-500' : 'text-muted-foreground/60'
                        )}>
                          Verset {num}
                        </p>
                      </div>
                      {isVerseValidated && <Check className="h-4 w-4 text-green-500 shrink-0 mt-1" />}
                    </div>
                  );
                })
              ) : versesLoading ? (
                Array.from({ length: Math.min(sourate.verses_count, 6) }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))
              ) : (
                // Sourates non couvertes par NPM : texte arabe API + audio CDN
                Array.from({ length: sourate.verses_count }, (_, i) => i + 1).map(verseNum => {
                  const isVerseValidated = verseProgress.get(`${dbId}-${verseNum}`) || false;
                  const verseData = verses.find(v => v.id === verseNum);
                  const cdnAudio = getCdnAudioUrl(sourate.number, verseNum);
                  return (
                    <div
                      key={verseNum}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg transition-colors border',
                        isVerseValidated
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                          : 'bg-muted/30 border-transparent'
                      )}
                    >
                      <Checkbox
                        checked={isVerseValidated}
                        onCheckedChange={() => onVerseToggle(dbId, verseNum, sourate.number, sourate.verses_count)}
                        className={cn(
                          'h-5 w-5 rounded border-2 mt-1 shrink-0',
                          isVerseValidated ? 'border-green-500 bg-green-500 data-[state=checked]:bg-green-500' : 'border-gold'
                        )}
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className={cn(
                          'font-arabic text-right text-base leading-relaxed',
                          isVerseValidated ? 'text-green-700 dark:text-green-300' : 'text-foreground'
                        )}>
                          {verseData?.text_arabic || `﴿ ${verseNum} ﴾`}
                        </p>
                        {verseData?.transliteration && (
                          <p className="text-xs text-primary/80 italic">{verseData.transliteration}</p>
                        )}
                        {verseData?.translation_fr && (
                          <p className="text-xs text-muted-foreground">{verseData.translation_fr}</p>
                        )}
                        {cdnAudio && <LecteurVerset audioUrl={cdnAudio} />}
                        <p className={cn(
                          'text-[10px] font-medium',
                          isVerseValidated ? 'text-green-500' : 'text-muted-foreground/60'
                        )}>
                          Verset {verseNum}
                        </p>
                      </div>
                      {isVerseValidated && <Check className="h-4 w-4 text-green-500 shrink-0 mt-1" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Memorization tips */}
          <div className="bg-muted/50 rounded-xl p-3 text-sm">
            <p className="font-medium text-foreground flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-gold" />
              Techniques de mémorisation
            </p>
            <ul className="text-muted-foreground text-xs space-y-1 ml-6">
              <li>• Écouter plusieurs fois</li>
              <li>• Répéter à voix haute</li>
              <li>• Réviser régulièrement</li>
            </ul>
          </div>
        </div>
        <ScrollButtons
          showTop={showTop}
          showBottom={showBottom}
          onScrollTop={scrollToTop}
          onScrollBottom={scrollToBottom}
          position="absolute"
        />
      </DialogContent>
    </Dialog>
  );
};

export default SourateDetailDialog;
