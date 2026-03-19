-- Version management for the application
CREATE TABLE IF NOT EXISTS app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_current BOOLEAN DEFAULT false,
  snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on app_versions" ON app_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- All authenticated users can read versions
CREATE POLICY "Authenticated users can read app_versions" ON app_versions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed V1
INSERT INTO app_versions (version_number, label, description, is_current)
VALUES (
  '1.0.0',
  'Version initiale',
  'Lancement de Dini Bismillah v1.0.0

Fonctionnalités :
- Apprentissage des sourates avec audio et validation
- Méthode Nourania avec suivi de progression
- Invocations quotidiennes
- Module prière avec horaires
- Calendrier Ramadan avec quiz et activités
- Alphabet arabe interactif
- 99 noms d''Allah
- Grammaire et conjugaison
- Système de points et classement
- Messagerie élève/enseignant
- Notifications push
- Suivi de présence
- Devoirs
- Panel admin complet
- Monitoring et logs
- Mascotte étoile (chat IA)
- Assistant Lune (admin IA)',
  true
);
