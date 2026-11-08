-- Photo de la STRUCTURE de la base Dinislam (zgnxqhfcmdonvdxqpekl), prise le 2026-11-08.
-- AUCUNE donnée d'élève ici. Lecture seule. Sert de repère si la base doit être reconstruite.
-- ⚠️ NE JAMAIS lancer « supabase db push » (160 migrations jamais enregistrées côté base).

-- ===== TABLES ET COLONNES =====

-- table absence_justifications
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   student_id uuid NOT NULL
--   course_date date NOT NULL
--   reason text
--   declared_by uuid
--   declared_label text
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table admin_card_order
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   card_order jsonb DEFAULT '[]'::jsonb
--   created_at timestamp with time zone DEFAULT now()
--   updated_at timestamp with time zone DEFAULT now()
--   card_key text
--   display_order integer DEFAULT 0

-- table admin_conversations
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   admin_id uuid
--   last_message text
--   last_message_at timestamp with time zone DEFAULT now()
--   unread_count integer DEFAULT 0
--   created_at timestamp with time zone DEFAULT now()
--   topic text DEFAULT 'Nouvelle conversation'::text
--   updated_at timestamp with time zone DEFAULT now()
--   messages jsonb DEFAULT '[]'::jsonb

-- table admin_task_templates
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   title text NOT NULL
--   next_course boolean NOT NULL DEFAULT true
--   to_bring boolean NOT NULL DEFAULT false
--   created_by uuid DEFAULT auth.uid()
--   created_at timestamp with time zone NOT NULL DEFAULT now()
--   to_prepare boolean NOT NULL DEFAULT false

-- table admin_tasks
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   group_id uuid
--   title text NOT NULL
--   done boolean NOT NULL DEFAULT false
--   done_at timestamp with time zone
--   due_date date
--   remind_at timestamp with time zone
--   reminded_at timestamp with time zone
--   student_id uuid
--   recurrence text
--   urgent boolean NOT NULL DEFAULT false
--   position integer NOT NULL DEFAULT 0
--   created_by uuid DEFAULT auth.uid()
--   created_at timestamp with time zone NOT NULL DEFAULT now()
--   updated_at timestamp with time zone NOT NULL DEFAULT now()
--   next_course boolean NOT NULL DEFAULT false
--   to_bring boolean NOT NULL DEFAULT false
--   carried integer NOT NULL DEFAULT 0
--   to_prepare boolean NOT NULL DEFAULT false
--   attachments jsonb NOT NULL DEFAULT '[]'::jsonb

-- table allah_name_media
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   name_id integer NOT NULL
--   media_type text NOT NULL
--   file_url text NOT NULL
--   file_name text
--   display_order integer NOT NULL DEFAULT 0
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table allah_names
--   id integer NOT NULL DEFAULT nextval('allah_names_id_seq'::regclass)
--   name_arabic text NOT NULL
--   name_french text NOT NULL
--   transliteration text
--   explanation text
--   display_order integer DEFAULT 0
--   image_url text
--   audio_url text
--   created_at timestamp with time zone DEFAULT now()

-- table alphabet_admin_unlocks
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   letter_id integer NOT NULL
--   created_by uuid
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table alphabet_content
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   letter_id integer NOT NULL
--   content_type text NOT NULL DEFAULT 'video'::text
--   file_url text NOT NULL
--   file_name text
--   display_order integer DEFAULT 0
--   uploaded_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table alphabet_game_scores
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   game text NOT NULL
--   score integer NOT NULL
--   total integer NOT NULL
--   missed ARRAY NOT NULL DEFAULT '{}'::integer[]
--   played_on date NOT NULL DEFAULT ((now() AT TIME ZONE 'Europe/Paris'::text))::date
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table alphabet_letters
--   id integer NOT NULL DEFAULT nextval('alphabet_letters_id_seq'::regclass)
--   letter_arabic text NOT NULL
--   name_arabic text NOT NULL
--   name_french text NOT NULL
--   display_order integer DEFAULT 0
--   audio_url text
--   created_at timestamp with time zone DEFAULT now()
--   position_isolated text
--   position_initial text
--   position_medial text
--   position_final text
--   audio_vowels_url text

-- table alphabet_line_models
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   letter_id integer NOT NULL
--   line_key text NOT NULL
--   audio_url text NOT NULL
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table alphabet_submissions
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   student_id uuid NOT NULL
--   letter_id integer NOT NULL
--   kind text NOT NULL
--   line_key text
--   audio_url text
--   status text NOT NULL DEFAULT 'pending'::text
--   admin_comment text
--   admin_audio_url text
--   created_at timestamp with time zone NOT NULL DEFAULT now()
--   reviewed_at timestamp with time zone

-- table alphabet_trace_stars
--   user_id uuid NOT NULL
--   letter_id integer NOT NULL
--   form smallint NOT NULL
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table app_appearance
--   key text NOT NULL
--   value jsonb NOT NULL DEFAULT '{}'::jsonb
--   updated_at timestamp with time zone NOT NULL DEFAULT now()
--   updated_by uuid

-- table app_logs
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid
--   action text NOT NULL
--   details jsonb
--   level text DEFAULT 'info'::text
--   created_at timestamp with time zone DEFAULT now()
--   is_read boolean DEFAULT false
--   resolved_at timestamp with time zone

-- table app_versions
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   version_number text NOT NULL
--   label text NOT NULL
--   description text
--   is_current boolean DEFAULT false
--   snapshot jsonb
--   created_at timestamp with time zone DEFAULT now()

-- table attendance_records
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   date date NOT NULL DEFAULT CURRENT_DATE
--   status text NOT NULL DEFAULT 'present'::text
--   marked_by uuid
--   notes text
--   created_at timestamp with time zone DEFAULT now()
--   send_message boolean NOT NULL DEFAULT true
--   message_seen_at timestamp with time zone
--   absence_alert_sent_at timestamp with time zone

-- table attendance_sessions
--   date date NOT NULL
--   created_by uuid
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table auto_reminder_logs
--   kind text NOT NULL
--   sent_on date NOT NULL
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table behavior_marks
--   student_id uuid NOT NULL
--   course_date date NOT NULL
--   kind text NOT NULL
--   marked_by uuid
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table bilan_envois
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   report_id uuid NOT NULL
--   student_id uuid NOT NULL
--   destinataire text NOT NULL
--   canal text NOT NULL
--   sent_at timestamp with time zone NOT NULL DEFAULT now()
--   sent_by uuid

-- table bilan_reads
--   report_id uuid NOT NULL
--   label text NOT NULL
--   read_at timestamp with time zone NOT NULL DEFAULT now()

-- table connexion_logs
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   login_at timestamp with time zone DEFAULT now()
--   ip_address text
--   user_agent text
--   created_at timestamp with time zone DEFAULT now()

-- table coran_progress
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   kind text NOT NULL
--   key text NOT NULL
--   data jsonb NOT NULL DEFAULT '{}'::jsonb
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table coran_reminder_logs
--   user_id uuid NOT NULL
--   sent_on date NOT NULL

-- table course_ready
--   student_id uuid NOT NULL
--   course_date date NOT NULL
--   ready_at timestamp with time zone NOT NULL DEFAULT now()

-- table crash_alert_settings
--   id integer NOT NULL DEFAULT 1
--   interval_hours integer NOT NULL DEFAULT 1
--   until_at timestamp with time zone
--   last_sent_at timestamp with time zone
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table daily_goals
--   student_id uuid NOT NULL
--   day date NOT NULL
--   label text
--   done_at timestamp with time zone NOT NULL DEFAULT now()

-- table dashboard_card_visibility
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   card_id uuid NOT NULL
--   user_id uuid NOT NULL
--   is_visible boolean DEFAULT true
--   updated_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table dashboard_cards
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   card_key text
--   title text NOT NULL
--   description text
--   icon text
--   route text
--   display_order integer DEFAULT 0
--   is_active boolean DEFAULT true
--   created_at timestamp with time zone DEFAULT now()
--   bg_color text
--   content_type text DEFAULT 'text'::text
--   content text
--   file_url text
--   file_name text
--   is_public boolean DEFAULT true
--   created_by uuid

-- table devoir_checks
--   devoir_id uuid NOT NULL
--   student_id uuid NOT NULL
--   checked_at timestamp with time zone NOT NULL DEFAULT now()

-- table devoir_decisions
--   devoir_id uuid NOT NULL
--   student_id uuid NOT NULL
--   decision text NOT NULL
--   decided_at timestamp with time zone NOT NULL DEFAULT now()
--   decided_by uuid

-- table devoir_modeles
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   titre text NOT NULL
--   type text NOT NULL
--   matiere_label text
--   matiere_emoji text
--   ligne_key text
--   pieces_jointes jsonb NOT NULL DEFAULT '[]'::jsonb
--   consigne_audio_url text
--   cible_id text
--   audio_requis boolean NOT NULL DEFAULT false
--   created_by uuid
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table devoir_steps
--   devoir_id uuid NOT NULL
--   student_id uuid NOT NULL
--   step smallint NOT NULL
--   checked_at timestamp with time zone NOT NULL DEFAULT now()

-- table devoir_vues
--   devoir_id uuid NOT NULL
--   student_id uuid NOT NULL
--   kind text NOT NULL
--   first_at timestamp with time zone NOT NULL DEFAULT now()

-- table devoirs
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   titre text NOT NULL
--   type text NOT NULL
--   description text
--   lien_lecon text
--   fichier_pdf_url text
--   date_limite timestamp with time zone
--   assigned_to text NOT NULL
--   group_id uuid
--   student_id uuid
--   created_by uuid
--   created_at timestamp with time zone DEFAULT now()
--   etapes jsonb NOT NULL DEFAULT '[]'::jsonb
--   cible_module text
--   cible_id text
--   audio_requis boolean NOT NULL DEFAULT false
--   consigne_audio_url text
--   visible_a timestamp with time zone
--   pieces_jointes jsonb NOT NULL DEFAULT '[]'::jsonb
--   matiere_label text
--   matiere_emoji text

-- table devoirs_rendus
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   devoir_id uuid
--   student_id uuid NOT NULL
--   audio_url text
--   statut text DEFAULT 'rendu'::text
--   commentaire_admin text
--   rendu_at timestamp with time zone DEFAULT now()
--   correction_audio_url text
--   a_ete_refait boolean NOT NULL DEFAULT false
--   photos jsonb NOT NULL DEFAULT '[]'::jsonb

-- table dropout_state
--   student_id uuid NOT NULL
--   level text
--   since timestamp with time zone
--   comeback_at timestamp with time zone
--   comeback_seen boolean NOT NULL DEFAULT true
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table encouragement_logs
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   student_id uuid NOT NULL
--   message text NOT NULL
--   automatic boolean NOT NULL DEFAULT false
--   sent_at timestamp with time zone NOT NULL DEFAULT now()

-- table group_devoir_settings
--   group_id uuid NOT NULL
--   max_devoirs integer
--   lignes jsonb NOT NULL DEFAULT '[]'::jsonb
--   updated_at timestamp with time zone NOT NULL DEFAULT now()
--   updated_by uuid

-- table group_levels
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   group_id uuid NOT NULL
--   name text NOT NULL
--   member_ids ARRAY NOT NULL DEFAULT '{}'::uuid[]
--   position integer NOT NULL DEFAULT 0
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table group_schedules
--   group_id uuid NOT NULL
--   weekday smallint NOT NULL
--   start_time time without time zone NOT NULL
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table group_sessions
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   group_id uuid NOT NULL
--   session_date date NOT NULL
--   seen text
--   seen_sent_at timestamp with time zone
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table homework_assignments
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   title text NOT NULL
--   description text
--   due_date date
--   is_active boolean DEFAULT true
--   created_at timestamp with time zone DEFAULT now()
--   user_id uuid
--   subject text
--   status text DEFAULT 'pending'::text
--   lesson_reference text
--   audio_url text
--   created_by uuid
--   completed_at timestamp with time zone

-- table homework_reminder_logs
--   devoir_id uuid NOT NULL
--   student_id uuid NOT NULL
--   last_sent_at timestamp with time zone NOT NULL DEFAULT now()

-- table homework_submissions
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   assignment_id uuid NOT NULL
--   user_id uuid NOT NULL
--   file_url text
--   notes text
--   status text DEFAULT 'submitted'::text
--   grade text
--   feedback text
--   reviewed_by uuid
--   submitted_at timestamp with time zone DEFAULT now()
--   created_at timestamp with time zone DEFAULT now()
--   audio_url text
--   file_name text
--   file_type text

-- table invocation_content
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   invocation_id integer NOT NULL
--   content_type text NOT NULL DEFAULT 'video'::text
--   file_url text NOT NULL
--   file_name text
--   display_order integer DEFAULT 0
--   uploaded_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table invocation_validation_requests
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   invocation_id integer NOT NULL
--   status text DEFAULT 'pending'::text
--   reviewed_at timestamp with time zone
--   reviewed_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table invocations
--   id integer NOT NULL DEFAULT nextval('invocations_id_seq'::regclass)
--   title_arabic text NOT NULL
--   title_french text NOT NULL
--   category text
--   display_order integer DEFAULT 0
--   is_locked boolean DEFAULT true
--   image_url text
--   created_at timestamp with time zone DEFAULT now()
--   content_arabic text
--   content_french text

-- table learning_modules
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   title text NOT NULL
--   description text
--   module_type text NOT NULL
--   icon text
--   display_order integer DEFAULT 0
--   is_active boolean DEFAULT true
--   created_at timestamp with time zone DEFAULT now()
--   image_url text
--   gradient text
--   icon_color text
--   is_builtin boolean DEFAULT false
--   builtin_path text
--   title_arabic text

-- table mascotte_usage
--   user_id uuid NOT NULL
--   jour date NOT NULL
--   questions integer NOT NULL DEFAULT 0

-- table module_card_content
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   card_id uuid NOT NULL
--   content_type text NOT NULL DEFAULT 'video'::text
--   file_url text NOT NULL
--   file_name text
--   display_order integer DEFAULT 0
--   uploaded_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table module_cards
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   module_id uuid NOT NULL
--   title text NOT NULL
--   description text
--   display_order integer DEFAULT 0
--   is_locked boolean DEFAULT false
--   created_at timestamp with time zone DEFAULT now()
--   image_url text
--   section text
--   title_arabic text

-- table module_content
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   module_id uuid NOT NULL
--   content_type text NOT NULL DEFAULT 'video'::text
--   file_url text NOT NULL
--   file_name text
--   display_order integer DEFAULT 0
--   uploaded_by uuid
--   created_at timestamp with time zone DEFAULT now()
--   title text

-- table module_flashcards
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   module_card_id uuid NOT NULL
--   front_text text NOT NULL
--   back_arabic text
--   back_transliteration text
--   display_order integer NOT NULL DEFAULT 0
--   created_at timestamp with time zone DEFAULT now()

-- table module_visibility
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   module_id uuid NOT NULL
--   visibility_type text NOT NULL DEFAULT 'all'::text
--   user_ids ARRAY NOT NULL DEFAULT '{}'::uuid[]
--   group_ids ARRAY NOT NULL DEFAULT '{}'::uuid[]
--   created_at timestamp with time zone DEFAULT now()
--   updated_at timestamp with time zone DEFAULT now()

-- table module_visits
--   user_id uuid NOT NULL
--   module_id uuid NOT NULL
--   day date NOT NULL DEFAULT ((now() AT TIME ZONE 'Europe/Paris'::text))::date
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table notification_confirmations
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   notification_id uuid NOT NULL
--   user_id uuid NOT NULL
--   confirmed_at timestamp with time zone DEFAULT now()
--   created_at timestamp with time zone DEFAULT now()

-- table notification_history
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   title text NOT NULL
--   body text
--   type text DEFAULT 'general'::text
--   sent_by uuid
--   target_user_id uuid
--   target_type text DEFAULT 'all'::text
--   created_at timestamp with time zone DEFAULT now()
--   successful_sends integer
--   total_recipients integer

-- table notification_invitations
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   show_banner boolean DEFAULT true
--   sent_at timestamp with time zone DEFAULT now()

-- table notification_preferences
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   prayer_reminders boolean DEFAULT true
--   ramadan_activities boolean DEFAULT true
--   daily_reminder_time text DEFAULT '08:00'::text
--   fajr_reminder boolean DEFAULT false
--   dhuhr_reminder boolean DEFAULT false
--   asr_reminder boolean DEFAULT false
--   maghrib_reminder boolean DEFAULT false
--   isha_reminder boolean DEFAULT false
--   created_at timestamp with time zone DEFAULT now()
--   updated_at timestamp with time zone DEFAULT now()
--   notif_msg boolean NOT NULL DEFAULT true
--   notif_hw_new boolean NOT NULL DEFAULT true
--   notif_hw_rem boolean NOT NULL DEFAULT true
--   notif_hw_res boolean NOT NULL DEFAULT true
--   notif_rec boolean NOT NULL DEFAULT true
--   notif_lesson boolean NOT NULL DEFAULT true
--   notif_act boolean NOT NULL DEFAULT true
--   notif_sched boolean NOT NULL DEFAULT true
--   notif_adm_msg boolean NOT NULL DEFAULT true
--   notif_adm_hw boolean NOT NULL DEFAULT true
--   notif_adm_valid boolean NOT NULL DEFAULT true
--   notif_adm_reg boolean NOT NULL DEFAULT true
--   quiet_mode boolean NOT NULL DEFAULT false
--   notif_silent boolean NOT NULL DEFAULT false
--   quiet_start smallint NOT NULL DEFAULT 21
--   quiet_end smallint NOT NULL DEFAULT 8
--   notif_adm_task boolean NOT NULL DEFAULT true
--   notif_prog_week boolean NOT NULL DEFAULT true
--   notif_adm_recap boolean NOT NULL DEFAULT true
--   notif_adm_crash boolean NOT NULL DEFAULT true
--   notif_coran boolean DEFAULT true
--   notif_prog_eve boolean DEFAULT true
--   notif_cours_prep boolean DEFAULT true
--   notif_adm_bilan boolean DEFAULT true
--   notif_par_bilan boolean DEFAULT true
--   notif_par_abs boolean DEFAULT true
--   notif_adm_abs boolean DEFAULT true
--   notif_adm_par boolean DEFAULT true

-- table nourania_admin_unlocks
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   student_id uuid NOT NULL
--   lesson_id uuid NOT NULL
--   unlocked_at timestamp with time zone NOT NULL DEFAULT now()
--   unlocked_by uuid

-- table nourania_commentaires_eleves
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   lecon_id uuid
--   student_id uuid NOT NULL
--   commentaire text NOT NULL
--   updated_at timestamp with time zone DEFAULT now()

-- table nourania_lesson_content
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   lesson_id uuid NOT NULL
--   content_type text NOT NULL DEFAULT 'video'::text
--   file_url text NOT NULL
--   file_name text
--   display_order integer DEFAULT 0
--   uploaded_by uuid
--   created_at timestamp with time zone DEFAULT now()
--   target_user_id uuid
--   viewed_at timestamp with time zone
--   lignes jsonb
--   lignes_auto jsonb

-- table nourania_lessons
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   lesson_number integer NOT NULL
--   title_arabic text NOT NULL
--   title_french text NOT NULL
--   description text
--   audio_url text
--   display_order integer DEFAULT 0
--   is_locked boolean DEFAULT true
--   created_at timestamp with time zone DEFAULT now()
--   page_start integer
--   page_end integer
--   commentaire_admin text

-- table nourania_validation_requests
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   lesson_id uuid NOT NULL
--   status text DEFAULT 'pending'::text
--   reviewed_at timestamp with time zone
--   reviewed_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table parent_codes
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   child_id uuid NOT NULL
--   label text NOT NULL
--   code_hash text NOT NULL
--   created_by uuid
--   created_at timestamp with time zone NOT NULL DEFAULT now()
--   updated_at timestamp with time zone

-- table parent_links
--   parent_id uuid NOT NULL
--   child_id uuid NOT NULL
--   created_at timestamp with time zone NOT NULL DEFAULT now()
--   confirme boolean NOT NULL DEFAULT false

-- table parent_lock_settings
--   user_id uuid NOT NULL
--   mode text NOT NULL DEFAULT 'auto'::text
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table point_settings
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   action_key text NOT NULL
--   label text NOT NULL
--   points integer NOT NULL DEFAULT 1
--   is_active boolean DEFAULT true
--   created_at timestamp with time zone DEFAULT now()
--   module_key text
--   module_label text
--   points_per_validation integer DEFAULT 1

-- table prayer_card_content
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   card_id uuid NOT NULL
--   content_type text NOT NULL DEFAULT 'video'::text
--   file_url text NOT NULL
--   file_name text
--   display_order integer DEFAULT 0
--   uploaded_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table prayer_cards
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   category_id uuid NOT NULL
--   title_arabic text NOT NULL
--   title_french text NOT NULL
--   display_order integer DEFAULT 0
--   is_locked boolean DEFAULT false
--   created_at timestamp with time zone DEFAULT now()
--   group_key text
--   image_url text
--   title text

-- table prayer_categories
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   name_arabic text NOT NULL
--   name_french text NOT NULL
--   description text
--   display_order integer DEFAULT 0
--   icon text
--   created_at timestamp with time zone DEFAULT now()
--   is_default boolean DEFAULT false
--   color text

-- table prayer_content
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   category_id uuid
--   title text
--   text_arabic text
--   text_french text
--   audio_url text
--   display_order integer DEFAULT 0
--   created_at timestamp with time zone DEFAULT now()

-- table profiles
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   full_name text
--   email text
--   avatar_url text
--   phone text
--   city text
--   is_approved boolean DEFAULT false
--   is_admin boolean DEFAULT false
--   points integer DEFAULT 0
--   created_at timestamp with time zone DEFAULT now()
--   updated_at timestamp with time zone DEFAULT now()
--   gender text
--   age integer
--   date_of_birth date
--   notification_prompt_dismissed text DEFAULT false
--   dob_set_by_user boolean DEFAULT false
--   notification_prompt_later_count integer DEFAULT 0
--   last_seen timestamp with time zone
--   notification_prompt_later_at timestamp with time zone
--   prayer_group text
--   parent_phone text
--   ask_birth_date boolean NOT NULL DEFAULT true
--   children_question text
--   bilan_arabe text
--   espace_parents text NOT NULL DEFAULT 'auto'::text
--   parent_phone_nom text
--   parent2_phone text
--   parent2_phone_nom text
--   hors_classement boolean NOT NULL DEFAULT false
--   presence_tous_groupes boolean NOT NULL DEFAULT false

-- table program_rewards
--   program_id uuid NOT NULL
--   user_id uuid NOT NULL
--   kind text NOT NULL
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table push_subscriptions
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   endpoint text NOT NULL
--   p256dh text NOT NULL
--   auth_key text NOT NULL
--   device_info text
--   is_active boolean DEFAULT true
--   created_at timestamp with time zone DEFAULT now()

-- table quiz_responses
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   quiz_id uuid NOT NULL
--   selected_answer text NOT NULL
--   is_correct boolean DEFAULT false
--   created_at timestamp with time zone DEFAULT now()
--   attempt_number integer DEFAULT 1

-- table ramadan_day_activities
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   day_id uuid NOT NULL
--   activity_type text
--   title text
--   description text
--   display_order integer DEFAULT 0
--   created_at timestamp with time zone DEFAULT now()
--   order_index integer DEFAULT 0
--   file_type text
--   file_name text
--   file_url text
--   type text

-- table ramadan_day_exceptions
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   day_id uuid NOT NULL
--   user_id uuid NOT NULL
--   is_unlocked boolean DEFAULT true
--   unlocked_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table ramadan_day_videos
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   day_id uuid NOT NULL
--   video_url text NOT NULL
--   title text
--   display_order integer DEFAULT 0
--   created_at timestamp with time zone DEFAULT now()
--   file_name text

-- table ramadan_days
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   day_number integer NOT NULL
--   theme text
--   video_url text
--   pdf_url text
--   is_locked boolean DEFAULT true
--   created_at timestamp with time zone DEFAULT now()

-- table ramadan_quizzes
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   day_id uuid NOT NULL
--   question text NOT NULL
--   option_a text
--   option_b text
--   option_c text
--   option_d text
--   correct_answer text
--   display_order integer DEFAULT 0
--   created_at timestamp with time zone DEFAULT now()
--   options jsonb DEFAULT '[]'::jsonb
--   question_order integer DEFAULT 0
--   correct_option integer
--   explanation text
--   correct_options jsonb DEFAULT '[]'::jsonb

-- table ramadan_settings
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   start_date date
--   end_date date
--   is_active boolean DEFAULT false
--   auto_unlock boolean DEFAULT false
--   created_at timestamp with time zone DEFAULT now()
--   updated_at timestamp with time zone DEFAULT now()
--   start_enabled boolean DEFAULT false
--   started_at timestamp with time zone
--   max_errors integer NOT NULL DEFAULT 3

-- table scheduled_notifications
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   title text DEFAULT ''::text
--   body text
--   scheduled_at timestamp with time zone DEFAULT now()
--   target_type text DEFAULT 'all'::text
--   target_user_id uuid
--   is_sent boolean DEFAULT false
--   sent_at timestamp with time zone
--   created_by uuid
--   created_at timestamp with time zone DEFAULT now()
--   module text
--   message text
--   start_date text
--   end_date text
--   send_time text DEFAULT '08:00'::text
--   recipients jsonb DEFAULT '"all"'::jsonb
--   is_active boolean DEFAULT true
--   require_confirmation boolean DEFAULT false
--   last_sent_on date
--   weekdays ARRAY
--   skip_holidays boolean NOT NULL DEFAULT false

-- table school_holidays
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   label text NOT NULL
--   start_date date NOT NULL
--   end_date date NOT NULL
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table sourate_admin_unlocks
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   sourate_id uuid NOT NULL
--   unlocked_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table sourate_content
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   sourate_id uuid NOT NULL
--   content_type text NOT NULL DEFAULT 'video'::text
--   file_url text NOT NULL
--   file_name text
--   display_order integer DEFAULT 0
--   uploaded_by uuid
--   created_at timestamp with time zone DEFAULT now()
--   target_user_id uuid
--   viewed_at timestamp with time zone

-- table sourate_recitations
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   sourate_id uuid
--   student_id uuid NOT NULL
--   audio_url text NOT NULL
--   student_comment text
--   status text NOT NULL DEFAULT 'pending'::text
--   admin_audio_url text
--   admin_comment text
--   created_at timestamp with time zone NOT NULL DEFAULT now()
--   updated_at timestamp with time zone NOT NULL DEFAULT now()
--   allah_name_id integer

-- table sourate_stories
--   sourate_number integer NOT NULL
--   titre text NOT NULL DEFAULT ''::text
--   texte text NOT NULL DEFAULT ''::text
--   merite text
--   cause_authentique boolean NOT NULL DEFAULT false
--   sources jsonb NOT NULL DEFAULT '[]'::jsonb
--   validated boolean NOT NULL DEFAULT false
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table sourate_validation_requests
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   sourate_id uuid NOT NULL
--   status text DEFAULT 'pending'::text
--   reviewed_at timestamp with time zone
--   reviewed_by uuid
--   created_at timestamp with time zone DEFAULT now()

-- table sourate_versets_audio
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   sourate_id uuid
--   sourate_number integer NOT NULL
--   verset_number integer NOT NULL
--   audio_url text NOT NULL
--   file_path text
--   created_at timestamp with time zone DEFAULT now()

-- table sourates
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   number integer NOT NULL
--   name_arabic text NOT NULL
--   name_french text NOT NULL
--   verses_count integer DEFAULT 0
--   audio_url text
--   display_order integer DEFAULT 0
--   is_locked boolean DEFAULT true
--   created_at timestamp with time zone DEFAULT now()
--   audio_complet_url text
--   audio_complet_path text
--   video_url text

-- table student_group_members
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   group_id uuid NOT NULL
--   user_id uuid NOT NULL
--   created_at timestamp with time zone DEFAULT now()

-- table student_groups
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   name text NOT NULL
--   description text
--   created_by uuid
--   created_at timestamp with time zone DEFAULT now()
--   color text DEFAULT '#3B82F6'::text
--   position integer

-- table student_passwords
--   user_id uuid NOT NULL
--   password text NOT NULL
--   source text NOT NULL DEFAULT 'connexion'::text
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table student_ranking
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   total_points integer DEFAULT 0
--   rank_position integer
--   week_points integer DEFAULT 0
--   month_points integer DEFAULT 0
--   updated_at timestamp with time zone DEFAULT now()
--   created_at timestamp with time zone DEFAULT now()

-- table student_reports
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   student_id uuid NOT NULL
--   period_label text NOT NULL
--   note numeric
--   appreciation text
--   motivation text
--   sent_at timestamp with time zone
--   updated_at timestamp with time zone NOT NULL DEFAULT now()
--   snapshot jsonb
--   guide jsonb
--   show_note boolean NOT NULL DEFAULT false
--   traduction jsonb
--   langue_ar text
--   share_token text
--   period_start date
--   period_end date

-- table trash_items
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   item_type text NOT NULL
--   item_data jsonb NOT NULL
--   original_id text NOT NULL
--   label text NOT NULL
--   deleted_at timestamp with time zone NOT NULL DEFAULT now()

-- table user_allah_name_progress
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   name_id integer NOT NULL
--   is_validated boolean NOT NULL DEFAULT false
--   validated_at timestamp with time zone

-- table user_alphabet_progress
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   letter_id integer NOT NULL
--   is_completed boolean DEFAULT false
--   completed_at timestamp with time zone
--   created_at timestamp with time zone DEFAULT now()
--   is_validated boolean DEFAULT false

-- table user_daily_prayers
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   date date NOT NULL DEFAULT CURRENT_DATE
--   fajr boolean DEFAULT false
--   dhuhr boolean DEFAULT false
--   asr boolean DEFAULT false
--   maghrib boolean DEFAULT false
--   isha boolean DEFAULT false
--   created_at timestamp with time zone DEFAULT now()
--   prayer_name text
--   is_checked boolean DEFAULT false

-- table user_flashcard_learned
--   user_id uuid NOT NULL
--   flashcard_id uuid NOT NULL
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- table user_grammaire_progress
--   user_id uuid NOT NULL
--   card_id uuid NOT NULL
--   lecon_at timestamp with time zone
--   exercices_at timestamp with time zone
--   updated_at timestamp with time zone NOT NULL DEFAULT now()

-- table user_invocation_progress
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   invocation_id integer NOT NULL
--   is_completed boolean DEFAULT false
--   is_validated boolean DEFAULT false
--   is_memorized boolean DEFAULT false
--   completed_at timestamp with time zone
--   updated_at timestamp with time zone DEFAULT now()
--   created_at timestamp with time zone DEFAULT now()

-- table user_messages
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   sender_id uuid
--   receiver_id uuid
--   content text DEFAULT ''::text
--   is_read boolean DEFAULT false
--   read_at timestamp with time zone
--   created_at timestamp with time zone DEFAULT now()
--   user_id uuid
--   message text
--   sender_type text DEFAULT 'user'::text
--   conversation_id text
--   message_type text DEFAULT 'text'::text
--   deleted_at timestamp with time zone
--   audio_url text

-- table user_nourania_progress
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   lesson_id uuid NOT NULL
--   is_completed boolean DEFAULT false
--   is_validated boolean DEFAULT false
--   progress_percentage integer DEFAULT 0
--   completed_at timestamp with time zone
--   created_at timestamp with time zone DEFAULT now()

-- table user_prayer_progress
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   card_id uuid NOT NULL
--   is_completed boolean DEFAULT false
--   completed_at timestamp with time zone
--   created_at timestamp with time zone DEFAULT now()
--   is_validated boolean DEFAULT false

-- table user_ramadan_fasting
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   date date NOT NULL
--   is_fasting boolean DEFAULT true
--   created_at timestamp with time zone DEFAULT now()
--   day_number integer
--   has_fasted boolean DEFAULT false

-- table user_ramadan_progress
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   day_id uuid NOT NULL
--   is_completed boolean DEFAULT false
--   quiz_score integer DEFAULT 0
--   completed_at timestamp with time zone
--   created_at timestamp with time zone DEFAULT now()
--   video_watched boolean DEFAULT false
--   quiz_completed boolean DEFAULT false
--   pdf_read boolean DEFAULT false

-- table user_ramadan_video_watched
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   video_id uuid NOT NULL
--   watched_at timestamp with time zone DEFAULT now()
--   created_at timestamp with time zone DEFAULT now()
--   day_id uuid

-- table user_roles
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   role USER-DEFINED NOT NULL DEFAULT 'user'::app_role
--   created_at timestamp with time zone DEFAULT now()

-- table user_sourate_progress
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   sourate_id uuid NOT NULL
--   is_validated boolean DEFAULT false
--   progress_percentage integer DEFAULT 0
--   validated_at timestamp with time zone
--   created_at timestamp with time zone DEFAULT now()
--   context text NOT NULL DEFAULT 'sourates'::text
--   is_memorized boolean NOT NULL DEFAULT false

-- table user_sourate_verse_progress
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   user_id uuid NOT NULL
--   sourate_id uuid NOT NULL
--   verse_number integer NOT NULL
--   is_memorized boolean DEFAULT false
--   created_at timestamp with time zone DEFAULT now()
--   context text NOT NULL DEFAULT 'sourates'::text

-- table weekly_program_settings
--   id smallint NOT NULL DEFAULT 1
--   enabled boolean NOT NULL DEFAULT true
--   disabled_group_ids ARRAY NOT NULL DEFAULT '{}'::uuid[]
--   updated_at timestamp with time zone NOT NULL DEFAULT now()
--   auto_nudge boolean NOT NULL DEFAULT true

-- table weekly_programs
--   id uuid NOT NULL DEFAULT gen_random_uuid()
--   student_id uuid NOT NULL
--   week_start date NOT NULL
--   items jsonb NOT NULL DEFAULT '[]'::jsonb
--   message_index smallint NOT NULL DEFAULT 0
--   teacher_note text
--   created_at timestamp with time zone NOT NULL DEFAULT now()

-- ===== CONTRAINTES =====
ALTER TABLE absence_justifications ADD CONSTRAINT absence_justifications_pkey PRIMARY KEY (id);
ALTER TABLE absence_justifications ADD CONSTRAINT absence_justifications_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE absence_justifications ADD CONSTRAINT absence_justifications_student_id_course_date_key UNIQUE (student_id, course_date);
ALTER TABLE admin_card_order ADD CONSTRAINT admin_card_order_pkey PRIMARY KEY (id);
ALTER TABLE admin_card_order ADD CONSTRAINT admin_card_order_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE admin_card_order ADD CONSTRAINT admin_card_order_user_id_key UNIQUE (user_id);
ALTER TABLE admin_conversations ADD CONSTRAINT admin_conversations_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE admin_conversations ADD CONSTRAINT admin_conversations_pkey PRIMARY KEY (id);
ALTER TABLE admin_conversations ADD CONSTRAINT admin_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE admin_conversations ADD CONSTRAINT admin_conversations_user_id_key UNIQUE (user_id);
ALTER TABLE admin_task_templates ADD CONSTRAINT admin_task_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE admin_task_templates ADD CONSTRAINT admin_task_templates_pkey PRIMARY KEY (id);
ALTER TABLE admin_task_templates ADD CONSTRAINT admin_task_templates_title_check CHECK ((length(TRIM(BOTH FROM title)) > 0));
ALTER TABLE admin_tasks ADD CONSTRAINT admin_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE admin_tasks ADD CONSTRAINT admin_tasks_group_id_fkey FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE SET NULL;
ALTER TABLE admin_tasks ADD CONSTRAINT admin_tasks_pkey PRIMARY KEY (id);
ALTER TABLE admin_tasks ADD CONSTRAINT admin_tasks_recurrence_check CHECK ((recurrence = 'weekly'::text));
ALTER TABLE admin_tasks ADD CONSTRAINT admin_tasks_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE admin_tasks ADD CONSTRAINT admin_tasks_title_check CHECK ((length(TRIM(BOTH FROM title)) > 0));
ALTER TABLE allah_name_media ADD CONSTRAINT allah_name_media_name_id_fkey FOREIGN KEY (name_id) REFERENCES allah_names(id) ON DELETE CASCADE;
ALTER TABLE allah_name_media ADD CONSTRAINT allah_name_media_pkey PRIMARY KEY (id);
ALTER TABLE allah_names ADD CONSTRAINT allah_names_pkey PRIMARY KEY (id);
ALTER TABLE alphabet_admin_unlocks ADD CONSTRAINT alphabet_admin_unlocks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE alphabet_admin_unlocks ADD CONSTRAINT alphabet_admin_unlocks_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES alphabet_letters(id) ON DELETE CASCADE;
ALTER TABLE alphabet_admin_unlocks ADD CONSTRAINT alphabet_admin_unlocks_pkey PRIMARY KEY (id);
ALTER TABLE alphabet_admin_unlocks ADD CONSTRAINT alphabet_admin_unlocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE alphabet_admin_unlocks ADD CONSTRAINT alphabet_admin_unlocks_user_letter UNIQUE (user_id, letter_id);
ALTER TABLE alphabet_content ADD CONSTRAINT alphabet_content_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES alphabet_letters(id) ON DELETE CASCADE;
ALTER TABLE alphabet_content ADD CONSTRAINT alphabet_content_pkey PRIMARY KEY (id);
ALTER TABLE alphabet_content ADD CONSTRAINT alphabet_content_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE alphabet_game_scores ADD CONSTRAINT alphabet_game_scores_check CHECK (((total > 0) AND (score <= total)));
ALTER TABLE alphabet_game_scores ADD CONSTRAINT alphabet_game_scores_game_check CHECK ((game = ANY (ARRAY['ecoute'::text, 'ballons'::text, 'formes'::text, 'sosies'::text, 'defi'::text, 'lettre'::text, 'syllabes'::text, 'defi_jour'::text])));
ALTER TABLE alphabet_game_scores ADD CONSTRAINT alphabet_game_scores_pkey PRIMARY KEY (id);
ALTER TABLE alphabet_game_scores ADD CONSTRAINT alphabet_game_scores_score_check CHECK ((score >= 0));
ALTER TABLE alphabet_game_scores ADD CONSTRAINT alphabet_game_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE alphabet_game_scores ADD CONSTRAINT alphabet_scores_max_realiste CHECK ((total <= 100));
ALTER TABLE alphabet_letters ADD CONSTRAINT alphabet_letters_pkey PRIMARY KEY (id);
ALTER TABLE alphabet_line_models ADD CONSTRAINT alphabet_line_models_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES alphabet_letters(id) ON DELETE CASCADE;
ALTER TABLE alphabet_line_models ADD CONSTRAINT alphabet_line_models_line_key_check CHECK ((line_key = ANY (ARRAY['formes'::text, 'courtes'::text, 'longues'::text, 'tanouines'::text, 'soukoune'::text, 'chadda'::text, 'mot'::text])));
ALTER TABLE alphabet_line_models ADD CONSTRAINT alphabet_line_models_pkey PRIMARY KEY (id);
ALTER TABLE alphabet_line_models ADD CONSTRAINT alphabet_line_models_unique UNIQUE (letter_id, line_key);
ALTER TABLE alphabet_submissions ADD CONSTRAINT alphabet_submissions_kind_check CHECK ((kind = ANY (ARRAY['exercise'::text, 'final'::text])));
ALTER TABLE alphabet_submissions ADD CONSTRAINT alphabet_submissions_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES alphabet_letters(id) ON DELETE CASCADE;
ALTER TABLE alphabet_submissions ADD CONSTRAINT alphabet_submissions_line_key_check CHECK ((line_key = ANY (ARRAY['formes'::text, 'courtes'::text, 'longues'::text, 'tanouines'::text, 'soukoune'::text, 'chadda'::text])));
ALTER TABLE alphabet_submissions ADD CONSTRAINT alphabet_submissions_pkey PRIMARY KEY (id);
ALTER TABLE alphabet_submissions ADD CONSTRAINT alphabet_submissions_shape CHECK ((((kind = 'exercise'::text) AND (line_key IS NOT NULL) AND (audio_url IS NOT NULL)) OR ((kind = 'final'::text) AND (line_key IS NULL))));
ALTER TABLE alphabet_submissions ADD CONSTRAINT alphabet_submissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'corrected'::text, 'redo'::text, 'validated'::text, 'to_review'::text])));
ALTER TABLE alphabet_submissions ADD CONSTRAINT alphabet_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE alphabet_trace_stars ADD CONSTRAINT alphabet_trace_stars_form_check CHECK (((form >= 0) AND (form <= 3)));
ALTER TABLE alphabet_trace_stars ADD CONSTRAINT alphabet_trace_stars_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES alphabet_letters(id) ON DELETE CASCADE;
ALTER TABLE alphabet_trace_stars ADD CONSTRAINT alphabet_trace_stars_pkey PRIMARY KEY (user_id, letter_id, form);
ALTER TABLE alphabet_trace_stars ADD CONSTRAINT alphabet_trace_stars_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE app_appearance ADD CONSTRAINT app_appearance_pkey PRIMARY KEY (key);
ALTER TABLE app_logs ADD CONSTRAINT app_logs_pkey PRIMARY KEY (id);
ALTER TABLE app_logs ADD CONSTRAINT app_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE app_versions ADD CONSTRAINT app_versions_pkey PRIMARY KEY (id);
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_user_id_date_key UNIQUE (user_id, date);
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE attendance_sessions ADD CONSTRAINT attendance_sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE attendance_sessions ADD CONSTRAINT attendance_sessions_pkey PRIMARY KEY (date);
ALTER TABLE auto_reminder_logs ADD CONSTRAINT auto_reminder_logs_pkey PRIMARY KEY (kind, sent_on);
ALTER TABLE behavior_marks ADD CONSTRAINT behavior_marks_kind_check CHECK ((kind = ANY (ARRAY['attentif'::text, 'participe'::text, 'bavarde'::text])));
ALTER TABLE behavior_marks ADD CONSTRAINT behavior_marks_pkey PRIMARY KEY (student_id, course_date, kind);
ALTER TABLE behavior_marks ADD CONSTRAINT behavior_marks_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE bilan_envois ADD CONSTRAINT bilan_envois_canal_check CHECK ((canal = ANY (ARRAY['partage'::text, 'telechargement'::text, 'copie'::text, 'whatsapp'::text, 'sms'::text, 'relance'::text])));
ALTER TABLE bilan_envois ADD CONSTRAINT bilan_envois_pkey PRIMARY KEY (id);
ALTER TABLE bilan_envois ADD CONSTRAINT bilan_envois_report_id_fkey FOREIGN KEY (report_id) REFERENCES student_reports(id) ON DELETE CASCADE;
ALTER TABLE bilan_envois ADD CONSTRAINT bilan_envois_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE bilan_reads ADD CONSTRAINT bilan_reads_pkey PRIMARY KEY (report_id, label);
ALTER TABLE bilan_reads ADD CONSTRAINT bilan_reads_report_id_fkey FOREIGN KEY (report_id) REFERENCES student_reports(id) ON DELETE CASCADE;
ALTER TABLE connexion_logs ADD CONSTRAINT connexion_logs_pkey PRIMARY KEY (id);
ALTER TABLE connexion_logs ADD CONSTRAINT connexion_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE coran_progress ADD CONSTRAINT coran_progress_kind_check CHECK ((kind = ANY (ARRAY['lecture'::text, 'juz'::text, 'programme'::text])));
ALTER TABLE coran_progress ADD CONSTRAINT coran_progress_pkey PRIMARY KEY (id);
ALTER TABLE coran_progress ADD CONSTRAINT coran_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE coran_progress ADD CONSTRAINT coran_progress_user_id_kind_key_key UNIQUE (user_id, kind, key);
ALTER TABLE coran_reminder_logs ADD CONSTRAINT coran_reminder_logs_pkey PRIMARY KEY (user_id, sent_on);
ALTER TABLE coran_reminder_logs ADD CONSTRAINT coran_reminder_logs_user_id_compte_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE course_ready ADD CONSTRAINT course_ready_pkey PRIMARY KEY (student_id, course_date);
ALTER TABLE course_ready ADD CONSTRAINT course_ready_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crash_alert_settings ADD CONSTRAINT crash_alert_settings_id_check CHECK ((id = 1));
ALTER TABLE crash_alert_settings ADD CONSTRAINT crash_alert_settings_interval_hours_check CHECK (((interval_hours >= 1) AND (interval_hours <= 4)));
ALTER TABLE crash_alert_settings ADD CONSTRAINT crash_alert_settings_pkey PRIMARY KEY (id);
ALTER TABLE daily_goals ADD CONSTRAINT daily_goals_pkey PRIMARY KEY (student_id, day);
ALTER TABLE daily_goals ADD CONSTRAINT daily_goals_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE dashboard_card_visibility ADD CONSTRAINT dashboard_card_visibility_card_id_fkey FOREIGN KEY (card_id) REFERENCES dashboard_cards(id) ON DELETE CASCADE;
ALTER TABLE dashboard_card_visibility ADD CONSTRAINT dashboard_card_visibility_card_id_user_id_key UNIQUE (card_id, user_id);
ALTER TABLE dashboard_card_visibility ADD CONSTRAINT dashboard_card_visibility_pkey PRIMARY KEY (id);
ALTER TABLE dashboard_card_visibility ADD CONSTRAINT dashboard_card_visibility_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE dashboard_card_visibility ADD CONSTRAINT dashboard_card_visibility_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE dashboard_cards ADD CONSTRAINT dashboard_cards_card_key_key UNIQUE (card_key);
ALTER TABLE dashboard_cards ADD CONSTRAINT dashboard_cards_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE dashboard_cards ADD CONSTRAINT dashboard_cards_pkey PRIMARY KEY (id);
ALTER TABLE devoir_checks ADD CONSTRAINT devoir_checks_devoir_id_fkey FOREIGN KEY (devoir_id) REFERENCES devoirs(id) ON DELETE CASCADE;
ALTER TABLE devoir_checks ADD CONSTRAINT devoir_checks_pkey PRIMARY KEY (devoir_id, student_id);
ALTER TABLE devoir_checks ADD CONSTRAINT devoir_checks_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE devoir_decisions ADD CONSTRAINT devoir_decisions_decision_check CHECK ((decision = ANY (ARRAY['rattraper'::text, 'historique'::text])));
ALTER TABLE devoir_decisions ADD CONSTRAINT devoir_decisions_devoir_id_fkey FOREIGN KEY (devoir_id) REFERENCES devoirs(id) ON DELETE CASCADE;
ALTER TABLE devoir_decisions ADD CONSTRAINT devoir_decisions_pkey PRIMARY KEY (devoir_id, student_id);
ALTER TABLE devoir_decisions ADD CONSTRAINT devoir_decisions_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE devoir_modeles ADD CONSTRAINT devoir_modeles_created_by_compte_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE devoir_modeles ADD CONSTRAINT devoir_modeles_pkey PRIMARY KEY (id);
ALTER TABLE devoir_steps ADD CONSTRAINT devoir_steps_devoir_id_fkey FOREIGN KEY (devoir_id) REFERENCES devoirs(id) ON DELETE CASCADE;
ALTER TABLE devoir_steps ADD CONSTRAINT devoir_steps_pkey PRIMARY KEY (devoir_id, student_id, step);
ALTER TABLE devoir_steps ADD CONSTRAINT devoir_steps_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE devoir_vues ADD CONSTRAINT devoir_vues_devoir_id_fkey FOREIGN KEY (devoir_id) REFERENCES devoirs(id) ON DELETE CASCADE;
ALTER TABLE devoir_vues ADD CONSTRAINT devoir_vues_kind_check CHECK ((kind = ANY (ARRAY['audio'::text, 'document'::text])));
ALTER TABLE devoir_vues ADD CONSTRAINT devoir_vues_pkey PRIMARY KEY (devoir_id, student_id, kind);
ALTER TABLE devoir_vues ADD CONSTRAINT devoir_vues_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE devoirs ADD CONSTRAINT devoirs_assigned_to_check CHECK ((assigned_to = ANY (ARRAY['all'::text, 'group'::text, 'student'::text])));
ALTER TABLE devoirs ADD CONSTRAINT devoirs_created_by_compte_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE devoirs ADD CONSTRAINT devoirs_group_id_fkey FOREIGN KEY (group_id) REFERENCES student_groups(id);
ALTER TABLE devoirs ADD CONSTRAINT devoirs_pkey PRIMARY KEY (id);
ALTER TABLE devoirs ADD CONSTRAINT devoirs_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE devoirs ADD CONSTRAINT devoirs_type_check CHECK ((type = ANY (ARRAY['sourate'::text, 'nourania'::text, 'recitation'::text, 'exercice_pdf'::text, 'autre'::text, 'allah_names'::text, 'alphabet'::text, 'invocations'::text, 'priere'::text, 'coran'::text])));
ALTER TABLE devoirs_rendus ADD CONSTRAINT devoirs_rendus_devoir_id_fkey FOREIGN KEY (devoir_id) REFERENCES devoirs(id) ON DELETE CASCADE;
ALTER TABLE devoirs_rendus ADD CONSTRAINT devoirs_rendus_pkey PRIMARY KEY (id);
ALTER TABLE devoirs_rendus ADD CONSTRAINT devoirs_rendus_statut_check CHECK ((statut = ANY (ARRAY['rendu'::text, 'corrige'::text, 'a_refaire'::text])));
ALTER TABLE devoirs_rendus ADD CONSTRAINT devoirs_rendus_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE dropout_state ADD CONSTRAINT dropout_state_pkey PRIMARY KEY (student_id);
ALTER TABLE dropout_state ADD CONSTRAINT dropout_state_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE encouragement_logs ADD CONSTRAINT encouragement_logs_pkey PRIMARY KEY (id);
ALTER TABLE encouragement_logs ADD CONSTRAINT encouragement_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE group_devoir_settings ADD CONSTRAINT group_devoir_settings_group_id_fkey FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE;
ALTER TABLE group_devoir_settings ADD CONSTRAINT group_devoir_settings_max_devoirs_check CHECK (((max_devoirs IS NULL) OR ((max_devoirs >= 1) AND (max_devoirs <= 30))));
ALTER TABLE group_devoir_settings ADD CONSTRAINT group_devoir_settings_pkey PRIMARY KEY (group_id);
ALTER TABLE group_levels ADD CONSTRAINT group_levels_group_id_fkey FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE;
ALTER TABLE group_levels ADD CONSTRAINT group_levels_pkey PRIMARY KEY (id);
ALTER TABLE group_schedules ADD CONSTRAINT group_schedules_group_id_fkey FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE;
ALTER TABLE group_schedules ADD CONSTRAINT group_schedules_pkey PRIMARY KEY (group_id);
ALTER TABLE group_schedules ADD CONSTRAINT group_schedules_weekday_check CHECK (((weekday >= 1) AND (weekday <= 7)));
ALTER TABLE group_sessions ADD CONSTRAINT group_sessions_group_id_fkey FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE;
ALTER TABLE group_sessions ADD CONSTRAINT group_sessions_group_id_session_date_key UNIQUE (group_id, session_date);
ALTER TABLE group_sessions ADD CONSTRAINT group_sessions_pkey PRIMARY KEY (id);
ALTER TABLE homework_assignments ADD CONSTRAINT homework_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE homework_assignments ADD CONSTRAINT homework_assignments_pkey PRIMARY KEY (id);
ALTER TABLE homework_assignments ADD CONSTRAINT homework_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE homework_reminder_logs ADD CONSTRAINT homework_reminder_logs_devoir_id_fkey FOREIGN KEY (devoir_id) REFERENCES devoirs(id) ON DELETE CASCADE;
ALTER TABLE homework_reminder_logs ADD CONSTRAINT homework_reminder_logs_pkey PRIMARY KEY (devoir_id, student_id);
ALTER TABLE homework_reminder_logs ADD CONSTRAINT homework_reminder_logs_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE homework_submissions ADD CONSTRAINT homework_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES homework_assignments(id) ON DELETE CASCADE;
ALTER TABLE homework_submissions ADD CONSTRAINT homework_submissions_assignment_id_user_id_key UNIQUE (assignment_id, user_id);
ALTER TABLE homework_submissions ADD CONSTRAINT homework_submissions_pkey PRIMARY KEY (id);
ALTER TABLE homework_submissions ADD CONSTRAINT homework_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE homework_submissions ADD CONSTRAINT homework_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE invocation_content ADD CONSTRAINT invocation_content_invocation_id_fkey FOREIGN KEY (invocation_id) REFERENCES invocations(id) ON DELETE CASCADE;
ALTER TABLE invocation_content ADD CONSTRAINT invocation_content_pkey PRIMARY KEY (id);
ALTER TABLE invocation_content ADD CONSTRAINT invocation_content_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE invocation_validation_requests ADD CONSTRAINT invocation_validation_requests_invocation_id_fkey FOREIGN KEY (invocation_id) REFERENCES invocations(id) ON DELETE CASCADE;
ALTER TABLE invocation_validation_requests ADD CONSTRAINT invocation_validation_requests_pkey PRIMARY KEY (id);
ALTER TABLE invocation_validation_requests ADD CONSTRAINT invocation_validation_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE invocation_validation_requests ADD CONSTRAINT invocation_validation_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE invocations ADD CONSTRAINT invocations_pkey PRIMARY KEY (id);
ALTER TABLE learning_modules ADD CONSTRAINT learning_modules_pkey PRIMARY KEY (id);
ALTER TABLE mascotte_usage ADD CONSTRAINT mascotte_usage_pkey PRIMARY KEY (user_id, jour);
ALTER TABLE mascotte_usage ADD CONSTRAINT mascotte_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE module_card_content ADD CONSTRAINT module_card_content_card_id_fkey FOREIGN KEY (card_id) REFERENCES module_cards(id) ON DELETE CASCADE;
ALTER TABLE module_card_content ADD CONSTRAINT module_card_content_pkey PRIMARY KEY (id);
ALTER TABLE module_card_content ADD CONSTRAINT module_card_content_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE module_cards ADD CONSTRAINT module_cards_module_id_fkey FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE;
ALTER TABLE module_cards ADD CONSTRAINT module_cards_pkey PRIMARY KEY (id);
ALTER TABLE module_content ADD CONSTRAINT module_content_module_id_fkey FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE;
ALTER TABLE module_content ADD CONSTRAINT module_content_pkey PRIMARY KEY (id);
ALTER TABLE module_content ADD CONSTRAINT module_content_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE module_flashcards ADD CONSTRAINT module_flashcards_module_card_id_fkey FOREIGN KEY (module_card_id) REFERENCES module_cards(id) ON DELETE CASCADE;
ALTER TABLE module_flashcards ADD CONSTRAINT module_flashcards_pkey PRIMARY KEY (id);
ALTER TABLE module_visibility ADD CONSTRAINT module_visibility_module_id_fkey FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE;
ALTER TABLE module_visibility ADD CONSTRAINT module_visibility_module_id_key UNIQUE (module_id);
ALTER TABLE module_visibility ADD CONSTRAINT module_visibility_pkey PRIMARY KEY (id);
ALTER TABLE module_visibility ADD CONSTRAINT valid_visibility_type CHECK ((visibility_type = ANY (ARRAY['all'::text, 'users'::text, 'groups'::text])));
ALTER TABLE module_visits ADD CONSTRAINT module_visits_module_id_fkey FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE;
ALTER TABLE module_visits ADD CONSTRAINT module_visits_pkey PRIMARY KEY (user_id, module_id, day);
ALTER TABLE module_visits ADD CONSTRAINT module_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notification_confirmations ADD CONSTRAINT notification_confirmations_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES notification_history(id) ON DELETE CASCADE;
ALTER TABLE notification_confirmations ADD CONSTRAINT notification_confirmations_notification_id_user_id_key UNIQUE (notification_id, user_id);
ALTER TABLE notification_confirmations ADD CONSTRAINT notification_confirmations_pkey PRIMARY KEY (id);
ALTER TABLE notification_confirmations ADD CONSTRAINT notification_confirmations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notification_history ADD CONSTRAINT notification_history_pkey PRIMARY KEY (id);
ALTER TABLE notification_history ADD CONSTRAINT notification_history_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE notification_history ADD CONSTRAINT notification_history_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notification_invitations ADD CONSTRAINT notification_invitations_pkey PRIMARY KEY (id);
ALTER TABLE notification_invitations ADD CONSTRAINT notification_invitations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notification_invitations ADD CONSTRAINT notification_invitations_user_id_key UNIQUE (user_id);
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_quiet_end_check CHECK (((quiet_end >= 0) AND (quiet_end <= 23)));
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_quiet_start_check CHECK (((quiet_start >= 0) AND (quiet_start <= 23)));
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);
ALTER TABLE nourania_admin_unlocks ADD CONSTRAINT nourania_admin_unlocks_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES nourania_lessons(id) ON DELETE CASCADE;
ALTER TABLE nourania_admin_unlocks ADD CONSTRAINT nourania_admin_unlocks_pkey PRIMARY KEY (id);
ALTER TABLE nourania_admin_unlocks ADD CONSTRAINT nourania_admin_unlocks_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE nourania_admin_unlocks ADD CONSTRAINT nourania_admin_unlocks_student_id_lesson_id_key UNIQUE (student_id, lesson_id);
ALTER TABLE nourania_admin_unlocks ADD CONSTRAINT nourania_admin_unlocks_unlocked_by_fkey FOREIGN KEY (unlocked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE nourania_commentaires_eleves ADD CONSTRAINT nourania_commentaires_eleves_lecon_id_fkey FOREIGN KEY (lecon_id) REFERENCES nourania_lessons(id) ON DELETE CASCADE;
ALTER TABLE nourania_commentaires_eleves ADD CONSTRAINT nourania_commentaires_eleves_lecon_id_student_id_key UNIQUE (lecon_id, student_id);
ALTER TABLE nourania_commentaires_eleves ADD CONSTRAINT nourania_commentaires_eleves_pkey PRIMARY KEY (id);
ALTER TABLE nourania_commentaires_eleves ADD CONSTRAINT nourania_commentaires_eleves_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE nourania_lesson_content ADD CONSTRAINT nourania_lesson_content_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES nourania_lessons(id) ON DELETE CASCADE;
ALTER TABLE nourania_lesson_content ADD CONSTRAINT nourania_lesson_content_pkey PRIMARY KEY (id);
ALTER TABLE nourania_lesson_content ADD CONSTRAINT nourania_lesson_content_target_user_id_compte_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE nourania_lesson_content ADD CONSTRAINT nourania_lesson_content_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE nourania_lessons ADD CONSTRAINT nourania_lessons_lesson_number_key UNIQUE (lesson_number);
ALTER TABLE nourania_lessons ADD CONSTRAINT nourania_lessons_pkey PRIMARY KEY (id);
ALTER TABLE nourania_validation_requests ADD CONSTRAINT nourania_validation_requests_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES nourania_lessons(id) ON DELETE CASCADE;
ALTER TABLE nourania_validation_requests ADD CONSTRAINT nourania_validation_requests_pkey PRIMARY KEY (id);
ALTER TABLE nourania_validation_requests ADD CONSTRAINT nourania_validation_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE nourania_validation_requests ADD CONSTRAINT nourania_validation_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE parent_codes ADD CONSTRAINT parent_codes_child_id_compte_fkey FOREIGN KEY (child_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE parent_codes ADD CONSTRAINT parent_codes_child_id_label_key UNIQUE (child_id, label);
ALTER TABLE parent_codes ADD CONSTRAINT parent_codes_created_by_compte_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE parent_codes ADD CONSTRAINT parent_codes_pkey PRIMARY KEY (id);
ALTER TABLE parent_links ADD CONSTRAINT parent_links_child_id_compte_fkey FOREIGN KEY (child_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE parent_links ADD CONSTRAINT parent_links_parent_id_compte_fkey FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE parent_links ADD CONSTRAINT parent_links_pkey PRIMARY KEY (parent_id, child_id);
ALTER TABLE parent_lock_settings ADD CONSTRAINT parent_lock_settings_mode_check CHECK ((mode = ANY (ARRAY['auto'::text, 'on'::text, 'off'::text])));
ALTER TABLE parent_lock_settings ADD CONSTRAINT parent_lock_settings_pkey PRIMARY KEY (user_id);
ALTER TABLE parent_lock_settings ADD CONSTRAINT parent_lock_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE point_settings ADD CONSTRAINT point_settings_action_key_key UNIQUE (action_key);
ALTER TABLE point_settings ADD CONSTRAINT point_settings_pkey PRIMARY KEY (id);
ALTER TABLE prayer_card_content ADD CONSTRAINT prayer_card_content_card_id_fkey FOREIGN KEY (card_id) REFERENCES prayer_cards(id) ON DELETE CASCADE;
ALTER TABLE prayer_card_content ADD CONSTRAINT prayer_card_content_pkey PRIMARY KEY (id);
ALTER TABLE prayer_card_content ADD CONSTRAINT prayer_card_content_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE prayer_cards ADD CONSTRAINT prayer_cards_category_id_fkey FOREIGN KEY (category_id) REFERENCES prayer_categories(id) ON DELETE CASCADE;
ALTER TABLE prayer_cards ADD CONSTRAINT prayer_cards_pkey PRIMARY KEY (id);
ALTER TABLE prayer_categories ADD CONSTRAINT prayer_categories_pkey PRIMARY KEY (id);
ALTER TABLE prayer_content ADD CONSTRAINT prayer_content_category_id_fkey FOREIGN KEY (category_id) REFERENCES prayer_categories(id) ON DELETE CASCADE;
ALTER TABLE prayer_content ADD CONSTRAINT prayer_content_pkey PRIMARY KEY (id);
ALTER TABLE profiles ADD CONSTRAINT profiles_bilan_arabe_check CHECK ((bilan_arabe = ANY (ARRAY['fusha'::text, 'darija'::text])));
ALTER TABLE profiles ADD CONSTRAINT profiles_children_question_check CHECK ((children_question = ANY (ARRAY['non'::text, 'oui'::text])));
ALTER TABLE profiles ADD CONSTRAINT profiles_espace_parents_check CHECK ((espace_parents = ANY (ARRAY['auto'::text, 'on'::text, 'off'::text])));
ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
ALTER TABLE program_rewards ADD CONSTRAINT program_rewards_kind_check CHECK ((kind = ANY (ARRAY['tresor'::text, 'bonus'::text])));
ALTER TABLE program_rewards ADD CONSTRAINT program_rewards_pkey PRIMARY KEY (program_id, kind);
ALTER TABLE program_rewards ADD CONSTRAINT program_rewards_program_id_fkey FOREIGN KEY (program_id) REFERENCES weekly_programs(id) ON DELETE CASCADE;
ALTER TABLE program_rewards ADD CONSTRAINT program_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_pkey PRIMARY KEY (id);
ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES ramadan_quizzes(id) ON DELETE CASCADE;
ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_user_id_quiz_id_key UNIQUE (user_id, quiz_id);
ALTER TABLE ramadan_day_activities ADD CONSTRAINT ramadan_day_activities_day_id_fkey FOREIGN KEY (day_id) REFERENCES ramadan_days(id) ON DELETE CASCADE;
ALTER TABLE ramadan_day_activities ADD CONSTRAINT ramadan_day_activities_pkey PRIMARY KEY (id);
ALTER TABLE ramadan_day_exceptions ADD CONSTRAINT ramadan_day_exceptions_day_id_fkey FOREIGN KEY (day_id) REFERENCES ramadan_days(id) ON DELETE CASCADE;
ALTER TABLE ramadan_day_exceptions ADD CONSTRAINT ramadan_day_exceptions_day_id_user_id_key UNIQUE (day_id, user_id);
ALTER TABLE ramadan_day_exceptions ADD CONSTRAINT ramadan_day_exceptions_pkey PRIMARY KEY (id);
ALTER TABLE ramadan_day_exceptions ADD CONSTRAINT ramadan_day_exceptions_unlocked_by_fkey FOREIGN KEY (unlocked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE ramadan_day_exceptions ADD CONSTRAINT ramadan_day_exceptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ramadan_day_videos ADD CONSTRAINT ramadan_day_videos_day_id_fkey FOREIGN KEY (day_id) REFERENCES ramadan_days(id) ON DELETE CASCADE;
ALTER TABLE ramadan_day_videos ADD CONSTRAINT ramadan_day_videos_pkey PRIMARY KEY (id);
ALTER TABLE ramadan_days ADD CONSTRAINT ramadan_days_day_number_key UNIQUE (day_number);
ALTER TABLE ramadan_days ADD CONSTRAINT ramadan_days_pkey PRIMARY KEY (id);
ALTER TABLE ramadan_quizzes ADD CONSTRAINT ramadan_quizzes_day_id_fkey FOREIGN KEY (day_id) REFERENCES ramadan_days(id) ON DELETE CASCADE;
ALTER TABLE ramadan_quizzes ADD CONSTRAINT ramadan_quizzes_pkey PRIMARY KEY (id);
ALTER TABLE ramadan_settings ADD CONSTRAINT ramadan_settings_pkey PRIMARY KEY (id);
ALTER TABLE scheduled_notifications ADD CONSTRAINT scheduled_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE scheduled_notifications ADD CONSTRAINT scheduled_notifications_pkey PRIMARY KEY (id);
ALTER TABLE scheduled_notifications ADD CONSTRAINT scheduled_notifications_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE school_holidays ADD CONSTRAINT school_holidays_check CHECK ((end_date >= start_date));
ALTER TABLE school_holidays ADD CONSTRAINT school_holidays_pkey PRIMARY KEY (id);
ALTER TABLE sourate_admin_unlocks ADD CONSTRAINT sourate_admin_unlocks_pkey PRIMARY KEY (id);
ALTER TABLE sourate_admin_unlocks ADD CONSTRAINT sourate_admin_unlocks_sourate_id_fkey FOREIGN KEY (sourate_id) REFERENCES sourates(id) ON DELETE CASCADE;
ALTER TABLE sourate_admin_unlocks ADD CONSTRAINT sourate_admin_unlocks_unlocked_by_fkey FOREIGN KEY (unlocked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE sourate_admin_unlocks ADD CONSTRAINT sourate_admin_unlocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sourate_admin_unlocks ADD CONSTRAINT sourate_admin_unlocks_user_id_sourate_id_key UNIQUE (user_id, sourate_id);
ALTER TABLE sourate_content ADD CONSTRAINT sourate_content_pkey PRIMARY KEY (id);
ALTER TABLE sourate_content ADD CONSTRAINT sourate_content_sourate_id_fkey FOREIGN KEY (sourate_id) REFERENCES sourates(id) ON DELETE CASCADE;
ALTER TABLE sourate_content ADD CONSTRAINT sourate_content_target_user_id_compte_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sourate_content ADD CONSTRAINT sourate_content_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE sourate_recitations ADD CONSTRAINT recitation_target_check CHECK (((sourate_id IS NOT NULL) <> (allah_name_id IS NOT NULL)));
ALTER TABLE sourate_recitations ADD CONSTRAINT sourate_recitations_allah_name_id_fkey FOREIGN KEY (allah_name_id) REFERENCES allah_names(id);
ALTER TABLE sourate_recitations ADD CONSTRAINT sourate_recitations_pkey PRIMARY KEY (id);
ALTER TABLE sourate_recitations ADD CONSTRAINT sourate_recitations_sourate_id_fkey FOREIGN KEY (sourate_id) REFERENCES sourates(id) ON DELETE CASCADE;
ALTER TABLE sourate_recitations ADD CONSTRAINT sourate_recitations_student_id_compte_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sourate_stories ADD CONSTRAINT sourate_stories_pkey PRIMARY KEY (sourate_number);
ALTER TABLE sourate_stories ADD CONSTRAINT sourate_stories_sourate_number_check CHECK (((sourate_number >= 1) AND (sourate_number <= 114)));
ALTER TABLE sourate_validation_requests ADD CONSTRAINT sourate_validation_requests_pkey PRIMARY KEY (id);
ALTER TABLE sourate_validation_requests ADD CONSTRAINT sourate_validation_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE sourate_validation_requests ADD CONSTRAINT sourate_validation_requests_sourate_id_fkey FOREIGN KEY (sourate_id) REFERENCES sourates(id) ON DELETE CASCADE;
ALTER TABLE sourate_validation_requests ADD CONSTRAINT sourate_validation_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sourate_versets_audio ADD CONSTRAINT sourate_versets_audio_pkey PRIMARY KEY (id);
ALTER TABLE sourate_versets_audio ADD CONSTRAINT sourate_versets_audio_sourate_id_fkey FOREIGN KEY (sourate_id) REFERENCES sourates(id) ON DELETE CASCADE;
ALTER TABLE sourate_versets_audio ADD CONSTRAINT sourate_versets_audio_sourate_id_verset_number_key UNIQUE (sourate_id, verset_number);
ALTER TABLE sourates ADD CONSTRAINT sourates_number_key UNIQUE (number);
ALTER TABLE sourates ADD CONSTRAINT sourates_pkey PRIMARY KEY (id);
ALTER TABLE student_group_members ADD CONSTRAINT student_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE;
ALTER TABLE student_group_members ADD CONSTRAINT student_group_members_group_id_user_id_key UNIQUE (group_id, user_id);
ALTER TABLE student_group_members ADD CONSTRAINT student_group_members_pkey PRIMARY KEY (id);
ALTER TABLE student_group_members ADD CONSTRAINT student_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE student_groups ADD CONSTRAINT student_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE student_groups ADD CONSTRAINT student_groups_pkey PRIMARY KEY (id);
ALTER TABLE student_passwords ADD CONSTRAINT student_passwords_pkey PRIMARY KEY (user_id);
ALTER TABLE student_passwords ADD CONSTRAINT student_passwords_source_check CHECK ((source = ANY (ARRAY['connexion'::text, 'oubli'::text, 'parametres'::text, 'admin'::text])));
ALTER TABLE student_passwords ADD CONSTRAINT student_passwords_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE student_ranking ADD CONSTRAINT student_ranking_pkey PRIMARY KEY (id);
ALTER TABLE student_ranking ADD CONSTRAINT student_ranking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE student_ranking ADD CONSTRAINT student_ranking_user_id_key UNIQUE (user_id);
ALTER TABLE student_reports ADD CONSTRAINT student_reports_langue_ar_check CHECK ((langue_ar = ANY (ARRAY['fusha'::text, 'darija'::text])));
ALTER TABLE student_reports ADD CONSTRAINT student_reports_note_check CHECK (((note IS NULL) OR ((note >= (0)::numeric) AND (note <= (20)::numeric))));
ALTER TABLE student_reports ADD CONSTRAINT student_reports_pkey PRIMARY KEY (id);
ALTER TABLE student_reports ADD CONSTRAINT student_reports_share_token_key UNIQUE (share_token);
ALTER TABLE student_reports ADD CONSTRAINT student_reports_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE student_reports ADD CONSTRAINT student_reports_student_id_period_label_key UNIQUE (student_id, period_label);
ALTER TABLE trash_items ADD CONSTRAINT trash_items_pkey PRIMARY KEY (id);
ALTER TABLE trash_items ADD CONSTRAINT trash_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_allah_name_progress ADD CONSTRAINT user_allah_name_progress_name_id_fkey FOREIGN KEY (name_id) REFERENCES allah_names(id) ON DELETE CASCADE;
ALTER TABLE user_allah_name_progress ADD CONSTRAINT user_allah_name_progress_pkey PRIMARY KEY (id);
ALTER TABLE user_allah_name_progress ADD CONSTRAINT user_allah_name_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_allah_name_progress ADD CONSTRAINT user_allah_name_progress_user_name_unique UNIQUE (user_id, name_id);
ALTER TABLE user_alphabet_progress ADD CONSTRAINT user_alphabet_progress_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES alphabet_letters(id) ON DELETE CASCADE;
ALTER TABLE user_alphabet_progress ADD CONSTRAINT user_alphabet_progress_pkey PRIMARY KEY (id);
ALTER TABLE user_alphabet_progress ADD CONSTRAINT user_alphabet_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_alphabet_progress ADD CONSTRAINT user_alphabet_progress_user_id_letter_id_key UNIQUE (user_id, letter_id);
ALTER TABLE user_daily_prayers ADD CONSTRAINT user_daily_prayers_pkey PRIMARY KEY (id);
ALTER TABLE user_daily_prayers ADD CONSTRAINT user_daily_prayers_user_id_date_key UNIQUE (user_id, date);
ALTER TABLE user_daily_prayers ADD CONSTRAINT user_daily_prayers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_flashcard_learned ADD CONSTRAINT user_flashcard_learned_flashcard_id_fkey FOREIGN KEY (flashcard_id) REFERENCES module_flashcards(id) ON DELETE CASCADE;
ALTER TABLE user_flashcard_learned ADD CONSTRAINT user_flashcard_learned_pkey PRIMARY KEY (user_id, flashcard_id);
ALTER TABLE user_flashcard_learned ADD CONSTRAINT user_flashcard_learned_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_grammaire_progress ADD CONSTRAINT user_grammaire_progress_pkey PRIMARY KEY (user_id, card_id);
ALTER TABLE user_grammaire_progress ADD CONSTRAINT user_grammaire_progress_user_id_compte_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_invocation_progress ADD CONSTRAINT user_invocation_progress_invocation_id_fkey FOREIGN KEY (invocation_id) REFERENCES invocations(id) ON DELETE CASCADE;
ALTER TABLE user_invocation_progress ADD CONSTRAINT user_invocation_progress_pkey PRIMARY KEY (id);
ALTER TABLE user_invocation_progress ADD CONSTRAINT user_invocation_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_invocation_progress ADD CONSTRAINT user_invocation_progress_user_id_invocation_id_key UNIQUE (user_id, invocation_id);
ALTER TABLE user_messages ADD CONSTRAINT user_messages_pkey PRIMARY KEY (id);
ALTER TABLE user_messages ADD CONSTRAINT user_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_messages ADD CONSTRAINT user_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_messages ADD CONSTRAINT user_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_nourania_progress ADD CONSTRAINT user_nourania_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES nourania_lessons(id) ON DELETE CASCADE;
ALTER TABLE user_nourania_progress ADD CONSTRAINT user_nourania_progress_pkey PRIMARY KEY (id);
ALTER TABLE user_nourania_progress ADD CONSTRAINT user_nourania_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_nourania_progress ADD CONSTRAINT user_nourania_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);
ALTER TABLE user_prayer_progress ADD CONSTRAINT user_prayer_progress_card_id_fkey FOREIGN KEY (card_id) REFERENCES prayer_cards(id) ON DELETE CASCADE;
ALTER TABLE user_prayer_progress ADD CONSTRAINT user_prayer_progress_pkey PRIMARY KEY (id);
ALTER TABLE user_prayer_progress ADD CONSTRAINT user_prayer_progress_user_id_card_id_key UNIQUE (user_id, card_id);
ALTER TABLE user_prayer_progress ADD CONSTRAINT user_prayer_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_ramadan_fasting ADD CONSTRAINT user_ramadan_fasting_pkey PRIMARY KEY (id);
ALTER TABLE user_ramadan_fasting ADD CONSTRAINT user_ramadan_fasting_user_day_unique UNIQUE (user_id, day_number);
ALTER TABLE user_ramadan_fasting ADD CONSTRAINT user_ramadan_fasting_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_ramadan_progress ADD CONSTRAINT user_ramadan_progress_day_id_fkey FOREIGN KEY (day_id) REFERENCES ramadan_days(id) ON DELETE CASCADE;
ALTER TABLE user_ramadan_progress ADD CONSTRAINT user_ramadan_progress_pkey PRIMARY KEY (id);
ALTER TABLE user_ramadan_progress ADD CONSTRAINT user_ramadan_progress_user_id_day_id_key UNIQUE (user_id, day_id);
ALTER TABLE user_ramadan_progress ADD CONSTRAINT user_ramadan_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_ramadan_video_watched ADD CONSTRAINT user_ramadan_video_watched_day_id_fkey FOREIGN KEY (day_id) REFERENCES ramadan_days(id) ON DELETE CASCADE;
ALTER TABLE user_ramadan_video_watched ADD CONSTRAINT user_ramadan_video_watched_pkey PRIMARY KEY (id);
ALTER TABLE user_ramadan_video_watched ADD CONSTRAINT user_ramadan_video_watched_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_ramadan_video_watched ADD CONSTRAINT user_ramadan_video_watched_user_id_video_id_key UNIQUE (user_id, video_id);
ALTER TABLE user_ramadan_video_watched ADD CONSTRAINT user_ramadan_video_watched_video_id_fkey FOREIGN KEY (video_id) REFERENCES ramadan_day_videos(id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE user_sourate_progress ADD CONSTRAINT user_sourate_progress_pkey PRIMARY KEY (id);
ALTER TABLE user_sourate_progress ADD CONSTRAINT user_sourate_progress_sourate_id_fkey FOREIGN KEY (sourate_id) REFERENCES sourates(id) ON DELETE CASCADE;
ALTER TABLE user_sourate_progress ADD CONSTRAINT user_sourate_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_sourate_verse_progress ADD CONSTRAINT user_sourate_verse_progress_pkey PRIMARY KEY (id);
ALTER TABLE user_sourate_verse_progress ADD CONSTRAINT user_sourate_verse_progress_sourate_id_fkey FOREIGN KEY (sourate_id) REFERENCES sourates(id) ON DELETE CASCADE;
ALTER TABLE user_sourate_verse_progress ADD CONSTRAINT user_sourate_verse_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE weekly_program_settings ADD CONSTRAINT weekly_program_settings_id_check CHECK ((id = 1));
ALTER TABLE weekly_program_settings ADD CONSTRAINT weekly_program_settings_pkey PRIMARY KEY (id);
ALTER TABLE weekly_programs ADD CONSTRAINT weekly_programs_pkey PRIMARY KEY (id);
ALTER TABLE weekly_programs ADD CONSTRAINT weekly_programs_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE weekly_programs ADD CONSTRAINT weekly_programs_student_id_week_start_key UNIQUE (student_id, week_start);

-- ===== INDEX =====
CREATE UNIQUE INDEX absence_justifications_pkey ON public.absence_justifications USING btree (id);
CREATE UNIQUE INDEX absence_justifications_student_id_course_date_key ON public.absence_justifications USING btree (student_id, course_date);
CREATE UNIQUE INDEX admin_card_order_pkey ON public.admin_card_order USING btree (id);
CREATE UNIQUE INDEX admin_card_order_user_id_key ON public.admin_card_order USING btree (user_id);
CREATE UNIQUE INDEX admin_conversations_pkey ON public.admin_conversations USING btree (id);
CREATE UNIQUE INDEX admin_conversations_user_id_key ON public.admin_conversations USING btree (user_id);
CREATE UNIQUE INDEX admin_task_templates_pkey ON public.admin_task_templates USING btree (id);
CREATE INDEX admin_tasks_group_idx ON public.admin_tasks USING btree (group_id, done, "position");
CREATE UNIQUE INDEX admin_tasks_pkey ON public.admin_tasks USING btree (id);
CREATE INDEX admin_tasks_remind_idx ON public.admin_tasks USING btree (remind_at) WHERE ((reminded_at IS NULL) AND (done = false));
CREATE UNIQUE INDEX allah_name_media_pkey ON public.allah_name_media USING btree (id);
CREATE UNIQUE INDEX allah_names_pkey ON public.allah_names USING btree (id);
CREATE UNIQUE INDEX alphabet_admin_unlocks_pkey ON public.alphabet_admin_unlocks USING btree (id);
CREATE UNIQUE INDEX alphabet_admin_unlocks_user_letter ON public.alphabet_admin_unlocks USING btree (user_id, letter_id);
CREATE UNIQUE INDEX alphabet_content_pkey ON public.alphabet_content USING btree (id);
CREATE UNIQUE INDEX alphabet_game_scores_pkey ON public.alphabet_game_scores USING btree (id);
CREATE INDEX alphabet_game_scores_user_idx ON public.alphabet_game_scores USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX alphabet_letters_pkey ON public.alphabet_letters USING btree (id);
CREATE UNIQUE INDEX alphabet_line_models_pkey ON public.alphabet_line_models USING btree (id);
CREATE UNIQUE INDEX alphabet_line_models_unique ON public.alphabet_line_models USING btree (letter_id, line_key);
CREATE INDEX alphabet_submissions_pending_idx ON public.alphabet_submissions USING btree (status) WHERE (status = 'pending'::text);
CREATE UNIQUE INDEX alphabet_submissions_pkey ON public.alphabet_submissions USING btree (id);
CREATE INDEX alphabet_submissions_student_idx ON public.alphabet_submissions USING btree (student_id, letter_id, created_at DESC);
CREATE UNIQUE INDEX alphabet_trace_stars_pkey ON public.alphabet_trace_stars USING btree (user_id, letter_id, form);
CREATE UNIQUE INDEX app_appearance_pkey ON public.app_appearance USING btree (key);
CREATE UNIQUE INDEX app_logs_pkey ON public.app_logs USING btree (id);
CREATE UNIQUE INDEX app_versions_pkey ON public.app_versions USING btree (id);
CREATE UNIQUE INDEX attendance_records_pkey ON public.attendance_records USING btree (id);
CREATE UNIQUE INDEX attendance_records_user_id_date_key ON public.attendance_records USING btree (user_id, date);
CREATE UNIQUE INDEX attendance_sessions_pkey ON public.attendance_sessions USING btree (date);
CREATE UNIQUE INDEX auto_reminder_logs_pkey ON public.auto_reminder_logs USING btree (kind, sent_on);
CREATE UNIQUE INDEX behavior_marks_pkey ON public.behavior_marks USING btree (student_id, course_date, kind);
CREATE UNIQUE INDEX bilan_envois_pkey ON public.bilan_envois USING btree (id);
CREATE INDEX bilan_envois_report_idx ON public.bilan_envois USING btree (report_id, sent_at DESC);
CREATE UNIQUE INDEX bilan_reads_pkey ON public.bilan_reads USING btree (report_id, label);
CREATE UNIQUE INDEX connexion_logs_pkey ON public.connexion_logs USING btree (id);
CREATE UNIQUE INDEX coran_progress_pkey ON public.coran_progress USING btree (id);
CREATE UNIQUE INDEX coran_progress_user_id_kind_key_key ON public.coran_progress USING btree (user_id, kind, key);
CREATE UNIQUE INDEX coran_reminder_logs_pkey ON public.coran_reminder_logs USING btree (user_id, sent_on);
CREATE UNIQUE INDEX course_ready_pkey ON public.course_ready USING btree (student_id, course_date);
CREATE UNIQUE INDEX crash_alert_settings_pkey ON public.crash_alert_settings USING btree (id);
CREATE UNIQUE INDEX daily_goals_pkey ON public.daily_goals USING btree (student_id, day);
CREATE UNIQUE INDEX dashboard_card_visibility_card_id_user_id_key ON public.dashboard_card_visibility USING btree (card_id, user_id);
CREATE UNIQUE INDEX dashboard_card_visibility_pkey ON public.dashboard_card_visibility USING btree (id);
CREATE UNIQUE INDEX dashboard_cards_card_key_key ON public.dashboard_cards USING btree (card_key);
CREATE UNIQUE INDEX dashboard_cards_pkey ON public.dashboard_cards USING btree (id);
CREATE UNIQUE INDEX devoir_checks_pkey ON public.devoir_checks USING btree (devoir_id, student_id);
CREATE UNIQUE INDEX devoir_decisions_pkey ON public.devoir_decisions USING btree (devoir_id, student_id);
CREATE UNIQUE INDEX devoir_modeles_pkey ON public.devoir_modeles USING btree (id);
CREATE UNIQUE INDEX devoir_steps_pkey ON public.devoir_steps USING btree (devoir_id, student_id, step);
CREATE UNIQUE INDEX devoir_vues_pkey ON public.devoir_vues USING btree (devoir_id, student_id, kind);
CREATE UNIQUE INDEX devoirs_pkey ON public.devoirs USING btree (id);
CREATE UNIQUE INDEX devoirs_rendus_pkey ON public.devoirs_rendus USING btree (id);
CREATE UNIQUE INDEX devoirs_rendus_un_par_eleve ON public.devoirs_rendus USING btree (devoir_id, student_id);
CREATE UNIQUE INDEX dropout_state_pkey ON public.dropout_state USING btree (student_id);
CREATE UNIQUE INDEX encouragement_logs_pkey ON public.encouragement_logs USING btree (id);
CREATE UNIQUE INDEX group_devoir_settings_pkey ON public.group_devoir_settings USING btree (group_id);
CREATE UNIQUE INDEX group_levels_pkey ON public.group_levels USING btree (id);
CREATE UNIQUE INDEX group_schedules_pkey ON public.group_schedules USING btree (group_id);
CREATE UNIQUE INDEX group_sessions_group_id_session_date_key ON public.group_sessions USING btree (group_id, session_date);
CREATE UNIQUE INDEX group_sessions_pkey ON public.group_sessions USING btree (id);
CREATE UNIQUE INDEX homework_assignments_pkey ON public.homework_assignments USING btree (id);
CREATE UNIQUE INDEX homework_reminder_logs_pkey ON public.homework_reminder_logs USING btree (devoir_id, student_id);
CREATE UNIQUE INDEX homework_submissions_assignment_id_user_id_key ON public.homework_submissions USING btree (assignment_id, user_id);
CREATE UNIQUE INDEX homework_submissions_pkey ON public.homework_submissions USING btree (id);
CREATE UNIQUE INDEX invocation_content_pkey ON public.invocation_content USING btree (id);
CREATE UNIQUE INDEX invocation_validation_one_pending ON public.invocation_validation_requests USING btree (user_id, invocation_id) WHERE (status = 'pending'::text);
CREATE UNIQUE INDEX invocation_validation_requests_pkey ON public.invocation_validation_requests USING btree (id);
CREATE UNIQUE INDEX invocations_pkey ON public.invocations USING btree (id);
CREATE UNIQUE INDEX learning_modules_pkey ON public.learning_modules USING btree (id);
CREATE UNIQUE INDEX mascotte_usage_pkey ON public.mascotte_usage USING btree (user_id, jour);
CREATE UNIQUE INDEX module_card_content_pkey ON public.module_card_content USING btree (id);
CREATE UNIQUE INDEX module_cards_pkey ON public.module_cards USING btree (id);
CREATE UNIQUE INDEX module_content_pkey ON public.module_content USING btree (id);
CREATE UNIQUE INDEX module_flashcards_pkey ON public.module_flashcards USING btree (id);
CREATE UNIQUE INDEX module_visibility_module_id_key ON public.module_visibility USING btree (module_id);
CREATE UNIQUE INDEX module_visibility_pkey ON public.module_visibility USING btree (id);
CREATE INDEX module_visits_day_idx ON public.module_visits USING btree (day);
CREATE UNIQUE INDEX module_visits_pkey ON public.module_visits USING btree (user_id, module_id, day);
CREATE UNIQUE INDEX notification_confirmations_notification_id_user_id_key ON public.notification_confirmations USING btree (notification_id, user_id);
CREATE UNIQUE INDEX notification_confirmations_pkey ON public.notification_confirmations USING btree (id);
CREATE UNIQUE INDEX notification_history_pkey ON public.notification_history USING btree (id);
CREATE UNIQUE INDEX notification_invitations_pkey ON public.notification_invitations USING btree (id);
CREATE UNIQUE INDEX notification_invitations_user_id_key ON public.notification_invitations USING btree (user_id);
CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (id);
CREATE UNIQUE INDEX notification_preferences_user_id_key ON public.notification_preferences USING btree (user_id);
CREATE UNIQUE INDEX nourania_admin_unlocks_pkey ON public.nourania_admin_unlocks USING btree (id);
CREATE UNIQUE INDEX nourania_admin_unlocks_student_id_lesson_id_key ON public.nourania_admin_unlocks USING btree (student_id, lesson_id);
CREATE UNIQUE INDEX nourania_commentaires_eleves_lecon_id_student_id_key ON public.nourania_commentaires_eleves USING btree (lecon_id, student_id);
CREATE UNIQUE INDEX nourania_commentaires_eleves_pkey ON public.nourania_commentaires_eleves USING btree (id);
CREATE UNIQUE INDEX nourania_lesson_content_pkey ON public.nourania_lesson_content USING btree (id);
CREATE UNIQUE INDEX nourania_lessons_lesson_number_key ON public.nourania_lessons USING btree (lesson_number);
CREATE UNIQUE INDEX nourania_lessons_pkey ON public.nourania_lessons USING btree (id);
CREATE UNIQUE INDEX nourania_validation_one_pending ON public.nourania_validation_requests USING btree (user_id, lesson_id) WHERE (status = 'pending'::text);
CREATE UNIQUE INDEX nourania_validation_requests_pkey ON public.nourania_validation_requests USING btree (id);
CREATE UNIQUE INDEX parent_codes_child_id_label_key ON public.parent_codes USING btree (child_id, label);
CREATE UNIQUE INDEX parent_codes_pkey ON public.parent_codes USING btree (id);
CREATE UNIQUE INDEX parent_links_pkey ON public.parent_links USING btree (parent_id, child_id);
CREATE UNIQUE INDEX parent_lock_settings_pkey ON public.parent_lock_settings USING btree (user_id);
CREATE UNIQUE INDEX point_settings_action_key_key ON public.point_settings USING btree (action_key);
CREATE UNIQUE INDEX point_settings_pkey ON public.point_settings USING btree (id);
CREATE UNIQUE INDEX prayer_card_content_pkey ON public.prayer_card_content USING btree (id);
CREATE UNIQUE INDEX prayer_cards_pkey ON public.prayer_cards USING btree (id);
CREATE UNIQUE INDEX prayer_categories_pkey ON public.prayer_categories USING btree (id);
CREATE UNIQUE INDEX prayer_content_pkey ON public.prayer_content USING btree (id);
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id);
CREATE UNIQUE INDEX program_rewards_pkey ON public.program_rewards USING btree (program_id, kind);
CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id);
CREATE UNIQUE INDEX push_subscriptions_user_id_endpoint_key ON public.push_subscriptions USING btree (user_id, endpoint);
CREATE UNIQUE INDEX quiz_responses_pkey ON public.quiz_responses USING btree (id);
CREATE UNIQUE INDEX quiz_responses_user_id_quiz_id_key ON public.quiz_responses USING btree (user_id, quiz_id);
CREATE UNIQUE INDEX ramadan_day_activities_pkey ON public.ramadan_day_activities USING btree (id);
CREATE UNIQUE INDEX ramadan_day_exceptions_day_id_user_id_key ON public.ramadan_day_exceptions USING btree (day_id, user_id);
CREATE UNIQUE INDEX ramadan_day_exceptions_pkey ON public.ramadan_day_exceptions USING btree (id);
CREATE UNIQUE INDEX ramadan_day_videos_pkey ON public.ramadan_day_videos USING btree (id);
CREATE UNIQUE INDEX ramadan_days_day_number_key ON public.ramadan_days USING btree (day_number);
CREATE UNIQUE INDEX ramadan_days_pkey ON public.ramadan_days USING btree (id);
CREATE UNIQUE INDEX ramadan_quizzes_pkey ON public.ramadan_quizzes USING btree (id);
CREATE UNIQUE INDEX ramadan_settings_pkey ON public.ramadan_settings USING btree (id);
CREATE UNIQUE INDEX scheduled_notifications_pkey ON public.scheduled_notifications USING btree (id);
CREATE UNIQUE INDEX school_holidays_pkey ON public.school_holidays USING btree (id);
CREATE UNIQUE INDEX sourate_admin_unlocks_pkey ON public.sourate_admin_unlocks USING btree (id);
CREATE UNIQUE INDEX sourate_admin_unlocks_user_id_sourate_id_key ON public.sourate_admin_unlocks USING btree (user_id, sourate_id);
CREATE UNIQUE INDEX sourate_content_pkey ON public.sourate_content USING btree (id);
CREATE INDEX sourate_recitations_allah_name_idx ON public.sourate_recitations USING btree (allah_name_id) WHERE (allah_name_id IS NOT NULL);
CREATE UNIQUE INDEX sourate_recitations_pkey ON public.sourate_recitations USING btree (id);
CREATE UNIQUE INDEX sourate_stories_pkey ON public.sourate_stories USING btree (sourate_number);
CREATE UNIQUE INDEX sourate_validation_one_pending ON public.sourate_validation_requests USING btree (user_id, sourate_id) WHERE (status = 'pending'::text);
CREATE UNIQUE INDEX sourate_validation_requests_pkey ON public.sourate_validation_requests USING btree (id);
CREATE UNIQUE INDEX sourate_versets_audio_pkey ON public.sourate_versets_audio USING btree (id);
CREATE UNIQUE INDEX sourate_versets_audio_sourate_id_verset_number_key ON public.sourate_versets_audio USING btree (sourate_id, verset_number);
CREATE UNIQUE INDEX sourates_number_key ON public.sourates USING btree (number);
CREATE UNIQUE INDEX sourates_pkey ON public.sourates USING btree (id);
CREATE UNIQUE INDEX student_group_members_group_id_user_id_key ON public.student_group_members USING btree (group_id, user_id);
CREATE UNIQUE INDEX student_group_members_pkey ON public.student_group_members USING btree (id);
CREATE UNIQUE INDEX student_groups_pkey ON public.student_groups USING btree (id);
CREATE UNIQUE INDEX student_passwords_pkey ON public.student_passwords USING btree (user_id);
CREATE UNIQUE INDEX student_ranking_pkey ON public.student_ranking USING btree (id);
CREATE UNIQUE INDEX student_ranking_user_id_key ON public.student_ranking USING btree (user_id);
CREATE UNIQUE INDEX student_reports_pkey ON public.student_reports USING btree (id);
CREATE UNIQUE INDEX student_reports_share_token_key ON public.student_reports USING btree (share_token);
CREATE UNIQUE INDEX student_reports_student_id_period_label_key ON public.student_reports USING btree (student_id, period_label);
CREATE UNIQUE INDEX trash_items_pkey ON public.trash_items USING btree (id);
CREATE UNIQUE INDEX user_allah_name_progress_pkey ON public.user_allah_name_progress USING btree (id);
CREATE UNIQUE INDEX user_allah_name_progress_user_name_unique ON public.user_allah_name_progress USING btree (user_id, name_id);
CREATE UNIQUE INDEX user_alphabet_progress_pkey ON public.user_alphabet_progress USING btree (id);
CREATE UNIQUE INDEX user_alphabet_progress_user_id_letter_id_key ON public.user_alphabet_progress USING btree (user_id, letter_id);
CREATE UNIQUE INDEX user_daily_prayers_pkey ON public.user_daily_prayers USING btree (id);
CREATE UNIQUE INDEX user_daily_prayers_user_id_date_key ON public.user_daily_prayers USING btree (user_id, date);
CREATE UNIQUE INDEX user_flashcard_learned_pkey ON public.user_flashcard_learned USING btree (user_id, flashcard_id);
CREATE UNIQUE INDEX user_grammaire_progress_pkey ON public.user_grammaire_progress USING btree (user_id, card_id);
CREATE UNIQUE INDEX user_invocation_progress_pkey ON public.user_invocation_progress USING btree (id);
CREATE UNIQUE INDEX user_invocation_progress_user_id_invocation_id_key ON public.user_invocation_progress USING btree (user_id, invocation_id);
CREATE UNIQUE INDEX user_messages_pkey ON public.user_messages USING btree (id);
CREATE UNIQUE INDEX user_nourania_progress_pkey ON public.user_nourania_progress USING btree (id);
CREATE UNIQUE INDEX user_nourania_progress_user_id_lesson_id_key ON public.user_nourania_progress USING btree (user_id, lesson_id);
CREATE UNIQUE INDEX user_prayer_progress_pkey ON public.user_prayer_progress USING btree (id);
CREATE UNIQUE INDEX user_prayer_progress_user_id_card_id_key ON public.user_prayer_progress USING btree (user_id, card_id);
CREATE UNIQUE INDEX user_ramadan_fasting_pkey ON public.user_ramadan_fasting USING btree (id);
CREATE UNIQUE INDEX user_ramadan_fasting_user_day_unique ON public.user_ramadan_fasting USING btree (user_id, day_number);
CREATE UNIQUE INDEX user_ramadan_progress_pkey ON public.user_ramadan_progress USING btree (id);
CREATE UNIQUE INDEX user_ramadan_progress_user_id_day_id_key ON public.user_ramadan_progress USING btree (user_id, day_id);
CREATE UNIQUE INDEX user_ramadan_video_watched_pkey ON public.user_ramadan_video_watched USING btree (id);
CREATE UNIQUE INDEX user_ramadan_video_watched_user_id_video_id_key ON public.user_ramadan_video_watched USING btree (user_id, video_id);
CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);
CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);
CREATE UNIQUE INDEX idx_usp_user_sourate_context ON public.user_sourate_progress USING btree (user_id, sourate_id, context);
CREATE UNIQUE INDEX user_sourate_progress_pkey ON public.user_sourate_progress USING btree (id);
CREATE UNIQUE INDEX idx_usvp_user_sourate_verse_context ON public.user_sourate_verse_progress USING btree (user_id, sourate_id, verse_number, context);
CREATE UNIQUE INDEX user_sourate_verse_progress_pkey ON public.user_sourate_verse_progress USING btree (id);
CREATE UNIQUE INDEX weekly_program_settings_pkey ON public.weekly_program_settings USING btree (id);
CREATE UNIQUE INDEX weekly_programs_pkey ON public.weekly_programs USING btree (id);
CREATE UNIQUE INDEX weekly_programs_student_id_week_start_key ON public.weekly_programs USING btree (student_id, week_start);

-- ===== FONCTIONS =====
CREATE OR REPLACE FUNCTION public.absence_alert_targets()
 RETURNS TABLE(record_id uuid, student_id uuid, full_name text, gender text, parent_ids uuid[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.id, a.user_id, p.full_name, p.gender,
         COALESCE((SELECT array_agg(l.parent_id) FROM parent_links l WHERE l.child_id = a.user_id), '{}')
  FROM attendance_records a JOIN profiles p ON p.user_id = a.user_id
  WHERE a.status = 'absent' AND a.absence_alert_sent_at IS NULL
    AND a.date = (now() AT TIME ZONE 'Europe/Paris')::date
    AND NOT EXISTS (SELECT 1 FROM absence_justifications j WHERE j.student_id = a.user_id AND j.course_date = a.date)
    AND EXISTS (SELECT 1 FROM student_group_members m JOIN group_schedules s ON s.group_id = m.group_id
                WHERE m.user_id = a.user_id AND s.weekday = extract(isodow FROM a.date)
                  AND (now() AT TIME ZONE 'Europe/Paris')::time BETWEEN s.start_time + interval '15 minutes' AND s.start_time + interval '4 hours');
$function$;

CREATE OR REPLACE FUNCTION public.admin_students_auth_status()
 RETURNS TABLE(user_id uuid, email_confirmed boolean, last_sign_in_at timestamp with time zone, recovery_sent_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Réservé à l''admin';
  END IF;
  RETURN QUERY SELECT u.id, u.email_confirmed_at IS NOT NULL, u.last_sign_in_at, u.recovery_sent_at FROM auth.users u;
END;
$function$;

CREATE OR REPLACE FUNCTION public.alphabet_self_validate(p_letter_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_age integer;
  v_dob date;
BEGIN
  SELECT age, date_of_birth INTO v_age, v_dob FROM profiles WHERE user_id = auth.uid();
  IF v_dob IS NOT NULL THEN v_age := date_part('year', age(current_date, v_dob)); END IF;
  IF COALESCE(v_age, 0) < 20 THEN RAISE EXCEPTION 'Validation réservée à l''enseignante'; END IF;
  UPDATE user_alphabet_progress SET is_validated = true, completed_at = now() WHERE user_id = auth.uid() AND letter_id = p_letter_id;
  IF NOT FOUND THEN
    INSERT INTO user_alphabet_progress (user_id, letter_id, is_validated, is_completed, completed_at) VALUES (auth.uid(), p_letter_id, true, true, now());
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.attendance_student_groups()
 RETURNS TABLE(user_id uuid, group_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT m.user_id, m.group_id FROM student_group_members m
  JOIN profiles p ON p.user_id = m.user_id AND p.is_approved = true;
$function$;

CREATE OR REPLACE FUNCTION public.bilan_mark_read(p_report uuid, p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE c uuid; l text;
BEGIN
  SELECT student_id INTO c FROM student_reports WHERE id = p_report;
  IF c IS NULL OR NOT public.can_act_for_child(c) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  l := public.parent_code_label(c, p_code);
  IF l IS NULL THEN RAISE EXCEPTION 'Code parents incorrect'; END IF;
  INSERT INTO bilan_reads (report_id, label) VALUES (p_report, l) ON CONFLICT DO NOTHING;
END $function$;

CREATE OR REPLACE FUNCTION public.bilan_public(p_token text, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r student_reports; l text; nom text;
BEGIN
  SELECT * INTO r FROM student_reports WHERE share_token = p_token AND sent_at IS NOT NULL;
  IF r.id IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Lien inconnu'; END IF;
  l := public.parent_code_label(r.student_id, p_code);
  IF l IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Code parents incorrect'; END IF;
  INSERT INTO bilan_reads (report_id, label) VALUES (r.id, l) ON CONFLICT DO NOTHING;
  SELECT full_name INTO nom FROM profiles WHERE user_id = r.student_id;
  RETURN jsonb_build_object('id', r.id, 'full_name', nom, 'period_label', r.period_label, 'snapshot', r.snapshot, 'guide', r.guide,
    'appreciation', r.appreciation, 'motivation', r.motivation, 'note', CASE WHEN r.show_note THEN r.note END,
    'traduction', r.traduction, 'langue_ar', r.langue_ar, 'sent_at', r.sent_at);
END $function$;

CREATE OR REPLACE FUNCTION public.can_act_for_child(p_child uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid() = p_child OR public.is_parent_of(auth.uid(), p_child) OR public.has_role(auth.uid(), 'admin'::public.app_role);
$function$;

CREATE OR REPLACE FUNCTION public.claim_program_reward(p_kind text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE w record; items jsonb; all_done boolean; deadline date; late boolean;
BEGIN
  IF p_kind NOT IN ('tresor', 'bonus') THEN RETURN false; END IF;
  SELECT * INTO w FROM weekly_programs WHERE student_id = auth.uid() ORDER BY week_start DESC LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  items := program_items(w.student_id, w.week_start, w.items);
  IF jsonb_array_length(items) = 0 THEN RETURN false; END IF;
  SELECT bool_and(program_item_done(w.student_id, x->>'module', x->>'item_id')) INTO all_done FROM jsonb_array_elements(items) x;
  IF NOT all_done THEN RETURN false; END IF;
  IF p_kind = 'bonus' THEN
    deadline := program_deadline(w.week_start, items);
    SELECT bool_or(CASE
        WHEN x->>'due' IS NOT NULL THEN program_item_done_at(w.student_id, x->>'module', x->>'item_id') > (x->>'due')::timestamptz
        ELSE (program_item_done_at(w.student_id, x->>'module', x->>'item_id') AT TIME ZONE 'Europe/Paris')::date >= deadline END)
      INTO late FROM jsonb_array_elements(items) x;
    IF COALESCE(late, false) THEN RETURN false; END IF;
  END IF;
  INSERT INTO program_rewards (program_id, user_id, kind) VALUES (w.id, w.student_id, p_kind) ON CONFLICT DO NOTHING;
  RETURN true;
END $function$;

CREATE OR REPLACE FUNCTION public.class_program_streaks()
 RETURNS TABLE(student_id uuid, streak integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  RETURN QUERY SELECT DISTINCT w.student_id, public.program_streak(w.student_id) FROM weekly_programs w;
END $function$;

CREATE OR REPLACE FUNCTION public.course_reminder_targets()
 RETURNS TABLE(user_id uuid, full_name text, gender text, sourate text, lecon text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.user_id, p.full_name, p.gender,
    (SELECT split_part(s.name_french, ' (', 1) FROM sourates s
      WHERE NOT EXISTS (SELECT 1 FROM user_sourate_progress u WHERE u.user_id = p.user_id AND u.sourate_id = s.id AND u.is_validated AND u.context = 'sourates')
      ORDER BY CASE WHEN s.number = 1000 THEN 111.5 ELSE s.number END DESC LIMIT 1),
    (SELECT 'leçon ' || l.lesson_number FROM nourania_lessons l
      WHERE NOT EXISTS (SELECT 1 FROM user_nourania_progress u WHERE u.user_id = p.user_id AND u.lesson_id = l.id AND u.is_validated)
      ORDER BY l.lesson_number LIMIT 1)
  FROM profiles p
  WHERE p.is_approved AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin');
$function$;

CREATE OR REPLACE FUNCTION public.date_de_validation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare col text := tg_argv[0];
begin
  if coalesce(new.is_validated, false)
     and (tg_op = 'INSERT' or not coalesce(old.is_validated, false))
     and (to_jsonb(new) ->> col) is null then
    new := jsonb_populate_record(new, jsonb_build_object(col, now()));
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.devoirs_rendus_trace_refait()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.statut = 'a_refaire' THEN NEW.a_ete_refait := true; END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.dropout_level_of(p_missed integer, p_last timestamp with time zone, p_joined timestamp with time zone)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_missed >= 2 OR COALESCE(p_last, p_joined) <= now() - interval '21 days' THEN 'red'
    WHEN p_missed = 1 THEN 'orange'
    ELSE NULL END;
$function$;

CREATE OR REPLACE FUNCTION public.eleves_connectes_30j()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select distinct user_id from connexion_logs
  where login_at > now() - interval '30 days' and public.has_role(auth.uid(), 'admin'::app_role);
$function$;

CREATE OR REPLACE FUNCTION public.est_adulte(p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (select case when date_of_birth is not null
                 then date_part('year', age((now() at time zone 'Europe/Paris')::date, date_of_birth)) >= 20
                 else coalesce(age, 0) >= 20 end
       from profiles where user_id = p_user),
    false)
$function$;

CREATE OR REPLACE FUNCTION public.est_hors_classement(_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select hors_classement from public.profiles where user_id = _user), false)
$function$;

CREATE OR REPLACE FUNCTION public.find_students_by_first_name(p_first text)
 RETURNS TABLE(user_id uuid, display text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH norm AS (SELECT translate(lower(btrim(p_first)), 'àâäáãéèêëíìîïóòôöõúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') AS q)
  SELECT p.user_id,
         split_part(btrim(p.full_name), ' ', 1) || COALESCE(' ' || NULLIF(left(btrim(substr(btrim(p.full_name), length(split_part(btrim(p.full_name), ' ', 1)) + 1)), 1), '') || '.', '')
  FROM profiles p, norm
  WHERE length(norm.q) >= 2 AND auth.uid() IS NOT NULL AND p.user_id <> auth.uid() AND p.is_approved
    AND NOT public.has_role(p.user_id, 'admin'::public.app_role)
    AND translate(lower(split_part(btrim(p.full_name), ' ', 1)), 'àâäáãéèêëíìîïóòôöõúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') = norm.q
  ORDER BY p.full_name LIMIT 10;
$function$;

CREATE OR REPLACE FUNCTION public.garde_alphabet_scores()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'admin'::app_role) then
    new.played_on := (now() at time zone 'Europe/Paris')::date;
    new.created_at := now();
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.garde_profil_eleve()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  if old.date_of_birth is not null then
    new.date_of_birth := old.date_of_birth;
    new.age := old.age;
  elsif new.date_of_birth is not null then
    new.age := date_part('year', age((now() at time zone 'Europe/Paris')::date, new.date_of_birth))::int;
  else
    new.age := old.age;   -- l'âge seul (sans date) ne se change pas par l'élève
  end if;
  if coalesce(old.dob_set_by_user, false) then new.dob_set_by_user := true; end if;
  new.hors_classement := old.hors_classement;
  new.presence_tous_groupes := old.presence_tous_groupes;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.garde_user_messages()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tmp public.user_messages;
begin
  -- tâches serveur (pas d'utilisateur) et admin : libres
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  if tg_op = 'INSERT' then
    if new.user_id is distinct from auth.uid()
       or coalesce(new.sender_type, 'user') <> 'user'
       or coalesce(new.message_type, 'text') not in ('text', 'audio')
       or (new.sender_id is not null and new.sender_id <> auth.uid())
       or new.receiver_id is not null then
      raise exception 'Message refusé : un élève ne peut écrire que dans sa propre conversation';
    end if;
    return new;
  end if;
  -- UPDATE : seuls is_read / read_at / deleted_at peuvent changer
  tmp := new;
  tmp.is_read := old.is_read; tmp.read_at := old.read_at; tmp.deleted_at := old.deleted_at;
  if tmp is distinct from old then
    raise exception 'Modification refusée : seul l''état « lu » ou « supprimé » peut changer';
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.garde_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare ok boolean;
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  -- un élève peut toujours enlever une validation, ou ne rien changer
  if not coalesce(new.is_validated, false) then return new; end if;
  if tg_op = 'UPDATE' and coalesce(old.is_validated, false) then return new; end if;
  ok := public.est_adulte(auth.uid());
  if not ok and tg_table_name = 'user_nourania_progress' then
    ok := exists (select 1 from nourania_admin_unlocks u
                  where u.student_id = auth.uid() and u.lesson_id = (to_jsonb(new) ->> 'lesson_id')::int);
  end if;
  if not ok then
    raise exception 'Validation réservée à l''enseignante';
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.generate_weekly_programs(p_week date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE s record; it jsonb; last_idx smallint; idx smallint; n integer := 0; excluded uuid[];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  SELECT disabled_group_ids INTO excluded FROM weekly_program_settings WHERE id = 1;
  FOR s IN SELECT p.user_id FROM profiles p
    WHERE p.is_approved AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin')
      AND NOT EXISTS (SELECT 1 FROM student_group_members g WHERE g.user_id = p.user_id AND g.group_id = ANY(COALESCE(excluded, '{}')))
  LOOP
    it := next_program_items(s.user_id);
    SELECT w.message_index INTO last_idx FROM weekly_programs w WHERE w.student_id = s.user_id ORDER BY week_start DESC LIMIT 1;
    idx := floor(random() * 24)::smallint;
    IF idx = last_idx THEN idx := ((idx + 1) % 24)::smallint; END IF; -- jamais le même message 2 semaines de suite
    INSERT INTO weekly_programs (student_id, week_start, items, message_index) VALUES (s.user_id, p_week, it, idx)
      ON CONFLICT (student_id, week_start) DO NOTHING;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;
  RETURN n;
END $function$;

CREATE OR REPLACE FUNCTION public.get_pending_registrations()
 RETURNS TABLE(user_id uuid, email text, full_name text, gender text, age integer, created_at timestamp with time zone, is_approved boolean, date_of_birth date)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$                                        
    SELECT          
      p.user_id,                                                                       
      u.email,  
      p.full_name,                                                                     
      p.gender,                                             
      p.age,   
      p.created_at,
      p.is_approved,
      p.date_of_birth
    FROM profiles p                                                                    
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.is_approved = false                                                        
    AND u.email_confirmed_at IS NOT NULL                    
    ORDER BY p.created_at DESC;         
  $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, is_approved, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false,
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$;

CREATE OR REPLACE FUNCTION public.is_parent_of(p_parent uuid, p_child uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from parent_links where parent_id = p_parent and child_id = p_child and confirme);
$function$;

CREATE OR REPLACE FUNCTION public.is_user_in_group(_group_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.student_group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.justify_absence(p_child uuid, p_code text, p_dates date[], p_reason text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE l text;
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  l := public.parent_code_label(p_child, p_code);
  IF l IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Code parents incorrect'; END IF;
  INSERT INTO absence_justifications (student_id, course_date, reason, declared_by, declared_label)
    SELECT p_child, d, NULLIF(btrim(p_reason), ''), auth.uid(), l FROM unnest(p_dates) d
  ON CONFLICT (student_id, course_date) DO UPDATE SET reason = EXCLUDED.reason, declared_by = EXCLUDED.declared_by, declared_label = EXCLUDED.declared_label, created_at = now();
  INSERT INTO attendance_records (user_id, date, status, notes)
    SELECT p_child, d, 'justified', NULLIF(btrim(p_reason), '') FROM unnest(p_dates) d
  ON CONFLICT (user_id, date) DO UPDATE SET status = 'justified', notes = COALESCE(EXCLUDED.notes, attendance_records.notes)
    WHERE attendance_records.status = 'absent';
  RETURN l;
END $function$;

CREATE OR REPLACE FUNCTION public.link_children(p_children uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE n int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  INSERT INTO parent_links (parent_id, child_id)
    SELECT auth.uid(), c FROM unnest(p_children) c JOIN profiles p ON p.user_id = c AND p.is_approved
    WHERE c <> auth.uid() ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE profiles SET children_question = 'oui' WHERE user_id = auth.uid();
  RETURN n;
END $function$;

CREATE OR REPLACE FUNCTION public.mark_attendance_message_seen(p_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE attendance_records SET message_seen_at = now() WHERE id = p_id AND user_id = auth.uid() AND message_seen_at IS NULL;
$function$;

CREATE OR REPLACE FUNCTION public.mark_comeback_seen()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE dropout_state SET comeback_seen = true WHERE student_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.mascotte_compter(p_user uuid)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into mascotte_usage (user_id, jour, questions)
  values (p_user, (now() at time zone 'Europe/Paris')::date, 1)
  on conflict (user_id, jour) do update set questions = mascotte_usage.questions + 1
  returning questions;
$function$;

CREATE OR REPLACE FUNCTION public.module_visible_for(p_path text, p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((
    SELECT CASE
      WHEN v.visibility_type = 'users' THEN p_user = ANY(v.user_ids)
      WHEN v.visibility_type = 'groups' THEN EXISTS (SELECT 1 FROM student_group_members g WHERE g.user_id = p_user AND g.group_id = ANY(v.group_ids))
      ELSE m.is_active END
    FROM learning_modules m LEFT JOIN module_visibility v ON v.module_id = m.id
    WHERE m.builtin_path = p_path LIMIT 1), false);
$function$;

CREATE OR REPLACE FUNCTION public.monitoring_annee()
 RETURNS TABLE(mois date, inscriptions integer, connexions integer, actifs integer, validations integer, messages integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  WITH m AS (SELECT generate_series(date_trunc('month', now() AT TIME ZONE 'Europe/Paris') - interval '11 months',
                                    date_trunc('month', now() AT TIME ZONE 'Europe/Paris'), interval '1 month')::date AS mois)
  SELECT m.mois,
    (SELECT count(*)::int FROM profiles p WHERE date_trunc('month', p.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois),
    (SELECT count(*)::int FROM connexion_logs c WHERE date_trunc('month', c.login_at AT TIME ZONE 'Europe/Paris')::date = m.mois),
    (SELECT count(DISTINCT c.user_id)::int FROM connexion_logs c WHERE date_trunc('month', c.login_at AT TIME ZONE 'Europe/Paris')::date = m.mois),
    ((SELECT count(*) FROM sourate_validation_requests v WHERE date_trunc('month', v.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois)
     + (SELECT count(*) FROM nourania_validation_requests v WHERE date_trunc('month', v.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois)
     + (SELECT count(*) FROM invocation_validation_requests v WHERE date_trunc('month', v.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois)
     + (SELECT count(*) FROM sourate_recitations v WHERE date_trunc('month', v.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois))::int,
    (SELECT count(*)::int FROM user_messages u WHERE date_trunc('month', u.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois)
  FROM m ORDER BY m.mois;
END $function$;

CREATE OR REPLACE FUNCTION public.move_attendance_session(p_from date, p_to date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  IF p_from = p_to THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM attendance_sessions WHERE date = p_to) OR EXISTS (SELECT 1 FROM attendance_records WHERE date = p_to) THEN
    RAISE EXCEPTION 'Il y a déjà une séance le %', to_char(p_to, 'DD/MM/YYYY');
  END IF;
  INSERT INTO attendance_sessions (date, created_by) VALUES (p_to, auth.uid());
  UPDATE attendance_records SET date = p_to WHERE date = p_from;
  DELETE FROM attendance_sessions WHERE date = p_from;
END $function$;

CREATE OR REPLACE FUNCTION public.my_program_streak()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT public.program_streak(auth.uid()); $function$;

CREATE OR REPLACE FUNCTION public.nettoyage_historiques()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron'
AS $function$
declare v_admin uuid; v_limite timestamptz := now() - interval '13 months'; n_cron int; n_cx int; n_nh int; v_rows jsonb;
begin
  delete from cron.job_run_details where end_time < now() - interval '7 days';
  get diagnostics n_cron = row_count;

  select user_id into v_admin from user_roles where role = 'admin' order by user_id limit 1;
  if v_admin is null then return 'pas d''admin'; end if;

  select jsonb_agg(to_jsonb(c)), count(*) into v_rows, n_cx from connexion_logs c where created_at < v_limite;
  if n_cx > 0 then
    insert into trash_items (user_id, item_type, item_data, original_id, label)
    values (v_admin, 'connexion_logs', v_rows, 'avant-' || to_char(v_limite, 'YYYY-MM-DD'),
            'Historique des connexions de plus de 13 mois (' || n_cx || ')');
    delete from connexion_logs where created_at < v_limite;
  end if;

  select jsonb_agg(to_jsonb(h)), count(*) into v_rows, n_nh from notification_history h where created_at < v_limite;
  if n_nh > 0 then
    insert into trash_items (user_id, item_type, item_data, original_id, label)
    values (v_admin, 'notification_history', v_rows, 'avant-' || to_char(v_limite, 'YYYY-MM-DD'),
            'Historique des notifications de plus de 13 mois (' || n_nh || ')');
    delete from notification_history where created_at < v_limite;
  end if;

  return format('journal cron : %s, connexions : %s, notifications : %s', n_cron, n_cx, n_nh);
end $function$;

CREATE OR REPLACE FUNCTION public.next_program_items(p_user uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE items jsonb := '[]'::jsonb; r record;
BEGIN
  IF module_visible_for('/allah-names', p_user) THEN
    SELECT a.id::text AS id, 'Nom n° ' || a.display_order || COALESCE(' · ' || NULLIF(a.transliteration, ''), '') AS detail INTO r FROM allah_names a
      WHERE NOT EXISTS (SELECT 1 FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id = a.id AND u.is_validated)
      ORDER BY a.display_order LIMIT 1;
    IF FOUND THEN items := items || jsonb_build_object('module','allah_names','item_id',r.id,'label','99 Noms','detail',r.detail,'path','/allah-names','emoji','🌟'); END IF;
  END IF;
  RETURN items;
END $function$;

CREATE OR REPLACE FUNCTION public.parent_bilans(p_child uuid, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF public.parent_code_label(p_child, p_code) IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Code parents incorrect'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', r.id, 'period_label', r.period_label, 'snapshot', r.snapshot, 'guide', r.guide, 'appreciation', r.appreciation,
      'motivation', r.motivation, 'note', CASE WHEN r.show_note THEN r.note END, 'traduction', r.traduction, 'langue_ar', r.langue_ar,
      'sent_at', r.sent_at, 'lu', EXISTS (SELECT 1 FROM bilan_reads b WHERE b.report_id = r.id)) ORDER BY r.sent_at DESC)
    FROM student_reports r WHERE r.student_id = p_child AND r.sent_at IS NOT NULL AND r.snapshot IS NOT NULL), '[]'::jsonb);
END $function$;

CREATE OR REPLACE FUNCTION public.parent_child_devoirs(p_child uuid, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF public.parent_code_label(p_child, p_code) IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Code parents incorrect'; END IF;
  RETURN jsonb_build_object(
    'groups', COALESCE((SELECT jsonb_agg(group_id) FROM student_group_members WHERE user_id = p_child), '[]'::jsonb),
    'devoirs', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.titre, 'type', d.type, 'created_at', d.created_at,
        'visible_a', d.visible_a, 'date_limite', d.date_limite, 'group_id', d.group_id,
        'statut', (SELECT r.statut FROM devoirs_rendus r WHERE r.devoir_id = d.id AND r.student_id = p_child LIMIT 1),
        'rendu_at', (SELECT r.rendu_at FROM devoirs_rendus r WHERE r.devoir_id = d.id AND r.student_id = p_child LIMIT 1)) ORDER BY d.created_at DESC)
      FROM devoirs d
      WHERE (d.assigned_to = 'all' OR d.student_id = p_child OR d.group_id IN (SELECT group_id FROM student_group_members WHERE user_id = p_child))
        AND (d.visible_a IS NULL OR d.visible_a <= now()) AND d.created_at >= now() - interval '45 days'), '[]'::jsonb));
END $function$;

CREATE OR REPLACE FUNCTION public.parent_children()
 RETURNS TABLE(child_id uuid, full_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select l.child_id, p.full_name from parent_links l join profiles p on p.user_id = l.child_id
  where l.parent_id = auth.uid() and l.confirme order by lower(p.full_name);
$function$;

CREATE OR REPLACE FUNCTION public.parent_code_change(p_child uuid, p_label text, p_old text, p_new text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE r parent_codes%ROWTYPE;
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_new IS NULL OR length(p_new) < 1 OR length(p_new) > 60 THEN RAISE EXCEPTION 'Écrivez un nouveau code (60 caractères au plus)'; END IF;
  SELECT * INTO r FROM parent_codes WHERE child_id = p_child AND label = p_label;
  IF NOT FOUND THEN RAISE EXCEPTION 'Code introuvable'; END IF;
  IF p_old IS NULL OR r.code_hash <> extensions.crypt(p_old, r.code_hash) THEN
    PERFORM pg_sleep(0.5); -- freine les essais au hasard
    RAISE EXCEPTION 'Ancien code incorrect';
  END IF;
  UPDATE parent_codes SET code_hash = extensions.crypt(p_new, extensions.gen_salt('bf')), updated_at = now() WHERE id = r.id;
  RETURN r.label;
END $function$;

CREATE OR REPLACE FUNCTION public.parent_code_check(p_child uuid, p_code text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE l text;
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  l := public.parent_code_label(p_child, p_code);
  IF l IS NULL THEN PERFORM pg_sleep(0.5); END IF; -- freine les essais au hasard
  RETURN l;
END $function$;

CREATE OR REPLACE FUNCTION public.parent_code_create(p_child uuid, p_label text, p_code text, p_current text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE n int;
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  -- Code libre (2026-10-30, demande de Nadia) : lettres et/ou chiffres, minuscules et/ou majuscules, sans longueur imposée
  IF p_code IS NULL OR length(p_code) < 1 OR length(p_code) > 60 THEN RAISE EXCEPTION 'Écrivez un code (60 caractères au plus)'; END IF;
  IF COALESCE(btrim(p_label), '') = '' THEN RAISE EXCEPTION 'Indiquez qui crée le code (ex. Maman)'; END IF;
  SELECT count(*) INTO n FROM parent_codes WHERE child_id = p_child;
  IF n >= 2 THEN RAISE EXCEPTION 'Il y a déjà 2 codes pour cet enfant'; END IF;
  -- Un 2e code ne peut être créé que par quelqu'un qui connaît déjà le 1er
  IF n > 0 AND (p_current IS NULL OR public.parent_code_label(p_child, p_current) IS NULL) THEN RAISE EXCEPTION 'Code actuel incorrect'; END IF;
  INSERT INTO parent_codes (child_id, label, code_hash, created_by) VALUES (p_child, btrim(p_label), extensions.crypt(p_code, extensions.gen_salt('bf')), auth.uid());
  RETURN btrim(p_label);
END $function$;

CREATE OR REPLACE FUNCTION public.parent_code_label(p_child uuid, p_code text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT label FROM parent_codes WHERE child_id = p_child AND code_hash = extensions.crypt(p_code, code_hash) LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.parent_lien_confirmer(p_child uuid, p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null or not exists (select 1 from parent_links where parent_id = auth.uid() and child_id = p_child) then
    raise exception 'Accès refusé';
  end if;
  if public.parent_code_label(p_child, p_code) is null then
    perform pg_sleep(0.5); -- freine les essais au hasard
    return false;
  end if;
  update parent_links set confirme = true where parent_id = auth.uid() and child_id = p_child;
  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.parent_liens_en_attente()
 RETURNS TABLE(child_id uuid, full_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select l.child_id, p.full_name from parent_links l join profiles p on p.user_id = l.child_id
  where l.parent_id = auth.uid() and not l.confirme order by lower(p.full_name);
$function$;

CREATE OR REPLACE FUNCTION public.parent_space_info(p_child uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN jsonb_build_object(
    'labels', COALESCE((SELECT jsonb_agg(label ORDER BY created_at) FROM parent_codes WHERE child_id = p_child), '[]'::jsonb),
    'codes', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', label, 'created_at', created_at, 'updated_at', updated_at) ORDER BY created_at)
                       FROM parent_codes WHERE child_id = p_child), '[]'::jsonb));
END $function$;

CREATE OR REPLACE FUNCTION public.parent_unread_count(p_child uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RETURN 0; END IF;
  RETURN (SELECT count(*) FROM student_reports r WHERE r.student_id = p_child AND r.sent_at IS NOT NULL AND r.snapshot IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM bilan_reads b WHERE b.report_id = r.id));
END $function$;

CREATE OR REPLACE FUNCTION public.program_deadline(p_week date, p_items jsonb)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
AS $function$
  WITH base AS (
    SELECT GREATEST(p_week, COALESCE((SELECT max((it->>'created_at')::timestamptz AT TIME ZONE 'Europe/Paris')::date
      FROM jsonb_array_elements(p_items) it WHERE it ? 'created_at'), p_week)) AS d
  )
  SELECT (d + ((3 - extract(isodow FROM d)::int + 7) % 7) + CASE WHEN extract(isodow FROM d)::int = 3 THEN 7 ELSE 0 END)::date FROM base;
$function$;

CREATE OR REPLACE FUNCTION public.program_item_done(p_user uuid, p_module text, p_item text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN EXISTS (SELECT 1 FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'corrige')
    WHEN 'nourania' THEN EXISTS (SELECT 1 FROM user_nourania_progress u WHERE u.user_id = p_user AND u.lesson_id::text = p_item AND u.is_validated)
    WHEN 'sourates' THEN EXISTS (SELECT 1 FROM user_sourate_progress u WHERE u.user_id = p_user AND u.sourate_id::text = p_item AND u.is_validated AND u.context = 'sourates')
    WHEN 'allah_names' THEN EXISTS (SELECT 1 FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id::text = p_item AND u.is_validated)
    WHEN 'alphabet' THEN EXISTS (SELECT 1 FROM user_alphabet_progress u WHERE u.user_id = p_user AND u.letter_id::text = p_item AND u.is_validated)
    WHEN 'invocations' THEN EXISTS (SELECT 1 FROM user_invocation_progress u WHERE u.user_id = p_user AND u.invocation_id::text = p_item AND u.is_validated)
    WHEN 'priere' THEN EXISTS (SELECT 1 FROM user_prayer_progress u WHERE u.user_id = p_user AND u.card_id::text = p_item AND u.is_validated)
    ELSE false END;
$function$;

CREATE OR REPLACE FUNCTION public.program_item_done_at(p_user uuid, p_module text, p_item text)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN (SELECT r.rendu_at FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'corrige' LIMIT 1)
    WHEN 'allah_names' THEN (SELECT u.validated_at FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id::text = p_item AND u.is_validated LIMIT 1)
    ELSE NULL END;
$function$;

CREATE OR REPLACE FUNCTION public.program_item_pending(p_user uuid, p_module text, p_item text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN EXISTS (SELECT 1 FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'rendu')
    WHEN 'allah_names' THEN EXISTS (SELECT 1 FROM sourate_recitations s WHERE s.student_id = p_user AND s.allah_name_id::text = p_item AND s.status = 'pending')
    ELSE false END;
$function$;

CREATE OR REPLACE FUNCTION public.program_items(p_user uuid, p_week date, p_stored jsonb)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT jsonb_agg(it) FROM jsonb_array_elements(COALESCE(p_stored, '[]'::jsonb)) it WHERE it->>'module' = 'allah_names'), '[]'::jsonb)
      || COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'module', 'devoir', 'item_id', d.id::text, 'label', d.titre,
          'detail', CASE d.type WHEN 'sourate' THEN 'Sourate' WHEN 'recitation' THEN 'Récitation' WHEN 'nourania' THEN 'Nourania' WHEN 'allah_names' THEN '99 noms' WHEN 'alphabet' THEN 'Alphabet' WHEN 'invocations' THEN 'Invocation' WHEN 'priere' THEN 'Prière' WHEN 'coran' THEN 'Coran' ELSE 'Devoir' END
                    || COALESCE(' · pour le ' || to_char(d.date_limite AT TIME ZONE 'Europe/Paris', 'DD/MM'), ''),
          'path', '/?open=devoirs#devoir-' || d.id::text,
          'emoji', CASE d.type WHEN 'sourate' THEN '📖' WHEN 'recitation' THEN '🎙️' WHEN 'nourania' THEN '✨' WHEN 'allah_names' THEN '🌟' WHEN 'alphabet' THEN '🔤' WHEN 'invocations' THEN '🤲' WHEN 'priere' THEN '🕌' WHEN 'coran' THEN '📗' ELSE '📚' END,
          'steps_total', jsonb_array_length(d.etapes),
          'created_at', d.created_at,
          'due', d.date_limite
        ) ORDER BY d.created_at)
        FROM devoirs d
        WHERE (d.assigned_to = 'all' OR d.student_id = p_user
               OR (d.group_id IS NOT NULL AND d.group_id IN (SELECT g.group_id FROM student_group_members g WHERE g.user_id = p_user)))
          AND (d.visible_a IS NULL OR d.visible_a <= now())
          AND (
            -- la semaine dure jusqu'à la création de la suivante (vacances : pas de nouvelle semaine, les devoirs s'ajoutent quand même)
            (d.created_at >= p_week AND d.created_at < COALESCE((SELECT min(w2.week_start) FROM weekly_programs w2 WHERE w2.student_id = p_user AND w2.week_start > p_week), 'infinity'::date))
            -- Devoir obligatoire (2026-10-26) : donné à partir du 26/10/2026 et pas fait = il reste sur le chemin jusqu'à ce qu'il
            -- soit fait, même après sa date (seulement depuis l'arrivée de l'élève), sauf si le professeur l'a rangé dans l'historique (2026-10-27)
            OR (d.created_at < p_week AND d.created_at >= '2026-10-26'::date
                AND d.created_at >= COALESCE((SELECT pr.created_at FROM profiles pr WHERE pr.user_id = p_user), '-infinity'::timestamptz)
                AND NOT program_item_done(p_user, 'devoir', d.id::text)
                AND NOT EXISTS (SELECT 1 FROM devoir_decisions dd WHERE dd.devoir_id = d.id AND dd.student_id = p_user AND dd.decision = 'historique'))
            -- Devoirs plus anciens : règle d'avant (30 jours, pas expirés)
            OR (d.created_at < p_week AND d.created_at < '2026-10-26'::date AND d.created_at >= p_week - 30
                AND (d.date_limite IS NULL OR d.date_limite >= p_week)
                AND NOT program_item_done(p_user, 'devoir', d.id::text))
          )
      ), '[]'::jsonb);
$function$;

CREATE OR REPLACE FUNCTION public.program_streak(p_user uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH wk AS (
    SELECT w.week_start, row_number() OVER (ORDER BY w.week_start DESC) AS rn,
      jsonb_array_length(program_items(w.student_id, w.week_start, w.items)) AS total,
      (SELECT count(*) FROM jsonb_array_elements(program_items(w.student_id, w.week_start, w.items)) it
        WHERE program_item_done(w.student_id, it->>'module', it->>'item_id')) AS done
    FROM weekly_programs w WHERE w.student_id = p_user
  ), flagged AS (
    SELECT rn, (total > 0 AND done = total) AS ok FROM wk
  ), counted AS (
    -- semaine en cours pas finie : on ne casse pas la série, on regarde à partir de la précédente
    SELECT rn, ok FROM flagged WHERE NOT (rn = 1 AND NOT ok)
  )
  SELECT COALESCE((SELECT count(*)::int FROM counted c
    WHERE c.ok AND NOT EXISTS (SELECT 1 FROM counted c2 WHERE c2.rn < c.rn AND NOT c2.ok)), 0);
$function$;

CREATE OR REPLACE FUNCTION public.ramadan_activity_fill_type()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.activity_type := COALESCE(NEW.activity_type, NEW.type);
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.recalculate_all_points_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE u uuid;
BEGIN
  FOR u IN SELECT user_id FROM profiles LOOP PERFORM recalculate_student_points(u); END LOOP;
  RETURN NULL;
END $function$;

CREATE OR REPLACE FUNCTION public.recalculate_student_points(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total INTEGER := 0;
  n INTEGER;
  pts INTEGER;
  r RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN RETURN; END IF; -- compte en cours de suppression
  -- Pour chaque ligne du barème : nombre d'actions de l'élève × points (0 si la ligne est désactivée)
  FOR r IN SELECT action_key, CASE WHEN is_active THEN points ELSE 0 END AS p FROM point_settings LOOP
    n := 0;
    CASE r.action_key
      WHEN 'sourate_validee' THEN SELECT COUNT(*) INTO n FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'nourania_lecon_validee' THEN SELECT COUNT(*) INTO n FROM user_nourania_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'invocation_vue' THEN SELECT COUNT(*) INTO n FROM user_invocation_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_lettre_apprise' THEN SELECT COUNT(*) INTO n FROM user_alphabet_progress WHERE user_id = p_user_id AND is_validated;
      -- Jeux de l'Alphabet : seule la meilleure partie de chaque jeu et de chaque jour compte
      WHEN 'alphabet_bonne_reponse' THEN SELECT COALESCE(SUM(best), 0) INTO n FROM (SELECT MAX(score) AS best FROM alphabet_game_scores WHERE user_id = p_user_id GROUP BY game, played_on) b;
      WHEN 'devoir_rendu' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id;
      WHEN 'devoir_corrige' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id AND statut = 'corrige';
      WHEN 'presence_marquee' THEN SELECT COUNT(*) INTO n FROM attendance_records WHERE user_id = p_user_id AND status IN ('present', 'late');
      WHEN 'priere_validee' THEN SELECT COUNT(*) INTO n FROM user_prayer_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'jeune_marque' THEN SELECT COUNT(*) INTO n FROM user_ramadan_fasting WHERE user_id = p_user_id AND COALESCE(has_fasted, is_fasting, false);
      WHEN 'quiz_reussi' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND quiz_completed;
      WHEN 'ramadan_jour_complete' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND is_completed;
      WHEN 'message_envoye' THEN SELECT COUNT(*) INTO n FROM user_messages WHERE sender_id = p_user_id AND deleted_at IS NULL;
      -- 🌟 99 Noms d'Allah : nom validé (2026-11-04, demande de Nadia)
      WHEN 'allah_nom_valide' THEN SELECT COUNT(*) INTO n FROM user_allah_name_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'vocabulaire_appris' THEN SELECT COUNT(*) INTO n FROM user_flashcard_learned WHERE user_id = p_user_id;
      -- Chemin de la semaine (2026-10-26) : trésor ouvert (+10) et diamant bonus (+5)
      WHEN 'tresor_ouvert' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'tresor';
      WHEN 'bonus_semaine' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'bonus';
      ELSE n := 0;
    END CASE;
    total := total + COALESCE(n, 0) * COALESCE(r.p, 0);
  END LOOP;

  INSERT INTO student_ranking (user_id, total_points, updated_at)
  VALUES (p_user_id, total, now())
  ON CONFLICT (user_id) DO UPDATE SET total_points = total, updated_at = now();

  UPDATE profiles SET points = total WHERE user_id = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.stats_connexions_30j()
 RETURNS TABLE(jour date, connexions integer, eleves integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with j as (
    select generate_series((now() at time zone 'Europe/Paris')::date - 29, (now() at time zone 'Europe/Paris')::date, interval '1 day')::date as jour
  )
  select j.jour, count(c.*)::int, count(distinct c.user_id)::int
  from j left join connexion_logs c on (c.login_at at time zone 'Europe/Paris')::date = j.jour
  where public.has_role(auth.uid(), 'admin'::app_role)
  group by j.jour order by j.jour;
$function$;

CREATE OR REPLACE FUNCTION public.student_engagement()
 RETURNS TABLE(student_id uuid, full_name text, gender text, joined_at timestamp with time zone, last_validation timestamp with time zone, missed_streak integer, weeks jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE current_week date;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  SELECT max(w.week_start) INTO current_week FROM weekly_programs w;
  RETURN QUERY
  WITH st AS (
    SELECT p.user_id, p.full_name, p.gender, p.created_at FROM profiles p
    WHERE p.is_approved AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin')
  ),
  last_val AS (
    SELECT x.uid, max(x.at) AS at FROM (
      SELECT user_id AS uid, COALESCE(validated_at, created_at) AS at FROM user_sourate_progress WHERE is_validated
      UNION ALL SELECT user_id, COALESCE(completed_at, created_at) FROM user_nourania_progress WHERE is_validated
      UNION ALL SELECT user_id, COALESCE(completed_at, created_at) FROM user_alphabet_progress WHERE is_validated
      UNION ALL SELECT user_id, COALESCE(completed_at, updated_at, created_at) FROM user_invocation_progress WHERE is_validated
      UNION ALL SELECT user_id, validated_at FROM user_allah_name_progress WHERE is_validated
      UNION ALL SELECT user_id, COALESCE(completed_at, created_at) FROM user_prayer_progress WHERE is_validated
    ) x GROUP BY x.uid
  ),
  wk AS (
    SELECT w.student_id, w.week_start,
      jsonb_array_length(program_items(w.student_id, w.week_start, w.items)) AS total,
      (SELECT count(*) FROM jsonb_array_elements(program_items(w.student_id, w.week_start, w.items)) it WHERE program_item_done(w.student_id, it->>'module', it->>'item_id'))::int AS done
    FROM weekly_programs w WHERE w.week_start >= current_date - 70
  )
  SELECT st.user_id, st.full_name, st.gender, st.created_at, lv.at,
    -- semaines passées (pas celle en cours) d'affilée sans aucun diamant, en partant de la plus récente
    (SELECT count(*)::int FROM (
       SELECT wk.done, row_number() OVER (ORDER BY wk.week_start DESC) AS rn,
              sum(CASE WHEN wk.done > 0 THEN 1 ELSE 0 END) OVER (ORDER BY wk.week_start DESC) AS seen_ok
       FROM wk WHERE wk.student_id = st.user_id AND wk.week_start < current_week AND wk.total > 0
     ) z WHERE z.seen_ok = 0),
    COALESCE((SELECT jsonb_agg(jsonb_build_object('week', wk.week_start, 'total', wk.total, 'done', wk.done) ORDER BY wk.week_start DESC)
              FROM wk WHERE wk.student_id = st.user_id), '[]'::jsonb)
  FROM st LEFT JOIN last_val lv ON lv.uid = st.user_id;
END $function$;

CREATE OR REPLACE FUNCTION public.trg_recalculate_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_student_points(OLD.user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalculate_student_points(NEW.user_id);
  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM public.recalculate_student_points(OLD.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_recalculate_points_col()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE col text := TG_ARGV[0]; o uuid; nw uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN o := (to_jsonb(OLD) ->> col)::uuid; END IF;
  IF TG_OP <> 'DELETE' THEN nw := (to_jsonb(NEW) ->> col)::uuid; END IF;
  IF nw IS NOT NULL THEN PERFORM recalculate_student_points(nw); END IF;
  IF o IS NOT NULL AND o IS DISTINCT FROM nw THEN PERFORM recalculate_student_points(o); END IF;
  RETURN COALESCE(NEW, OLD);
END $function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.weekly_program_view(p_student uuid DEFAULT NULL::uuid)
 RETURNS TABLE(program_id uuid, student_id uuid, full_name text, gender text, week_start date, items jsonb, message_index smallint, teacher_note text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE all_ok boolean := public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role';
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (w.student_id) w.id, w.student_id, p.full_name, p.gender, w.week_start,
    COALESCE((SELECT jsonb_agg(it || jsonb_build_object(
                'done', program_item_done(w.student_id, it->>'module', it->>'item_id'),
                'pending', program_item_pending(w.student_id, it->>'module', it->>'item_id'),
                'done_at', program_item_done_at(w.student_id, it->>'module', it->>'item_id'),
                'steps_done', CASE WHEN it->>'module' = 'devoir'
                  THEN (SELECT count(*) FROM devoir_steps ds WHERE ds.student_id = w.student_id AND ds.devoir_id::text = it->>'item_id') ELSE 0 END))
              FROM jsonb_array_elements(program_items(w.student_id, w.week_start, w.items)) it), '[]'::jsonb),
    w.message_index, w.teacher_note
  FROM weekly_programs w JOIN profiles p ON p.user_id = w.student_id
  WHERE CASE WHEN all_ok THEN (p_student IS NULL OR w.student_id = p_student) ELSE w.student_id = auth.uid() END
  ORDER BY w.student_id, w.week_start DESC;
END $function$;

-- ===== DÉCLENCHEURS =====
CREATE TRIGGER garde_alphabet_scores BEFORE INSERT ON public.alphabet_game_scores FOR EACH ROW EXECUTE FUNCTION garde_alphabet_scores();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.alphabet_game_scores FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE OF status, user_id ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points_col('user_id');
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.devoirs_rendus FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points_col('student_id');
CREATE TRIGGER trg_devoirs_rendus_refait BEFORE INSERT OR UPDATE OF statut ON public.devoirs_rendus FOR EACH ROW EXECUTE FUNCTION devoirs_rendus_trace_refait();
CREATE TRIGGER recalculate_all_points AFTER INSERT OR DELETE OR UPDATE ON public.point_settings FOR EACH STATEMENT EXECUTE FUNCTION recalculate_all_points_trigger();
CREATE TRIGGER garde_profil_eleve BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION garde_profil_eleve();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.program_rewards FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points();
CREATE TRIGGER trg_ramadan_activity_fill_type BEFORE INSERT OR UPDATE ON public.ramadan_day_activities FOR EACH ROW EXECUTE FUNCTION ramadan_activity_fill_type();
CREATE TRIGGER update_sourate_recitations_updated_at BEFORE UPDATE ON public.sourate_recitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER date_de_validation BEFORE INSERT OR UPDATE ON public.user_allah_name_progress FOR EACH ROW EXECUTE FUNCTION date_de_validation('validated_at');
CREATE TRIGGER garde_validation BEFORE INSERT OR UPDATE ON public.user_allah_name_progress FOR EACH ROW EXECUTE FUNCTION garde_validation();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.user_allah_name_progress FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points_col('user_id');
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.user_alphabet_progress FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE ON public.user_flashcard_learned FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points_col('user_id');
CREATE TRIGGER garde_validation BEFORE INSERT OR UPDATE ON public.user_invocation_progress FOR EACH ROW EXECUTE FUNCTION garde_validation();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.user_invocation_progress FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points();
CREATE TRIGGER garde_user_messages BEFORE INSERT OR UPDATE ON public.user_messages FOR EACH ROW EXECUTE FUNCTION garde_user_messages();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE OF deleted_at ON public.user_messages FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points_col('sender_id');
CREATE TRIGGER date_de_validation BEFORE INSERT OR UPDATE ON public.user_nourania_progress FOR EACH ROW EXECUTE FUNCTION date_de_validation('completed_at');
CREATE TRIGGER garde_validation BEFORE INSERT OR UPDATE ON public.user_nourania_progress FOR EACH ROW EXECUTE FUNCTION garde_validation();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.user_nourania_progress FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points();
CREATE TRIGGER garde_validation BEFORE INSERT OR UPDATE ON public.user_prayer_progress FOR EACH ROW EXECUTE FUNCTION garde_validation();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.user_prayer_progress FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points_col('user_id');
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.user_ramadan_fasting FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points_col('user_id');
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.user_ramadan_progress FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points_col('user_id');
CREATE TRIGGER date_de_validation BEFORE INSERT OR UPDATE ON public.user_sourate_progress FOR EACH ROW EXECUTE FUNCTION date_de_validation('validated_at');
CREATE TRIGGER garde_validation BEFORE INSERT OR UPDATE ON public.user_sourate_progress FOR EACH ROW EXECUTE FUNCTION garde_validation();
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.user_sourate_progress FOR EACH ROW EXECUTE FUNCTION trg_recalculate_points();

-- ===== RÈGLES DE SÉCURITÉ (RLS) =====
-- absence_justifications | admin_absence_justifications | ALL | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- absence_justifications | read_absence_justifications | SELECT | {public}
--   USING: can_act_for_child(student_id)
--   CHECK: None
-- admin_card_order | Users can manage own card order | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- admin_card_order | Users can view own card order | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- admin_conversations | Admins can manage conversations | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- admin_conversations | Users can view own conversations | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- admin_task_templates | admin_all_admin_task_templates | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- admin_tasks | admin_all_admin_tasks | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- allah_name_media | allah_name_media_admin_write | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- allah_name_media | allah_name_media_read | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- allah_names | Admins can manage allah_names | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- allah_names | Anyone can view allah_names | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- alphabet_admin_unlocks | admin_all_alphabet_unlocks | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- alphabet_admin_unlocks | student_read_own_alphabet_unlocks | SELECT | {authenticated}
--   USING: (user_id = auth.uid())
--   CHECK: None
-- alphabet_content | Admins can manage alphabet_content | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- alphabet_content | Anyone can view alphabet_content | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- alphabet_game_scores | own_insert_alphabet_scores | INSERT | {authenticated}
--   USING: None
--   CHECK: (user_id = auth.uid())
-- alphabet_game_scores | own_read_alphabet_scores | SELECT | {authenticated}
--   USING: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- alphabet_letters | Admins can manage alphabet_letters | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- alphabet_letters | Anyone can view alphabet_letters | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- alphabet_line_models | admin_write_alphabet_line_models | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- alphabet_line_models | anyone_read_alphabet_line_models | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- alphabet_submissions | admin_all_alphabet_submissions | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- alphabet_submissions | student_read_own_alphabet_submissions | SELECT | {authenticated}
--   USING: (student_id = auth.uid())
--   CHECK: None
-- alphabet_submissions | student_send_alphabet_submissions | INSERT | {authenticated}
--   USING: None
--   CHECK: ((student_id = auth.uid()) AND (status = 'pending'::text) AND (admin_comment IS NULL) AND (admin_audio_url IS NULL) AND (reviewed_at IS NULL))
-- alphabet_trace_stars | trace_stars_own_insert | INSERT | {authenticated}
--   USING: None
--   CHECK: (user_id = auth.uid())
-- alphabet_trace_stars | trace_stars_own_read | SELECT | {authenticated}
--   USING: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- app_appearance | admin_app_appearance | ALL | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- app_appearance | read_app_appearance | SELECT | {public}
--   USING: true
--   CHECK: None
-- app_logs | Admins can delete app_logs | DELETE | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- app_logs | Admins can restore app_logs | INSERT | {authenticated}
--   USING: None
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- app_logs | Admins can update app_logs | UPDATE | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- app_logs | Admins can view app_logs | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- app_logs | Users can insert own logs | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- app_versions | Admins full access on app_versions | ALL | {public}
--   USING: (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))
--   CHECK: None
-- app_versions | Authenticated users can read app_versions | SELECT | {public}
--   USING: (auth.uid() IS NOT NULL)
--   CHECK: None
-- attendance_records | Admins can manage attendance | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- attendance_records | Users can view own attendance | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- attendance_sessions | attendance_sessions_admin | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- attendance_sessions | attendance_sessions_read | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- behavior_marks | admin_behavior_marks | ALL | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- bilan_envois | admin_bilan_envois | ALL | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- bilan_reads | admin_bilan_reads | ALL | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- connexion_logs | Admins can restore connexion logs | INSERT | {authenticated}
--   USING: None
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- connexion_logs | Admins can view all connexion logs | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- connexion_logs | Users can insert own connexion logs | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- connexion_logs | Users can view own connexion logs | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- coran_progress | admin_read_coran_progress | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- coran_progress | own_coran_progress | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: (auth.uid() = user_id)
-- coran_reminder_logs | admin_coran_reminder_logs | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- course_ready | admin_read_course_ready | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- course_ready | own_course_ready | ALL | {authenticated}
--   USING: (auth.uid() = student_id)
--   CHECK: (auth.uid() = student_id)
-- crash_alert_settings | Admins manage crash alert settings | ALL | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- daily_goals | admin_read_daily_goals | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- daily_goals | own_daily_goals | ALL | {authenticated}
--   USING: (auth.uid() = student_id)
--   CHECK: (auth.uid() = student_id)
-- dashboard_card_visibility | Admins can manage card visibility | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- dashboard_card_visibility | Users can view own card visibility | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- dashboard_cards | Admins can manage dashboard_cards | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- dashboard_cards | Anyone can view dashboard_cards | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- devoir_checks | admin_insert_devoir_checks | INSERT | {authenticated}
--   USING: None
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- devoir_checks | admin_read_devoir_checks | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- devoir_checks | own_devoir_checks | ALL | {authenticated}
--   USING: (auth.uid() = student_id)
--   CHECK: (auth.uid() = student_id)
-- devoir_decisions | admin_manage_devoir_decisions | ALL | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- devoir_decisions | student_read_own_devoir_decisions | SELECT | {public}
--   USING: (student_id = auth.uid())
--   CHECK: None
-- devoir_modeles | admin_devoir_modeles | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- devoir_steps | admin_insert_devoir_steps | INSERT | {authenticated}
--   USING: None
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- devoir_steps | admin_read_devoir_steps | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- devoir_steps | own_devoir_steps | ALL | {authenticated}
--   USING: (auth.uid() = student_id)
--   CHECK: (auth.uid() = student_id)
-- devoir_vues | admin_devoir_vues | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- devoir_vues | eleve_devoir_vues | INSERT | {authenticated}
--   USING: None
--   CHECK: (student_id = auth.uid())
-- devoir_vues | eleve_lit_devoir_vues | SELECT | {authenticated}
--   USING: ((student_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- devoirs | admin_manage_devoirs | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- devoirs | students_read_devoirs | SELECT | {public}
--   USING: (((visible_a IS NULL) OR (visible_a <= now())) AND ((assigned_to = 'all'::text) OR (student_id = auth.uid()) OR (group_id IN ( SELECT student_group_members.group_id
   FROM student_group_members
  WHERE (student_group_members.user_id = auth.uid())))))
--   CHECK: None
-- devoirs_rendus | admin_manage_rendus | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- devoirs_rendus | students_manage_own_rendus | ALL | {authenticated}
--   USING: (student_id = auth.uid())
--   CHECK: (student_id = auth.uid())
-- dropout_state | dropout_state_read | SELECT | {authenticated}
--   USING: ((student_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- encouragement_logs | encouragement_logs_admin | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- group_devoir_settings | admin_group_devoir_settings | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- group_levels | admin_group_levels | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- group_schedules | admin_group_schedules | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- group_schedules | read_group_schedules | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- group_sessions | admin_group_sessions | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- homework_assignments | Admins can manage homework | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- homework_assignments | Users can view own homework | SELECT | {authenticated}
--   USING: ((user_id = auth.uid()) OR (user_id IS NULL) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- homework_reminder_logs | admin_homework_reminder_logs | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- homework_submissions | Admins can manage submissions | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- homework_submissions | Users can create submissions | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- homework_submissions | Users can view own submissions | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- invocation_content | Admins can manage invocation content | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- invocation_content | Anyone can view invocation content | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- invocation_validation_requests | Admins can manage invocation validations | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- invocation_validation_requests | Users can create invocation validations | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- invocation_validation_requests | Users can view own invocation validations | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- invocations | Admin full access invocations | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- invocations | Admins can manage invocations | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- invocations | Anyone can view invocations | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- learning_modules | Admins can manage learning_modules | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- learning_modules | Anyone can view learning_modules | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- mascotte_usage | Admin lit l'usage de la mascotte | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- module_card_content | Admins can manage module_card_content | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- module_card_content | Anyone can view module_card_content | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- module_cards | Admins can manage module_cards | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- module_cards | Anyone can view module_cards | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- module_content | Admins can manage module_content | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- module_content | Anyone can view module_content | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- module_flashcards | admin_manage_flashcards | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- module_flashcards | anyone_read_flashcards | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- module_visibility | admin_all_module_visibility | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- module_visibility | student_read_module_visibility | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- module_visits | admin_read_module_visits | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- module_visits | own_insert_module_visits | INSERT | {authenticated}
--   USING: None
--   CHECK: (user_id = auth.uid())
-- module_visits | own_read_module_visits | SELECT | {authenticated}
--   USING: (user_id = auth.uid())
--   CHECK: None
-- notification_confirmations | Users can create confirmations | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- notification_confirmations | Users can view own confirmations | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- notification_history | Admins can manage notification history | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- notification_history | Admins can view notification history | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- notification_invitations | admin_manage_invitations | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- notification_invitations | users_read_own_invitation | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- notification_invitations | users_update_own_invitation | UPDATE | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- notification_preferences | Admins can view all notification prefs | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- notification_preferences | Users can manage own notification prefs | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- notification_preferences | Users can view own notification prefs | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- nourania_admin_unlocks | Admins full access on nourania_admin_unlocks | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- nourania_admin_unlocks | Students read their own unlocks | SELECT | {authenticated}
--   USING: (student_id = auth.uid())
--   CHECK: None
-- nourania_commentaires_eleves | admin_manage_commentaires | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- nourania_commentaires_eleves | student_read_own_commentaire | SELECT | {authenticated}
--   USING: (student_id = auth.uid())
--   CHECK: None
-- nourania_lesson_content | Admins can manage nourania content | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- nourania_lesson_content | Anyone can view nourania content | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- nourania_lessons | Admins can manage nourania_lessons | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- nourania_lessons | Anyone can view nourania_lessons | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- nourania_validation_requests | Admins can manage nourania validations | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- nourania_validation_requests | Users can create nourania validations | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- nourania_validation_requests | Users can view own nourania validations | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- objects | Admin full access invocation-content storage | ALL | {authenticated}
--   USING: ((bucket_id = 'invocation-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'invocation-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | Admins can read all audio | SELECT | {authenticated}
--   USING: ((bucket_id = 'devoirs-audios'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- objects | Admins manage recitations files | ALL | {authenticated}
--   USING: ((bucket_id = 'recitations'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'recitations'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | Auth users upload own recitations | INSERT | {authenticated}
--   USING: None
--   CHECK: ((bucket_id = 'recitations'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))
-- objects | Users can upload own audio | INSERT | {authenticated}
--   USING: None
--   CHECK: ((bucket_id = 'devoirs-audios'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
-- objects | admin_delete_versets | DELETE | {authenticated}
--   USING: ((bucket_id = 'sourates-versets'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- objects | admin_manage_admin_todo | ALL | {authenticated}
--   USING: ((bucket_id = 'admin-todo'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'admin-todo'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_alphabet_content | ALL | {authenticated}
--   USING: ((bucket_id = 'alphabet-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'alphabet-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_coran_pages | ALL | {authenticated}
--   USING: ((bucket_id = 'coran-pages'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'coran-pages'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_invocation_content | ALL | {authenticated}
--   USING: ((bucket_id = 'invocation-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'invocation-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_messages_audio | ALL | {authenticated}
--   USING: ((bucket_id = 'messages-audio'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'messages-audio'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_module_cards | ALL | {authenticated}
--   USING: ((bucket_id = 'module-cards'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'module-cards'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_module_content | ALL | {authenticated}
--   USING: ((bucket_id = 'module-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'module-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_nourania_content | ALL | {authenticated}
--   USING: ((bucket_id = 'nourania-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'nourania-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_prayer_cards | ALL | {authenticated}
--   USING: ((bucket_id = 'prayer-cards'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'prayer-cards'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_sourate_content | ALL | {authenticated}
--   USING: ((bucket_id = 'sourate-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'sourate-content'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_manage_sourates_versets | ALL | {authenticated}
--   USING: ((bucket_id = 'sourates-versets'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'sourates-versets'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | admin_upload_versets | INSERT | {authenticated}
--   USING: None
--   CHECK: ((bucket_id = 'sourates-versets'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | devoirs_fichiers_admin | ALL | {authenticated}
--   USING: ((bucket_id = 'devoirs-fichiers'::text) AND has_role(auth.uid(), 'admin'::app_role))
--   CHECK: ((bucket_id = 'devoirs-fichiers'::text) AND has_role(auth.uid(), 'admin'::app_role))
-- objects | devoirs_fichiers_eleve_depot | INSERT | {authenticated}
--   USING: None
--   CHECK: ((bucket_id = 'devoirs-fichiers'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
-- objects | fichiers_prives_lecture | SELECT | {authenticated}
--   USING: ((bucket_id = ANY (ARRAY['recitations'::text, 'messages-audio'::text, 'devoirs-audios'::text, 'devoirs-fichiers'::text])) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR has_role(auth.uid(), 'admin'::app_role) OR ((storage.foldername(name))[1] = ANY (ARRAY['admin'::text, 'prof'::text])) OR (EXISTS ( SELECT 1
   FROM user_roles r
  WHERE ((r.role = 'admin'::app_role) AND ((r.user_id)::text = (storage.foldername(objects.name))[1]))))))
--   CHECK: None
-- objects | own_write_messages_audio | INSERT | {authenticated}
--   USING: None
--   CHECK: ((bucket_id = 'messages-audio'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
-- objects | public_read_alphabet_content | SELECT | {public}
--   USING: (bucket_id = 'alphabet-content'::text)
--   CHECK: None
-- objects | public_read_coran_pages | SELECT | {public}
--   USING: (bucket_id = 'coran-pages'::text)
--   CHECK: None
-- objects | public_read_invocation_content | SELECT | {public}
--   USING: (bucket_id = 'invocation-content'::text)
--   CHECK: None
-- objects | public_read_module_cards | SELECT | {public}
--   USING: (bucket_id = 'module-cards'::text)
--   CHECK: None
-- objects | public_read_module_content | SELECT | {public}
--   USING: (bucket_id = 'module-content'::text)
--   CHECK: None
-- objects | public_read_nourania_content | SELECT | {public}
--   USING: (bucket_id = 'nourania-content'::text)
--   CHECK: None
-- objects | public_read_prayer_cards | SELECT | {public}
--   USING: (bucket_id = 'prayer-cards'::text)
--   CHECK: None
-- objects | public_read_sourate_content | SELECT | {public}
--   USING: (bucket_id = 'sourate-content'::text)
--   CHECK: None
-- objects | public_read_sourates_versets | SELECT | {public}
--   USING: (bucket_id = 'sourates-versets'::text)
--   CHECK: None
-- objects | public_read_versets | SELECT | {authenticated}
--   USING: (bucket_id = 'sourates-versets'::text)
--   CHECK: None
-- objects | student_delete_own_recitation_file | DELETE | {authenticated}
--   USING: ((bucket_id = 'recitations'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text))
--   CHECK: None
-- parent_codes | admin_parent_codes | ALL | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- parent_links | admin_parent_links | ALL | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- parent_links | parent_unlink_own | DELETE | {public}
--   USING: (parent_id = auth.uid())
--   CHECK: None
-- parent_links | read_own_parent_links | SELECT | {public}
--   USING: ((parent_id = auth.uid()) OR (child_id = auth.uid()))
--   CHECK: None
-- parent_lock_settings | admin_write_parent_lock | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- parent_lock_settings | own_or_admin_read_parent_lock | SELECT | {authenticated}
--   USING: ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- point_settings | Admins can manage point_settings | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- point_settings | Anyone can view point_settings | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- prayer_card_content | Admins can manage prayer_card_content | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- prayer_card_content | Anyone can view prayer_card_content | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- prayer_cards | Admins can manage prayer_cards | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- prayer_cards | Anyone can view prayer_cards | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- prayer_categories | Admins can manage prayer_categories | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- prayer_categories | Anyone can view prayer_categories | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- prayer_content | Admins can manage prayer_content | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- prayer_content | Anyone can view prayer_content | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- profiles | Admins can manage all profiles | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- profiles | Users can insert own profile | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- profiles | Users can update own profile safely | UPDATE | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: ((auth.uid() = user_id) AND (is_admin = ( SELECT p.is_admin
   FROM profiles p
  WHERE (p.user_id = auth.uid()))) AND (is_approved = ( SELECT p.is_approved
   FROM profiles p
  WHERE (p.user_id = auth.uid()))) AND (points = ( SELECT p.points
   FROM profiles p
  WHERE (p.user_id = auth.uid()))))
-- profiles | Users can view own profile | SELECT | {authenticated}
--   USING: ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- profiles | admin_can_update_profiles | UPDATE | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- program_rewards | admin_insert_program_rewards | INSERT | {authenticated}
--   USING: None
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- program_rewards | read_own_program_rewards | SELECT | {authenticated}
--   USING: ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- push_subscriptions | Admins can view all push subs | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- push_subscriptions | Users can manage own push subs | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- push_subscriptions | Users can view own push subs | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- quiz_responses | Admins can view all quiz responses | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- quiz_responses | Users can create quiz responses | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- quiz_responses | Users can view own quiz responses | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- quiz_responses | admin_insert_quiz_responses | INSERT | {authenticated}
--   USING: None
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- ramadan_day_activities | Admins can manage ramadan_day_activities | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- ramadan_day_activities | Anyone can view ramadan_day_activities | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- ramadan_day_exceptions | Admins can manage ramadan exceptions | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- ramadan_day_exceptions | Users can view own ramadan exceptions | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- ramadan_day_videos | Admins can manage ramadan_day_videos | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- ramadan_day_videos | Anyone can view ramadan_day_videos | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- ramadan_days | Admins can manage ramadan_days | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- ramadan_days | Anyone can view ramadan_days | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- ramadan_quizzes | Admins can manage ramadan_quizzes | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- ramadan_quizzes | Anyone can view ramadan_quizzes | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- ramadan_settings | Admins can manage ramadan_settings | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- ramadan_settings | Anyone can view ramadan_settings | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- scheduled_notifications | Admins can manage scheduled notifications | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- scheduled_notifications | Admins can view scheduled notifications | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- school_holidays | school_holidays_admin | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- school_holidays | school_holidays_read | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- sourate_admin_unlocks | Admins can manage unlocks | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- sourate_admin_unlocks | Users can view own unlocks | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- sourate_content | Admins can manage sourate_content | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- sourate_content | students_see_their_content | SELECT | {public}
--   USING: ((target_user_id IS NULL) OR (target_user_id = auth.uid()))
--   CHECK: None
-- sourate_recitations | Admins full access on recitations | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- sourate_recitations | Students can insert own recitations | INSERT | {authenticated}
--   USING: None
--   CHECK: (student_id = auth.uid())
-- sourate_recitations | Students can view own recitations | SELECT | {authenticated}
--   USING: (student_id = auth.uid())
--   CHECK: None
-- sourate_recitations | admins_update_recitations | UPDATE | {public}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- sourate_recitations | student_delete_own_recitation | DELETE | {authenticated}
--   USING: (student_id = auth.uid())
--   CHECK: None
-- sourate_stories | admin_manage_sourate_stories | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- sourate_stories | read_validated_sourate_stories | SELECT | {authenticated}
--   USING: (validated OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- sourate_validation_requests | Admins can manage validation requests | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- sourate_validation_requests | Users can create validation requests | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- sourate_validation_requests | Users can view own validation requests | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- sourate_versets_audio | admin_manage_versets_audio | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- sourate_versets_audio | students_read_versets_audio | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- sourates | Admins can manage sourates | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- sourates | Anyone can view sourates | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- student_group_members | Admins can manage group members | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- student_group_members | Users can view members of their own groups | SELECT | {authenticated}
--   USING: (has_role(auth.uid(), 'admin'::app_role) OR is_user_in_group(group_id, auth.uid()))
--   CHECK: None
-- student_groups | Admins can manage student_groups | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- student_groups | Anyone can view student_groups | SELECT | {authenticated}
--   USING: true
--   CHECK: None
-- student_passwords | admin_read_student_passwords | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- student_ranking | Admins can manage ranking | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- student_ranking | Authenticated can view rankings | SELECT | {authenticated}
--   USING: (NOT est_hors_classement(user_id))
--   CHECK: None
-- student_ranking | Users can insert own ranking | INSERT | {authenticated}
--   USING: None
--   CHECK: (auth.uid() = user_id)
-- student_reports | admin_student_reports | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- trash_items | trash_items_delete_own | DELETE | {authenticated}
--   USING: (user_id = auth.uid())
--   CHECK: None
-- trash_items | trash_items_insert_own | INSERT | {authenticated}
--   USING: None
--   CHECK: (user_id = auth.uid())
-- trash_items | trash_items_select_own | SELECT | {authenticated}
--   USING: (user_id = auth.uid())
--   CHECK: None
-- user_allah_name_progress | admin_all_allah_progress | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- user_allah_name_progress | student_own_allah_progress | ALL | {authenticated}
--   USING: (user_id = auth.uid())
--   CHECK: (user_id = auth.uid())
-- user_alphabet_progress | Users can view own progress | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_alphabet_progress | admin_all_alphabet_progress | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- user_daily_prayers | Admin can view all user_daily_prayers | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_daily_prayers | Users can manage own daily prayers | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_daily_prayers | Users can view own daily prayers | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_flashcard_learned | admin_insert_flashcard_learned | INSERT | {authenticated}
--   USING: None
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- user_flashcard_learned | flashcard_learned_delete | DELETE | {authenticated}
--   USING: (user_id = auth.uid())
--   CHECK: None
-- user_flashcard_learned | flashcard_learned_insert | INSERT | {authenticated}
--   USING: None
--   CHECK: (user_id = auth.uid())
-- user_flashcard_learned | flashcard_learned_read | SELECT | {authenticated}
--   USING: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None
-- user_grammaire_progress | admin_read_grammaire_progress | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_grammaire_progress | own_grammaire_progress | ALL | {authenticated}
--   USING: (user_id = auth.uid())
--   CHECK: (user_id = auth.uid())
-- user_invocation_progress | Users can manage own invocation progress | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_invocation_progress | Users can view own invocation progress | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_messages | admin_can_insert_messages | INSERT | {authenticated}
--   USING: None
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- user_messages | admin_can_read_messages | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_messages | admin_can_update_messages | UPDATE | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_messages | students_can_insert_messages | INSERT | {authenticated}
--   USING: None
--   CHECK: ((user_id = auth.uid()) AND (COALESCE(sender_type, 'user'::text) = 'user'::text))
-- user_messages | students_can_read_own_messages | SELECT | {authenticated}
--   USING: ((user_id = auth.uid()) OR (sender_id = auth.uid()) OR (receiver_id = auth.uid()))
--   CHECK: None
-- user_messages | students_can_update_own_messages | UPDATE | {authenticated}
--   USING: ((auth.uid() = receiver_id) OR (auth.uid() = user_id))
--   CHECK: None
-- user_nourania_progress | Admins can manage all nourania progress | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_nourania_progress | Users can manage own nourania progress | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_nourania_progress | Users can view own nourania progress | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_prayer_progress | Admin can view all user_prayer_progress | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_prayer_progress | Users can manage own prayer progress | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_prayer_progress | Users can view own prayer progress | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_ramadan_fasting | Admin can view all user_ramadan_fasting | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_ramadan_fasting | Users can manage own fasting | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_ramadan_fasting | Users can view own fasting | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_ramadan_progress | Admins can view all progress | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_ramadan_progress | Users can manage own progress | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: (auth.uid() = user_id)
-- user_ramadan_progress | Users can manage own ramadan progress | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_ramadan_progress | Users can view own ramadan progress | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_ramadan_video_watched | Users can manage own watched | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: (auth.uid() = user_id)
-- user_ramadan_video_watched | Users can manage own watched videos | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_ramadan_video_watched | Users can view own watched videos | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_ramadan_video_watched | admin_insert_ramadan_video_watched | INSERT | {authenticated}
--   USING: None
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- user_ramadan_video_watched | admin_read_ramadan_video_watched | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_roles | Admins can manage roles | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_roles | Users can view own roles | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_sourate_progress | Admins can manage all sourate progress | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_sourate_progress | Users can manage own sourate progress | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_sourate_progress | Users can view own sourate progress | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_sourate_verse_progress | Admin can view all user_sourate_verse_progress | SELECT | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: None
-- user_sourate_verse_progress | Users can manage own verse progress | ALL | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- user_sourate_verse_progress | Users can view own verse progress | SELECT | {authenticated}
--   USING: (auth.uid() = user_id)
--   CHECK: None
-- weekly_program_settings | weekly_program_settings_admin | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- weekly_programs | weekly_programs_admin | ALL | {authenticated}
--   USING: has_role(auth.uid(), 'admin'::app_role)
--   CHECK: has_role(auth.uid(), 'admin'::app_role)
-- weekly_programs | weekly_programs_read | SELECT | {authenticated}
--   USING: ((student_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
--   CHECK: None

-- ===== TÂCHES PLANIFIÉES (cron) =====
-- dinislam-coran-reminders [0 18,19 * * *]
--   
--     SELECT net.http_post(
--       url := 'https://zgnxqhfcmdonvdxqpekl.supabase.co/functions/v1/coran-reminders',
--       body := '{}'::jsonb
--     );
-- dinislam-homework-reminders [0 16,17 * * *]
--   
--     SELECT net.http_post(
--       url := 'https://zgnxqhfcmdonvdxqpekl.supabase.co/functions/v1/homework-reminders',
--       headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <CLE_ANON_MASQUEE>', 'apikey', '<CLE_ANON_MASQUEE>'),
--       body := '{}'::jsonb
--     );
-- dinislam-nettoyage-historiques [30 2 * * *]
--   select public.nettoyage_historiques()
-- dinislam-scheduled-notifications [*/5 * * * *]
--   
--     SELECT net.http_post(
--       url := 'https://zgnxqhfcmdonvdxqpekl.supabase.co/functions/v1/process-scheduled-notifications',
--       headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <CLE_ANON_MASQUEE>', 'apikey', '<CLE_ANON_MASQUEE>'),
--       body := '{}'::jsonb, timeout_milliseconds := 30000
--     );
-- dinislam-trash-maintenance [0 9 * * *]
--   
--     SELECT net.http_post(
--       url := 'https://zgnxqhfcmdonvdxqpekl.supabase.co/functions/v1/trash-maintenance',
--       headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <CLE_ANON_MASQUEE>', 'apikey', '<CLE_ANON_MASQUEE>'),
--       body := '{}'::jsonb
--     );
