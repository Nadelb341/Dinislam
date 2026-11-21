import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { untypedDb } from '@/lib/untypedDb';
import { useAuth } from '@/contexts/AuthContext';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { errorMessage } from '@/lib/utils';
import type { AlphabetWord } from '@/data/alphabetWords';

/** ✏️ Modifier le mot exemple d'une lettre (2026-11-21) : mot arabe, prononciation, traduction, emoji ; « ↩️ Mot de départ » → corbeille */
export function ModifierMotDialog({ lettre, mot, onClose }: { lettre: string | null; mot: (AlphabetWord & { modifie?: boolean }) | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [word, setWord] = useState(''); const [tr, setTr] = useState(''); const [fr, setFr] = useState(''); const [emoji, setEmoji] = useState('');
  const [retour, setRetour] = useState(false);
  useEffect(() => { if (mot) { setWord(mot.word); setTr(mot.tr); setFr(mot.fr); setEmoji(mot.emoji); } }, [mot]);
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['alphabet-mots'] });

  const enregistrer = async () => {
    if (!lettre || !word.trim()) { toast.error('Écris le mot en arabe'); return; }
    try {
      const r = await ecrireOuGarder({ table: 'alphabet_mots', op: 'upsert', rows: [{ lettre, word: word.trim(), tr: tr.trim(), fr: fr.trim(), emoji: emoji.trim() || '⭐', updated_at: new Date().toISOString() }] });
      toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : '✏️ Mot modifié (enregistre ta voix pour ce mot ci-dessous)');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const motDeDepart = async () => {
    if (!lettre || !user) return;
    try {
      const { data } = await untypedDb.from('alphabet_mots').select('*').eq('lettre', lettre).maybeSingle();
      if (data) await trashThenDelete({ userId: user.id, type: 'alphabet_mot', id: lettre, label: `Mot exemple de ${lettre}`, data,
        remove: () => untypedDb.from('alphabet_mots').delete().eq('lettre', lettre) });
      toast.success('↩️ Mot de départ remis (ton mot est dans la corbeille)');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const suivant = (id: string) => (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); if (id) document.getElementById(id)?.focus(); else void enregistrer(); } };
  return (
    <Dialog open={!!lettre} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm" level="nested">
        <DialogHeader>
          <DialogTitle>✏️ Mot exemple de <span className="font-arabic text-2xl">{lettre}</span></DialogTitle>
          <DialogDescription>Le mot que voient les élèves sous la lettre.</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold" htmlFor="mot-ar">Mot en arabe (avec les voyelles)</label>
        <Input id="mot-ar" dir="rtl" className="font-arabic text-2xl" value={word} onChange={(e) => setWord(e.target.value)} onKeyDown={suivant('mot-tr')} />
        <label className="text-xs font-semibold" htmlFor="mot-tr">Prononciation</label>
        <Input id="mot-tr" value={tr} onChange={(e) => setTr(e.target.value)} onKeyDown={suivant('mot-fr')} placeholder="ex. arnab" />
        <label className="text-xs font-semibold" htmlFor="mot-fr">En français</label>
        <Input id="mot-fr" value={fr} onChange={(e) => setFr(e.target.value)} onKeyDown={suivant('mot-emoji')} placeholder="ex. lapin" />
        <label className="text-xs font-semibold" htmlFor="mot-emoji">Image (emoji)</label>
        <Input id="mot-emoji" value={emoji} maxLength={8} onChange={(e) => setEmoji(e.target.value)} onKeyDown={suivant('')} />
        <div className="flex flex-wrap justify-between gap-2 pt-1">
          {mot?.modifie && <Button variant="ghost" onClick={() => setRetour(true)}>↩️ Mot de départ</Button>}
          <Button className="ms-auto" onClick={() => void enregistrer()}>Enregistrer</Button>
        </div>
        <ConfirmDeleteDialog open={retour} onOpenChange={setRetour} onConfirm={() => { setRetour(false); void motDeDepart(); }}
          title="Remettre le mot de départ ?" description="Ton mot ira dans la corbeille de Paramètres ; tu pourras le restaurer." />
      </DialogContent>
    </Dialog>
  );
}
