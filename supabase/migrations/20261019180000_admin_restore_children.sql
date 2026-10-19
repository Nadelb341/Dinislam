-- Corbeille « copie d'abord » (2026-10-19) : l'admin doit pouvoir relire puis remettre
-- ce qui disparaît en cascade (réponses de quiz, flashcards apprises, vidéos vues) quand elle restaure.
create policy "admin_insert_quiz_responses" on public.quiz_responses
  for insert to authenticated with check (has_role(auth.uid(), 'admin'::app_role));
create policy "admin_insert_flashcard_learned" on public.user_flashcard_learned
  for insert to authenticated with check (has_role(auth.uid(), 'admin'::app_role));
create policy "admin_read_ramadan_video_watched" on public.user_ramadan_video_watched
  for select to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "admin_insert_ramadan_video_watched" on public.user_ramadan_video_watched
  for insert to authenticated with check (has_role(auth.uid(), 'admin'::app_role));
