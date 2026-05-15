# CLAUDE.md

Ce fichier fournit des instructions à Claude Code (claude.ai/code) pour travailler sur ce dépôt.

## Présentation du projet

Dinislam est une application web d'éducation islamique (en français) construite avec React + TypeScript + Vite, utilisant Supabase comme backend. Elle couvre les sourates du Coran (114 + Ayat Al-Kursi), les invocations, la méthode Nourania, l'apprentissage de la prière, les activités du Ramadan, l'alphabet arabe, les noms d'Allah, la grammaire/conjugaison, le vocabulaire, les hadiths, et plus encore. Elle dispose de rôles admin/élève avec un workflow d'approbation (accepter/refuser), un suivi de présence, des devoirs, une messagerie, des notifications push, un classement et un chat mascotte (via Supabase Edge Function).

## 🔐 Problèmes de connexion élève — diagnostic rapide (màj 2026-05-08)

Quand un élève ne peut pas se connecter, proposer **immédiatement** ces étapes dans l'ordre :

### 1. Diagnostic complet en une requête
```sql
SELECT u.email, u.email_confirmed_at, u.banned_until, u.deleted_at,
       p.full_name, p.is_approved, p.plain_password, r.role
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN user_roles r ON r.user_id = u.id
WHERE u.email = 'email@exemple.com';
```

### 2. Confirmer l'email manuellement (cause la plus fréquente)
```sql
UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'email@exemple.com';
```

### 3. Approuver le compte si `is_approved = false`
Via le panneau admin 🛡️ → Inscriptions → Accepter, ou :
```sql
UPDATE profiles SET is_approved = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email@exemple.com');
```

### 4. Réinitialiser le mot de passe
Via l'app : **Panneau admin 🛡️ → Élèves → élève → ⋯ → Modifier le mot de passe**

### 5. Supprimer un compte fantôme (doublon, test...)
```sql
SELECT id FROM auth.users WHERE email = 'email@exemple.com';
-- Puis avec l'UUID récupéré :
DELETE FROM profiles WHERE user_id = 'UUID_ICI';
DELETE FROM user_roles WHERE user_id = 'UUID_ICI';
DELETE FROM auth.users WHERE id = 'UUID_ICI';
```

---

## 📧 Flux d'inscription avec confirmation email (màj 2026-05-08)

### Flux actif
1. Élève remplit le formulaire → Supabase envoie l'email de confirmation
2. Élève clique le lien → détecté via `type=signup` dans le hash URL → déconnexion auto → redirigé vers `/auth?email_confirmed=1`
3. Bannière verte "✅ Email confirmé !" sur la page de connexion
4. **L'admin voit la demande UNIQUEMENT après confirmation email** (via RPC `get_pending_registrations()`)
5. Élève se connecte → page d'attente si pas encore approuvé (`PendingApproval.tsx`) → accueil si approuvé
6. Admin approuve → élève apparaît dans la liste Élèves

### Implémentation clé
- `AuthContext.tsx` → `onAuthStateChange` : détection `type=signup` dans hash → signOut + redirect
- `Auth.tsx` : bannière verte sur `?email_confirmed=1`, ne redirige pas vers `/` si ce param est présent
- `AdminRegistrationValidations.tsx` : utilise `supabase.rpc('get_pending_registrations')` au lieu de query directe
- `emailRedirectTo: window.location.origin` (pas de chemin personnalisé — évite besoin whitelist Supabase)

### Fonction RPC (déjà déployée en base)
```sql
-- get_pending_registrations() : retourne profiles avec email_confirmed_at IS NOT NULL
-- GRANT EXECUTE ON FUNCTION get_pending_registrations() TO authenticated;
```

---

## ⬆️⬇️ Boutons scroll haut/bas — règle acquise (màj 2026-04-26)

Présents dans **toutes** les zones scrollables.

**Composants réutilisables :**
- `src/hooks/useScrollToTop.ts` → `useScrollToTop()` (dialog/conteneur) et `useWindowScrollToTop()` (page)
- `src/components/ui/ScrollButtons.tsx` → `<ScrollButtons showTop showBottom onScrollTop onScrollBottom position="absolute|fixed" />`

**Zones couvertes :**
- Toutes les pages : via `AppLayout.tsx` (`useWindowScrollToTop`, `position="fixed"`, `bottom-24` pour dépasser la barre de nav)
- `SourateDetailDialog` : `position="absolute"` dans le dialog

**Règle :** `showTop = scrollPos > 200` · `showBottom = !atBottom` (indépendant — les deux flèches s'affichent **simultanément** au milieu de la page)

## 📦 Pas de débordement de texte hors de son conteneur
Voir règle complète dans `~/PROJETS CLAUDE CODE/CLAUDE.md`.
- `overflow-hidden` sur tout conteneur de liste/carte
- `[overflow-wrap:anywhere]` sur les spans de texte — coupe même les longues chaînes sans espaces
- `min-w-0` sur tout élément `flex-1` dans un flex container

## 🚫 Pas de chevauchement d'icônes / boutons
Voir règle complète dans `~/PROJETS CLAUDE CODE/CLAUDE.md`.
- Tous les boutons d'action doivent être **frères directs** dans le même conteneur flex
- Ne jamais placer un bouton dans un enfant flex si un autre bouton d'action est dans le parent
- Tester avec un titre très long à chaque nouveau composant liste/carte

## 📱 Responsive — téléphone / tablette / ordinateur
Voir règle complète dans `~/PROJETS CLAUDE CODE/CLAUDE.md`.
- **Téléphone** (base) : 1 colonne, navigation compacte, texte lisible sur petit écran
- **Tablette** (`md:` ≥ 768px) : 2 colonnes pour les grilles de sourates/leçons, plus d'espace
- **Ordinateur** (`lg:` ≥ 1024px) : sidebar fixe, 3+ colonnes, layout spacieux
- Toute nouvelle page ou composant doit avoir les 3 niveaux testés

## Commandes

- `npm run dev` — Lancer le serveur de développement (port 8080)
- `npm run build` — Build de production
- `npm run build:dev` — Build de développement
- `npm run lint` — ESLint
- `npm run test` — Lancer tous les tests (vitest)
- `npm run test:watch` — Tests en mode watch
- Test unique : `npx vitest run src/chemin/vers/fichier.test.ts`

## Architecture

**Stack frontend :** React 18, TypeScript, Vite (plugin SWC), Tailwind CSS, shadcn/ui (primitives Radix), React Router v6, TanStack React Query.

**Alias de chemin :** `@` pointe vers `./src` (configuré dans vite, vitest et tsconfig).

**Répertoires principaux :**
- `src/pages/` — Composants de pages (routes). La plupart des routes sont protégées via `ProtectedRoute` dans App.tsx (vérification auth + statut admin/approbation).
- `src/components/` — Composants regroupés par fonctionnalité : `admin/`, `audio/`, `auth/`, `cards/`, `homework/`, `layout/`, `mascot/`, `messaging/`, `nourania/`, `prayer/`, `push/`, `ramadan/`, `settings/`, `sourates/`, `ui/` (shadcn).
- `src/contexts/AuthContext.tsx` — Contexte d'authentification unique fournissant `user`, `session`, `isAdmin`, `isApproved`, ainsi que les méthodes d'auth. Utilise Supabase Auth avec une table `user_roles` pour les vérifications admin et `profiles.is_approved` pour le contrôle d'approbation.
- `src/hooks/` — Hooks personnalisés pour les horaires de prière, versets du Coran (dont Ayat Al-Kursi via numéro spécial 1000), notifications push, heartbeat de présence, messages non lus, progression utilisateur, confetti, compteurs admin, etc.
- `src/integrations/supabase/` — `client.ts` (instance du client Supabase) et `types.ts` (types DB auto-générés). Le fichier types est la source de vérité pour le schéma de la base de données.
- `src/lib/` — Fonctions utilitaires (inclut le helper `cn()` de shadcn dans `utils.ts`).

**Backend (Supabase) :**
- `supabase/functions/` — Edge Functions : `admin-assistant`, `delete-user`, `get-vapid-key`, `mascot-chat`, `process-scheduled-notifications`, `send-push-notification`.
- `supabase/migrations/` — Fichiers de migration SQL.
- La base de données compte 50+ tables couvrant les profils, modules d'apprentissage, devoirs, présence, notifications, contenu Ramadan, contenu prière, quiz, et plus.

**Routage :** Toutes les routes sauf `/auth` et `*` (404) sont enveloppées dans `ProtectedRoute`. Les routes de modules dynamiques utilisent `/module/:moduleId` avec `GenericModulePage`, et plusieurs chemins de modules spécifiques utilisent `GenericTimelinePage`.

**Gestion d'état :** État serveur via TanStack React Query ; état d'auth via React Context ; pas de bibliothèque d'état global supplémentaire.

**Tests :** Vitest avec environnement jsdom, React Testing Library. Fichier de setup dans `src/test/setup.ts`. Les fichiers de test suivent le pattern `*.test.ts` ou `*.spec.ts` dans `src/`.

**Composants UI :** shadcn/ui (style default, couleur de base slate, variables CSS activées). Ajouter de nouveaux composants avec `npx shadcn-ui@latest add <composant>`.

## Sourates — Spécificités

- **Ayat Al-Kursi** (numéro spécial `1000`) est insérée entre Al-Ikhlas (112) et Al-Masad (111) dans `SOURATES_ORDERED`. L'API Quran charge le verset 255 de Al-Baqara via `useQuranVerses`. Affiche **"2-255"** dans l'étoile (et non "111b"). Étoile dorée ambre (`hsl(38, 90%, 50%)`) avec halo animé pulsant (classe `.star-ayat-kursi`) pour la distinguer des autres.
- **Audio Ayat Al-Kursi** : 9 fichiers MP3 hébergés localement dans `public/audio/ayat-al-kursi/002_e00.mp3` à `002_e08.mp3`. Utilisés dans `SourateDetailDialog.tsx` pour sourate.number === 1000. Raison : nospetitsmusulmans.com bloque les requêtes cross-domain. Ne pas remplacer par des URLs externes.
- **Icônes 🎁** sur les étoiles toutes les 5 sourates à partir d'Al-Fil (105) : `GIFT_SOURATE_NUMBERS` = {105, 100, 95, …, 5}. Validation d'une sourate 🎁 → feux d'artifice (`fireConfetti`) + toast de félicitation.
- **Accessibilité séquentielle** : basée sur l'index dans `SOURATES_ORDERED` (pas number+1), pour gérer Ayat Al-Kursi.
- **Contenu ciblé** : `sourate_content.target_user_id` (nullable) pour envoyer du contenu à un élève spécifique. `viewed_at` pour le suivi de lecture admin.

## Système de validation admin — màj 2026-04-26

Toutes les validations (inscriptions, sourates, nourania, invocations) disposent de boutons **Accepter** et **Refuser** :
- **Inscriptions** (`AdminRegistrationValidations`) : accepter = `is_approved=true` + rôle `student` ; refuser = suppression profil.
- **Sourates** (`AdminSourateValidations`) : accepter = `status='approved'` + progression ; refuser = `status='refused'` + notification push.
- **Nourania** (`AdminNouraniaValidations`) : idem sourates.
- **Invocations** (`AdminInvocationValidations`) : idem avec recalcul des points.
- **Récitations** (`AdminRecitationReview`) : fermeture immédiate du panneau + item retiré du cache avant les opérations async.
- Côté élève : réception realtime du refus + toast + possibilité de resoumettre.

### Pattern optimistic update (sourates, nourania, récitations)
Toutes les mutations de validation utilisent des **mises à jour optimistes** pour une réactivité immédiate :
- `onMutate` : `setProcessingId(req.id)` + annulation des requêtes en cours + suppression immédiate de l'item dans le cache → retourne `{ previous }`
- `onError` : restauration du cache depuis `context.previous` + toast d'erreur
- `onSettled` : `setProcessingId(null)`
- JSX : `disabled={processingId === req.id}` (per-item, pas global `isPending`)
- Ne **jamais** revenir au pattern `disabled={mutation.isPending}` global (bloque tous les items)

## Contenu ciblé par élève

- Tables `sourate_content` et `nourania_lesson_content` ont des colonnes `target_user_id` (UUID nullable) et `viewed_at` (timestamptz).
- `target_user_id = NULL` → contenu global visible par tous.
- `target_user_id` défini → visible uniquement par cet élève.
- Admin voit le statut Vu/Non vu sous chaque contenu ciblé.
- Marquage automatique `viewed_at` quand l'élève ouvre la sourate/leçon.

## Parcours sourates — Layout (màj 2026-04-26)

- Étoiles de 72px (`STAR_SIZE`), largeur parcours 370px (`TOTAL_WIDTH`), espacement **145px** (`ROW_HEIGHT`).
- Numéros affichés dans **toutes** les étoiles (y compris verrouillées, en gris). Seules les validées affichent ✓.
- Personnages 56px dans les virages du serpentin.
- **Label sous chaque étoile** : `{numéro} - {name_french}` (ex : "113 - Al-Falaq (L'Aube Naissante)"), taille 9px, largeur 112px (`w-28`), wrapping sans troncature. Ayat Al-Kursi affiche "2-255" comme numéro.
- Audios versets : CDN Alafasy `cdn.islamic.network/quran/audio/128/ar.alafasy/{N}.mp3` pour toutes les sourates sauf Ayat Al-Kursi (fichiers locaux).

## Page d'accueil — ordre des blocs (màj 2026-05-07)
1. Bannière notifications (si non fermée)
2. Message de bienvenue (Bismillah + prénom)
3. **Carte "Prochaine prière"** — horaires via `usePrayerTimesCity`, ville lue depuis `localStorage['dinislam_prayer_city']` (défaut Montpellier)
4. **Carte "Hadith du jour"** — liste de 40 hadiths dans `Index.tsx` (constante `HADITHS`), rotation par `dayOfYear % 40`
5. **Carte "Votre progression"**
6. Devoirs admin / BlocDevoirsEleve
7. Grille des modules

### Détails cartes Prière & Hadith (màj 2026-05-07)
- **Prochaine prière** : fond dégradé pastel violet-indigo-bleu (100), dates grégorienne (`text-base` gras) et hégirienne (`text-sm`) centrées au-dessus du titre. Grille 5 pastilles colorées (Fajr violet / Dohr ambre / Asr teal / Maghrib orange / Icha indigo). `PRAYER_EMOJI` map, `getSavedCity()` lit `localStorage['dinislam_prayer_city']`. Dates via `getGregorianDate()` (Intl fr-FR) et `getHijriDate()` (Intl `en-u-ca-islamic` + `HIJRI_MONTHS` array 12 mois français).
- **Hadith du jour** : fond dégradé pastel emerald-teal-cyan (100), badge thème arrondi, texte arabe en vert foncé, guillemet décorative grande. Fonction `getDayHadith()` → `HADITHS[dayOfYear % HADITHS.length]`.
- La ville se lit dans `getSavedCity()` (même clé que `Priere.tsx` : `dinislam_prayer_city`). Si aucune ville sauvegardée → Montpellier par défaut.

## Bouton Zoom dans le header (màj 2026-05-07)
- Icône SVG inline `ZoomIcon` (caméra bleue #2D8CFF, rx=4) dans `Header.tsx`
- Constante `ZOOM_URL` en haut du fichier — changer ici si le lien Zoom change
- Bouton visible pour **tous** les utilisateurs (admin et élèves), placé avant le trophée 🏆
- Ouvre dans un nouvel onglet (`window.open`, `noopener,noreferrer`)

## Classement — règles de rang (màj 2026-05-07)
- **Dense ranking** : `getDenseRanks<T extends {total:number}>(sortedArr)` → même rang pour même score (ex: 2 élèves à 10pts = tous les deux 8ème). Appliqué en vue globale, groupes admin, groupe élève.
- **Tous les élèves** dans le classement global : on part de `profiles.is_approved=true` (hors admins via `user_roles`) puis on joint `student_ranking`. Élèves à 0 pts apparaissent en bas.
- **Médailles** : `getMedaille(rank)` prend un rang 1-based (1=🥇, 2=🥈, 3=🥉).
- Bannière "Ma position" utilise `myGlobalDenseRank` (dense rank, pas `myGlobalIndex+1`).

## Registre de présence — tri par groupes (màj 2026-05-07)
- `AdminAttendance.tsx` charge `student_groups` + `student_group_members` via une query `attendance-group-members`
- Memo `groupedStudents` : pour chaque groupe (trié par nom), liste des élèves membres. Élèves sans groupe dans une section "Sans groupe" en bas.
- Rendu : bandeau coloré (couleur du groupe) entre chaque groupe avec `👥 NomGroupe — N élèves`. Numérotation 1, 2, 3... par groupe.
- Si aucun groupe créé, affiche tous les élèves sans séparateur (comportement d'origine).

## Cartes admin-only

Les cartes `students`, `messages`, `attendance`, `homework`, `recitations` dans `ADMIN_ONLY_CARDS` n'affichent jamais le toggle de visibilité élèves (pas d'icône œil).

## Nettoyage tableau de bord + accueil admin (màj 2026-05-04)

### Cartes supprimées du code (`STATIC_CARDS` dans `Admin.tsx`)
- `messages` (Messages)
- `attendance` (Registre de Présence)
- `recitations` (Corriger audios)
- `homework` (Cahier de texte)
Ces fonctions restent accessibles via le panneau admin (🛡️) et le header — supprimées du tableau de bord car doublons.

### Cartes supprimées de la base de données
- Table `dashboard_cards` : suppression de "Élèves", "Utilisateurs", "Messages", "Registre de Présence"
- Table `learning_modules` : suppression de "Élèves", "Utilisateurs", "Messages", "Registre de Présence"
Ces cartes étaient visibles sur la page d'accueil et dans le tableau de bord admin — elles faisaient doublon avec le panneau admin (🛡️) et le header.

## Panneau admin (🛡️) — AdminCommandModal

- **Boutons actions** (grands, avec badge rouge si en attente) : 📚 Devoirs · 🎙️ Récitations · 📖 Sourates · 🔤 Nourania
- **Modules** (grille 2 colonnes) : 👨‍🎓 Élèves · 📋 Registre · 📓 Cahier de texte · 📝 Inscriptions
- La clé localStorage est `admin_boutons_order_v3` — à incrémenter si on ajoute/retire des boutons actions pour forcer un reset.
- `AdminStudentDetails` est utilisé pour le bouton Élèves (pas `AdminStudents`). Le `DropdownMenuContent` doit avoir `className="z-[600]"` pour apparaître au-dessus de la modale (z-500).
- Les `Dialog` imbriqués dans des composants affichés dans la modale doivent utiliser `level="nested"` (overlay z-500, content z-550).
- Carte "Élèves" du tableau de bord supprimée (accessible uniquement via le panneau admin).
- Popup "Bienvenue - Comment t'appelles-tu" supprimé de `Index.tsx` (le prénom est saisi à l'inscription).

## Récitations (fonctionnalité 2026-04-09)

- Table `sourate_recitations` : `id`, `sourate_id`, `student_id`, `audio_url`, `student_comment`, `status` (pending/validated/corrected), `admin_audio_url`, `admin_comment`, `created_at`, `updated_at`.
- Bucket Storage `recitations` (public, 50 MB max). Fichiers élèves : `{user_id}/{sourate_id}/{timestamp}.mp4` (ou `.webm` sur Chrome). Fichiers admin : `admin/{student_id}/{recitation_id}-response.webm`.
- **Côté élève** : `SourateRecitationPanel.tsx` dans `SourateDetailDialog.tsx` (au-dessus de la vidéo). Utilise MediaRecorder API → upload Supabase → insert en DB. Subscription realtime pour voir les réponses admin.
- **Côté admin** : `AdminRecitationReview.tsx` accessible via la carte "Corriger audios" (ViewType `recitations`). Filtre par statut, lecture audio, champ commentaire, enregistrement audio de réponse, boutons Valider / Envoyer correction.
- RLS : élèves voient et suppriment leurs propres récitations (pending seulement) ; admins voient et modifient toutes (`has_role(auth.uid(), 'admin'::app_role)`).
- **Politique RLS admin** : si l'admin ne voit pas les récitations, relancer ce SQL : `DROP POLICY IF EXISTS "Admins full access on recitations" ON public.sourate_recitations; CREATE POLICY "Admins full access on recitations" ON public.sourate_recitations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));`
- **Politique RLS élève DELETE** (màj 2026-05-07) : `CREATE POLICY "student_delete_own_recitation" ON public.sourate_recitations FOR DELETE TO authenticated USING (student_id = auth.uid()); CREATE POLICY "student_delete_own_recitation_file" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'recitations' AND split_part(name, '/', 1) = auth.uid()::text);`
- **Politique Storage** : bucket `recitations` public=true. Si les audios ne se lisent pas, relancer : `UPDATE storage.buckets SET public = true WHERE id = 'recitations'; DROP POLICY IF EXISTS "Public read recitations" ON storage.objects; CREATE POLICY "Public read recitations" ON storage.objects FOR SELECT USING (bucket_id = 'recitations');`
- **URLs signées (màj 2026-04-26)** : `AdminRecitationReview` et `SourateRecitationPanel` génèrent des **signed URLs** (validité 2h) via `supabase.storage.from('recitations').createSignedUrl(path, 7200)` dans le `queryFn`. Contourne les problèmes de cache SW et restrictions iOS WKWebView. Ne pas revenir aux URLs publiques directes.
- **Service Worker** : les requêtes vers `/storage/v1/object/` et les requêtes de `destination === 'audio'` sont toujours passées directement au réseau (jamais mises en cache). Les réponses non-200 ne sont jamais mises en cache non plus.
- `useAdminPendingCounts` : inclut maintenant le count `recitations` (status=pending) avec abonnement realtime.
- **Format audio iOS (màj 2026-05-07 — CRITIQUE)** : iOS Safari ne supporte PAS WebM. `mr.mimeType` est vide AVANT `mr.start()` sur iOS → fallback `audio/webm` erroné. Solution : `pickMimeType()` utilise `isTypeSupported(['audio/mp4', ...])`, crée MediaRecorder avec format explicite, lit `mr.mimeType` APRÈS `mr.start()`. Blob et upload en `audio/mp4` / `.mp4`. Preview via `FileReader.readAsDataURL()` (blob URLs cassées sur iOS WKWebView). Élèves peuvent supprimer leurs récitations "En attente" via bouton 🗑️ + AlertDialog.

## Suppression d'élève (màj 2026-05-08)

- Bouton **"Supprimer l'élève"** dans `AdminStudentDetails.tsx` → menu ⋯ → option rouge avec icône Trash2
- Confirmation obligatoire via `ConfirmDeleteDialog` avant suppression
- Suppression via `supabase.functions.invoke('delete-user', { body: { user_id } })` (Edge Function existante)
- Edge Function `confirm-user-email` créée (`supabase/functions/confirm-user-email/`) mais **non utilisée dans le flux principal** — disponible pour corrections manuelles si besoin

## Mot de passe admin (fonctionnalité 2026-04-08)

- Colonne `plain_password` dans `profiles` pour afficher le mot de passe en clair côté admin (app familiale privée).
- Edge Function `update-user-password` : vérifie que l'appelant est admin, appelle `supabaseAdmin.auth.admin.updateUserById` + met à jour `profiles.plain_password`.
- `AdminStudents.tsx` et `AdminStudentDetails.tsx` : menu 3 points → "Modifier le mot de passe" avec affichage du mot de passe actuel (masqué avec œil) et champ nouveau mot de passe.

## Classement (`src/pages/Classement.tsx`) — mis à jour 2026-04-22

**Règle principale** : un élève voit son propre nom + tous les autres en "Élève" ; l'admin voit tous les noms réels. Anonymisation **data layer** (pas juste UI).

- **Fetch profiles conditionnel** : si `isAdmin` → `supabase.from('profiles').in('user_id', userIds)` (tous les noms). Sinon → `.eq('user_id', user.id)` (seulement le profil du viewer). Les autres lignes affichent `full_name || 'Élève'`, donc "Élève" quand `full_name` est null. Ne jamais élargir ce fetch pour les élèves.
- **Vue par défaut = Global** pour tous (élèves et admins). Le toggle "🌍 Global" et "👨‍👩‍👧 Par groupes" est visible pour tous.
- **Vue "Par groupes" côté élève** : affiche uniquement le groupe de l'élève, membres en `Moi` / `Élève`, triés par points. Source : `groupMembers.filter(m => m.group_id === myGroupId)`.
- **Vue "Par groupes" côté admin** : tous les groupes, tous les membres avec `full_name`.
- **RLS `student_group_members`** : la policy SELECT autorise un utilisateur à lire les membres des groupes auxquels **il appartient** (admin voit tout). Mise en place via la fonction SECURITY DEFINER `public.is_user_in_group(_group_id, _user_id)` pour contourner la récursion RLS. Migration : `20260422120000_fix_group_members_visibility.sql`. **Ne pas restreindre à nouveau à `auth.uid() = user_id` sinon l'élève ne verra que lui-même.**
- **RLS `student_ranking`** : lecture publique (tous les authentifiés voient les points), c'est voulu pour que le classement existe.

## Piège `student_groups`

- La table **n'a pas** de colonne `updated_at`. Ne pas la référencer dans les `.update({...})` (erreur PGRST204 : "Could not find the 'updated_at' column..."). Si on veut tracker la dernière modif, ajouter d'abord la colonne via migration.

## Inscriptions — màj 2026-05-13

- La liste des inscriptions (`AdminRegistrationValidations.tsx`) utilise une requête directe sur `profiles` avec `.or('is_approved.eq.false,is_approved.is.null')` — **pas la RPC `get_pending_registrations()`** (celle-ci filtrait par `email_confirmed_at IS NOT NULL`, ce qui cachait les élèves non confirmés).
- Le compteur (`useAdminPendingCounts.ts`) utilise aussi `.eq('is_approved', false)` directement sur `profiles`.
- **Workflow push** : toujours pousser sur `origin`, `lovable` ET `lovable-fork` pour que le code atteigne bien Lovable.

## Visibilité des modules — màj 2026-05-13

### Table `module_visibility`
```sql
CREATE TABLE IF NOT EXISTS public.module_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  visibility_type text NOT NULL DEFAULT 'all',
  user_ids uuid[] NOT NULL DEFAULT '{}',
  group_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT module_visibility_module_id_key UNIQUE (module_id),
  CONSTRAINT valid_visibility_type CHECK (visibility_type IN ('all', 'users', 'groups'))
);
ALTER TABLE public.module_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_module_visibility" ON public.module_visibility FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "student_read_module_visibility" ON public.module_visibility FOR SELECT TO authenticated USING (true);
```

### Fonctionnement
- Bouton **"Afficher à…"** dans le menu 3 points de chaque carte (page d'accueil, admin uniquement)
- Composant : `src/components/admin/ModuleVisibilityDialog.tsx`
- 3 modes : `all` (tout le monde), `users` (personnes spécifiques), `groups` (groupes spécifiques)
- Badge **🎯 Ciblé** affiché sur les cartes ciblées (admin uniquement)
- Filtrage dans `Index.tsx` : les élèves ne voient que les cartes qui leur sont destinées
- `visibility_type = 'all'` ou pas de ligne → visible par tous

## Colonnes ajoutées à `module_cards` — màj 2026-05-13

```sql
ALTER TABLE public.module_cards ADD COLUMN IF NOT EXISTS title_arabic text;
ALTER TABLE public.module_cards ADD COLUMN IF NOT EXISTS section text;
```

## Colonnes ajoutées à `invocations` — màj 2026-05-15

```sql
ALTER TABLE public.invocations ADD COLUMN IF NOT EXISTS content_arabic text;
ALTER TABLE public.invocations ADD COLUMN IF NOT EXISTS content_french text;
```
Ces colonnes sont utilisées dans `AdminInvocationManager.tsx` pour stocker le texte arabe et la traduction française de l'invocation.

## Contenu YouTube dans les cartes de module — màj 2026-05-14

- Le lien YouTube est sauvegardé dans `module_card_content` avec `content_type: 'youtube'` et `file_url: embedUrl` (format `https://www.youtube.com/embed/VIDEO_ID`)
- La conversion URL → embed se fait dans `ContentUploadTabs.tsx` via `convertYoutubeToEmbed()`
- **Ne pas** utiliser un lien `<a>` pour les URLs embed — elles ne s'ouvrent pas correctement dans un navigateur
- Affichage via `<iframe>` avec classe `aspect-video` dans **les 3 fichiers** de dialog de détail de carte :
  - `GenericModulePage.tsx` (route `/module/:moduleId`)
  - `GenericTimelinePage.tsx` (routes `/module/vocabulaire`, `/module/darija`, etc.)
  - `GrammaireConjugaisonPage.tsx` (route `/grammaire`) ← **page dédiée, à ne pas oublier !**

## 🃏 Système de flashcards — màj 2026-05-14

### Table SQL à créer (à exécuter par Mustapha)
```sql
CREATE TABLE IF NOT EXISTS public.module_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_card_id uuid NOT NULL REFERENCES public.module_cards(id) ON DELETE CASCADE,
  front_text text NOT NULL,
  back_arabic text,
  back_transliteration text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.module_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_flashcards" ON public.module_flashcards
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_flashcards" ON public.module_flashcards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
```

### Architecture
- **FlashcardPlayer** (`src/components/FlashcardPlayer.tsx`) : composant élève — flip 3D animé, navigation ←→, bouton Mélanger/Réinitialiser, barre de progression
- **FlashcardManager** (`src/components/admin/FlashcardManager.tsx`) : accordéon admin dans chaque carte — formulaire ajout (français + arabe + translittération) + liste avec suppression
- Intégré dans les **3 pages** module : `GrammaireConjugaisonPage`, `GenericTimelinePage`, `GenericModulePage`
- Query key élève : `['flashcards', selectedCard?.id]` (chargement lazy à l'ouverture du dialog)
- Query key admin : `['admin-flashcards', cardId]` + invalide aussi `['flashcards', cardId]`
- Recto : texte français — Verso : arabe + translittération
- Fonctionne pour **tous les modules** de l'application

## ⚠️ Routage des modules — architecture à 3 fichiers (màj 2026-05-14)

**TOUJOURS vérifier `App.tsx` avant de modifier un composant de module.**

| Route | Composant | Modules |
|-------|-----------|---------|
| `/grammaire` | `GrammaireConjugaisonPage.tsx` | Grammaire & Conjugaison |
| `/coran` | `CoranPage.tsx` | Coran (PDF + 114 sourates 1→114) |
| `/module/vocabulaire` | `GenericTimelinePage.tsx` | Vocabulaire |
| `/module/lecture-coran` | `GenericTimelinePage.tsx` | Lecture Coran |
| `/module/darija` | `GenericTimelinePage.tsx` | Darija |
| `/module/dictionnaire` | `GenericTimelinePage.tsx` | Dictionnaire |
| `/module/dhikr` | `GenericTimelinePage.tsx` | Dhikr |
| `/module/hadiths` | `GenericTimelinePage.tsx` | Hadiths |
| `/module/histoires-prophetes` | `GenericTimelinePage.tsx` | Histoires des Prophètes |
| `/module/:moduleId` | `GenericModulePage.tsx` | Tous les autres modules dynamiques |

**Règle :** quand on ajoute une fonctionnalité dans le dialog de détail d'une carte, la dupliquer dans les **3 fichiers**.

## Carte Coran — màj 2026-05-15

### Architecture
- **Page** : `src/pages/CoranPage.tsx` → route `/coran`
- **Données partagées** : `src/data/sourates.ts` exporte `SOURATES_DATA` (115 sourates dont Ayat Al-Kursi) et `CORAN_ORDERED` (114 sourates triées 1→114, sans Ayat Al-Kursi)
- **Module Supabase** : `learning_modules` avec `is_builtin=true`, `builtin_path='/coran'`

### PDF du Coran
- **Fichier intégré** : `public/pdf/coran.pdf` (41Mo, compressé depuis 351Mo via ghostscript 60 DPI)
- CoranPage charge d'abord l'URL depuis la base (`module_card_content`), sinon fallback sur `/pdf/coran.pdf`
- Le service worker **exclut les PDF du cache** (`isPdfRequest` dans `sw.js`) — évite 41Mo en cache SW
- Admin Coran → deux modes : **Lien URL** (recommandé pour gros fichiers) ou **Téléverser** (max ~50Mo Supabase)
- Le lien URL est validé avant sauvegarde (auto-ajout de `https://` si manquant)

### Fonctionnement
- Section PDF en haut → bouton "Ouvrir / Télécharger" → `window.open()` (fiable sur iOS PWA)
- Liste des 114 sourates Al-Fatiha→An-Nas, **toutes déverrouillées** dès le départ
- Validation : tous les versets cochés → **auto-validation directe** sans demande admin
- Réutilise `SourateDetailDialog` à l'identique

### Progression indépendante de la carte Sourates (màj 2026-05-15)
- Colonne `context text NOT NULL DEFAULT 'sourates'` ajoutée dans `user_sourate_progress` et `user_sourate_verse_progress`
- CoranPage utilise `context = 'coran'` pour toutes les lectures/écritures
- Sourates.tsx utilise `context = 'sourates'`
- `onConflict` mis à jour partout : `'user_id,sourate_id,context'` et `'user_id,sourate_id,verse_number,context'`
- Contraintes UNIQUE recréées avec `context` : `idx_usp_user_sourate_context` et `idx_usvp_user_sourate_verse_context`
- Fichiers concernés : `CoranPage.tsx`, `Sourates.tsx`, `AdminSourateValidations.tsx`, `AdminUnlockAllDialog.tsx`
- **Ne jamais revenir à `onConflict: 'user_id,sourate_id'`** sans context — les deux parcours redeviendraient liés

### Admin
- Carte "Coran" dans `STATIC_CARDS` (vert, `view: 'coran-manage'`)
- `CARD_KEY_TO_BUILTIN_PATH['coran'] = '/coran'` → toggle visibilité
- `AdminCoranContent` : gestion PDF + autres contenus (YouTube, audio, fichiers)

### Déverrouillage automatique 20 ans et bouton admin (màj 2026-05-15)
- Hook `useIsOver20()` dans `src/hooks/useIsOver20.ts` : lit `date_of_birth` / `age` depuis `profiles`
- **Sourates.tsx** : `isSourateAccessible()` → bypass si `isOver20 || isAdmin` ; auto-validation si `isOver20`
- **Nourania.tsx** : `isLessonUnlocked()` → bypass si `isOver20 || isAdmin` ; auto-validation si `isAdminUnlocked || isOver20`
- **Invocations.tsx** : `isCardUnlocked()` → bypass si `isAdmin || isOver20`
- **`AdminUnlockAllDialog`** (`src/components/admin/AdminUnlockAllDialog.tsx`) : bouton "Déverrouiller tout" + multi-select élèves dans Sourates.tsx, Nourania.tsx, Invocations.tsx. Upsert massif de toutes les progressions à `is_validated=true`.

## Déploiement

**⚠️ LOVABLE EST L'OUTIL DE PUBLICATION OFFICIEL — PAS VERCEL.**

- Les élèves utilisent **uniquement le lien Lovable**. Migrer les élèves vers un autre URL est trop contraignant, donc Lovable reste la source de vérité côté publication.
- Remote `lovable` → repo GitHub `badmust75-coder/dinislam-5e689abf` (branche `main`) — **c'est ce repo que Lovable surveille**.
- Remote `origin` → repo GitHub `badmust75-coder/Dinislam` (archive/miroir, à maintenir à jour).
- **Workflow** : modifs locales → `git push origin main && git push lovable main` → Lovable récupère depuis son repo → Mustapha clique "Publier" dans Lovable.
- Claude **ne doit jamais** pousser vers Vercel, recréer un projet Vercel, ni proposer de migrer les élèves sur un autre URL sans demande explicite.
- Le `vercel.json` éventuellement présent et l'URL `dinislam-two.vercel.app` sont des résidus d'une ancienne tentative — ignorer, ne pas s'en servir comme référence.

## Page Prière (`src/pages/Priere.tsx`) — màj 2026-04-26

- **Ville par défaut** : Montpellier (34) si aucune ville n'a jamais été sélectionnée.
- **Persistance ville** : sauvegardée dans `localStorage` sous la clé `dinislam_prayer_city` (JSON). Restaurée automatiquement à chaque ouverture. Helper `getSavedCity()` valide le JSON avant de l'utiliser.
- `handleSelectCity(city)` : centralise la mise à jour state + localStorage + fermeture du sélecteur.

## Règle UX — Confirmation avant suppression

**TOUJOURS** afficher une modale de confirmation avant toute suppression définitive dans l'application.
- Utiliser `useDeleteConfirm` + `<DeleteConfirmDialog>` (ou un `AlertDialog` équivalent si le composant n'existe pas)
- Cela s'applique à TOUS les boutons/icônes poubelle, menus "Supprimer", et toute action de suppression irréversible
- Messages adaptés au contexte : "Supprimer cet élève ?", "Supprimer ce devoir ?", etc.
- Ne jamais supprimer directement sans confirmation, même pour de petits éléments

## Nourania — Contenu PDF des leçons (màj 2026-05-06)

### PDFs découpés depuis القاعدة النورانية
- PDF source : `/Users/nadiaelb/Documents/Cours Arabe Enfants/Nourania/PDF cours d'arabe/القاعدة النورانية PC-328 copie.pdf` (34 pages)
- PDFs découpés (17 fichiers) : `/Users/nadiaelb/Documents/Cours Arabe Enfants/Nourania/PDFs leçons/lesson_01.pdf` à `lesson_17.pdf`
- Script de génération : pypdf (pip3 install pypdf) + mapping pages ci-dessous

### Mapping pages PDF → leçons (0-indexé)
| Leçon | Indices pypdf | Pages PDF |
|-------|--------------|-----------|
| L1 | [6] | 7 |
| L2 | [7,8,9] | 8-10 |
| L3 | [9] | 10 |
| L4 | [10,11] | 11-12 |
| L5 | [11,12] | 12-13 |
| L6 | [12,13] | 13-14 |
| L7 | [13] | 14 |
| L8 | [14,15,16] | 15-17 |
| L9 | [16,17,18] | 17-19 |
| L10 | [18,19] | 19-20 |
| L11 | [19,20,21,22] | 20-23 |
| L12 | [22,23] | 23-24 |
| L13 | [23,24,25] | 24-26 |
| L14 | [25] | 26 |
| L15 | [25,26] | 26-27 |
| L16 | [26] | 27 |
| L17 | [26,27,28] | 27-29 |

### Upload dans l'app
- Bucket Supabase : `nourania-content`, chemin `lesson-{lesson_id}/{timestamp}.pdf`
- Table : `nourania_lesson_content` (content_type = 'fichier', file_name = 'Cours PDF - Leçon N')
- **Bouton "Import PDF en lot"** dans `AdminNouraniaContent.tsx` : sélectionner les 17 PDFs (lesson_01.pdf…) → upload automatique + remplacement des anciens (idempotent)
- Pages 30-31 (instructions prof) et 32-34 (pages de couverture arrière) exclues

### Affichage PDF sans scroll interne (màj 2026-05-07)
- Composant `src/components/nourania/NouraniaPdfViewer.tsx` : utilise `react-pdf` (pdfjs-dist v5) pour rendre chaque page en `<canvas>` empilé verticalement → scroll continu sans iframe
- Worker PDF : `public/pdf.worker.min.mjs` (copie locale de pdfjs-dist, 1 MB)
- Suppression de l'ancienne `<iframe>` et de `getPdfHeight()` dans `Nourania.tsx`
- Bouton "Imprimer" rouge (bordure + texte) à côté de chaque PDF → ouvre dans un nouvel onglet pour impression native
- `react-pdf` ajouté dans `optimizeDeps.include` de `vite.config.ts`

### Notes de l'enseignante — realtime (màj 2026-05-06)
- Table `nourania_commentaires_eleves` : `lecon_id`, `student_id`, `commentaire`, UNIQUE(lecon_id, student_id)
- RLS : admin ALL · élève SELECT WHERE student_id = auth.uid()
- **Realtime activé** (`ALTER PUBLICATION supabase_realtime ADD TABLE nourania_commentaires_eleves`) — les élèves reçoivent les notes instantanément (toast 📝 affiché, query invalidée)
- ⚠️ Sans le `ALTER PUBLICATION`, les élèves ne voient la note qu'après rechargement de la page
- Migration : `supabase/migrations/20260506120000_fix_commentaires_realtime.sql`
