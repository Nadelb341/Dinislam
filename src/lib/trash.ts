import { supabase } from "@/integrations/supabase/client";

export type TrashItemType =
  | "learning_module" | "module_content" | "prayer_card_content" | "sourate_content" | "alphabet_content"
  | "allah_name" | "allah_name_media" | "invocation" | "invocation_content" | "devoir"
  | "nourania_lesson_content" | "ramadan_day_video" | "ramadan_quiz" | "ramadan_day_activity"
  | "module_card" | "flashcard" | "dashboard_card" | "admin_conversation"
  | "student_group" | "scheduled_notification";

export interface TrashItem {
  id: string;
  user_id: string;
  item_type: string;
  item_data: any;
  original_id: string;
  label: string;
  deleted_at: string;
}

const TABLE_BY_TYPE: Record<TrashItemType, string> = {
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
};

export async function moveToTrash(userId: string, type: TrashItemType, originalId: string, label: string, data: any) {
  const { error } = await supabase
    .from("trash_items" as any)
    .insert({ user_id: userId, item_type: type, original_id: originalId, label, item_data: data } as any);
  return !error;
}

export async function fetchTrash(userId: string): Promise<TrashItem[]> {
  const { data } = await supabase
    .from("trash_items" as any)
    .select("*")
    .eq("user_id", userId)
    .order("deleted_at", { ascending: false });
  return (data as unknown as TrashItem[]) || [];
}

export async function restoreTrashItem(item: TrashItem): Promise<boolean> {
  const table = TABLE_BY_TYPE[item.item_type as TrashItemType];
  if (!table) return false;
  const { error } = await supabase.from(table as any).insert(item.item_data as any);
  if (error) return false;
  await supabase.from("trash_items" as any).delete().eq("id", item.id);
  return true;
}

export async function permanentlyDeleteTrashItem(id: string) {
  await supabase.from("trash_items" as any).delete().eq("id", id);
}

export async function emptyTrash(userId: string) {
  await supabase.from("trash_items" as any).delete().eq("user_id", userId);
}
