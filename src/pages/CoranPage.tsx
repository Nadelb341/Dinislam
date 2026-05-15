import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SourateDetailDialog from '@/components/sourates/SourateDetailDialog';
import { Search, BookOpen, Download } from 'lucide-react';
import { CORAN_ORDERED, type SourateData } from '@/data/sourates';

const CoranPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourate, setSelectedSourate] = useState<SourateData | null>(null);
  const [sourateProgress, setSourateProgress] = useState<Map<string, { is_validated: boolean; is_memorized: boolean; progress_percentage: number }>>(new Map());
  const [verseProgress, setVerseProgress] = useState<Map<string, boolean>>(new Map());
  const [sourateContents, setSourateContents] = useState<any[]>([]);
  const [dbSourates, setDbSourates] = useState<Map<number, string>>(new Map());
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        { data: progressData },
        { data: verseData },
        { data: contentData },
        { data: souratesDb },
      ] = await Promise.all([
        (supabase as any).from('user_sourate_progress').select('*').eq('user_id', user.id).eq('context', 'coran'),
        (supabase as any).from('user_sourate_verse_progress').select('*').eq('user_id', user.id).eq('context', 'coran'),
        (supabase as any).from('sourate_content').select('*').order('display_order'),
        supabase.from('sourates').select('id, number'),
      ]);

      const idMap = new Map<number, string>();
      souratesDb?.forEach(s => idMap.set(s.number, s.id));
      setDbSourates(idMap);

      const pMap = new Map<string, { is_validated: boolean; is_memorized: boolean; progress_percentage: number }>();
      progressData?.forEach(p => {
        pMap.set(p.sourate_id, {
          is_validated: p.is_validated,
          is_memorized: (p as any).is_memorized ?? false,
          progress_percentage: p.progress_percentage,
        });
      });
      setSourateProgress(pMap);

      const vMap = new Map<string, boolean>();
      verseData?.forEach((v: any) => {
        vMap.set(`${v.sourate_id}-${v.verse_number}`, (v as any).is_validated ?? v.is_memorized);
      });
      setVerseProgress(vMap);
      setSourateContents(contentData || []);
    } catch (error) {
      console.error('Error loading Coran data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  // Charger le PDF — d'abord depuis la base, sinon le fichier intégré à l'app
  useEffect(() => {
    const fetchPdf = async () => {
      const { data: mod } = await (supabase as any)
        .from('learning_modules')
        .select('id')
        .eq('builtin_path', '/coran')
        .maybeSingle();
      if (mod) {
        const { data: cards } = await (supabase as any)
          .from('module_cards')
          .select('id')
          .eq('module_id', mod.id)
          .order('display_order')
          .limit(5);
        if (cards?.length) {
          const cardIds = cards.map((c: any) => c.id);
          const { data: contents } = await (supabase as any)
            .from('module_card_content')
            .select('file_url')
            .in('card_id', cardIds)
            .eq('content_type', 'fichier')
            .not('file_url', 'is', null)
            .limit(1);
          if (contents?.length) {
            setPdfUrl(contents[0].file_url);
            return;
          }
        }
      }
      // Fallback : PDF intégré directement dans l'application
      setPdfUrl('/pdf/coran.pdf');
    };
    fetchPdf();
  }, []);

  const handleVerseToggle = async (sourateDbId: string, verseNumber: number, _sourateNumber: number, versesCount: number) => {
    if (!user) return;

    const key = `${sourateDbId}-${verseNumber}`;
    const currentValue = verseProgress.get(key) || false;
    const newValue = !currentValue;

    setVerseProgress(prev => {
      const newMap = new Map(prev);
      newMap.set(key, newValue);
      return newMap;
    });

    try {
      await (supabase as any)
        .from('user_sourate_verse_progress')
        .upsert(
          { user_id: user.id, sourate_id: sourateDbId, verse_number: verseNumber, is_memorized: newValue, context: 'coran' },
          { onConflict: 'user_id,sourate_id,verse_number,context' }
        );

      const newVerseProgress = new Map(verseProgress);
      newVerseProgress.set(key, newValue);

      let validatedVerses = 0;
      for (let i = 1; i <= versesCount; i++) {
        if (newVerseProgress.get(`${sourateDbId}-${i}`)) validatedVerses++;
      }
      const percentage = Math.round((validatedVerses / versesCount) * 100);
      const allValidated = validatedVerses === versesCount;

      await (supabase as any)
        .from('user_sourate_progress')
        .upsert(
          {
            user_id: user.id,
            sourate_id: sourateDbId,
            progress_percentage: percentage,
            is_validated: sourateProgress.get(sourateDbId)?.is_validated || false,
            context: 'coran',
          },
          { onConflict: 'user_id,sourate_id,context' }
        );

      setSourateProgress(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(sourateDbId) || { is_validated: false, is_memorized: false, progress_percentage: 0 };
        newMap.set(sourateDbId, { ...existing, progress_percentage: percentage });
        return newMap;
      });

      // Auto-validation sans demande admin pour la carte Coran
      if (allValidated && !sourateProgress.get(sourateDbId)?.is_validated) {
        setSelectedSourate(null);
        await (supabase as any)
          .from('user_sourate_progress')
          .upsert(
            { user_id: user.id, sourate_id: sourateDbId, is_validated: true, is_memorized: true, progress_percentage: 100, context: 'coran' },
            { onConflict: 'user_id,sourate_id,context' }
          );
        setSourateProgress(prev => {
          const newMap = new Map(prev);
          newMap.set(sourateDbId, { is_validated: true, is_memorized: true, progress_percentage: 100 });
          return newMap;
        });
        toast({ title: 'بارك الله فيك 🎉', description: 'Sourate validée ! Bonne continuation.' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = CORAN_ORDERED.filter(s =>
    s.name_french.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name_arabic.includes(searchQuery) ||
    String(s.number).includes(searchQuery)
  );

  const totalValidated = CORAN_ORDERED.filter(s => {
    const dbId = dbSourates.get(s.number);
    return dbId && sourateProgress.get(dbId)?.is_validated;
  }).length;

  const selectedDbId = selectedSourate ? dbSourates.get(selectedSourate.number) : undefined;

  return (
    <AppLayout title="Coran">
      <div className="p-3 md:p-6 space-y-4">

        {/* Section PDF */}
        <div className="rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
              <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 font-arabic text-lg">القرآن الكريم</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Coran complet avec Tajwid (Français)</p>
            </div>
          </div>
          {pdfUrl ? (
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950"
              onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
            >
              <Download className="h-4 w-4 mr-2" />
              Ouvrir / Télécharger le PDF
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              PDF non encore disponible — l'enseignant peut l'ajouter via le panneau admin → Coran.
            </p>
          )}
        </div>

        {/* Barre de progression */}
        <div className="rounded-xl border bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {totalValidated} / 114 sourates validées
            </span>
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
              {Math.round((totalValidated / 114) * 100)}%
            </span>
          </div>
          <Progress value={Math.round((totalValidated / 114) * 100)} className="h-2" />
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une sourate..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        </div>

        {/* Liste des sourates */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(sourate => {
              const dbId = dbSourates.get(sourate.number);
              const progress = dbId ? sourateProgress.get(dbId) : undefined;
              const isValidated = progress?.is_validated || false;
              const pct = progress?.progress_percentage || 0;

              return (
                <button
                  key={sourate.number}
                  onClick={() => setSelectedSourate(sourate)}
                  className="w-full text-left rounded-xl border bg-card hover:bg-muted/50 transition-colors p-3 flex items-center gap-3"
                >
                  {/* Numéro */}
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    isValidated
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isValidated ? '✓' : sourate.number}
                  </div>

                  {/* Noms */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-arabic text-base">{sourate.name_arabic}</span>
                      <span className="text-xs text-muted-foreground">· {sourate.verses_count} v.</span>
                    </div>
                    <p className="text-sm text-foreground/80 [overflow-wrap:anywhere]">{sourate.name_french}</p>
                    {pct > 0 && !isValidated && (
                      <Progress value={pct} className="h-1 mt-1" />
                    )}
                  </div>

                  {/* Badge type */}
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full hidden sm:inline ${
                    sourate.revelation_type === 'Mecquoise'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  }`}>
                    {sourate.revelation_type === 'Mecquoise' ? 'Mecque' : 'Médine'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog détail sourate */}
      {selectedSourate && (
        <SourateDetailDialog
          open={!!selectedSourate}
          onOpenChange={open => { if (!open) setSelectedSourate(null); }}
          sourate={selectedSourate}
          dbId={selectedDbId}
          verseProgress={verseProgress}
          sourateProgress={selectedDbId ? sourateProgress.get(selectedDbId) : undefined}
          contents={sourateContents.filter((c: any) => c.sourate_id === selectedDbId)}
          onVerseToggle={handleVerseToggle}
        />
      )}
    </AppLayout>
  );
};

export default CoranPage;
