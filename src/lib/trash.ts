import { supabase } from "@/integrations/supabase/client";
import { saveDraft } from "@/hooks/useDraftRecovery";
import { untypedDb } from "@/lib/untypedDb";

export type TrashItemType =
  | "learning_module" | "module_content" | "prayer_card_content" | "sourate_content" | "alphabet_content"
  | "allah_name" | "allah_name_media" | "invocation" | "invocation_content" | "devoir"
  | "nourania_lesson_content" | "ramadan_day_video" | "ramadan_quiz" | "ramadan_day_activity"
  | "module_card" | "flashcard" | "dashboard_card" | "admin_conversation"
  | "student_group" | "scheduled_notification"
  | "sourate_verset_audio" | "attendance_day" | "registration" | "draft" | "sourate_recitation";

export interface TrashItem {
  id: string;
  user_id: string;
  item_type: string;
  item_data: any;
  original_id: string;
  label: string;
  deleted_at: string;
}

const TABLE_BY_TYPE: Record<Exclude<TrashItemType, "draft">, string> = {
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
};

export async function moveToTrash(userId: string, type: TrashItemType, originalId: string, label: string, data: any) {
  const { error } = await supabase
    .from("trash_items")
    .insert({ user_id: userId, item_type: type, original_id: originalId, label, item_data: data });
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
  const table = TABLE_BY_TYPE[item.item_type as Exclude<TrashItemType, "draft">];
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
  const url: string = item.item_data?.audio_url || "";
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
