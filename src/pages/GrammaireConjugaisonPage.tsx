import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import FlashcardPlayer from '@/components/FlashcardPlayer';
import AppLayout from '@/components/layout/AppLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Video, Volume2, BookOpen, ChevronRight, Play, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';

type TabId = 'lecon' | 'exercices' | 'evaluation';

const tabLsKey = (tab: 'lecon' | 'exercices', cardId: string, userId: string) =>
  `grammaire_${tab}_${userId}_${cardId}`;

const GrammaireConjugaisonPage = () => {
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [activeTab, setActiveTab]           = useState<TabId>('lecon');
  const [lessonOpened, setLessonOpened]     = useState(false);
  const [exercicesOpened, setExercicesOpened] = useState(false);
  const [warningTab, setWarningTab]         = useState<TabId | null>(null);

  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } =
    useScrollToTop();

  // Load unlock state from localStorage when a card is opened
  useEffect(() => {
    if (!selectedCard || !user) return;
    const uid = user.id;
    const lesson    = localStorage.getItem(tabLsKey('lecon',     selectedCard.id, uid)) === 'true';
    const exercices = localStorage.getItem(tabLsKey('exercices', selectedCard.id, uid)) === 'true';
    setLessonOpened(lesson);
    setExercicesOpened(exercices);
    setActiveTab('lecon');
    setWarningTab(null);
    // Opening the dialog counts as visiting Leçon
    if (!lesson) {
      localStorage.setItem(tabLsKey('lecon', selectedCard.id, uid), 'true');
      setLessonOpened(true);
    }
  }, [selectedCard?.id, user?.id]);

  const handleTabClick = (tab: TabId) => {
    const locked =
      (tab === 'exercices' && !lessonOpened) ||
      (tab === 'evaluation' && !exercicesOpened);
    if (locked) {
      setWarningTab(tab);
      return;
    }
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
        .from('learning_modules')
        .select('*')
        .eq('builtin_path', '/grammaire')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['grammaire-cards', module?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('module_cards')
        .select('*')
        .eq('module_id', module!.id)
        .order('section', { nullsFirst: true })
        .order('display_order');
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
        .from('module_card_content')
        .select('*')
        .in('card_id', cardIds)
        .order('display_order');
      if (error) throw error;
      return data || [];
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
        .from('module_flashcards')
        .select('*')
        .eq('module_card_id', selectedCard!.id)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCard?.id,
  });

  const hasContent = (cardId: string) =>
    (cardContents as any[]).some((c: any) => c.card_id === cardId);

  let globalIndex = 0;

  const TABS: { id: TabId; label: string; emoji: string; unlocked: boolean }[] = [
    { id: 'lecon',      label: 'Leçon',       emoji: '📖', unlocked: true },
    { id: 'exercices',  label: 'Exercices',   emoji: '✏️', unlocked: lessonOpened },
    { id: 'evaluation', label: 'Évaluation',  emoji: '🎯', unlocked: exercicesOpened },
  ];

  const WARNING_MSG: Record<TabId, string> = {
    lecon: '',
    exercices:  "📖 Tu dois d'abord ouvrir l'onglet Leçon avant d'accéder aux exercices.",
    evaluation: "✏️ Tu dois d'abord faire les Exercices avant de passer à l'évaluation.",
  };

  return (
    <AppLayout title="Grammaire & Conjugaison">
      <div className="p-4 space-y-0 pb-28">
        {/* Header */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8, #2563eb)' }}>
          <p className="font-arabic text-xl text-blue-200 mb-1">{module?.title_arabic || 'النحو والصرف'}</p>
          <h1 className="text-2xl font-bold text-white">Grammaire & Conjugaison</h1>
          <p className="text-blue-200 text-sm mt-1">{module?.description || 'Règles de grammaire arabe'}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
              {cards.length} leçon{cards.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="h-14 flex-1 bg-muted animate-pulse rounded-xl" />
              </div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-lg">Aucune leçon disponible</p>
            <p className="text-sm mt-2">L'enseignant ajoutera bientôt des règles de grammaire.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {Object.entries(sections).map(([section, sectionCards], sectionIdx) => {
              const isLastSection = sectionIdx === Object.keys(sections).length - 1;
              return (
                <div key={section}>
                  {section !== '_root' && (
                    <div className="flex items-center gap-3 py-4 px-2">
                      <div className="w-0.5 ml-[15px] h-4 bg-[#38bdf8]" />
                      <div
                        className="ml-6 px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-md"
                        style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)' }}
                      >
                        {section}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    {(sectionCards as any[]).map((card: any, cardIdx: number) => {
                      globalIndex++;
                      const isLast = cardIdx === (sectionCards as any[]).length - 1 && isLastSection;
                      const hasMedia = hasContent(card.id);

                      return (
                        <div key={card.id} className="relative flex items-start group">
                          {!isLast && (
                            <div
                              className="absolute left-[15px] top-8 bottom-0 w-0.5"
                              style={{ background: 'linear-gradient(to bottom, #38bdf8, #e2e8f0)' }}
                            />
                          )}
                          <div className="shrink-0 mt-3 z-10">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white"
                              style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}
                            >
                              {hasMedia && <Play className="h-3 w-3 text-white fill-white" />}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedCard(card)}
                            className={cn(
                              'flex-1 ml-4 mb-1 text-left rounded-xl px-4 py-3.5 border transition-all duration-200',
                              'bg-card border-border hover:border-blue-300 hover:shadow-md active:scale-[0.98]',
                              'group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/20'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground leading-snug">{card.title}</p>
                                {card.title_arabic && (
                                  <p className="font-arabic text-sm text-muted-foreground mt-0.5">{card.title_arabic}</p>
                                )}
                                {card.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {hasMedia && (
                                  <span className="flex items-center gap-1">
                                    {(cardContents as any[]).filter((c: any) => c.card_id === card.id).map((c: any) => {
                                      if (c.content_type === 'video')   return <Video   key={c.id} className="h-3.5 w-3.5 text-blue-500" />;
                                      if (c.content_type === 'audio')   return <Volume2 key={c.id} className="h-3.5 w-3.5 text-teal-500" />;
                                      if (c.content_type === 'pdf')     return <FileText key={c.id} className="h-3.5 w-3.5 text-red-500" />;
                                      if (c.content_type === 'youtube') return <Video   key={c.id} className="h-3.5 w-3.5 text-red-500" />;
                                      return null;
                                    })}
                                  </span>
                                )}
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      {selectedCard && (
        <Dialog open onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">

            {/* Scrollable body */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 space-y-1">
                {selectedCard.section && (
                  <Badge className="text-xs" style={{ background: '#0284c7', color: 'white' }}>
                    {selectedCard.section}
                  </Badge>
                )}
                {selectedCard.title_arabic && (
                  <p className="font-arabic text-lg text-muted-foreground">{selectedCard.title_arabic}</p>
                )}
                <DialogTitle className="text-lg leading-snug">{selectedCard.title}</DialogTitle>
              </div>

              {/* Tabs */}
              <div className="px-4 pb-2">
                <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all',
                        activeTab === tab.id && warningTab !== tab.id
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

                {/* Warning message (locked tab clicked) */}
                {warningTab && (
                  <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-2">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium leading-snug">
                      {WARNING_MSG[warningTab]}
                    </p>
                  </div>
                )}
              </div>

              {/* Tab content */}
              <div className="px-4 pb-6 space-y-4">

                {/* ── LEÇON ── */}
                {activeTab === 'lecon' && (
                  <>
                    {selectedCard.description && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
                        <p className="text-sm text-foreground">{selectedCard.description}</p>
                      </div>
                    )}
                    {selectedContents.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ressources</h4>
                        {selectedContents.map((content: any) => (
                          <div key={content.id} className="border border-border rounded-xl overflow-hidden">
                            {content.content_type === 'video' && (
                              <video src={content.file_url} controls className="w-full rounded-xl" />
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
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
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
                        <p className="text-sm">Aucune ressource pour cette leçon.</p>
                      </div>
                    ) : null}
                  </>
                )}

                {/* ── EXERCICES ── */}
                {activeTab === 'exercices' && (
                  <>
                    {(selectedFlashcards as any[]).length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">🃏 Flashcards</h4>
                        <FlashcardPlayer cards={selectedFlashcards as any[]} />
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <span className="text-4xl block mb-3">✏️</span>
                        <p className="text-sm font-medium">Aucun exercice pour cette leçon.</p>
                        <p className="text-xs mt-1">L'enseignant en ajoutera bientôt.</p>
                      </div>
                    )}
                  </>
                )}

                {/* ── ÉVALUATION ── */}
                {activeTab === 'evaluation' && (
                  <div className="text-center py-10 text-muted-foreground">
                    <span className="text-4xl block mb-3">🎯</span>
                    <p className="text-sm font-medium">Évaluation bientôt disponible.</p>
                    <p className="text-xs mt-1">L'enseignant préparera une évaluation pour cette leçon.</p>
                  </div>
                )}

              </div>
            </div>

            {/* Scroll buttons */}
            <ScrollButtons
              showTop={showTop}
              showBottom={showBottom}
              onScrollTop={scrollToTop}
              onScrollBottom={scrollToBottom}
              position="absolute"
            />
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
};

export default GrammaireConjugaisonPage;
