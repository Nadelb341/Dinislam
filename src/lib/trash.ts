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
  | "sourate_verset_audio" | "attendance_day" | "registration" | "draft" | "sourate_recitation" | "alphabet_letter_audio" | "admin_task" | "alphabet_line_model" | "admin_task_template" | "school_holiday";

export interface TrashItem {
  id: string;
  user_id: string;
  item_type: string;
  item_data: Json;
  original_id: string;
  label: string;
  deleted_at: string;
}

const TABLE_BY_TYPE: Record<Exclude<TrashItemType, "draft" | "alphabet_letter_audio" | "alphabet_line_model">, string> = {
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
};

export async function moveToTrash(userId: string, type: TrashItemType, originalId: string, label: string, data: unknown) {
  const { error } = await supabase
    .from("trash_items")
    .insert({ user_id: userId, item_type: type, original_id: originalId, label, item_data: data as Json });
  return !error;
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
  const table = TABLE_BY_TYPE[item.item_type as Exclude<TrashItemType, "draft" | "alphabet_letter_audio" | "alphabet_line_model">];
  if (!table) return false;
  const { error } = await untypedDb.from(table).insert(item.item_data);
  if (error) return false;
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
