import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BaremeItem {
  id: string;
  module_key: string | null;
  module_label: string | null;
  points_per_validation: number | null;
  action_key: string;
  label: string;
  points: number;
}

interface ClassementEntry {
  user_id: string;
  full_name: string | null;
  total: number;
}

interface GroupeClassement {
  id: string;
  name: string;
  color: string | null;
  total: number;
  nbMembres: number;
}

const getMedaille = (index: number) => {
  if (index === 0) return { bg: 'hsl(48 96% 89%)', border: 'hsl(38 92% 50%)', emoji: '🥇', textColor: 'hsl(26 90% 37%)' };
  if (index === 1) return { bg: 'hsl(210 40% 96%)', border: 'hsl(215 16% 57%)', emoji: '🥈', textColor: 'hsl(215 25% 35%)' };
  if (index === 2) return { bg: 'hsl(293 100% 98%)', border: 'hsl(270 70% 72%)', emoji: '🥉', textColor: 'hsl(273 72% 47%)' };
  return { bg: 'hsl(138 76% 97%)', border: 'hsl(142 69% 73%)', emoji: null, textColor: 'hsl(143 64% 24%)' };
};

const Classement = () => {
  const { user, isAdmin } = useAuth();
  const [editBareme, setEditBareme] = useState(false);
  const [bareme, setBareme] = useState<BaremeItem[]>([]);
  const [classement, setClassement] = useState<ClassementEntry[]>([]);
  const [classementGroupes, setClassementGroupes] = useState<GroupeClassement[]>([]);
  const [vue, setVue] = useState<'global' | 'groupes'>('global');
  const [loading, setLoading] = useState(true);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});

  const chargerBareme = async () => {
    const { data } = await supabase
      .from('point_settings')
      .select('*')
      .order('action_key');
    setBareme((data as BaremeItem[]) || []);
  };

  const chargerClassement = async () => {
    setLoading(true);

    // Save previous ranks
    const oldRanks: Record<string, number> = {};
    classement.forEach((e, i) => { oldRanks[e.user_id] = i + 1; });
    setPreviousRanks(oldRanks);

    // Fetch rankings
    const { data: rankingData } = await supabase
      .from('student_ranking')
      .select('user_id, total_points')
      .order('total_points', { ascending: false })
      .limit(200);

    const userIds = (rankingData || []).map(r => r.user_id);
    let profiles: { user_id: string; full_name: string | null }[] = [];
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds)
        .limit(200);
      profiles = data || [];
    }

    const enrichis: ClassementEntry[] = (rankingData || []).map(r => {
      const profile = profiles.find(p => p.user_id === r.user_id);
      return {
        user_id: r.user_id,
        full_name: profile?.full_name || null,
        total: r.total_points ?? 0,
      };
    });

    // Detect rank improvements for current user
    if (user) {
      const newIndex = enrichis.findIndex(e => e.user_id === user.id);
      const newRank = newIndex >= 0 ? newIndex + 1 : null;
      const oldRank = oldRanks[user.id];
      if (oldRank && newRank && newRank < oldRank) {
        toast.success(
          `⭐ Bravo ! Tu gagnes ${oldRank - newRank} place${oldRank - newRank > 1 ? 's' : ''} au classement ! 🎉`,
          { duration: 4000 }
        );
      }
    }

    setClassement(enrichis);

    // Group rankings
    const { data: groupes } = await supabase
      .from('student_groups')
      .select('id, name, color');
    const { data: membres } = await supabase
      .from('student_group_members')
      .select('group_id, user_id');

    const groupesAvecPoints: GroupeClassement[] = (groupes || []).map(g => {
      const membreIds = (membres || [])
        .filter(m => m.group_id === g.id)
        .map(m => m.user_id);
      const totalGroupe = enrichis
        .filter(e => membreIds.includes(e.user_id))
        .reduce((sum, e) => sum + e.total, 0);
      return { ...g, total: totalGroupe, nbMembres: membreIds.length };
    }).sort((a, b) => b.total - a.total);

    setClassementGroupes(groupesAvecPoints);
    setLoading(false);
  };

  useEffect(() => {
    chargerBareme();
    chargerClassement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('rankings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_ranking' }, () => {
        chargerClassement();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myIndex = classement.findIndex(e => e.user_id === user?.id);

  const updateBaremePoints = async (id: string, newPoints: number) => {
    await supabase
      .from('point_settings')
      .update({ points: Math.max(0, newPoints), points_per_validation: Math.max(0, newPoints) })
      .eq('id', id);
    chargerBareme();
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-7 w-7 text-secondary" />
            <h1 className="text-2xl font-bold text-foreground">Classement</h1>
            <Crown className="h-7 w-7 text-secondary" />
          </div>
          <p className="text-sm text-muted-foreground">Qui sera au sommet cette semaine ?</p>
        </div>

        {/* My position */}
        {myIndex >= 0 && (
          <div className="rounded-2xl p-4 text-center space-y-1"
            style={{ backgroundColor: 'hsl(48 96% 89%)', border: '2px solid hsl(38 92% 50%)' }}>
            <p className="text-2xl">⭐</p>
            <p className="font-bold text-foreground text-lg">
              {myIndex === 0 ? '1er' : `${myIndex + 1}ème`}
            </p>
            <p className="text-sm text-muted-foreground">{classement[myIndex].total} points</p>
            <p className="text-sm font-medium text-secondary">
              {myIndex <= 2
                ? 'Bravo Champion(ne) ! Continue de briller ! 🌟'
                : myIndex <= Math.ceil(classement.length / 2)
                  ? 'Tu y es presque ! Encore un petit effort pour le podium ! 💪'
                  : 'Ne lâche rien ! Chaque petit pas compte ! ✨'}
            </p>
          </div>
        )}

        {/* Toggle global / groupes */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setVue('global')}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              backgroundColor: vue === 'global' ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              color: vue === 'global' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
            }}>
            🌍 Global
          </button>
          <button
            onClick={() => setVue('groupes')}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              backgroundColor: vue === 'groupes' ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              color: vue === 'groupes' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
            }}>
            👨‍👩‍👧 Par groupes
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : vue === 'global' ? (
          /* CLASSEMENT GLOBAL */
          classement.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">⭐</p>
              <p className="text-muted-foreground font-semibold">Aucun classement pour le moment</p>
              <p className="text-muted-foreground text-sm">Les points seront attribués à chaque validation !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {classement.map((eleve, index) => {
                const m = getMedaille(index);
                const isMe = eleve.user_id === user?.id;
                return (
                  <div
                    key={eleve.user_id}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all animate-fade-in"
                    style={{
                      backgroundColor: m.bg,
                      borderColor: isMe ? 'hsl(38 92% 50%)' : m.border,
                      animationDelay: `${index * 40}ms`,
                      transform: isMe ? 'scale(1.02)' : undefined,
                    }}>
                    <span className="text-xl w-8 text-center font-bold">
                      {m.emoji || `${index + 1}.`}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      {isMe && (
                        <span className="text-xs font-semibold" style={{ color: m.textColor }}>
                          (Vous)
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-lg" style={{ color: m.textColor }}>
                      {eleve.total} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* CLASSEMENT PAR GROUPES */
          classementGroupes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun groupe créé</p>
          ) : (
            <div className="space-y-2">
              {classementGroupes.map((groupe, index) => {
                const m = getMedaille(index);
                return (
                  <div
                    key={groupe.id}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 animate-fade-in"
                    style={{
                      backgroundColor: m.bg,
                      borderColor: m.border,
                      animationDelay: `${index * 40}ms`,
                    }}>
                    <span className="text-xl w-8 text-center font-bold">
                      {m.emoji || `${index + 1}.`}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: m.textColor }}>{groupe.name}</p>
                      <p className="text-xs" style={{ color: m.textColor }}>
                        {groupe.nbMembres} membre{groupe.nbMembres > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="font-bold text-lg" style={{ color: m.textColor }}>
                      {groupe.total} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Barème footer */}
        <div className="border border-border rounded-2xl p-4 flex items-center justify-between bg-card">
          <p className="font-semibold text-foreground">Barème des points :</p>
          {isAdmin && (
            <button
              onClick={() => setEditBareme(true)}
              className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
              ⚙️ Modifier
            </button>
          )}
        </div>

        {/* Quick barème preview for students */}
        {!isAdmin && bareme.length > 0 && (
          <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground px-1">
            {bareme.map(b => (
              <span key={b.id}>
                {b.label} : {b.points} pts
              </span>
            ))}
          </div>
        )}

        {/* Bottom sheet barème dialog */}
        {editBareme && (
          <div
            className="fixed inset-0 bg-black/50 z-[500] flex items-end justify-center"
            onClick={() => setEditBareme(false)}>
            <div
              className="bg-background rounded-t-3xl w-full max-w-lg p-5 pb-8 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground">⚙️ Barème des points</h3>
                <button
                  onClick={() => setEditBareme(false)}
                  className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center font-bold">
                  ✕
                </button>
              </div>
              {bareme.map(b => (
                <div key={b.id} className="flex items-center justify-between py-3 border-b border-border">
                  <p className="text-sm font-semibold flex-1 text-foreground">{b.label}</p>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => updateBaremePoints(b.id, b.points - 1)}
                      className="w-8 h-8 rounded-full bg-muted font-bold text-muted-foreground flex items-center justify-center text-lg">
                      −
                    </button>
                    <span className="w-10 text-center font-bold text-secondary text-lg">
                      {b.points}
                    </span>
                    <button
                      onClick={() => updateBaremePoints(b.id, b.points + 1)}
                      className="w-8 h-8 rounded-full font-bold text-white flex items-center justify-center text-lg"
                      style={{ backgroundColor: 'hsl(38 92% 50%)' }}>
                      +
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setEditBareme(false);
                  chargerClassement();
                  toast.success('Barème sauvegardé ✅');
                }}
                className="w-full py-3 rounded-xl text-white font-bold mt-4"
                style={{ backgroundColor: 'hsl(142 71% 45%)' }}>
                ✅ Sauvegarder et fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Classement;
