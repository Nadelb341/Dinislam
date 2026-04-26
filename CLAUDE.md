# CLAUDE.md

Ce fichier fournit des instructions à Claude Code (claude.ai/code) pour travailler sur ce dépôt.

## Présentation du projet

Dinislam est une application web d'éducation islamique (en français) construite avec React + TypeScript + Vite, utilisant Supabase comme backend. Elle couvre les sourates du Coran (114 + Ayat Al-Kursi), les invocations, la méthode Nourania, l'apprentissage de la prière, les activités du Ramadan, l'alphabet arabe, les noms d'Allah, la grammaire/conjugaison, le vocabulaire, les hadiths, et plus encore. Elle dispose de rôles admin/élève avec un workflow d'approbation (accepter/refuser), un suivi de présence, des devoirs, une messagerie, des notifications push, un classement et un chat mascotte (via Supabase Edge Function).

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

## Cartes admin-only

Les cartes `students`, `messages`, `attendance`, `homework`, `recitations` dans `ADMIN_ONLY_CARDS` n'affichent jamais le toggle de visibilité élèves (pas d'icône œil).

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
- Bucket Storage `recitations` (public, 50 MB max). Fichiers élèves : `{user_id}/{sourate_id}/{timestamp}.webm`. Fichiers admin : `admin/{student_id}/{recitation_id}-response.webm`.
- **Côté élève** : `SourateRecitationPanel.tsx` dans `SourateDetailDialog.tsx` (au-dessus de la vidéo). Utilise MediaRecorder API → upload Supabase → insert en DB. Subscription realtime pour voir les réponses admin.
- **Côté admin** : `AdminRecitationReview.tsx` accessible via la carte "Corriger audios" (ViewType `recitations`). Filtre par statut, lecture audio, champ commentaire, enregistrement audio de réponse, boutons Valider / Envoyer correction.
- RLS : élèves voient leurs propres récitations ; admins voient et modifient toutes (`has_role(auth.uid(), 'admin'::app_role)`).
- **Politique RLS admin** : si l'admin ne voit pas les récitations, relancer ce SQL : `DROP POLICY IF EXISTS "Admins full access on recitations" ON public.sourate_recitations; CREATE POLICY "Admins full access on recitations" ON public.sourate_recitations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));`
- **Politique Storage** : bucket `recitations` public=true. Si les audios ne se lisent pas, relancer : `UPDATE storage.buckets SET public = true WHERE id = 'recitations'; DROP POLICY IF EXISTS "Public read recitations" ON storage.objects; CREATE POLICY "Public read recitations" ON storage.objects FOR SELECT USING (bucket_id = 'recitations');`
- **URLs signées (màj 2026-04-26)** : `AdminRecitationReview` et `SourateRecitationPanel` génèrent des **signed URLs** (validité 2h) via `supabase.storage.from('recitations').createSignedUrl(path, 7200)` dans le `queryFn`. Contourne les problèmes de cache SW et restrictions iOS WKWebView. Ne pas revenir aux URLs publiques directes.
- **Service Worker** : les requêtes vers `/storage/v1/object/` et les requêtes de `destination === 'audio'` sont toujours passées directement au réseau (jamais mises en cache). Les réponses non-200 ne sont jamais mises en cache non plus.
- `useAdminPendingCounts` : inclut maintenant le count `recitations` (status=pending) avec abonnement realtime.

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
