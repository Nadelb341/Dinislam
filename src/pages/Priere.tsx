import { useVillePriere } from '@/hooks/useVillePriere';
import { enregistrerVillePriere } from '@/lib/rappelsPriere';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Navigation, MapPin, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePrayerTimesCity, PRIORITY_CITIES, OTHER_CITIES, CityOption, PRAYER_METHODS, PRAYER_METHOD_KEY, getSavedMethod, PrayerMethod } from '@/hooks/usePrayerTimesCity';

import { CielDesPrieres } from '@/components/prayer/CielDesPrieres';
import { EtoilesDuJour } from '@/components/prayer/EtoilesDuJour';
import { AMBIANCES, momentDe } from '@/lib/momentPriere';
import QiblaCompass from '@/components/prayer/QiblaCompass';
import PrayerWeeklyCalendar from '@/components/prayer/PrayerWeeklyCalendar';
import PrayerModuleCards from '@/components/prayer/PrayerModuleCards';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const Priere = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showQibla, setShowQibla] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  // 📍 2026-11-15 : la ville du PROFIL commande les horaires (l'élève n'a rien à régler ici) ; sans ville de profil, le choix de l'appareil
  const { ville: villeProfilOuAppareil, duProfil } = useVillePriere();
  const [villeManuelle, setVilleManuelle] = useState<CityOption | null>(null);
  const selectedCity = duProfil ? villeProfilOuAppareil : (villeManuelle ?? villeProfilOuAppareil);
  const [selectedMethod, setSelectedMethod] = useState<PrayerMethod>(getSavedMethod);

  const handleSelectCity = (city: CityOption) => {
    setVilleManuelle(city);
    try { localStorage.setItem('dinislam_prayer_city', JSON.stringify(city)); } catch { /* stockage indisponible */ }
    // Rappels de prière envoyés par le serveur : il suit la ville choisie (2026-11-09)
    if (user) void enregistrerVillePriere(user.id, city, selectedMethod.id);
    setShowCitySelector(false);
  };

  const handleSelectMethod = (method: PrayerMethod) => {
    setSelectedMethod(method);
    localStorage.setItem(PRAYER_METHOD_KEY, String(method.id));
    if (user) void enregistrerVillePriere(user.id, selectedCity, method.id);
    setShowMethodSelector(false);
  };

  const { prayerTimes, loading: prayerLoading, error: prayerError, getNextPrayer } = usePrayerTimesCity(selectedCity, selectedMethod);

  const { data: dailyPrayers = [] } = useQuery({
    queryKey: ['user-daily-prayers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const fromDate = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
      const { data, error } = await supabase
        .from('user_daily_prayers')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', fromDate)
        .eq('is_checked', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const todayKey = getTodayKey();
  const todayChecked = dailyPrayers
    .filter(p => p.date === todayKey)
    .map(p => p.prayer_name);

  const calendarData = useMemo(() => {
    const map: Record<string, number> = {};
    dailyPrayers.forEach(p => {
      map[p.date] = (map[p.date] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [dailyPrayers]);

  const { askValidation, validationDialog } = useConfirmValidation();

  const toggleDailyPrayerMutation = useMutation({
    mutationFn: async (prayerName: string) => {
      if (!user?.id) throw new Error('Non connecté');
      const existing = dailyPrayers.find(p => p.date === todayKey && p.prayer_name === prayerName);
      if (existing) {
        const { error } = await supabase.from('user_daily_prayers').delete().eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_daily_prayers').insert({ user_id: user.id, date: todayKey, prayer_name: prayerName, is_checked: true });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-daily-prayers', user?.id] }),
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const nextPrayer = prayerTimes ? getNextPrayer() : null;
  // 🌅 Moment de la journée (ambiance de TOUTE la page, Nadia 2026-11-26) : recalculé chaque minute
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setMaintenant(new Date()), 60_000); return () => clearInterval(t); }, []);
  const moment = prayerTimes ? momentDe(prayerTimes, maintenant) : 'dhohr';
  const ambiance = AMBIANCES[moment];
  const basculerPriere = (name: string) => {
    const done = dailyPrayers.some(p => p.date === todayKey && p.prayer_name === name);
    if (done) toggleDailyPrayerMutation.mutate(name);
    else askValidation('Valider cette prière ?', `« ${name} » sera cochée comme faite aujourd'hui.`, () => toggleDailyPrayerMutation.mutate(name));
  };

  return (
    <AppLayout>
      {/* 🌅 L'ambiance du moment (Sobh orangé, Chourouk orangé/bleu, Dhohr et Asr bleu, Maghreb orangé, Icha nuit) colore TOUTE la page */}
      <div className="min-h-full transition-[background] duration-1000" style={{ background: ambiance.fond }}>
      <div className="p-4 space-y-5 max-w-5xl mx-auto">
        <div className="text-center space-y-1 animate-fade-in">
          <h1 className="text-2xl font-bold font-arabic" style={{ color: ambiance.texte }}>الصلاة</h1>
          <p className="text-sm font-semibold" style={{ color: ambiance.texte, opacity: 0.85 }}>La Prière</p>
        </div>

        {/* 26/11 (Nadia) : la ville sur une ligne courte AU-DESSUS du ciel, puis « Qibla » et « Méthode calcul » à droite (moins chargé) */}
        <div className="relative z-20 flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            {duProfil ? (
              <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground" title="La ville se change dans ⚙️ › Paramètres du profil">
                <MapPin className="h-4 w-4 shrink-0 text-green-600" />
                <span className="min-w-0 flex-1 text-left font-medium leading-tight [overflow-wrap:anywhere]">{selectedCity.label}</span>
              </div>
            ) : (
              <button
                onClick={() => setShowCitySelector(!showCitySelector)}
                className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/50"
              >
                <MapPin className="h-4 w-4 shrink-0 text-green-600" />
                <span className="min-w-0 flex-1 text-left font-medium leading-tight [overflow-wrap:anywhere]">{selectedCity.label}</span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', showCitySelector && 'rotate-180')} />
              </button>
            )}
              {showCitySelector && !duProfil && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-card border border-border rounded-xl shadow-elevated max-h-56 overflow-y-auto">
                  <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-0">── Votre région ──</div>
                  {PRIORITY_CITIES.map((city) => (
                    <button
                      key={city.label}
                      onClick={() => handleSelectCity(city)}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2',
                        selectedCity.label === city.label && 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 font-medium'
                      )}
                    >
                      <span className="flex-1">{city.label}</span>
                      <span className="text-xs text-muted-foreground">{city.country}</span>
                    </button>
                  ))}
                  <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-0">── France & International ──</div>
                  {OTHER_CITIES.map((city) => (
                    <button
                      key={city.label}
                      onClick={() => handleSelectCity(city)}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2',
                        selectedCity.label === city.label && 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 font-medium'
                      )}
                    >
                      <span className="flex-1">{city.label}</span>
                      <span className="text-xs text-muted-foreground">{city.country}</span>
                    </button>
                  ))}
                </div>
              )}
          </div>
          <Button size="sm" onClick={() => setShowQibla(true)} className="h-9 shrink-0 gap-1.5 bg-green-700 px-3 text-white hover:bg-green-800">
            <Navigation className="h-4 w-4" />
            Qibla
          </Button>
          <div className="relative shrink-0">
            <Button size="sm" variant="outline" onClick={() => setShowMethodSelector(!showMethodSelector)} aria-expanded={showMethodSelector}
              className="h-9 gap-1.5 border-amber-300 bg-card px-3 text-amber-800 dark:text-amber-300">
              <Clock className="h-4 w-4" />
              Méthode calcul
            </Button>
            {showMethodSelector && (
              <div className="absolute right-0 top-full z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
                <div className="bg-muted/30 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Méthode de calcul · {selectedMethod.label}
                </div>
                {PRAYER_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method)}
                    className={cn(
                      'w-full text-left px-4 py-3 text-sm hover:bg-muted/50 transition-colors border-t border-border/40',
                      selectedMethod.id === method.id && 'bg-amber-50 dark:bg-amber-950/30'
                    )}
                  >
                    <p className={cn('font-semibold', selectedMethod.id === method.id ? 'text-amber-700 dark:text-amber-400' : 'text-foreground')}>
                      {method.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Présentation 9 : téléphone tourné ou tablette → 2 colonnes (le ciel à gauche, les étoiles et la semaine à droite) */}
        <div className="grid gap-4 lg:grid-cols-2 [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-2">
          <div className="min-w-0">
            {prayerLoading ? (
              <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Chargement des horaires...</span>
                </div>
              </div>
            ) : prayerError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">{prayerError}</div>
            ) : prayerTimes ? (
              <CielDesPrieres moment={moment} horaires={prayerTimes} prochaine={nextPrayer} />
            ) : null}
          </div>
          <div className="min-w-0 space-y-4">
            {prayerTimes && <EtoilesDuJour horaires={prayerTimes} cochees={todayChecked} onToggle={basculerPriere} texte={ambiance.texte} nuit={ambiance.etoiles} />}
            <PrayerWeeklyCalendar prayerData={calendarData} />
          </div>
        </div>

        <PrayerModuleCards />
      </div>
      </div>

      {showQibla && (
        <QiblaCompass city={selectedCity} onClose={() => setShowQibla(false)} />
      )}
      {validationDialog}
    </AppLayout>
  );
};

export default Priere;
