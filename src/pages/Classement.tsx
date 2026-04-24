import { useEffect, useState } from 'react';
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

interface GroupMemberEntry {
  user_id: string;
  full_name: string | null;
  total: number;
  group_id: string;
  group_name: string;
  group_color: string | null;
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
  const [groupMembers, setGroupMembers] = useState<GroupMemberEntry[]>([]);
  const [myGroupId, setMyGroupId] = useState<string | null>(null);
  const [vue, setVue] = useState<'global' | 'groupes'>('global');
  const [loading, setLoading] = useState(true);

  const chargerBareme = async () => {
    const { data } = await supabase.from('point_settings').select('*').order('action_key');
    setBareme((data as BaremeItem[]) || []);
  };

  const chargerClassement = async () => {
    setLoading(true);

    // Fetch global ranking
    const { data: rankingData } = await supabase
      .from('student_ranking')
      .select('user_id, total_points')
      .order('total_points', { ascending: false })
      .limit(200);

    const userIds = (rankingData || []).map(r => r.user_id);
    let profiles: { user_id: string; full_name: string | null }[] = [];
    if (userIds.length > 0) {
      // Privacy: seuls les admins récupèrent tous les noms.
      // Un élève ne reçoit que son propre profil ; les autres lignes afficheront "Élève".
      if (isAdmin) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds)
          .limit(200);
        profiles = data || [];
      } else if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('user_id', user.id);
        profiles = data || [];
      }
    }

    const enrichis: ClassementEntry[] = (rankingData || []).map(r => ({
      user_id: r.user_id,
      full_name: profiles.find(p => p.user_id === r.user_id)?.full_name || null,
      total: r.total_points ?? 0,
    }));

    setClassement(enrichis);

    // Rank improvement toast
    if (user) {
      const newIndex = enrichis.findIndex(e => e.user_id === user.id);
      const newRank = newIndex >= 0 ? newIndex + 1 : null;
      if (newRank && newRank <= 3) {
        // Only toast when on podium
      }
    }

    // Fetch group members with individual rankings
    const { data: groupes } = await supabase.from('student_groups').select('id, name, color');
    const { data: membres } = await supabase.from('student_group_members').select('group_id, user_id');

    if (groupes && membres) {
      // Find current user's group
      const myMembership = membres.find(m => m.user_id === user?.id);
      setMyGroupId(myMembership?.group_id || null);

      // Build individual member entries
      const memberEntries: GroupMemberEntry[] = [];
      for (const groupe of groupes) {
        const membreIds = membres.filter(m => m.group_id === groupe.id).map(m => m.user_id);
        for (const uid of membreIds) {
          const ranking = enrichis.find(e => e.user_id === uid);
          const profile = profiles.find(p => p.user_id === uid);
          memberEntries.push({
            user_id: uid,
            full_name: profile?.full_name || null,
            total: ranking?.total ?? 0,
            group_id: groupe.id,
            group_name: groupe.name,
            group_color: groupe.color,
          });
        }
      }
      setGroupMembers(memberEntries);
    }

    setLoading(false);
  };

  useEffect(() => {
    chargerBareme();
    chargerClassement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const updateBaremePoints = async (id: string, newPoints: number) => {
    await supabase
      .from('point_settings')
      .update({ points: Math.max(0, newPoints), points_per_validation: Math.max(0, newPoints) })
      .eq('id', id);
    chargerBareme();
  };

  // For students: only members of their group, sorted by points
  const myGroupMembers = groupMembers
    .filter(m => m.group_id === myGroupId)
    .sort((a, b) => b.total - a.total);

  // For admin: all groups with their sorted members
  const groupIds = [...new Set(groupMembers.map(m => m.group_id))];
  const groupesAvecMembres = groupIds.map(gid => {
    const members = groupMembers.filter(m => m.group_id === gid).sort((a, b) => b.total - a.total);
    return {
      group_id: gid,
      group_name: members[0]?.group_name || '',
      group_color: members[0]?.group_color || null,
      members,
    };
  });

  const myRankInGroup = myGroupMembers.findIndex(m => m.user_id === user?.id);
  const myGlobalIndex = classement.findIndex(e => e.user_id === user?.id);

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

        {/* Ma position (student global) */}
        {!isAdmin && myGlobalIndex >= 0 && (
          <div className="rounded-2xl p-4 text-center space-y-1"
            style={{ backgroundColor: 'hsl(48 96% 89%)', border: '2px solid hsl(38 92% 50%)' }}>
            <p className="text-2xl">⭐</p>
            <p className="font-bold text-foreground text-lg">
              {myGlobalIndex === 0 ? '1er' : `${myGlobalIndex + 1}ème`} au classement général
            </p>
            <p className="text-sm text-muted-foreground">{classement[myGlobalIndex].total} points</p>
          </div>
        )}

        {/* Toggle — Global visible pour tous (les noms sont anonymisés côté élève) */}
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
          /* CLASSEMENT GLOBAL — admin seulement */
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
                    className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all"
                    style={{
                      backgroundColor: m.bg,
                      borderColor: isMe ? 'hsl(38 92% 50%)' : m.border,
                    }}>
                    <span className="text-xl w-8 text-center font-bold">
                      {m.emoji || `${index + 1}.`}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: m.textColor }}>
                        {eleve.full_name || 'Élève'}
                        {isMe && <span className="ml-1 text-xs opacity-70">(Moi)</span>}
                      </p>
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
          isAdmin ? (
            /* Admin : tous les groupes avec noms réels */
            groupesAvecMembres.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun groupe créé</p>
            ) : (
              <div className="space-y-4">
                {groupesAvecMembres.map(groupe => (
                  <div key={groupe.group_id} className="rounded-2xl border border-border overflow-hidden">
                    <div className="px-4 py-2 font-bold text-sm text-white"
                      style={{ backgroundColor: groupe.group_color || 'hsl(var(--primary))' }}>
                      👥 {groupe.group_name} — {groupe.members.length} membre{groupe.members.length > 1 ? 's' : ''}
                    </div>
                    <div className="divide-y divide-border">
                      {groupe.members.map((m, index) => {
                        const med = getMedaille(index);
                        return (
                          <div key={m.user_id} className="flex items-center gap-3 px-4 py-2"
                            style={{ backgroundColor: med.bg }}>
                            <span className="text-lg w-6 text-center font-bold">
                              {med.emoji || `${index + 1}.`}
                            </span>
                            <span className="flex-1 text-sm font-medium" style={{ color: med.textColor }}>
                              {m.full_name || 'Élève'}
                            </span>
                            <span className="font-bold text-sm" style={{ color: med.textColor }}>
                              {m.total} pts
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Élève : seulement son groupe, anonymisé */
            myGroupId === null ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">👥</p>
                <p className="text-muted-foreground font-semibold">Tu n'es pas encore dans un groupe</p>
                <p className="text-muted-foreground text-sm">Demande à ton enseignant de t'assigner à un groupe.</p>
              </div>
            ) : myGroupMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun membre dans ton groupe</p>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="px-4 py-2 font-bold text-sm text-white"
                  style={{ backgroundColor: myGroupMembers[0]?.group_color || 'hsl(var(--primary))' }}>
                  👥 {myGroupMembers[0]?.group_name} — {myGroupMembers.length} membre{myGroupMembers.length > 1 ? 's' : ''}
                </div>
                <div className="divide-y divide-border">
                  {myGroupMembers.map((membre, index) => {
                    const med = getMedaille(index);
                    const isMe = membre.user_id === user?.id;
                    return (
                      <div key={membre.user_id} className="flex items-center gap-3 px-4 py-2"
                        style={{ backgroundColor: isMe ? 'hsl(48 96% 89%)' : med.bg }}>
                        <span className="text-lg w-6 text-center font-bold">
                          {med.emoji || `${index + 1}.`}
                        </span>
                        <span className="flex-1 text-sm font-medium" style={{ color: isMe ? 'hsl(26 90% 37%)' : med.textColor }}>
                          {isMe ? 'Moi' : 'Élève'}
                        </span>
                        <span className="font-bold text-sm" style={{ color: isMe ? 'hsl(26 90% 37%)' : med.textColor }}>
                          {membre.total} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
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

        {!isAdmin && bareme.length > 0 && (
          <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground px-1">
            {bareme.map(b => (
              <span key={b.id}>{b.label} : {b.points} pts</span>
            ))}
          </div>
        )}

        {/* Barème edit dialog (admin) */}
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
                    <span className="w-10 text-center font-bold text-secondary text-lg">{b.points}</span>
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
                onClick={() => { setEditBareme(false); chargerClassement(); toast.success('Barème sauvegardé ✅'); }}
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
