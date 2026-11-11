import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { trashThenDelete } from '@/lib/trash';
import { MATIERES } from '@/lib/devoirMatieres';
import { asPJ, lignesHabituelles, type LigneDevoir, type PieceJointe } from '@/lib/devoirFichiers';
import type { Json } from '@/integrations/supabase/types';
import { OutilsDeLigne } from '@/components/cahier/OutilsLigneDevoir';
import { CiblesMulti } from '@/components/cahier/CiblesMulti';
import { useReglagesDevoirsGroupe } from '@/hooks/useReglagesDevoirsGroupe';
import { useProchainesEtapes } from '@/hooks/useProchainesEtapes';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { brouillonDe, donnerDevoirs, enregistrerBrouillon, formVide, itemsDuFormulaire, type Cible, type FormEleve } from '@/lib/devoirsEleve';

const TYPE_OPTIONS = [
  { value: 'recitation', label: '🎙️ Récitation' }, { value: 'sourate', label: '📖 Sourate à mémoriser' }, { value: 'nourania', label: '✨ Leçon Nourania' },
  { value: 'allah_names', label: "🌟 99 noms d'Allah" }, { value: 'alphabet', label: '🔤 Alphabet' }, { value: 'invocations', label: '🤲 Invocations' },
  { value: 'priere', label: '🕌 Prière' }, { value: 'coran', label: '📗 Coran' }, { value: 'exercice_pdf', label: '📄 Exercice PDF' }, { value: 'autre', label: '✏️ Autre' },
];

/**
 * 📚 Les devoirs d'UN élève, dans sa carte de la liste (Nadia, 2026-11-11, maquette A).
 * Par matière / Devoir détaillé, ⚡ modèles, 💡 prochaine étape (modifiable), 📍 plusieurs éléments par ligne (= plusieurs devoirs),
 * 🔁 comme la semaine dernière, 💎 maximum de la semaine du groupe, 📋 donner aussi à…, brouillon par élève, envoi hors ligne.
 */
export interface DevoirPasse { titre: string; type: string; cible_id: string | null; matiere_emoji: string | null }
export function FormulaireDevoirEleve({ eleve, groupeId, autres, dateLimite, visibleA, dejaCetteSemaine, semainePassee, onSuivant }: {
  eleve: { user_id: string; full_name: string | null };
  groupeId: string | null;
  /** Les autres élèves du groupe (ou de la classe) pour « 📋 Donner aussi à… » */
  autres: { user_id: string; full_name: string | null }[];
  dateLimite: string;
  visibleA: string | null;
  dejaCetteSemaine: number;
  semainePassee: DevoirPasse[];
  onSuivant?: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const nom = eleve.full_name || 'Élève';
  const [form, setForm] = useState<FormEleve>(() => brouillonDe(eleve.user_id));
  const [envoi, setEnvoi] = useState(false);
  const [aussiOuvert, setAussiOuvert] = useState(() => brouillonDe(eleve.user_id).aussi.length > 0);
  const { askValidation, validationDialog } = useConfirmValidation();
  const suggestions = useProchainesEtapes(eleve.user_id);
  const { data: reglages } = useReglagesDevoirsGroupe(groupeId);

  // Brouillon de CET élève, gardé à chaque changement (idée 4)
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) { premier.current = false; return; }
    enregistrerBrouillon(eleve.user_id, nom, form);
  }, [form, eleve.user_id, nom]);

  const lignesVisibles: LigneDevoir[] = (reglages?.lignes ?? lignesHabituelles()).filter((l) => l.actif || (form.lignes[l.key] || '').trim());
  const items = itemsDuFormulaire(form, lignesVisibles);
  const max = reglages?.max_devoirs ?? null;
  const set = (p: Partial<FormEleve>) => setForm((f) => ({ ...f, ...p }));
  const setLigne = (k: string, v: string) => setForm((f) => ({ ...f, lignes: { ...f.lignes, [k]: v } }));
  const setPJ = (k: string, n: PieceJointe[]) => setForm((f) => ({ ...f, pj: { ...f.pj, [k]: n } }));
  const setConsigne = (k: string, url: string | null) => setForm((f) => { const c = { ...f.consignes }; if (url) c[k] = url; else delete c[k]; return { ...f, consignes: c }; });
  const ligneDuType = (type: string) => lignesVisibles.find((l) => l.type === type && !l.perso) ?? lignesVisibles.find((l) => l.type === type);

  // ⚡ Modèles
  const { data: modeles = [] } = useQuery({
    queryKey: ['devoir-modeles'],
    queryFn: async () => ((await supabase.from('devoir_modeles').select('*').order('created_at', { ascending: false })).data || []),
  });
  const [gererModeles, setGererModeles] = useState(false);
  const [modeleASupprimer, setModeleASupprimer] = useState<{ id: string; titre: string } | null>(null);
  const appliquerModele = (m: (typeof modeles)[number]) => {
    const ligne = lignesVisibles.find((l) => l.key === m.ligne_key) ?? ligneDuType(m.type);
    if (!ligne) { toast.error('Cette ligne n\'est pas affichée pour ce groupe (⚙️ Lignes et maximum, dans la fiche du groupe)'); return; }
    setForm((f) => ({
      ...f, parMatiere: true, lignes: { ...f.lignes, [ligne.key]: m.titre }, pj: { ...f.pj, [ligne.key]: asPJ(m.pieces_jointes) },
      consignes: m.consigne_audio_url ? { ...f.consignes, [ligne.key]: m.consigne_audio_url } : f.consignes,
      cibles: m.cible_id ? { ...f.cibles, [ligne.key]: [{ v: m.cible_id, l: m.titre }] } : f.cibles, audios: { ...f.audios, [ligne.key]: m.audio_requis },
    }));
  };
  const garderModele = async (m: LigneDevoir) => {
    const titre = (form.lignes[m.key] || '').trim();
    if (!titre) return;
    const { error } = await supabase.from('devoir_modeles').insert({
      titre, type: m.type, matiere_label: m.perso ? m.label : null, matiere_emoji: m.perso ? m.emoji : null, ligne_key: m.key,
      pieces_jointes: (form.pj[m.key] || []) as unknown as Json, consigne_audio_url: form.consignes[m.key] || null,
      cible_id: form.cibles[m.key]?.[0]?.v || null, audio_requis: !!form.audios[m.key], created_by: user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['devoir-modeles'] });
    toast.success(`⚡ Modèle « ${titre} » gardé`);
  };
  const supprimerModele = async (id: string) => {
    const m = modeles.find((x) => x.id === id);
    if (!m || !user) return;
    try {
      await trashThenDelete({ userId: user.id, type: 'devoir_modele', id, label: `⚡ Modèle « ${m.titre} »`, data: m, remove: () => supabase.from('devoir_modeles').delete().eq('id', id) });
      queryClient.invalidateQueries({ queryKey: ['devoir-modeles'] });
      toast.success('Modèle supprimé (dans la corbeille de Paramètres)');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Suppression impossible'); }
  };

  // 💡 Prochaine étape (idée 2) : remplit la ligne, que Nadia modifie ensuite librement
  const appliquerSuggestion = (s: { type: string; texte: string; cible: Cible }) => {
    const ligne = ligneDuType(s.type);
    if (!ligne) return;
    setForm((f) => ({ ...f, parMatiere: true, lignes: { ...f.lignes, [ligne.key]: s.texte }, cibles: { ...f.cibles, [ligne.key]: [s.cible] } }));
    toast.success(`💡 Ajouté sur la ligne ${ligne.emoji} ${ligne.label} : tu peux le modifier`);
  };

  // 🔁 Comme la semaine dernière (idée 8)
  const commeSemainePassee = () => {
    const lignes: Record<string, string> = {}, cibles: Record<string, Cible[]> = {};
    for (const d of semainePassee) {
      const ligne = ligneDuType(d.type) ?? ligneDuType('autre');
      if (!ligne) continue;
      lignes[ligne.key] = lignes[ligne.key] ? `${lignes[ligne.key]} · ${d.titre}` : d.titre;
      if (d.cible_id) cibles[ligne.key] = [...(cibles[ligne.key] || []), { v: d.cible_id, l: d.titre }];
    }
    setForm((f) => ({ ...f, parMatiere: true, lignes: { ...f.lignes, ...lignes }, cibles: { ...f.cibles, ...cibles } }));
    toast.success('🔁 Devoirs de la semaine dernière repris : modifie ce qu\'il faut');
  };

  const destinataires = [eleve.user_id, ...form.aussi.filter((id) => id !== eleve.user_id)];
  const donner = async () => {
    if (!user) return;
    if (!dateLimite) { toast.error('Choisis d\'abord la date à rendre 📅 (en haut)'); return; }
    if (!items.length) { toast.error(form.parMatiere ? 'Écris au moins une consigne sur une ligne' : 'Le titre est obligatoire'); return; }
    setEnvoi(true);
    try {
      const r = await donnerDevoirs({ eleveIds: destinataires, items, date_limite: dateLimite, visible_a: visibleA, source_task_id: form.source_task_id, created_by: user.id });
      setForm(formVide());
      enregistrerBrouillon(eleve.user_id, nom, formVide());
      setAussiOuvert(false);
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      const qui = destinataires.length > 1 ? `${nom} et ${destinataires.length - 1} autre${destinataires.length > 2 ? 's' : ''}` : nom;
      if (r === 'en_attente') toast.info(`📡 Hors connexion : devoirs de ${qui} gardés sur l'appareil, envoyés au retour du réseau`);
      else toast.success(`✅ ${items.length} devoir${items.length > 1 ? 's' : ''} donné${items.length > 1 ? 's' : ''} à ${qui}`);
    } catch (e) {
      toast.error(`Pas donné : ${(e as Error).message}`);
    } finally { setEnvoi(false); }
  };
  const demanderDonner = () => {
    if (max !== null && dejaCetteSemaine + items.length > max) {
      askValidation('Maximum de devoirs dépassé', `« ${nom} » : ${max} devoir${max > 1 ? 's' : ''} maximum par semaine dans ce groupe (déjà ${dejaCetteSemaine}, + ${items.length}). Le donner quand même ?`, () => void donner());
    } else void donner();
  };

  return (
    <div className="mt-2 rounded-2xl border-2 border-dashed border-primary/30 bg-card p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold">✏️ Nouveaux devoirs pour {nom}</p>
        <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-bold', max !== null && dejaCetteSemaine + items.length > max ? 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200' : 'bg-muted')}>
          💎 {dejaCetteSemaine + items.length}{max !== null ? ` / max ${max}` : ''} cette semaine
        </span>
      </div>

      {/* 💡 Prochaine étape · 🔁 comme la semaine dernière */}
      {(suggestions.length > 0 || semainePassee.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1.5">
          <span className="text-xs font-bold">💡 Sa prochaine étape :</span>
          {suggestions.map((s) => {
            const m = MATIERES.find((x) => x.type === s.type);
            return <button key={s.type} type="button" onClick={() => appliquerSuggestion(s)} className="rounded-full border bg-card px-2.5 py-1 text-xs font-semibold text-start [overflow-wrap:anywhere]">{m?.emoji} {s.cible.l}</button>;
          })}
          {semainePassee.length > 0 && <button type="button" onClick={commeSemainePassee} className="rounded-full border border-sky-300 bg-sky-50 dark:bg-sky-950/30 px-2.5 py-1 text-xs font-bold">🔁 Comme la semaine dernière ({semainePassee.length})</button>}
        </div>
      )}

      <div className="flex rounded-xl bg-muted p-1">
        <button type="button" onClick={() => set({ parMatiere: true })} aria-pressed={form.parMatiere}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${form.parMatiere ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}>✍️ Par matière</button>
        <button type="button" onClick={() => set({ parMatiere: false })} aria-pressed={!form.parMatiere}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${!form.parMatiere ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}>📝 Devoir détaillé</button>
      </div>

      {form.parMatiere ? (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Un devoir (et un 💎) par ligne remplie. 📍 : coche un ou plusieurs éléments (3 invocations = 3 devoirs).</p>
          {modeles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 px-2 py-1.5">
              <span className="text-xs font-bold">⚡ Modèles :</span>
              {modeles.map((m) => (
                <span key={m.id} className="relative">
                  <button type="button" onClick={() => appliquerModele(m)} className="rounded-full border bg-card px-2.5 py-1 text-xs font-semibold text-start [overflow-wrap:anywhere]">
                    {m.matiere_emoji || MATIERES.find((x) => x.type === m.type)?.emoji || '✏️'} {m.titre}{m.consigne_audio_url ? ' 🎧' : ''}{asPJ(m.pieces_jointes).length ? ' 📎' : ''}
                  </button>
                  {gererModeles && (
                    <button type="button" aria-label={`Supprimer le modèle ${m.titre}`} onClick={() => setModeleASupprimer({ id: m.id, titre: m.titre })}
                      className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-[#EF4444] text-white text-[11px] font-extrabold grid place-items-center">✕</button>
                  )}
                </span>
              ))}
              <button type="button" onClick={() => setGererModeles((v) => !v)} className="text-[11px] font-bold underline">{gererModeles ? 'Terminé' : 'Gérer'}</button>
            </div>
          )}
          {lignesVisibles.map((m) => {
            const rempli = !!(form.lignes[m.key] || '').trim();
            return (
              <div key={m.key} data-ligne className={`rounded-xl px-2 py-1.5 ${rempli ? 'bg-sky-50 dark:bg-sky-950/30' : ''}`}>
                <OutilsDeLigne ligneKey={`${eleve.user_id}|${m.key}`} ligneNom={`${m.label} · ${nom}`} pj={form.pj[m.key] || []} audio={form.consignes[m.key] || null}
                  setPJ={(n) => setPJ(m.key, n)} setAudio={(u) => setConsigne(m.key, u)}>
                  {(icones) => (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:flex-nowrap">
                      <span className="min-w-0 flex-1 sm:flex-none sm:w-[7.5rem] shrink-0 text-sm font-semibold [overflow-wrap:anywhere]">{m.emoji} {m.label}</span>
                      <Input id={`devoir-${eleve.user_id}-${m.key}`} value={form.lignes[m.key] || ''} placeholder={m.exemple ? `ex. ${m.exemple}` : 'la consigne…'} aria-label={`Devoir de ${m.label} pour ${nom}`}
                        className="order-last basis-full min-w-0 sm:order-none sm:basis-auto sm:flex-1"
                        onChange={(e) => setLigne(m.key, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget.closest('[data-ligne]')?.nextElementSibling?.querySelector('input') as HTMLInputElement | null)?.focus(); } }} />
                      {icones}
                    </div>
                  )}
                </OutilsDeLigne>
                {rempli && (
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 sm:ps-[7.5rem]">
                    {!m.perso && <CiblesMulti type={m.type} value={form.cibles[m.key] || []} onChange={(v) => setForm((f) => ({ ...f, cibles: { ...f.cibles, [m.key]: v } }))} />}
                    <label className="flex items-center gap-1.5 text-xs font-semibold">
                      <input type="checkbox" checked={!!form.audios[m.key]} onChange={(e) => setForm((f) => ({ ...f, audios: { ...f.audios, [m.key]: e.target.checked } }))} className="h-4 w-4 accent-orange-500" />
                      🎙️ audio demandé
                    </label>
                    <button type="button" onClick={() => void garderModele(m)} className="rounded-full border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[11px] font-bold">⚡ Garder comme modèle</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <OutilsDeLigne ligneKey={`${eleve.user_id}|detail`} ligneNom={`devoir détaillé · ${nom}`} pj={form.pj.detail || []} audio={form.consignes.detail || null}
            setPJ={(n) => setPJ('detail', n)} setAudio={(u) => setConsigne('detail', u)}>
            {(icones) => (
              <div className="flex items-center gap-2">
                <Input id={`devoir-${eleve.user_id}-titre`} placeholder="Titre du devoir *" value={form.titre} className="min-w-0" onChange={(e) => set({ titre: e.target.value })} />
                {icones}
              </div>
            )}
          </OutilsDeLigne>
          <select id={`devoir-${eleve.user_id}-type`} value={form.type} onChange={(e) => set({ type: e.target.value, ciblesDetail: [] })} className="w-full border rounded-xl p-3 text-sm bg-background">
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="flex flex-wrap items-center gap-2">
            <CiblesMulti type={form.type} value={form.ciblesDetail} onChange={(v) => set({ ciblesDetail: v })} />
            <label className="flex items-center gap-1.5 text-xs font-semibold">
              <input type="checkbox" checked={form.audio_requis} onChange={(e) => set({ audio_requis: e.target.checked })} className="h-4 w-4 accent-orange-500" />
              🎙️ audio demandé
            </label>
          </div>
          <Textarea id={`devoir-${eleve.user_id}-description`} placeholder="Description (optionnel)" value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} />
          <Input id={`devoir-${eleve.user_id}-lien`} placeholder="Lien vers la leçon (optionnel)" value={form.lien_lecon} onChange={(e) => set({ lien_lecon: e.target.value })} />
          <label className="text-xs font-medium text-muted-foreground block">💎 Étapes (optionnel, une par ligne) : le diamant de l'élève se remplit à chaque étape cochée</label>
          <Textarea id={`devoir-${eleve.user_id}-etapes`} placeholder={'Ex. :\nLigne 1\nLigne 2'} value={form.etapes} rows={3} onChange={(e) => set({ etapes: e.target.value })} />
        </div>
      )}

      {/* 📋 Donner aussi à… (Q1-A) */}
      {autres.length > 0 && (
        <div className="rounded-xl border bg-muted/30 px-2.5 py-2 space-y-1.5">
          <button type="button" onClick={() => setAussiOuvert((v) => !v)} className="w-full text-start text-xs font-bold">
            📋 Donner aussi à… {form.aussi.length ? `(${form.aussi.length})` : ''} {aussiOuvert ? '▴' : '▾'}
          </button>
          {aussiOuvert && (
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => set({ aussi: form.aussi.length === autres.length ? [] : autres.map((a) => a.user_id) })}
                className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', form.aussi.length === autres.length ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>
                {form.aussi.length === autres.length ? '✓ ' : ''}Tout le groupe
              </button>
              {autres.map((a) => {
                const on = form.aussi.includes(a.user_id);
                return <button key={a.user_id} type="button" aria-pressed={on} onClick={() => set({ aussi: on ? form.aussi.filter((x) => x !== a.user_id) : [...form.aussi, a.user_id] })}
                  className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{on ? '✓ ' : ''}{a.full_name || 'Élève'}</button>;
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button className="flex-1" disabled={envoi || !items.length} onClick={demanderDonner}>
          {envoi ? 'Envoi…' : `✅ Donner ${items.length > 1 ? `les ${items.length} devoirs` : 'le devoir'} à ${nom}${form.aussi.length ? ` + ${form.aussi.length}` : ''}`}
        </Button>
        {onSuivant && <Button variant="outline" onClick={onSuivant} aria-label="Élève suivant">Suivant ›</Button>}
      </div>

      <AlertDialog open={!!modeleASupprimer} onOpenChange={(o) => { if (!o) setModeleASupprimer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le modèle « {modeleASupprimer?.titre} » ?</AlertDialogTitle>
            <AlertDialogDescription>Il ira dans la corbeille de Paramètres. Les devoirs déjà donnés ne changent pas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (modeleASupprimer) void supprimerModele(modeleASupprimer.id); }}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {validationDialog}
    </div>
  );
}
