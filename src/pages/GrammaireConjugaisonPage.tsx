import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import FlashcardPlayer from '@/components/FlashcardPlayer';
import AppLayout from '@/components/layout/AppLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Video, Volume2, BookOpen, ChevronRight, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';

type TabId = 'lecon' | 'exercices' | 'evaluation';

const tabLsKey = (tab: 'lecon' | 'exercices', cardId: string, userId: string) =>
  `grammaire_${tab}_${userId}_${cardId}`;

// Palette de couleurs tournante par chapitre
const COLORS = [
  { accent: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  { accent: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' },
  { accent: '#0d9488', light: '#f0fdfa', border: '#99f6e4', text: '#0f766e' },
  { accent: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#b45309' },
  { accent: '#ec4899', light: '#fdf2f8', border: '#fbcfe8', text: '#be185d' },
  { accent: '#10b981', light: '#f0fdf4', border: '#a7f3d0', text: '#047857' },
  { accent: '#f97316', light: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  { accent: '#6366f1', light: '#eef2ff', border: '#c7d2fe', text: '#4338ca' },
];

const GrammaireConjugaisonPage = () => {
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [activeTab, setActiveTab]             = useState<TabId>('lecon');
  const [lessonOpened, setLessonOpened]       = useState(false);
  const [exercicesOpened, setExercicesOpened] = useState(false);
  const [warningTab, setWarningTab]           = useState<TabId | null>(null);

  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } =
    useScrollToTop();

  useEffect(() => {
    if (!selectedCard || !user) return;
    const uid = user.id;
    const lesson    = localStorage.getItem(tabLsKey('lecon',     selectedCard.id, uid)) === 'true';
    const exercices = localStorage.getItem(tabLsKey('exercices', selectedCard.id, uid)) === 'true';
    setLessonOpened(lesson);
    setExercicesOpened(exercices);
    setActiveTab('lecon');
    setWarningTab(null);
    if (!lesson) {
      localStorage.setItem(tabLsKey('lecon', selectedCard.id, uid), 'true');
      setLessonOpened(true);
    }
  }, [selectedCard?.id, user?.id]);

  const handleTabClick = (tab: TabId) => {
    const locked =
      (tab === 'exercices' && !lessonOpened) ||
      (tab === 'evaluation' && !exercicesOpened);
    if (locked) { setWarningTab(tab); return; }
    setWarningTab(null);
    setActiveTab(tab);
    if (tab === 'exercices' && !exercicesOpened && user) {
      localStorage.setItem(tabLsKey('exercices', selectedCard.id, user.id), 'true');
      setExercicesOpened(true);
    }
  };

  const { data: module } = useQuery({
    queryKey: ['grammaire-module'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_modules').select('*').eq('builtin_path', '/grammaire').single();
      if (error) throw error;
      return data;
    },
  });

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['grammaire-cards', module?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('module_cards').select('*').eq('module_id', module!.id)
        .order('section', { nullsFirst: true }).order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!module?.id,
  });

  const { data: cardContents = [] } = useQuery({
    queryKey: ['grammaire-card-contents', module?.id],
    queryFn: async () => {
      if (!cards.length) return [];
      const cardIds = cards.map((c: any) => c.id);
      const { data, error } = await supabase
        .from('module_card_content').select('*').in('card_id', cardIds).order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: cards.length > 0,
  });

  // Nombre de flashcards par carte
  const { data: flashcardCounts = {} } = useQuery({
    queryKey: ['grammaire-flashcard-counts', module?.id],
    queryFn: async () => {
      if (!cards.length) return {};
      const cardIds = cards.map((c: any) => c.id);
      const { data } = await (supabase as any)
        .from('module_flashcards').select('module_card_id').in('module_card_id', cardIds);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.module_card_id] = (counts[r.module_card_id] || 0) + 1;
      });
      return counts;
    },
    enabled: cards.length > 0,
  });

  const sections = (cards as any[]).reduce((acc: Record<string, any[]>, card: any) => {
    const key = card.section || '_root';
    if (!acc[key]) acc[key] = [];
    acc[key].push(card);
    return acc;
  }, {});

  const selectedContents = selectedCard
    ? (cardContents as any[]).filter((c: any) => c.card_id === selectedCard.id)
    : [];

  const { data: selectedFlashcards = [] } = useQuery({
    queryKey: ['flashcards', selectedCard?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('module_flashcards').select('*').eq('module_card_id', selectedCard!.id).order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCard?.id,
  });

  const TABS: { id: TabId; label: string; emoji: string; unlocked: boolean }[] = [
    { id: 'lecon',      label: 'Leçon',      emoji: '📖', unlocked: true },
    { id: 'exercices',  label: 'Exercices',  emoji: '✏️', unlocked: lessonOpened },
    { id: 'evaluation', label: 'Évaluation', emoji: '🎯', unlocked: exercicesOpened },
  ];

  const WARNING_MSG: Record<TabId, string> = {
    lecon: '',
    exercices:  "📖 Tu dois d'abord ouvrir l'onglet Leçon avant d'accéder aux exercices.",
    evaluation: "✏️ Tu dois d'abord faire les Exercices avant de passer à l'évaluation.",
  };

  // Numérotation globale des chapitres
  let globalChapterIndex = 0;

  return (
    <AppLayout title="Grammaire & Conjugaison">
      <div className="p-4 pb-28">

        {/* Header */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8, #2563eb)' }}>
          <p className="font-arabic text-xl text-blue-200 mb-1">{module?.title_arabic || 'النحو والصرف'}</p>
          <h1 className="text-2xl font-bold text-white">Grammaire & Conjugaison</h1>
          <p className="text-blue-200 text-sm mt-1">{module?.description || 'Règles de grammaire arabe'}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
              {cards.length} chapitre{cards.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Liste des chapitres */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-lg">Aucun chapitre disponible</p>
            <p className="text-sm mt-2">L'enseignant ajoutera bientôt des règles de grammaire.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(sections).map(([section, sectionCards]) => (
              <div key={section}>
                {/* En-tête de section */}
                {section !== '_root' && (
                  <div className="flex items-center gap-3 mb-3 mt-2">
                    <div className="h-px flex-1 bg-border" />
                    <span
                      className="px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)' }}
                    >
                      {section}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                {/* Cartes chapitres */}
                {(sectionCards as any[]).map((card: any) => {
                  globalChapterIndex++;
                  const chNum = globalChapterIndex;
                  const color = COLORS[(chNum - 1) % COLORS.length];
                  const contents = (cardContents as any[]).filter((c: any) => c.card_id === card.id);
                  const hasVideo   = contents.some(c => c.content_type === 'video' || c.content_type === 'youtube');
                  const hasPdf     = contents.some(c => c.content_type === 'pdf' || c.content_type === 'document');
                  const hasAudio   = contents.some(c => c.content_type === 'audio');
                  const hasFlash   = (flashcardCounts as any)[card.id] > 0;

                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className="w-full text-left rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg active:scale-[0.98] shadow-sm"
                      style={{ borderColor: color.border, backgroundColor: color.light }}
                    >
                      {/* Barre colorée en haut */}
                      <div className="h-1.5 w-full" style={{ backgroundColor: color.accent }} />

                      <div className="p-4 flex items-start gap-3">
                        {/* Cercle numéro chapitre */}
                        <div
                          className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: color.accent }}
                        >
                          <span className="text-white text-[9px] font-semibold leading-none uppercase tracking-wide">Ch.</span>
                          <span className="text-white text-lg font-black leading-none">{chNum}</span>
                        </div>

                        {/* Contenu texte */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: color.text }}>
                            Chapitre {chNum}
                          </p>
                          <p className="font-bold text-foreground leading-snug [overflow-wrap:anywhere]">{card.title}</p>
                          {card.title_arabic && (
                            <p className="font-arabic text-sm text-muted-foreground mt-0.5">{card.title_arabic}</p>
                          )}
                          {card.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
                          )}

                          {/* Badges contenu */}
                          {(hasVideo || hasPdf || hasAudio || hasFlash) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {hasVideo && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">📹 Vidéo</span>
                              )}
                              {hasPdf && (
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">📄 PDF</span>
                              )}
                              {hasAudio && (
                                <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">🔊 Audio</span>
                              )}
                              {hasFlash && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">🃏 Exercices</span>
                              )}
                            </div>
                          )}
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 mt-1" style={{ color: color.accent }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog détail chapitre */}
      {selectedCard && (() => {
        const chapterNum = (cards as any[]).findIndex((c: any) => c.id === selectedCard.id) + 1;
        const color = COLORS[(chapterNum - 1) % COLORS.length];
        return (
          <Dialog open onOpenChange={() => setSelectedCard(null)}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">

              <div ref={scrollRef} onScroll={handleScroll} className="max-h-[85vh] overflow-y-auto">

                {/* En-tête coloré */}
                <div className="px-5 pt-5 pb-4" style={{ backgroundColor: color.light, borderBottom: `2px solid ${color.border}` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: color.accent }}
                    >
                      <span className="text-white text-[8px] font-semibold uppercase">Ch.</span>
                      <span className="text-white text-sm font-black leading-none">{chapterNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: color.text }}>
                        Chapitre {chapterNum}
                      </p>
                      {selectedCard.section && (
                        <Badge className="text-[10px] mt-0.5" style={{ background: color.accent, color: 'white' }}>
                          {selectedCard.section}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedCard.title_arabic && (
                    <p className="font-arabic text-lg text-muted-foreground">{selectedCard.title_arabic}</p>
                  )}
                  <DialogTitle className="text-lg leading-snug mt-0.5">{selectedCard.title}</DialogTitle>
                </div>

                {/* Onglets */}
                <div className="px-4 pt-4 pb-2">
                  <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all',
                          activeTab === tab.id
                            ? 'bg-white dark:bg-slate-800 shadow-sm text-primary'
                            : 'text-muted-foreground hover:text-foreground',
                          !tab.unlocked && 'opacity-60'
                        )}
                      >
                        <span>{tab.emoji}</span>
                        <span>{tab.label}</span>
                        {!tab.unlocked && <Lock className="h-3 w-3 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {warningTab && (
                    <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-2">
                      <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium leading-snug">
                        {WARNING_MSG[warningTab]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Contenu onglets */}
                <div className="px-4 pb-6 space-y-4">

                  {/* ── LEÇON ── */}
                  {activeTab === 'lecon' && (
                    <>
                      {selectedCard.description && (
                        <div className="rounded-xl p-4 border" style={{ backgroundColor: color.light, borderColor: color.border }}>
                          <p className="text-sm text-foreground">{selectedCard.description}</p>
                        </div>
                      )}
                      {selectedContents.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ressources</h4>
                          {selectedContents.map((content: any) => (
                            <div key={content.id} className="border border-border rounded-xl overflow-hidden">
                              {content.content_type === 'video' && (
                                <video src={content.file_url} controls className="w-full" />
                              )}
                              {content.content_type === 'audio' && (
                                <div className="p-4 flex items-center gap-3 bg-muted/30">
                                  <Volume2 className="h-5 w-5 text-teal-500 shrink-0" />
                                  <audio src={content.file_url} controls className="flex-1 h-8" />
                                </div>
                              )}
                              {(content.content_type === 'pdf' || content.content_type === 'document') && (
                                <button
                                  onClick={() => window.open(content.file_url, '_blank', 'noopener,noreferrer')}
                                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left"
                                >
                                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-red-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{content.file_name}</p>
                                    <p className="text-xs text-muted-foreground">Ouvrir le PDF</p>
                                  </div>
                                </button>
                              )}
                              {content.content_type === 'image' && (
                                <img src={content.file_url} alt={content.file_name} className="w-full object-cover max-h-64" />
                              )}
                              {content.content_type === 'youtube' && (
                                <div className="aspect-video">
                                  <iframe
                                    src={content.file_url}
                                    className="w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    title={content.file_name}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : !selectedCard.description ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Aucune ressource pour ce chapitre.</p>
                        </div>
                      ) : null}
                    </>
                  )}

                  {/* ── EXERCICES ── */}
                  {activeTab === 'exercices' && (
                    (selectedFlashcards as any[]).length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">🃏 Flashcards</h4>
                        <FlashcardPlayer cards={selectedFlashcards as any[]} />
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <span className="text-4xl block mb-3">✏️</span>
                        <p className="text-sm font-medium">Aucun exercice pour ce chapitre.</p>
                        <p className="text-xs mt-1">L'enseignant en ajoutera bientôt.</p>
                      </div>
                    )
                  )}

                  {/* ── ÉVALUATION ── */}
                  {activeTab === 'evaluation' && (
                    <div className="text-center py-10 text-muted-foreground">
                      <span className="text-4xl block mb-3">🎯</span>
                      <p className="text-sm font-medium">Évaluation bientôt disponible.</p>
                      <p className="text-xs mt-1">L'enseignant préparera une évaluation pour ce chapitre.</p>
                    </div>
                  )}
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
      })()}
    </AppLayout>
  );
};

export default GrammaireConjugaisonPage;
