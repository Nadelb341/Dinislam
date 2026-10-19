import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { saveDraft, loadDraft, clearDraft } from '@/hooks/useDraftRecovery';
import { DRAFT_RESUME_EVENT, EDIT_MARK, editDraftKey, takeDraftResume, takeDraftResumePrefix } from '@/lib/pendingDrafts';

/**
 * Brouillon automatique d'un formulaire de CRÉATION (règle « Brouillon automatique » + « Actions inachevées »).
 * - Pendant que le formulaire est ouvert, ce qui est tapé est gardé sur l'appareil (localStorage draft_<clé>).
 * - Fermé sans valider : le brouillon reste (message « ⏳ Action pas terminée » à l'ouverture de l'appli).
 * - Formulaire rouvert vide, ou « Continuer » depuis le message d'ouverture : le brouillon revient tout seul.
 * - Création réussie : appeler `done()`.
 * ⚠️ La clé doit être déclarée dans DRAFT_DEFS (src/lib/pendingDrafts.ts).
 */
export interface CreationDraftOptions<T> {
  /** Formulaire de création ouvert (pas en modification d'un élément existant) */
  active: boolean;
  value: T;
  isEmpty: (v: T) => boolean;
  /** Remet le brouillon dans le formulaire ET l'ouvre */
  restore: (v: T) => void;
}

export interface CreationDraft {
  key: string | null;
  /** Le formulaire affiche un brouillon repris */
  restored: boolean;
  /** À appeler après une création réussie */
  done: () => void;
  /** Le brouillon a été mis à la corbeille : on repart de zéro */
  forget: () => void;
}

export function useCreationDraft<T>(key: string | null, opts: CreationDraftOptions<T>): CreationDraft {
  const [restored, setRestored] = useState(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const skipSave = useRef(false);
  /** Contenu au moment d'une création réussie : on ne le regarde plus comme un brouillon */
  const finishedAt = useRef<string | null>(null);
  const serialized = JSON.stringify(opts.value);
  const serializedRef = useRef(serialized);
  serializedRef.current = serialized;

  const restoreFrom = (k: string) => {
    const d = loadDraft<T>(k);
    if (d == null || optsRef.current.isEmpty(d)) return;
    skipSave.current = true;
    optsRef.current.restore(d);
    setRestored(true);
  };

  // « Continuer » depuis le message d'ouverture (au chargement de l'écran, ou écran déjà ouvert)
  useEffect(() => {
    if (!key) return;
    const tryResume = () => { if (takeDraftResume(key)) restoreFrom(key); };
    tryResume();
    window.addEventListener(DRAFT_RESUME_EVENT, tryResume);
    return () => window.removeEventListener(DRAFT_RESUME_EVENT, tryResume);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restoreFrom ne lit que des refs
  }, [key]);

  // Formulaire ouvert vide alors qu'un brouillon existe → il revient ; fermé sans valider → on prévient
  const wasActive = useRef(false);
  const keyRef = useRef(key);
  useEffect(() => {
    // Autre élément (ex. autre jour du Ramadan) : comme une nouvelle ouverture
    if (keyRef.current !== key) {
      // Fiche fermée en même temps que l'élément quitté (ex. modification annulée) : on prévient aussi
      const left = keyRef.current;
      if (left && wasActive.current) {
        const d = loadDraft<T>(left);
        if (d != null && !optsRef.current.isEmpty(d)) toast('📝 Brouillon gardé', { description: 'Tu le retrouveras dans 🛡️ › Mes brouillons.' });
      }
      keyRef.current = key; wasActive.current = false;
    }
    if (!key) return;
    if (opts.active && !wasActive.current) {
      finishedAt.current = null;
      if (opts.isEmpty(opts.value)) restoreFrom(key);
    }
    if (!opts.active && wasActive.current) {
      setRestored(false);
      const d = loadDraft<T>(key);
      if (d != null && !optsRef.current.isEmpty(d)) {
        toast('📝 Brouillon gardé', { description: 'Tu le retrouveras en rouvrant ce formulaire.' });
      }
    }
    wasActive.current = opts.active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, opts.active]);

  // Sauvegarde à chaque frappe
  useEffect(() => {
    if (!key || !opts.active) return;
    // Juste après une création réussie : rien n'est réécrit tant que le formulaire n'a pas changé
    if (finishedAt.current !== null) {
      if (serialized === finishedAt.current) return;
      finishedAt.current = null;
    }
    if (skipSave.current) { skipSave.current = false; return; }
    if (opts.isEmpty(opts.value)) clearDraft(key); else saveDraft(key, opts.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, opts.active, serialized]);

  return {
    key,
    restored,
    done: () => { if (key) clearDraft(key); finishedAt.current = serializedRef.current; setRestored(false); },
    forget: () => { setRestored(false); },
  };
}

const REPLY_PREFIX = 'dinislam_admin_reply_';

/**
 * Réponse de l'enseignante dans une conversation : brouillon propre à chaque élève
 * (comme la messagerie des élèves). Le texte revient quand on rouvre la conversation.
 */
export function useReplyDraft(studentId: string | null, setText: (t: string) => void) {
  const key = studentId ? REPLY_PREFIX + studentId : null;
  const setRef = useRef(setText);
  setRef.current = setText;
  useEffect(() => { setRef.current(key ? loadDraft<string>(key) ?? '' : ''); }, [key]);
  return {
    change: (t: string) => {
      setText(t);
      if (key) { if (t.trim()) saveDraft(key, t); else clearDraft(key); }
    },
    sent: () => { if (key) clearDraft(key); },
  };
}

/** « Continuer » une réponse depuis le message d'ouverture : rend l'élève dont il faut rouvrir la conversation. */
export function useReplyResume(onResume: (studentId: string) => void) {
  const cbRef = useRef(onResume);
  cbRef.current = onResume;
  useEffect(() => {
    const tryResume = () => {
      const k = takeDraftResumePrefix(REPLY_PREFIX);
      if (k) cbRef.current(k.slice(REPLY_PREFIX.length));
    };
    tryResume();
    window.addEventListener(DRAFT_RESUME_EVENT, tryResume);
    return () => window.removeEventListener(DRAFT_RESUME_EVENT, tryResume);
  }, []);
}

/**
 * Brouillon d'une MODIFICATION pas enregistrée d'un élément existant (2026-10-19, demande de Nadia).
 * Même fonctionnement que la création : « vide » veut dire « identique à l'original ».
 * Clé `<clé du formulaire>__edit_<id>` (voir editDraftKey) : la définition est reprise de la clé du formulaire.
 */
export function useEditDraft<T>(base: string, itemId: string | number | null | undefined, opts: {
  active: boolean; value: T; original: T | null; restore: (v: T) => void;
}): CreationDraft {
  const key = itemId != null ? editDraftKey(base, itemId) : null;
  const original = JSON.stringify(opts.original);
  return useCreationDraft(key, {
    active: opts.active && key !== null,
    value: opts.value,
    isEmpty: (v) => JSON.stringify(v) === original,
    restore: opts.restore,
  });
}

/** « Continuer » une modification depuis « Mes brouillons » : rouvre la fiche de l'élément, le brouillon revient tout seul. */
export function useEditDraftResume<I extends { id: string | number }>(base: string | null, items: I[] | undefined, openEdit: (item: I) => void) {
  const pending = useRef<string | null>(null);
  const openRef = useRef(openEdit);
  openRef.current = openEdit;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const tryOpen = () => {
    if (!pending.current) return;
    const item = itemsRef.current?.find((i) => String(i.id) === pending.current);
    if (item) { pending.current = null; openRef.current(item); }
  };
  useEffect(() => {
    if (!base) return;
    const prefix = base + EDIT_MARK;
    const take = () => {
      const k = takeDraftResumePrefix(prefix);
      if (k) { pending.current = k.slice(prefix.length); tryOpen(); }
    };
    take();
    window.addEventListener(DRAFT_RESUME_EVENT, take);
    return () => window.removeEventListener(DRAFT_RESUME_EVENT, take);
  }, [base]);
  useEffect(() => { tryOpen(); }, [items]);
}
