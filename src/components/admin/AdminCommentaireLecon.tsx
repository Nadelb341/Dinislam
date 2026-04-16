import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { sendPushNotification } from '@/lib/pushHelper';
import { Lock, Unlock } from 'lucide-react';

const COMMENTAIRE_DEFAULT = "📌 Pour le prochain cours, Tu dois réviser :\n✅ Page : \n✅ Ligne n° : ";

interface Props {
  leconId: string;
}

const AdminCommentaireLecon = ({ leconId }: Props) => {
  const { user } = useAuth();
  const [eleves, setEleves] = useState<any[]>([]);
  const [eleveSelectionne, setEleveSelectionne] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [commentairesExistants, setCommentairesExistants] = useState<any[]>([]);

  // Mode : 'suivi' ou 'debloquer'
  const [mode, setMode] = useState<'suivi' | 'debloquer'>('suivi');

  // Pour le déverrouillage
  const [lessons, setLessons] = useState<any[]>([]);
  const [adminUnlocks, setAdminUnlocks] = useState<string[]>([]); // lesson_ids déverrouillés pour cet élève
  const [loadingUnlock, setLoadingUnlock] = useState<string | null>(null);

  useEffect(() => {
    chargerEleves();
    chargerCommentaires();
    chargerLecons();
  }, [leconId]);

  const chargerEleves = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('is_approved', true);
    setEleves((profiles || []).map(p => ({ id: p.user_id, full_name: p.full_name })));
  };

  const chargerLecons = async () => {
    const { data } = await supabase
      .from('nourania_lessons')
      .select('id, lesson_number, title_french')
      .order('lesson_number');
    setLessons(data || []);
  };

  const chargerCommentaires = async () => {
    const { data } = await (supabase as any)
      .from('nourania_commentaires_eleves')
      .select('*')
      .eq('lecon_id', leconId);

    const comments = data || [];
    if (comments.length > 0) {
      const ids = comments.map((c: any) => c.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', ids);

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.user_id] = p.full_name || ''; });

      setCommentairesExistants(comments.map((c: any) => ({
        ...c,
        full_name: nameMap[c.student_id] || 'Élève inconnu',
      })));
    } else {
      setCommentairesExistants([]);
    }
  };

  const chargerUnlocksEleve = async (studentId: string) => {
    const { data } = await (supabase as any)
      .from('nourania_admin_unlocks')
      .select('lesson_id')
      .eq('student_id', studentId);
    setAdminUnlocks((data || []).map((r: any) => r.lesson_id));
  };

  const handleSelectEleve = (studentId: string) => {
    setEleveSelectionne(studentId);
    const existant = commentairesExistants.find((c: any) => c.student_id === studentId);
    setCommentaire(existant?.commentaire || COMMENTAIRE_DEFAULT);
    if (studentId) chargerUnlocksEleve(studentId);
  };

  const handleValider = async () => {
    if (!eleveSelectionne) {
      toast.error('Sélectionne un élève');
      return;
    }

    const { error } = await (supabase as any)
      .from('nourania_commentaires_eleves')
      .upsert({
        lecon_id: leconId,
        student_id: eleveSelectionne,
        commentaire,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'lecon_id,student_id' });

    if (error) {
      toast.error('Erreur: ' + error.message);
      return;
    }

    sendPushNotification({
      userIds: [eleveSelectionne],
      title: '📝 Note de l\'enseignante',
      body: 'Votre enseignante a mis à jour votre progression Nourania',
      data: { url: '/nourania' },
    });

    toast.success('✅ Commentaire envoyé à l\'élève !');
    chargerCommentaires();
  };

  const handleToggleUnlock = async (lessonId: string) => {
    if (!eleveSelectionne) return;
    setLoadingUnlock(lessonId);

    const isUnlocked = adminUnlocks.includes(lessonId);

    if (isUnlocked) {
      // Verrouiller : supprimer l'entrée
      const { error } = await (supabase as any)
        .from('nourania_admin_unlocks')
        .delete()
        .eq('student_id', eleveSelectionne)
        .eq('lesson_id', lessonId);

      if (error) {
        toast.error('Erreur : ' + error.message);
      } else {
        setAdminUnlocks(prev => prev.filter(id => id !== lessonId));
        toast.success('🔒 Leçon verrouillée');
      }
    } else {
      // Déverrouiller : insérer l'entrée
      const { error } = await (supabase as any)
        .from('nourania_admin_unlocks')
        .insert({
          student_id: eleveSelectionne,
          lesson_id: lessonId,
          unlocked_by: user?.id,
        });

      if (error) {
        toast.error('Erreur : ' + error.message);
      } else {
        setAdminUnlocks(prev => [...prev, lessonId]);
        const lesson = lessons.find(l => l.id === lessonId);
        sendPushNotification({
          userIds: [eleveSelectionne],
          title: '🔓 Nouvelle leçon disponible !',
          body: `${lesson?.title_french || 'Une leçon'} a été déverrouillée pour toi`,
          data: { url: '/nourania' },
        });
        toast.success('🔓 Leçon déverrouillée !');
      }
    }

    setLoadingUnlock(null);
  };

  const eleveNom = eleves.find(e => e.id === eleveSelectionne)?.full_name || '';

  return (
    <div className="bg-amber-50 rounded-xl p-3 mb-3 border border-amber-200">
      <p className="text-sm font-semibold text-amber-800 mb-2">
        💬 Commentaire individuel
      </p>

      {/* Sélection élève */}
      <select
        value={eleveSelectionne}
        onChange={e => { handleSelectEleve(e.target.value); setMode('suivi'); }}
        className="w-full border rounded-xl p-2 text-sm mb-3 bg-white"
      >
        <option value="">Sélectionner un élève...</option>
        {eleves.map(e => {
          const aCommentaire = commentairesExistants.some((c: any) => c.student_id === e.id);
          return (
            <option key={e.id} value={e.id}>
              {aCommentaire ? '✅ ' : '○ '}{e.full_name}
            </option>
          );
        })}
      </select>

      {/* Après sélection : menu déroulant Suivi / Débloquer */}
      {eleveSelectionne && (
        <>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setMode('suivi')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                mode === 'suivi'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'
              }`}
            >
              📋 Suivi du cours
            </button>
            <button
              type="button"
              onClick={() => setMode('debloquer')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                mode === 'debloquer'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'
              }`}
            >
              🔓 Débloquer une leçon
            </button>
          </div>

          {/* Mode Suivi du cours */}
          {mode === 'suivi' && (
            <>
              <textarea
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm mb-2 bg-white"
                rows={4}
                placeholder={COMMENTAIRE_DEFAULT}
              />
              <button
                onClick={handleValider}
                className="w-full py-2 rounded-xl text-white font-bold text-sm"
                style={{ backgroundColor: '#22c55e' }}
              >
                ✅ Valider et envoyer à l'élève
              </button>
            </>
          )}

          {/* Mode Débloquer une leçon */}
          {mode === 'debloquer' && (
            <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
              <p className="text-xs font-semibold text-amber-700 px-3 pt-2 pb-1">
                Leçons déverrouillées pour <span className="text-amber-900">{eleveNom}</span> :
              </p>
              <div className="divide-y divide-amber-100">
                {lessons.map((lesson) => {
                  const isUnlocked = adminUnlocks.includes(lesson.id);
                  const isLoading = loadingUnlock === lesson.id;
                  return (
                    <div key={lesson.id} className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-gray-700">
                        <span className="font-semibold">Leçon {lesson.lesson_number}</span>
                        <span className="text-gray-500"> — {lesson.title_french}</span>
                      </span>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleToggleUnlock(lesson.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ml-2 ${
                          isUnlocked
                            ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                        }`}
                      >
                        {isLoading ? (
                          <span className="animate-spin">⏳</span>
                        ) : isUnlocked ? (
                          <><Unlock className="h-3 w-3" /> Débloquée</>
                        ) : (
                          <><Lock className="h-3 w-3" /> Débloquer</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Commentaires enregistrés */}
      {commentairesExistants.length > 0 && (
        <div className="mt-3 border-t border-amber-200 pt-2">
          <p className="text-xs font-semibold text-amber-700 mb-1">
            Commentaires enregistrés :
          </p>
          {commentairesExistants.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between py-1 text-xs">
              <span className="text-amber-800 font-semibold">
                ✅ {c.full_name}
              </span>
              <button
                onClick={() => { handleSelectEleve(c.student_id); setMode('suivi'); }}
                className="text-blue-500 underline text-xs"
              >
                Modifier
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCommentaireLecon;
