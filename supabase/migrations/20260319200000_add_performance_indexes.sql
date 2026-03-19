-- Performance indexes for frequently queried tables
-- User progression tables
CREATE INDEX IF NOT EXISTS idx_user_sourate_progress_user_id ON user_sourate_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invocation_progress_user_id ON user_invocation_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nourania_progress_user_id ON user_nourania_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alphabet_progress_user_id ON user_alphabet_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prayer_progress_user_id ON user_prayer_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ramadan_progress_user_id ON user_ramadan_progress(user_id);

-- Daily tracking (composite indexes)
CREATE INDEX IF NOT EXISTS idx_user_daily_prayers_user_date ON user_daily_prayers(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_ramadan_fasting_user_date ON user_ramadan_fasting(user_id, date);

-- Homework
CREATE INDEX IF NOT EXISTS idx_devoirs_rendus_user_id ON devoirs_rendus(user_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_user_id ON homework_submissions(user_id);

-- Validation requests
CREATE INDEX IF NOT EXISTS idx_sourate_validation_user_status ON sourate_validation_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_nourania_validation_user_status ON nourania_validation_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invocation_validation_user_status ON invocation_validation_requests(user_id, status);

-- Audit / logs
CREATE INDEX IF NOT EXISTS idx_notification_history_created ON notification_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connexion_logs_created ON connexion_logs(created_at DESC);

-- Push subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active ON push_subscriptions(user_id, is_active);

-- Leaderboard
CREATE INDEX IF NOT EXISTS idx_student_ranking_points ON student_ranking(total_points DESC);

-- Profile approval
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON profiles(is_approved);

-- Messages
CREATE INDEX IF NOT EXISTS idx_user_messages_user_read ON user_messages(user_id, is_read);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date ON attendance_records(user_id, date);

-- App logs
CREATE INDEX IF NOT EXISTS idx_app_logs_level_read ON app_logs(level, is_read);
