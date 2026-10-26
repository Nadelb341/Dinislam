import { supabase } from "@/integrations/supabase/client";
import { saveDraft } from "@/hooks/useDraftRecovery";
import { untypedDb } from "@/lib/untypedDb";
import type { Json } from '@/integrations/supabase/types';

export type TrashItemType =
  | "learning_module" | "module_content" | "prayer_card_content" | "sourate_content" | "alphabet_content"
  | "allah_name" | "allah_name_media" | "invocation" | "invocation_content" | "devoir"
  | "nourania_lesson_content" | "ramadan_day_video" | "ramadan_quiz" | "ramadan_day_activity"
  | "module_card" | "flashcard" | "dashboard_card" | "admin_conversation"
  | "student_group" | "scheduled_notification"
  | "sourate_verset_audio" | "attendance_day" | "registration" | "draft" | "sourate_recitation" | "alphabet_letter_audio" | "admin_task" | "alphabet_line_model" | "admin_task_template" | "school_holiday" | "sourate_admin_unlock" | "coran_progress" | "sourate_story" | "admin_task_attachment" | "coran_note" | "group_level";

export interface TrashItem {
  id: string;
  user_id: string;
  item_type: string;
  item_data: Json;
  original_id: string;
  label: string;
  deleted_at: string;
}

const TABLE_BY_TYPE: Record<Exclude<TrashItemType, "draft" | "alphabet_letter_audio" | "alphabet_line_model" | "admin_task_attachment" | "coran_note">, string> = {
  learning_module: "learning_modules",
  module_content: "module_card_content",
  prayer_card_content: "prayer_card_content",
  sourate_content: "sourate_content",
  alphabet_content: "alphabet_content",
  allah_name: "allah_names",
  allah_name_media: "allah_name_media",
  invocation: "invocations",
  invocation_content: "invocation_content",
  devoir: "devoirs",
  nourania_lesson_content: "nourania_lesson_content",
  ramadan_day_video: "ramadan_day_videos",
  ramadan_quiz: "ramadan_quizzes",
  ramadan_day_activity: "ramadan_day_activities",
  module_card: "module_cards",
  flashcard: "module_flashcards",
  dashboard_card: "dashboard_cards",
  admin_conversation: "admin_conversations",
  student_group: "student_groups",
  scheduled_notification: "scheduled_notifications",
  sourate_verset_audio: "sourate_versets_audio",
  attendance_day: "attendance_records",
  registration: "profiles",
  sourate_recitation: "sourate_recitations",
  admin_task: "admin_tasks",
  admin_task_template: "admin_task_templates",
  school_holiday: "school_holidays",
  sourate_admin_unlock: "sourate_admin_unlocks",
  coran_progress: "coran_progress",
  sourate_story: "sourate_stories",
  group_level: "group_levels",
};

export async function moveToTrash(userId: string, type: TrashItemType, originalId: string, label: string, data: unknown) {
  const { error } = await supabase
    .from("trash_items")
    .insert({ user_id: userId, item_type: type, original_id: originalId, label, item_data: data as Json });
  return !error;
}

/** Éléments liés qui disparaîtraient avec l'élément (suppression en cascade) : gardés avec lui dans la corbeille. */
export type TrashChildren = { table: string; rows: Record<string, unknown>[]; relink?: string }[];

/** Lit les lignes liées d'une table (ex. réponses d'un quiz) pour les garder dans la corbeille. */
export async function collectChildren(table: string, column: string, ids: string[], relink?: boolean): Promise<TrashChildren[number]> {
  if (!ids.length) return { table, rows: [] };
  const { data, error } = await untypedDb.from(table).select("*").in(column, ids);
  if (error) throw new Error("Lecture des éléments liés impossible : rien n'a été supprimé");
  return { table, rows: (data || []) as Record<string, unknown>[], ...(relink ? { relink: column } : {}) };
}

/**
 * Règle « ne jamais rien perdre » (2026-10-19) : la copie dans la corbeille est faite AVANT la suppression.
 * Copie impossible → rien n'est supprimé. Suppression impossible → la copie est retirée (pas de doublon).
 */
export async function trashThenDelete(opts: {
  userId: string; type: TrashItemType; id: string; label: string; data: unknown;
  children?: TrashChildren;
  remove: () => PromiseLike<{ error: unknown }>;
}) {
  const children = (opts.children || []).filter((c) => c.rows.length);
  const payload = children.length ? { ...(opts.data as object), __children: children } : opts.data;
  const { data: saved, error } = await supabase.from("trash_items")
    .insert({ user_id: opts.userId, item_type: opts.type, original_id: opts.id, label: opts.label, item_data: payload as Json })
    .select("id").single();
  if (error || !saved) throw new Error("Mise en corbeille impossible : rien n'a été supprimé");
  const { error: delErr } = await opts.remove();
  if (delErr) {
    await supabase.from("trash_items").delete().eq("id", saved.id);
    throw delErr instanceof Error ? delErr : new Error("Suppression impossible");
  }
}

export async function fetchTrash(userId: string): Promise<TrashItem[]> {
  const { data } = await supabase
    .from("trash_items")
    .select("*")
    .eq("user_id", userId)
    .order("deleted_at", { ascending: false });
  return (data as unknown as TrashItem[]) || [];
}

export async function restoreTrashItem(item: TrashItem): Promise<boolean> {
  // Brouillon : on le remet sur l'appareil, il sera reproposé à la prochaine ouverture de l'appli
  if (item.item_type === "draft") {
    const d = item.item_data as { key?: string; data?: unknown } | null;
    if (!d?.key) return false;
    saveDraft(d.key, d.data);
    await supabase.from("trash_items").delete().eq("id", item.id);
    return true;
  }
  // Audio d'une lettre remplacé : on remet l'ancien, et celui en place part à son tour dans la corbeille
  if (item.item_type === "alphabet_letter_audio") {
    const d = item.item_data as { letter_id?: number; field?: "audio_url" | "audio_vowels_url"; audio_url?: string } | null;
    if (!d?.letter_id || !d.audio_url) return false;
    const field = d.field === "audio_vowels_url" ? "audio_vowels_url" : "audio_url";
    const { data: letter } = await supabase.from("alphabet_letters").select("*").eq("id", d.letter_id).maybeSingle();
    if (!letter) return false;
    const current = letter[field];
    if (current && current !== d.audio_url) {
      const ok = await moveToTrash(item.user_id, "alphabet_letter_audio", String(d.letter_id), item.label, { ...d, audio_url: current });
      if (!ok) return false;
    }
    const { error } = await supabase.from("alphabet_letters").update({ [field]: d.audio_url }).eq("id", d.letter_id);
    if (error) return false;
    await supabase.from("trash_items").delete().eq("id", item.id);
    return true;
  }
  // Modèle audio d'une ligne remplacé : on remet l'ancien, celui en place part à son tour dans la corbeille
  if (item.item_type === "alphabet_line_model") {
    const d = item.item_data as { letter_id?: number; line_key?: string; audio_url?: string } | null;
    if (!d?.letter_id || !d.line_key || !d.audio_url) return false;
    const { data: current } = await supabase.from("alphabet_line_models").select("audio_url")
      .eq("letter_id", d.letter_id).eq("line_key", d.line_key).maybeSingle();
    if (current?.audio_url && current.audio_url !== d.audio_url) {
      const ok = await moveToTrash(item.user_id, "alphabet_line_model", item.original_id, item.label, { ...d, audio_url: current.audio_url });
      if (!ok) return false;
    }
    const { error } = await supabase.from("alphabet_line_models")
      .upsert({ letter_id: d.letter_id, line_key: d.line_key, audio_url: d.audio_url, updated_at: new Date().toISOString() }, { onConflict: "letter_id,line_key" });
    if (error) return false;
    await supabase.from("trash_items").delete().eq("id", item.id);
    return true;
  }
  // Note d'un marque-page du Coran : remise sur son marque-page (recréé en « À apprendre » s'il a été retiré)
  if (item.item_type === "coran_note") {
    const d = item.item_data as { index?: number; note?: { id: string; text: string; date: string } } | null;
    if (!d?.index || !d.note) return false;
    const { data: row } = await supabase.from("coran_progress").select("data").eq("user_id", item.user_id).eq("kind", "lecture").eq("key", "main").maybeSingle();
    const lecture = ((row?.data as { index?: number; bookmarks?: { index: number; color: string; label: string; notes?: { id: string }[] }[] } | null) || { index: 1, bookmarks: [] });
    const bms = lecture.bookmarks || [];
    const found = bms.find((b) => b.index === d.index);
    const next = found
      ? bms.map((b) => (b.index === d.index ? { ...b, notes: [...(b.notes || []).filter((n) => n.id !== d.note!.id), d.note!] } : b))
      : [...bms, { index: d.index, color: "or", label: "À apprendre", notes: [d.note] }];
    const { error } = await supabase.from("coran_progress")
      .upsert({ user_id: item.user_id, kind: "lecture", key: "main", data: { ...lecture, bookmarks: next } as unknown as Json, updated_at: new Date().toISOString() }, { onConflict: "user_id,kind,key" });
    if (error) return false;
    await supabase.from("trash_items").delete().eq("id", item.id);
    return true;
  }
  // Fichier retiré d'une ligne « À FAIRE » : on le remet sur sa ligne (le fichier est resté dans le stockage)
  if (item.item_type === "admin_task_attachment") {
    const d = item.item_data as { task_id?: string; attachment?: { path: string; name: string; type: string } } | null;
    if (!d?.task_id || !d.attachment) return false;
    const { data: task } = await supabase.from("admin_tasks").select("attachments").eq("id", d.task_id).maybeSingle();
    if (!task) return false;
    const list = Array.isArray(task.attachments) ? (task.attachments as { path: string }[]) : [];
    if (!list.some((a) => a.path === d.attachment!.path)) {
      const { error } = await supabase.from("admin_tasks").update({ attachments: [...list, d.attachment] as unknown as Json }).eq("id", d.task_id);
      if (error) return false;
    }
    await supabase.from("trash_items").delete().eq("id", item.id);
    return true;
  }
  // Séance de présence : on recrée la date (même sans aucune présence notée) puis les présences
  if (item.item_type === "attendance_day") {
    const rows = Array.isArray(item.item_data) ? item.item_data : [];
    const { error: sErr } = await supabase.from("attendance_sessions").upsert({ date: item.original_id }, { onConflict: "date", ignoreDuplicates: true });
    if (sErr) return false;
    if (rows.length) {
      const { error } = await untypedDb.from("attendance_records").insert(rows);
      if (error) return false;
    }
    await supabase.from("trash_items").delete().eq("id", item.id);
    return true;
  }
  const table = TABLE_BY_TYPE[item.item_type as Exclude<TrashItemType, "draft" | "alphabet_letter_audio" | "alphabet_line_model" | "admin_task_attachment" | "coran_note">];
  if (!table) return false;
  const { __children, ...row } = (item.item_data || {}) as { __children?: TrashChildren } & Record<string, unknown>;
  const { error } = await untypedDb.from(table).insert(__children ? row : item.item_data);
  if (error) return false;
  // Éléments liés gardés avec lui (réponses, membres, flashcards...) : remis dans l'ordre où ils ont été copiés
  for (const c of __children || []) {
    if (c.relink) {
      const ids = c.rows.map((r) => r.id).filter(Boolean);
      if (ids.length) await untypedDb.from(c.table).update({ [c.relink]: item.original_id }).in("id", ids);
    } else if (c.rows.length) {
      await untypedDb.from(c.table).upsert(c.rows, { ignoreDuplicates: true });
    }
  }
  await supabase.from("trash_items").delete().eq("id", item.id);
  return true;
}

/** Élèves : un élément reste 2 mois dans la corbeille, puis il est vidé automatiquement (fonction trash-maintenance). */
export const STUDENT_TRASH_DAYS = 61;

/** Fichier audio d'une récitation mise à la corbeille (gardé pour pouvoir la restaurer) */
function recitationFilePath(item: TrashItem): string | null {
  if (item.item_type !== "sourate_recitation") return null;
  const url: string = (item.item_data as { audio_url?: string } | null)?.audio_url || "";
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/recitations\/(.+?)(?:\?|$)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function removeFiles(items: TrashItem[]) {
  const paths = items.map(recitationFilePath).filter((p): p is string => !!p);
  if (paths.length) await supabase.storage.from("recitations").remove(paths);
}

export async function permanentlyDeleteTrashItem(id: string) {
  const { data } = await supabase.from("trash_items").select("*").eq("id", id).maybeSingle();
  if (data) await removeFiles([data as unknown as TrashItem]);
  await supabase.from("trash_items").delete().eq("id", id);
}

export async function emptyTrash(userId: string) {
  await removeFiles(await fetchTrash(userId));
  await supabase.from("trash_items").delete().eq("user_id", userId);
}
