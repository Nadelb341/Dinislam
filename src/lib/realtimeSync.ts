/**
 * 🔄 « Tout changement visible EN DIRECT » (règle de Nadia, 2026-10-25).
 *
 * Tables écoutées par le composant unique `RealtimeSync` (monté une seule fois dans App.tsx).
 * Pour chaque table : les débuts de queryKey react-query à rafraîchir quand elle change.
 * Les écrans qui chargent sans react-query (useState/useEffect) écoutent l'événement navigateur
 * `dinislam:realtime` via `useRealtimeRefresh` (src/hooks/useRealtimeRefresh.ts).
 *
 * ⚠️ Toute table ajoutée ici doit aussi être dans la publication `supabase_realtime`
 * (migration 20261025180000_realtime_all_content.sql) et avoir une policy SELECT (RLS).
 * ⚠️ Volontairement absentes : app_logs, crash_alert_settings, push_subscriptions, student_passwords
 * (sensible), user_roles, encouragement_logs, dropout_state, notification_confirmations,
 * notification_invitations, admin_conversations (historique privé de l'assistant 🌙, enregistré à chaque message).
 * Les 21 tables déjà en direct gardent leurs propres abonnements (non listées ici).
 */
export const REALTIME_EVENT = 'dinislam:realtime';

export interface RealtimeEventDetail {
  table: string;
}

// Progression des élèves : utilisée aussi par le chemin de la semaine 💎 et le suivi d'engagement
const PROGRESS_VIEWS = ['weekly-program', 'weekly-program-admin', 'student-engagement'];

export const REALTIME_TABLE_QUERY_KEYS: Record<string, string[]> = {
  coran_progress: ['coran-progress', 'coran-admin-progress'],
  devoir_checks: ['weekly-program', 'weekly-program-admin', 'student-engagement', 'admin-devoirs', 'cahier-classe'],
  devoir_steps: ['weekly-program', 'weekly-program-admin', 'admin-devoirs'],
  sourate_stories: ['sourate-stories'],
  admin_card_order: ['admin-card-ordering'],
  admin_task_templates: ['admin-task-templates'],
  admin_tasks: ['admin-tasks', 'cahier-classe'],
  alphabet_admin_unlocks: ['admin-alphabet-grid', 'alphabet-admin-unlocks', 'alphabet-student-summary', 'alphabet-unlock-student', 'fully-unlocked-students'],
  alphabet_content: ['admin-alphabet-contents', 'alphabet-contents-page'],
  alphabet_game_scores: ['alphabet-game-scores', 'alphabet-student-summary'],
  alphabet_letters: ['admin-alphabet-grid', 'admin-alphabet-letters', 'admin-alphabet-submissions', 'admin-dashboard-stats', 'admin-module-progress', 'alphabet-letters-page', 'alphabet-student-summary', 'fully-unlocked-students', 'student-progress', 'student-progress-details', 'user-progress', 'weekly-program', 'weekly-program-admin'],
  alphabet_line_models: ['alphabet-line-models'],
  alphabet_trace_stars: ['alphabet-student-summary', 'alphabet-trace-stars'],
  app_versions: ['app-versions'],
  attendance_sessions: ['attendance-sessions'],
  dashboard_card_visibility: ['card-visibility', 'user-dynamic-cards'],
  dashboard_cards: ['admin-dynamic-cards', 'user-dynamic-cards'],
  // Un devoir donné / modifié / supprimé change aussi les diamants du chemin de la semaine (2026-10-26)
  devoirs: ['admin-devoirs', 'admin-devoirs-rendus', 'admin-homework-badges', 'weekly-program', 'weekly-program-admin', 'student-engagement', 'bilans', 'devoir-en-cours', 'cahier-classe'],
  // Audio envoyé ou corrigé : le diamant suit
  devoirs_rendus: ['weekly-program', 'weekly-program-admin', 'student-engagement', 'admin-devoirs-rendus', 'bilans', 'devoir-en-cours', 'cahier-classe'],
  // 👨‍👩‍👧 Espace parents, absences justifiées, comportement, bilans (2026-10-28)
  parent_links: ['espace-parents', 'admin-parents'],
  absence_justifications: ['absences-justifiees', 'bilan-trimestriel', 'admin-attendance'],
  behavior_marks: ['comportement', 'bilan-trimestriel', 'cahier-classe'],
  bilan_reads: ['bilan-trimestriel'],
  // 🔄 Rotation des devoirs : choix « à rattraper / historique » du professeur (2026-10-27)
  devoir_decisions: ['admin-devoirs', 'weekly-program', 'weekly-program-admin', 'bilans', 'cahier-classe'],
  // 🎒 Prêt pour le cours (élève + colonne ✅ du Tableau de la classe) et 🎯 objectif du jour (2026-10-26)
  course_ready: ['course-ready', 'cahier-classe'],
  daily_goals: ['daily-goals'],
  group_schedules: ['course-ready-info', 'group-course'],
  // 📝 « Ce qu'on a vu » et 🎚️ niveaux d'un groupe (2026-10-26)
  group_sessions: ['cahier-classe'],
  group_levels: ['cahier-classe'],
  homework_submissions: ['my-homework-submissions'],
  invocation_content: ['admin-invocation-contents', 'admin-invocation-contents-full', 'invocation-contents-all'],
  invocations: ['admin-dashboard-stats', 'admin-invocation-validations', 'admin-invocations-full', 'admin-invocations-list', 'admin-module-progress', 'admin-stats', 'fully-unlocked-students', 'invocations-list', 'student-progress', 'student-progress-details', 'user-progress', 'weekly-program', 'weekly-program-admin'],
  module_card_content: ['admin-module-card-contents', 'coran-extra-contents', 'coran-pdf-content', 'generic-module-contents', 'grammaire-card-contents', 'module-card-contents'],
  module_cards: ['admin-module-cards', 'coran-extra-card', 'coran-pdf-card', 'generic-module-cards', 'grammaire-cards', 'module-cards'],
  module_content: ['module-content'],
  module_flashcards: ['admin-flashcards', 'flashcards', 'grammaire-flashcard-counts'],
  // 👁️ Visites des cartes (« Vu par N élèves cette semaine », 2026-10-27)
  module_visits: ['module-visits'],
  module_visibility: ['module-visibility', 'weekly-program', 'weekly-program-admin'],
  notification_preferences: ['admin-push-stats'],
  nourania_lesson_content: ['admin-nourania-contents', 'nourania-lesson-contents'],
  nourania_lessons: ['admin-dashboard-stats', 'admin-module-progress', 'admin-nourania-lessons', 'admin-nourania-validations', 'admin-stats', 'fully-unlocked-students', 'nourania-lessons', 'student-progress', 'student-progress-details', 'user-progress', 'weekly-program', 'weekly-program-admin'],
  parent_lock_settings: [],
  point_settings: ['alphabet-point-settings'],
  prayer_card_content: ['prayer-card-content'],
  prayer_cards: ['prayer-cards', 'weekly-program', 'weekly-program-admin'],
  prayer_categories: ['admin-dashboard-stats', 'admin-module-progress', 'admin-prayer-categories', 'admin-stats', 'student-progress', 'student-progress-details'],
  quiz_responses: ['admin-global-stats', 'admin-quiz-global-stats', 'admin-quiz-student-detail', 'admin-ramadan-student-detail', 'ramadan-quiz-responses'],
  ramadan_day_activities: ['admin-ramadan-activities', 'ramadan-day-activities'],
  ramadan_day_exceptions: ['admin-ramadan-day-exceptions', 'ramadan-day-exceptions'],
  ramadan_day_videos: ['admin-ramadan-day-videos', 'ramadan-day-videos'],
  ramadan_days: ['admin-dashboard-stats', 'admin-global-stats', 'admin-module-progress', 'admin-quiz-tracking-days', 'admin-ramadan-days', 'admin-ramadan-days-manager', 'admin-ramadan-student-detail', 'admin-stats', 'ramadan-days', 'student-progress', 'student-progress-details', 'user-progress'],
  ramadan_quizzes: ['admin-global-stats', 'admin-quiz-student-detail', 'admin-ramadan-quizzes', 'admin-ramadan-student-detail', 'ramadan-quizzes'],
  ramadan_settings: ['ramadan-settings'],
  scheduled_notifications: ['scheduled-notifications'],
  school_holidays: ['school-holidays', 'bilans', 'course-ready-info', 'group-course'],
  // 📊 Bilan trimestriel des élèves (note, appréciation, guide, envoi aux parents)
  student_reports: ['bilans', 'bilan-trimestriel'],
  sourate_admin_unlocks: ['admin-sourate-unlocks'],
  sourate_versets_audio: [],
  sourates: ['admin-dashboard-stats', 'admin-module-progress', 'admin-recitations', 'admin-sourate-validations', 'admin-sourates', 'admin-sourates-list', 'admin-stats', 'fully-unlocked-students', 'student-progress', 'student-progress-details', 'user-progress', 'weekly-program', 'weekly-program-admin'],
  student_group_members: ['course-ready-info', 'attendance-group-members', 'attendance-groups-overview', 'my-group-ids', 'student-groups', 'weekly-program', 'weekly-program-admin'],
  student_groups: ['admin-devoirs', 'admin-student-groups', 'admin-todo-groups', 'attendance-group-members', 'attendance-groups-overview', 'student-groups', 'student-groups-messaging', 'weekly-program-admin'],
  trash_items: [],
  user_allah_name_progress: ['admin-recitations', 'allah-name-progress', 'fully-unlocked-students', 'bilans', ...PROGRESS_VIEWS],
  user_alphabet_progress: ['admin-alphabet-grid', 'admin-module-progress', 'alphabet-student-summary', 'alphabet-unlock-student', 'student-progress', 'student-progress-details', 'user-alphabet-progress-page', 'user-progress', ...PROGRESS_VIEWS],
  user_daily_prayers: ['user-daily-prayers', 'user-progress'],
  user_flashcard_learned: ['flashcard-learned'],
  user_nourania_progress: ['admin-module-progress', 'admin-stats', 'fully-unlocked-students', 'nourania-progress', 'student-progress', 'student-progress-details', 'student-validated-details', 'user-progress', 'bilans', ...PROGRESS_VIEWS],
  user_prayer_progress: ['admin-module-progress', 'admin-stats', 'student-progress', 'student-progress-details', ...PROGRESS_VIEWS],
  user_ramadan_fasting: ['ramadan-fasting'],
  user_ramadan_progress: ['admin-global-stats', 'admin-module-progress', 'admin-quiz-student-progress', 'admin-ramadan-student-detail', 'admin-stats', 'ramadan-progress', 'student-progress', 'student-progress-details', 'user-progress'],
  user_ramadan_video_watched: ['ramadan-video-watched'],
  user_sourate_verse_progress: [],
  weekly_program_settings: ['weekly-program', 'weekly-program-admin'],
  weekly_programs: ['weekly-program', 'weekly-program-admin', 'student-engagement', 'cahier-classe'],
};

export const REALTIME_TABLES = Object.keys(REALTIME_TABLE_QUERY_KEYS);

/** Délai de regroupement : un réordonnancement de 50 lignes = un seul rechargement */
export const REALTIME_DEBOUNCE_MS = 400;
