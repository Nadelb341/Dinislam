# CLAUDE.md

> 📚 **Historique détaillé de toutes les fonctionnalités** (qui a demandé quoi, choix de Nadia, fichiers, tests) : `HISTORIQUE.md`. Le lire AVANT de toucher à une fonctionnalité existante (chercher son nom dedans).

## 🚨🚨 RÈGLE ABSOLUE — L'application doit TOUJOURS pouvoir s'ouvrir (voir CLAUDE.md global)
Règle née le 2026-09-15 sur Agenda Nadia (un hook mal placé a fait planter toute l'appli pour tout le monde) — s'applique aussi ici. Règle complète (priorité maximale) dans `~/Projets Claude Code/CLAUDE.md`, tout en haut du fichier : `tsc` ET `npx eslint` (règles React des Hooks, si `eslint-plugin-react-hooks` est installé dans ce projet) obligatoires avant chaque push, vigilance renforcée sur tout composant affiché sans condition sur l'écran d'accueil/la mise en page globale.

Ce fichier fournit des instructions à Claude Code (claude.ai/code) pour travailler sur ce dépôt.

## Présentation du projet

Dinislam est une application web d'éducation islamique (en français) construite avec React + TypeScript + Vite, utilisant Supabase comme backend. Elle couvre les sourates du Coran (114 + Ayat Al-Kursi), les invocations, la méthode Nourania, l'apprentissage de la prière, les activités du Ramadan, l'alphabet arabe, les noms d'Allah, la grammaire/conjugaison, le vocabulaire, les hadiths, et plus encore. Elle dispose de rôles admin/élève avec un workflow d'approbation (accepter/refuser), un suivi de présence, des devoirs, une messagerie, des notifications push, un classement et un chat mascotte (via Supabase Edge Function).

## 🆓 RÈGLE ABSOLUE — Appli LIBRE : rien de payant + utilisable hors ligne même en « black-out » (Nadia, 2026-11-08)
Règle complète tout en haut de `~/Projets Claude Code/CLAUDE.md`. Pour Dinislam : forfaits gratuits seulement (Vercel Hobby, Supabase Free), aucune fonction dépendante d'un abonnement ou de l'accès Claude de Mustapha ; vidéos allégées et servies par l'appli (Vercel) plutôt que par Supabase ; tout contenu déjà vu (vidéos d'invocations comprises) doit rester lisible sans réseau.

## 🧹 RÈGLE ABSOLUE — Supprimer = tout ce qui en dépend, mais PRÉVENIR avant si ça touche autre chose (Nadia, 2026-11-11)
Règle complète dans `~/Projets Claude Code/CLAUDE.md`. Retirer aussi tout ce qui ne servait qu'à la fonction supprimée (code, états, brouillons, réglages, tables) ; chercher avant tout ce qui l'utilise ; si un morceau sert aussi ailleurs ou si des données seraient perdues → prévenir Nadia et attendre sa réponse.

## 🚫 RÈGLE ABSOLUE — Ne JAMAIS lancer `supabase db push` (2026-11-08, audit idée 25)
Les ~160 fichiers de `supabase/migrations/` ont été appliqués à la main (`supabase db query --linked -f`) et ne sont pas enregistrés côté base : un `db push` essaierait de TOUT rejouer (doublons, erreurs, données abîmées). Toujours `supabase db query --linked -f <fichier>` puis vérifier en base. Photo de la structure (sans aucune donnée) : `supabase/schema/schema_2026-11-08.sql` (tables, contraintes, index, fonctions, déclencheurs, règles RLS, tâches planifiées ; clé anon masquée) — à refaire après un gros changement de base. Node : `engines.node = 24.x` (= réglage Vercel). Installation : npm seulement (fichiers bun supprimés le 2026-11-08).

## ⏳ RÈGLE ABSOLUE — Ne jamais compter sur Nadia pour relancer / rappeler / redemander
Voir la règle complète dans `~/Projets Claude Code/CLAUDE.md` (élargie le 2026-08-31). Toute suite à donner — blocage côté Nadia **OU** une amélioration/vérification que JE propose pour plus tard — doit être notée par moi dans une section **"⚠️ ACTION EN ATTENTE"** de ce fichier et reprise par moi au début de chaque session, jamais en attendant qu'elle m'en reparle. Nadia oublie tout : *"n'attends plus que je te dise de faire les choses à venir ou des sortes de rappels"*.

## ⏳ RÈGLE ABSOLUE — « Actions en attentes » en bas de CHAQUE réponse (2026-11-02)
Règle complète dans le CLAUDE.md global. À chaque réponse, terminer par **« ⏳ Actions en attentes »** : tout ce qui est noté « ⚠️ ACTION EN ATTENTE » ci-dessous + ce qui attend une réponse de Nadia dans la conversation, tant qu'elle n'a pas dit que c'est fait.
🔢 Chaque action **numérotée** (1., 2., 3.…), comme toute liste d'actions à faire/valider par Nadia (règle 2026-11-02, CLAUDE.md global).

### ⚠️ ACTION EN ATTENTE — liste à jour (à rappeler en bas de chaque réponse, NUMÉROTÉE)
Mise au propre le 2026-11-09 (idée 27 de l'audit). L'ancienne liste (très longue, surtout des ✅) est recopiée telle quelle dans `HISTORIQUE.md`, section « Ancienne liste en attente ».
- 🛠️ **Audit TAZ/ZAT/DETTE du 07/11 — reste** (lancé par Nadia le 09/11 : « lance ») : idée 18 sauvegarde hebdomadaire : dépôt PRIVÉ https://github.com/Nadelb341/dinislam-sauvegardes créé le 09/11 (GitHub Actions chaque dimanche 3 h UTC, pg_dump 17 public+auth+storage → gzip → GPG AES-256, 12 dernières semaines, `journal.txt` garde le dépôt actif) → ⏳ Nadia doit ajouter les 2 secrets GitHub `SUPABASE_DB_URL` (adresse « Session pooler » avec mot de passe de la base) et `CHIFFREMENT` (mot de passe qu'elle invente, gardé dans son appli Mots de passe), puis je lance la 1re sauvegarde (Run workflow) et je vérifie le journal ; idée 28 grandes mises à jour (Vite 5→8, React 19, Tailwind 4, React Router 7…) = chantier dédié, demander avant ; `_shared/cors.ts` des 14 fonctions serveur pas fait (gain minime, redéploiement des 14). ✅ faits : 1-17, 19-27 (détail dans HISTORIQUE.md).
- ✅ 🔤 Alphabet lettre par lettre (en ligne le 11/11, commit 5b33b5c) : vu en vrai par Nadia (fenêtre d'une lettre OK).
- ✅ 📚 Devoirs élève par élève + 👥 cartes de groupe (en ligne le 11/11, commit 606b7dd) : vus en vrai par Nadia (« parfait »).
- 🆕 **Nouveautés du 11/11 en ligne, ⏳ à VOIR en vrai par Nadia (captures)** : Alphabet par groupes + Alif fermée (34f822a) ; devoirs à plusieurs lignes = 1 💎 par matière (155d871) ; 📨 Convocations (f468e5f) ; 🎠 jeux de saison (voir sections). Cheminée et cache-cache : ⏳ choix de Nadia (https://claude.ai/artifact/DbTNHqJarGC6mTZRXXyyrN).
- ✅ 🧪 Rappels de prière : Nadia confirme le 11/11 que les notifications arrivent → clos.
- ❓ **Questions de l'audit à Nadia** (« plus tard ») : (q1) tester récitation / consigne audio / message audio sur un compte élève ; (q2) accord pour créer le secret des tâches planifiées (idée 19 bis : Vault + `supabase secrets set`) ; (q3) suppression d'un élève définitive OU pause 61 jours restaurable ; (q4) forfait Supabase = gratuit (règle du 08/11) → reste à vérifier que la clé Gemini (AI Studio) est gratuite.
- 🍂 **Saisons — reste validé par Nadia** : sous-carte « Vocabulaire pour la saison », petit décor dans les pages (idée 7), ciblage élèves/groupes, son du feu, image qui change chaque semaine. (Hiver codé et en ligne le 04/11.)
- 🔢 **Numéros de lignes Nourania** : choix du style des pastilles (5 styles https://claude.ai/artifact/Fk2Q2Epb4CeNjkZfMDaxUz, Nadia les trouvait « pas assez grosses, vides et froides ») ; ÉTAPE 2 : devoir « Leçon 6 – ligne 4 », corrections avec les lignes, lignes dites dans l'audio ; ÉTAPE 3 : mode « cours en direct » Zoom, grossir une ligne par appui long.
- 🎬 Vidéos d'invocations avec boutons d'iPhone (Avant de manger, J'ai mal) : Nadia « laisse comme ça » (09/11) → clos.
- 📜 **TOUJOURS EN DERNIER** — Valider les 114 fiches des sourates (Accueil › Coran › ⋮ › Gérer le contenu › 📜 Fiches) : Nadia « plus tard » ; points de doute : 36 Yâ-Sîn et 64 At-Taghâbun, 30 Ar-Rûm, 96 versets 6-19, An-Nahl 126 / Al-Isrâ' 85 / Yâ-Sîn 12 / Al-Mutaffifîn, 3 Âl ʿImrân, 8 et 60, 24 An-Nûr et 66 At-Tahrîm (détail dans HISTORIQUE.md).

## 🎠 Petits jeux des décors de saison (2026-11-11 ; RIEN À GAGNER, juste des animations)
- `src/components/saisons/JeuxSaison.tsx` (+ logique testée `jeuxSaisonLogique.ts`), monté sur l'accueil quand une saison est active ; mêmes jeux à chaque saison, décor de la saison.
- 🦔 Compagnon (hérisson/écureuil, pingouin/bonhomme, lapin, crabe = le même que celui qui se promène) en bas à gauche : grandit à la 1ʳᵉ connexion du jour, UNE fois par 24 h (table `compagnons` + RPC `compagnon_du_jour`, migration `20261111210000`, testée en ROLLBACK) ; parle : un nouveau message à chaque retour sur l'accueil, 5 par visite (sessionStorage), sur les devoirs à faire, la validation, revenir pour grandir.
- 🌳 Arbre de la semaine : fruits (🍎 ✨ 🌸 🍊) sur l'arbre / le chalet / le soleil en haut à gauche, un par validation depuis lundi. 🎁 Secoue l'arbre (toucher en haut à gauche) : le nom d'Allah du jour, une fois par jour. ❓ Question du coin du feu : petit « ? » sur la cheminée (44 px, ne cache pas les cartes), une question par jour (ses lettres apprises ou une banque de 14 questions).
- Réglages : Décorations des saisons › « 🎠 Petits jeux » (chaque jeu + pour qui : tout le monde / groupes), `ReglagesSaisons.jeux`.
- ⏳ Cheminée (flamme) et cache-cache : idées https://claude.ai/artifact/DbTNHqJarGC6mTZRXXyyrN, choix de Nadia attendu.

## 📨 Convocations (2026-11-11, page de choix https://claude.ai/artifact/PWeJ2MVPR8R4sgtPGkgQe3 : organisation A, envoi A, 9 idées)
- GRATUIT (règle des applis libres) : envoi tout seul DANS L'APPLI (notification élève + parents reliés, catégorie `sched`, carte « 📨 Convocation » ✅ Je viens / ❌ Absent sur l'accueil élève, `ConvocationEleve`) ; WhatsApp / SMS = 1 appui de Nadia (lien `wa.me` / `sms:` avec le message écrit). SMS/WhatsApp vraiment automatiques = service payant → refusé.
- Accueil enseignante : bouton ROUGE « 📨 Convocations » au-dessus d'« Absences signalées » → `ConvocationsDialog` (onglets Envoyer · Chaque semaine · Modèles · Numéros · Historique). `/?convocations=1` l'ouvre (notification « Convocations envoyées »).
- Base (migration `20261111190000_convocations.sql`, testée en ROLLBACK avec les droits d'une élève) : `convocation_modeles` (4 modèles de départ, corbeille), `convocation_programmations` (jour ISO 1 = lundi, heure, cible tous/groupes/élèves, sauter_vacances, rappel_veille ; corbeille), `convocations` (historique + réponse ; l'élève et ses parents lisent les siennes), RPC `repondre_convocation` (« Absent » → `absence_justifications`).
- Tâche planifiée `dinislam-convocations` (15 min) → fonction `convocations-programmees` (essai réel sur Test 3 le 11/11 : 1 envoi, pas de doublon, puis effacé). Variables {prénom} {groupe} {jour} {heure} : `src/lib/convocations.ts` = même rendu que la fonction (à changer ENSEMBLE).
- Numéros : `profiles.phone / parent_phone(_nom) / parent2_phone(_nom)` (lisibles seulement par l'admin et l'élève lui-même) ; 0 numéro enregistré au 11/11. Hors ligne : `src/lib/fileHorsLigne.ts` (écritures gardées puis rejouées).

## 📚 Devoirs élève par élève (2026-11-11, page de choix https://claude.ai/artifact/Eibb12g88n4zQRwv1G9yJq)
- Écran des devoirs (`AdminHomework`) : en haut SEULEMENT « 📅 Pour quand ? » (date + 🕑 préparer à l'avance) ; plus de formulaire commun, plus de choix Tous/Groupe/Élèves, plus de 🎚️ Niveaux (écran, hook et table `group_levels` supprimés : 0 niveau), plus de « Créer un devoir ».
- Chaque carte d'élève (`RotationProf`, onglet Cette semaine) contient `FormulaireDevoirEleve` : Par matière / Devoir détaillé, ⚡ modèles, 💡 prochaine étape (`useProchainesEtapes`, remplit la ligne, modifiable, seulement les cartes que l'élève voit), 🔁 comme la semaine dernière, 💎 x / max de la semaine (réglage du groupe), 📋 Donner aussi à… (Q1-A), « Suivant › », 🟢 servi / 📝 brouillon sur la carte. « Général » = tous les élèves (rôle élève).
- Logique `src/lib/devoirsEleve.ts` (tests `devoirsEleve.test.ts`) : un devoir par élève (`assigned_to 'student'`, jamais de group_id : la RLS montrerait le devoir à tout le groupe) ; 📍 plusieurs éléments cochés sur une ligne = un devoir par élément (Q2-A, `CiblesMulti`) ; brouillon PAR ÉLÈVE `draft_dinislam_homework` = { v: 2, parEleve } (message d'ouverture et corbeille des pièces jointes adaptés, clé `<élève>|<ligne>`) ; hors ligne : file `dinislam_devoirs_en_attente` (`useDevoirsEnAttente`).
- ➕ **Plusieurs lignes dans une matière (11/11, 2ᵉ demande)** : un 💎 PAR MATIÈRE. Plusieurs lignes (`FormEleve.plus`) et/ou plusieurs éléments 📍 = UN devoir « en étapes » (`etapes`, une par ligne ou par élément) : l'élève coche chaque étape, le diamant se remplit, il brille quand Nadia valide. Remplace « 3 invocations = 3 devoirs ». Tests `devoirsEleve.test.ts`.
- « ⚙️ Lignes et maximum du groupe » (Q4-B) : déplacé dans la fiche du groupe (carte « Après le cours », vue `reglages`). Le maximum se compte maintenant PAR ÉLÈVE et par semaine.
- « En faire un devoir » (cahier de texte) : texte sur la ligne ✏️ Autre du 1er élève, les autres dans « Donner aussi à… », sa carte s'ouvre. « 📋 Copier vers un groupe » : retrouve aussi les devoirs donnés élève par élève et les recopie à chaque élève du groupe visé.

## 🔤 Alphabet lettre par lettre (2026-11-11, maquette https://claude.ai/artifact/Hbi5GrtdfujjyK8zEhN6q7)
- Couleurs (`COULEUR_LETTRE` + `etatLettre` dans `src/lib/alphabetProgress.ts`, tests `alphabetLettres.test.ts`) : vert apprise · jaune ouverte · jaune ⏳ envoyée · rouge clair « à revoir » (dernière demande `final` = to_review/redo/corrected ; renvoyée → jaune ⏳ → verte) · gris 🔒. Mêmes couleurs : grille élève (+ légende), fenêtre d'une lettre, 📊 Suivi (`AlphabetProgressGrid`).
- Enseignante : sur /alphabet, toucher une lettre = `AlphabetLettreAcces` (groupes repliés, « Ouvrir/Fermer au groupe entier », Ouvrir/Fermer par élève, « 📖 Voir la fiche »). Écriture : `src/lib/alphabetOuvertures.ts › changerLettre` (journal « Alphabet » dans `cartes_journal`, notification catégorie `lesson` aux élèves qui la découvrent, file hors ligne `dinislam_alphabet_ouvertures_en_attente`). Données : `useAlphabetClasse` (clé `alphabet-classe`).
- 🔒 **Règle du 2026-11-11 (2ᵉ demande)** : AUCUNE lettre ouverte au départ, Alif comprise (`computeUnlocked`) ; une lettre débloquée s'ouvre seule ; une lettre VALIDÉE ouvre la suivante (toutes les lettres validées, même débloquées à la main). 20 ans et plus : tout ouvert (gardé). « 🔓 Débloquer des lettres » (`AlphabetUnlockDialog`) refait : groupes repliés → « Débloquer pour tout le groupe » ou un élève → grille des lettres.
- Table `alphabet_group_unlocks` (migration `20261111150000`) : lettre ouverte à un GROUPE = aussi pour ses futurs membres ; l'élève ne lit que celles de ses groupes. Comme les déblocages par élève : reste ouverte mais n'ouvre pas les suivantes. Les 20 ans et plus gardent tout ouvert (choix de Nadia).

## 🗂️ Qui voit quelles cartes (2026-11-11, maquette A + les 10 idées de Nadia)
- **Règle unique** `src/lib/cartesAcces.ts` (`carteOuverte`, `accesDe`, ouvrir/fermer, journal ; tests `cartesAcces.test.ts`) = base `carte_visible_pour` (+ `module_visible_for`, `eleves_qui_voient`) — à changer ENSEMBLE. 3 états : 🌍 tout le monde (is_active + pas de ciblage), 🎯 certains (`visibility_type` users/groups/**mixed** : élève coché OU dans un groupe coché), 🔒 personne. Dates `learning_modules.ouverte_du / ouverte_jusquau` (fin exclue).
- **Seul chemin d'écriture** `src/lib/cartesAccesEnregistrer.ts › enregistrerAcces` : journal `cartes_journal`, notification (catégorie `act`) SEULEMENT aux élèves qui gagnent la carte, hors ligne → file `dinislam_acces_cartes_en_attente` envoyée au retour du réseau (`useAccesEnAttente`, monté sur l'accueil admin et la page).
- Écrans : page `AdminCartesAcces` (`/admin?section=cartes-acces`, bouclier + menu ⋮ des cartes), fenêtre « Afficher à… » réécrite (`ModuleVisibilityDialog`), « Ses cartes » dans la fiche élève (`SesCartesEleve`), étiquettes de l'accueil (🔒 Personne / 🎯 Ciblé / ⏰). Barre du bas (`BottomNav`) : même règle (avant : is_active seul).
- Ouverture programmée : fonction `cartes-programmees` (pg_cron `dinislam-cartes-programmees` toutes les 15 min, `ouverture_annoncee_le` = pas de doublon), testée en vrai sur Dhikr puis remise à l'identique.
- Corrigé au passage : Nourania affichait « Masqué » alors que 7 groupes la voyaient ; « Afficher aux élèves » prévenait TOUS les élèves ; `learning_modules` n'était pas dans le direct.

## 🔄 RÈGLE ABSOLUE — Tout changement visible EN DIRECT chez les utilisateurs concernés (2026-10-23, élargie le 2026-10-25)
Nadia : *« lorsque je fais un changement dans l'application, les autres utilisateurs concernés doivent pouvoir le voir instantanément, les modifications, ajouts ou suppressions, doivent se mettre à jour en direct sans que les utilisateurs aient à recharger l'appli. »* Règle complète : CLAUDE.md global (« 🔄 Tout ce qui est partagé… »).
- Concerne tout ce que Nadia publie ou change pour les élèves (cours, cartes, audios, images, devoirs, validations, déblocages, réglages, annonces) ET tout ce qu'un élève envoie à Nadia, sur tous les écrans qui l'affichent (y compris un autre appareil de Nadia).
- Pour chaque table : abonnement `postgres_changes` sur l'écran + table dans la publication `supabase_realtime` + RLS de lecture.
- ✅ **2026-10-25 : tout est en direct.** Migration `20261025180000_realtime_all_content.sql` (+57 tables → **78 tables** dans la publication, vérifié en base). `src/components/RealtimeSync.tsx` (monté une fois dans App.tsx, dans AuthProvider) : un seul canal, un abonnement par table, regroupement 400 ms → invalide les queryKey de `src/lib/realtimeSync.ts` (table → préfixes) + événement `dinislam:realtime`. Écrans sans react-query : `useRealtimeRefresh(tables, reload, enabled)` / `useRealtimeVersion` (src/hooks/useRealtimeRefresh.ts), branchés dans 14 fichiers (Sourates, CoranPage, SourateDetailDialog, AdminSourateVersets, BlocDevoirsEleve, Classement, Settings (corbeille), TrashPurgeWarning, NotificationFamilies, useParentLock, StudentSettingsOverview, ModuleVisibilityDialog, AdminCommentaireLecon). **Toute nouvelle table lue par l'appli : l'ajouter à la publication ET à `REALTIME_TABLE_QUERY_KEYS`.** Exclues volontairement (jamais en direct) : app_logs, crash_alert_settings, push_subscriptions, student_passwords, user_roles, encouragement_logs, dropout_state, notification_confirmations, notification_invitations, admin_conversations (historique de l'assistant 🌙, réécrit à chaque message).
- ✅ **Nouvelle carte « Coran » en ligne (2026-10-25, commit c8cb226)** — maquette validée par Nadia (https://claude.ai/artifact/QvuXNcAUJhvvatshFL5sy9) + ses 9 idées. Ancienne carte retirée (CoranPage réécrite, `AdminCoranContent.tsx` et `public/pdf/coran.pdf` supprimés, récupérables dans git ; 0 élève avait une progression `context='coran'`).
  - **Pages** : bucket public `coran-pages`, dossier `coran_pages/001.webp … 676.webp` (WebP q62, 1400 px de haut, 119 Mo, cache 1 an). 1 = couverture, 2 = « Un exemple qui explique », 3 = Al-Azhar, 4…607 = pages 1…604 du Coran (PDF p.10…613), 608…676 = fin du livre (PDF p.614…682). Source : ~/Documents/Cours Arabe Adulte/Al-Quran-Al-Karim-Tajwid-Fr.pdf.
  - **Données** : `src/data/coranMeta.ts` (généré depuis Tanzil : SURA_PAGE, SURA_REVELATION_ORDER, JUZ avec leurs sourates, MANZIL_PAGE, A_SAVOIR, indexOfPage/pageOfIndex) ; `src/lib/coranPlan.ts` (+ tests) ; `src/lib/coranPages.ts` (pageUrl, describeIndex, couleurs des marque-pages).
  - **Écrans** (`src/components/coran/`) : CoranReader (droite → gauche, glisser, ← → clavier, zoom 2 doigts / double-tap, double page en paysage ≥ 900 px, voisines préchargées, Cache API `dinislam-coran-pages-v1` = lecture hors connexion), CoranTools (🔖 marque-pages 4 couleurs, 📑 Sommaire : page / sourate / marque-pages / À savoir, 🎧 Houssary via SafeYoutubeEmbed), CoranJuzTab, CoranRevelationTab (fiches + correction + validation admin, brouillon `dinislam_sourate_story`), CoranProgrammeTab + CoranCertificate, CoranStudentsTab (admin), AdminCoranManager (Tableau de bord › Coran).
  - **Base** (`20261025210000_coran_tajwid.sql`) : `coran_progress` (user_id, kind lecture|juz|programme, key, data jsonb ; RLS own + lecture admin, testée), `sourate_stories` (élèves : seulement `validated`), en direct ; `notification_preferences.notif_coran` + `coran_reminder_logs` + cron `dinislam-coran-reminders` (18 h/19 h UTC → fonction `coran-reminders`, agit à 20 h Paris, déployée --no-verify-jwt) ; catégorie `coran` dans send-push-notification (redéployée).
  - **Fiches des sourates** : 114 fiches rédigées le 2026-10-25 (46 avec cause authentique, 124 références vérifiées sur sunnah.com), insérées avec `validated=false` (élèves : 0 visible, testé). Copie de sauvegarde : `supabase/data/sourate_stories_2026-10-25.json`. ⏳ **ACTION EN ATTENTE (Nadia)** : relire et valider dans Tableau de bord › Coran › 📜 Fiches ; points de doute signalés : 36 Yâ-Sîn et 64 At-Taghâbun (jugements divergents), 30 Ar-Rûm (aucune cause retenue), 96 versets 6-19, An-Nahl 126 / Al-Isrâ' 85 / Yâ-Sîn 12 / Al-Mutaffifîn (récits médinois dans des sourates mecquoises), 3 Âl ʿImrân (Uhud), 8 et 60 (lien dit par un compagnon), 24 An-Nûr et 66 At-Tahrîm (récits sensibles adoucis). À rappeler à chaque séance tant qu'il reste des fiches non validées. 📌 Nadia (2026-11-09) : « plus tard », à mettre TOUJOURS en dernier dans « ⏳ Actions en attentes ». Le reste de l'audit (11, 18, 23, 24, 26, 27, 28 + questions q1-q4) : « plus tard » aussi.
  - 2026-10-25 (suite) : Programme = seulement 🌙 Ramadan et ✏️ À mon rythme (pages/jour OU date de fin → `endDate`, 604 pages réparties, max 604 jours) ; messages d'encouragement `src/lib/coranEncouragements.ts` (début, jour fait, moitié, retard, sourate/Juz' terminés). Lecteur : outils 🔖/📑/🎧 dans la bande du haut, numéro de page centré en bas, ruban de couleur sur une page marquée + barre « 🔖 Mes marque-pages ». Quiz 3 questions par fiche (`SourateQuiz`), bouton admin « Valider toutes les fiches sans doute » (`STORIES_WITH_DOUBT` dans coranPages.ts), « 📖 Sourate du jour » sur l'accueil (`src/components/home/SourateDuJour.tsx`, SilentBoundary, rien tant qu'aucune fiche validée ; liens /coran?tab=lieu&sourate=N et /coran?page=I).
  - ✅ 2026-10-26 : notes des marque-pages = proposition A + bulle de B. Post-it jaune sous le ruban, ouvert à chaque arrivée sur la page, refermé/rouvert avec la bulle 💬 (pastille = nombre de notes), en-tête surligné de la couleur (« 🔴 À réviser », « 🟡 À apprendre »…). `Bookmark.notes[] {id,text,date}` + `reviewAt`. Fenêtre du marque-page (CoranTools › BookmarkButton, contrôlée par CoranPage) : couleur, notes datées (✕ → corbeille type `coran_note`, restauration remet la note), notes rapides, dictée 🎙️, « ❔ Pose une question » + bouton « ? » d'explication → message dans la messagerie du professeur + notification (`src/lib/coranQuestions.ts`). Rappel « À réviser » : revient 3 jours après, puis 7 jours après chaque « ✅ Révisée » (bandeau dans Lire). Notes visibles dans 👀 Élèves. « maîtresse » remplacé par « professeur » dans toute l'appli (11 textes, base vérifiée : 0).
  - Trois modes sans mélange : Lire (marque-page `lecture/main`), Juz' (`juz/<n>`), Programme (`programme/active`) ; bande verte / or / bleue ; « Sourate terminée » et « Lecture du jour faite » demandent confirmation (pas pour décocher). Arrêter un programme → corbeille (`coran_progress`).
- ✅ (vérifié en base le 2026-11-01) : `user_prayer_progress`, `user_daily_prayers`, `user_sourate_verse_progress`, `user_ramadan_fasting` ont toutes une règle de lecture admin → l'admin voit bien les progrès des élèves (signalé le 2026-10-25, réglé depuis).

## 📡 L'appli s'ouvre toujours, même sans réseau (✅ 2026-11-02, règle globale du 2026-10-27)
Avant : sans réseau = écran blanc (le service worker ne gardait AUCUN script en mémoire), polices Google qui bloquaient l'affichage, connexion bloquée ~25 s puis renvoi vers l'écran de connexion, faux « Inscription en attente ».
- **`public/sw.js`** réécrit (modèle Agenda) : tout gardé en mémoire dès l'installation (liste `self.__PRECACHE` écrite à chaque build par le plugin `offlinePrecache` de `vite.config.ts`, 77 fichiers, 6 Mo bruts ≈ 2 Mo téléchargés) ; ⚡ à chaque mise à jour, les fichiers `/assets/` déjà gardés sont recopiés sans retéléchargement ; ouverture : réseau 3 s max puis page en mémoire (`clean()` pour Safari) ; données Supabase `/rest/v1/` : réseau 4 s max puis dernière copie de la personne (mémoire par élève, `CURRENT_USER`), sinon erreur 503 « Hors connexion » (jamais de fausse réponse vide) ; audios, vidéos, PDF, `/audio/`, `/pdf/`, `version.json` et stockage Supabase : toujours le réseau. `ignoreVary` obligatoire : Vercel envoie `Vary: Origin` et les scripts sont demandés avec un en-tête Origin → sans lui, écran blanc hors ligne (trouvé au test). La mémoire des pages du Coran (`dinislam-coran-pages-v1`) n'est plus jamais effacée (l'ancien service worker l'effaçait à chaque mise à jour). Message `FORCE_RELOAD` gardé, seulement lors d'une vraie mise à jour.
- **Polices** : `@fontsource` (Tajawal 300-800, Amiri 400/700, Patrick Hand, Cinzel 700) importées dans `src/main.tsx` ; Noto Naskh Arabic = `@font-face` dans `index.css`, limitée par `unicode-range` aux 6 signes de la hamza (même effet que l'ancien `&text=`). Plus aucune ressource externe au démarrage.
- **Connexion** (`client.ts` : `resilientFetch`, renouvellement 8 s max puis session enregistrée ; `AuthContext` : ouverture immédiate avec la session et le rôle mémorisés `dinislam_auth_cache_<id>` {isAdmin, isApproved}, `readStoredSession` en secours, une vérification ratée reprend la dernière réponse connue, `checkAdminRole` rend `null` (et non plus `false`) quand la base ne répond pas → l'admin ne perd plus sa vue hors ligne).
- **Bandeau** `src/components/shared/OfflineBanner.tsx` (sous l'en-tête, dans `AppLayout`) « Hors connexion — dernière connexion aujourd'hui à HH h MM » + message sur la page de connexion ; sonde réelle `src/hooks/useOnlineStatus.ts` (copie Agenda, `dinislam_last_online_at`).
- **Filet d'erreur par page** : `ErrorBoundary scope="page"` autour du contenu de chaque page (l'en-tête et le menu restent utilisables).
- `vercel.json` : `sw.js` jamais en cache, `index.html` no-cache, `/assets/` immuables ; `register(..., { updateViaCache: 'none' })`.
- **Testé en vrai** (Chrome + puppeteer sur la version construite, script `offline-test.cjs` du scratchpad de la séance, faux élève au jeton expiré) : mode avion accueil 0,1 s ✅, page jamais ouverte (Coran) ✅, wifi sans Internet (proxy muet) accueil et Sourates ✅ (bandeau au bout de ~5 s, le temps de la sonde), après une mise à jour ✅ (ancienne version effacée, pages du Coran gardées).
- ✅ En ligne (commit 074100f) et **retesté sur https://dinislam-app.vercel.app** le 2026-11-02 : mode avion 0,1 s, page jamais ouverte, wifi sans Internet → tout s'ouvre.
- ✅ 2026-11-08 : session de secours hors ligne passée de 60 s à **180 s** (`client.ts`). Supabase (auth-js 2.91) juge un jeton « bientôt expiré » 90 s avant la fin → avec 60 s il redemandait sans arrêt. Mesuré (Chrome, faux élève au jeton expiré, mode avion) : ancienne version **1 560 écritures de session en 20 s**, nouvelle **1** ; wifi sans Internet 3 → 0. Appli ouverte en 0,4 s avec bandeau dans les deux cas. Script : `test-hors-ligne.cjs` (scratchpad de la séance, playwright-core installé dans le scratchpad, jamais celui d'une autre appli).
- Au passage, tests : `src/test/setup.ts` fournit une mémoire `localStorage` complète (Node récent en fournit une sans `getItem` → 2 erreurs « storage.getItem is not a function » à chaque `vitest`, présentes avant).

## 🗑️ Corbeille — règles de Nadia (2026-09-30, identiques à l'Agenda)
- Tout ce qui est supprimé dans l'appli (🗑️ ou croix rouge) va d'abord dans la corbeille de Paramètres (bouton « Corbeille » dans la fenêtre de la roue dentée ⚙️) ; rien n'est supprimé définitivement sauf quand la personne vide elle-même sa corbeille.
- **Élèves uniquement** : chaque élément est vidé automatiquement au bout de 61 jours (2 mois), un par un (seuls ceux qui ont atteint 2 mois) — fonction `trash-maintenance`, pg_cron `dinislam-trash-maintenance` (tous les jours 9 h UTC). La date de vidage s'affiche sous chaque élément. La corbeille de l'admin n'est JAMAIS vidée automatiquement.
- **Alerte 3 jours avant**, pour les élèves de plus de 12 ans (âge inconnu = prévenu aussi) : notification + bandeau `TrashPurgeWarning` « Attention : Ta corbeille dans « Paramètres » va être vidée automatiquement dans 3 jours ».
- Côté élève, la seule suppression existante est celle d'une récitation envoyée (`SourateRecitationPanel`) → type `sourate_recitation`, l'audio reste stocké jusqu'au vidage définitif (supprimé alors du stockage `recitations`).
- Notifications : la carte « Notifications » de Paramètres est réservée aux ÉLÈVES (masquée pour l'admin, ainsi que le bouton « Notifications » de la roue dentée) : activer, cartes par famille, mode calme aux heures réglables (`quiet_start`/`quiet_end`, défaut 21 h–8 h), son « Avec son » / « Silencieux (vibration) » (`notif_silent` ; un son « doux » personnalisé est impossible pour une appli web : c'est le son du téléphone). L'enseignante a tout dans le bouclier › « Notifs » (activation sur l'appareil `PushToggle`, alertes d'enseignante, diagnostic, tests, envois).
- 🔒 Espace parents (`useParentLock` + `ParentGateDialog`) : élève de MOINS de 12 ans → roue dentée grisée avec cadenas, et la page Paramètres demande le mot de passe de connexion de l'enfant (vérifié par une reconnexion), déverrouillé 15 min sur l'appareil. Réglable par élève dans sa fiche du bouclier (table `parent_lock_settings` : `auto` = selon l'âge, `on` = toujours, `off` = jamais ; écriture admin seulement). Le verrou protège aussi « Changer de compte » (`AccountSwitcher`, qui déconnecte l'enfant) ; la déconnexion est dans la fenêtre du profil, déjà verrouillée.
- 👀 Fiche élève (bouclier › Élèves › un élève) : `StudentSettingsOverview` = appareils abonnés aux notifications (0 = ne reçoit rien), mode calme, son, notifications coupées, choix de l'Espace parents (lecture admin de `notification_preferences` ajoutée).
- Restauration : un élément à la fois (pas de bouton « Tout restaurer », choix de Nadia).

## 🚫 RÈGLE ABSOLUE — Rien en attente ni inachevé d'une session à l'autre (Nadia, 2026-10-01)
Voir la règle complète dans `~/Projets Claude Code/CLAUDE.md` (« 🏁 Finir maintenant », renforcée le 2026-10-01). Tout ce que je repère dans une session sur Dinislam (bug, alerte du contrôle de code, finition, idée acceptée, ménage, doc) est fini dans la session. Seules exceptions : action/décision de Nadia ou d'un tiers, et surveillance qui demande le passage du temps — notées ici en « ⚠️ ACTION EN ATTENTE » et reprises en début de séance.

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

## Piège `student_groups`

- La table **n'a pas** de colonne `updated_at`. Ne pas la référencer dans les `.update({...})` (erreur PGRST204 : "Could not find the 'updated_at' column..."). Si on veut tracker la dernière modif, ajouter d'abord la colonne via migration.

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

## 🔓 RÈGLE ABSOLUE — Bouton "Accès complet" sur toute carte à contenu verrouillé (Dinislam, À VIE)

**Cette règle est NON NÉGOCIABLE et s'applique à toute nouvelle carte créée dans Dinislam qui possède un système de progression verrouillée (validation sourate par sourate, leçon par leçon, etc.).**

### Cartes actuellement équipées
| Carte | Page | `moduleType` | Table progress | Clé de suppression (re-lock) |
|-------|------|-------------|----------------|------------------------------|
| Sourates | `Sourates.tsx` | `'sourates'` | `user_sourate_progress` (context='sourates') | `.eq('context', 'sourates')` |
| Nourania | `Nourania.tsx` | `'nourania'` | `user_nourania_progress` | (tout l'utilisateur) |
| Invocations | `Invocations.tsx` | `'invocations'` | `user_invocation_progress` | (tout l'utilisateur) |
| 99 Noms d'Allah | `AllahNamesPage.tsx` | `'allah-names'` | `user_allah_name_progress` | (tout l'utilisateur) |

### Comportement obligatoire du dialog
1. **À l'ouverture** : les élèves qui ont déjà l'accès complet apparaissent **pré-cochés** (requête qui compare count validé vs total items)
2. **Cocher un élève non coché** → badge bleu "→ Accès total" → au submit : upsert massif de tout le contenu à `is_validated=true`
3. **Décocher un élève coché** → badge orange "→ Mode normal" → au submit : **suppression de toute sa progression** pour ce module (il repart de zéro, validation une par une)
4. **Bouton "Appliquer"** : désactivé si aucun changement, affiche `🔓 +N` / `🔒 -N` selon les actions en attente

### Points au déverrouillage/verrouillage (màj session 2026-05-20)
- **Unlock** : le déclencheur `recalculate_points` (créé le 2026-10-05, il n'existait pas avant malgré ce qui était écrit ici) recalcule à chaque ligne
- **Lock (delete)** : le déclencheur couvre aussi DELETE depuis le 2026-10-05 ; l'appel RPC explicite reste en filet de sécurité
- **Fix** : `AdminUnlockAllDialog.tsx` appelle `recalculate_student_points(p_user_id)` pour **tous les élèves affectés** (toUnlock + toLock) après les opérations DB :
  ```javascript
  const allAffected = [...new Set([...toUnlock, ...toLock])];
  for (const userId of allAffected) {
    await supabase.rpc('recalculate_student_points', { p_user_id: userId });
  }
  ```
- **Règle** : tout futur bloc unlock/lock dans AdminUnlockAllDialog doit inclure cet appel RPC pour les utilisateurs affectés

### Comment ajouter une nouvelle carte
Quand on crée une nouvelle carte avec contenu progressif verrouillé :
1. Ajouter `moduleType: 'nouveau_module'` dans l'union type de `Props` dans `AdminUnlockAllDialog.tsx`
2. Ajouter le label dans `MODULE_LABELS`
3. Ajouter les blocs `if (moduleType === 'nouveau_module')` dans `queryFn` (détection) et `mutationFn` (unlock + lock)
4. Importer et placer `<AdminUnlockAllDialog moduleType="nouveau_module" />` dans la page admin du module
5. **Ne jamais créer une carte verrouillée sans ce bouton** — l'admin doit toujours pouvoir gérer l'accès complet

## 🗑️ Corbeille — système de suppression réversible (ajouté 2026-08-16)

Voir la règle globale complète dans `~/Projets Claude Code/CLAUDE.md` ("Corbeille : toute suppression est réversible"). Dinislam était le dernier des 4 projets de Nadia à ne pas encore avoir ce système (63 suppressions directes recensées au départ) — maintenant en place.

### Infrastructure
- **Table `trash_items`** créée en base avec succès (2026-08-16)
- `src/lib/trash.ts` : fonctions simples `moveToTrash` / `fetchTrash` / `restoreTrashItem` / `permanentlyDeleteTrashItem` / `emptyTrash` (pas de contexte React, comme Planning Girl et Paus'Étude)
- **`restoreTrashItem` insère `item_data` tel quel** (pas de reconstruction manuelle de l'id) — nécessaire ici car certaines tables (`allah_names`) ont un id **entier auto-incrémenté**, pas un uuid ; réinjecter l'objet complet (qui contient déjà son id d'origine avec le bon type) évite un mismatch de type lors de la restauration
- Section Corbeille dans `src/pages/Settings.tsx`, juste après la carte Notifications — liste avec Restaurer/Supprimer individuels + "Vider", chacun avec sa propre confirmation `AlertDialog`

### Modules connectés (18 types)
`learning_module` (Admin.tsx + AdminModules.tsx) | `module_content` (AdminModules.tsx, AdminCoranContent.tsx, AdminGenericModuleManager.tsx) | `prayer_card_content` | `sourate_content` | `alphabet_content` | `allah_name` + `allah_name_media` | `invocation` + `invocation_content` | `devoir` | `nourania_lesson_content` | `ramadan_day_video` | `ramadan_quiz` | `ramadan_day_activity` | `module_card` | `flashcard` | `dashboard_card` | `admin_conversation` | `student_group` | `scheduled_notification`

### Volontairement NON connecté (état interne, pas du "contenu")
- `AdminUnlockAllDialog.tsx` : suppressions de progression lors du re-verrouillage (re-lock)
- `AdminDynamicCardDialog.tsx` : `dashboard_card_visibility` — remplacement en bloc à chaque sauvegarde (delete-then-reinsert), pas une suppression utilisateur
- `AdminStudentGroups.tsx` : `student_group_members` — remplacement en bloc à l'édition d'un groupe (pas la suppression du groupe lui-même, qui elle EST connectée)
- `AdminRamadanManager.tsx` : `ramadan_day_exceptions` (déverrouillage/verrouillage par élève, comme un toggle d'accès) et `resetCalendarMutation` (reset global admin, pas une suppression d'élément)
- `AdminCommentaireLecon.tsx` : `nourania_admin_unlocks` (toggle verrou/déverrou par leçon/élève)
- `Sourates.tsx` / `Nourania.tsx` / `Invocations.tsx` : nettoyage auto d'une ancienne demande refusée avant resoumission (`validation_requests` où `status='refused'`)
- `AdminRamadanManager.tsx` : `quiz_questions` bulk-replace lors de la sauvegarde (logique déjà dédupliquée, pas une suppression au sens usuel)
- `AdminStudentGroups.tsx`, `AdminRegistrationValidations.tsx`, `AdminStudentDetails.tsx` : suppressions de compte/profil (hors périmètre de la corbeille générique, comme pour Planning Girl)

### Limite connue
La suppression d'un **groupe d'élèves** (`student_group`) ne sauvegarde que la ligne du groupe (nom, couleur...), pas la liste de ses membres (`student_group_members`, supprimée en cascade par la BDD) — une restauration recrée le groupe vide, les membres doivent être réajoutés manuellement. Comportement volontairement simple, comme pour les post-its de Planning Girl.

---

## ⚠️ Piège Supabase (2026-11-04)
- Une requête supabase-js ne part QUE si on l'attend (`await` ou `.then`). `void supabase.from(...).insert(...)` n'envoie RIEN. 3 cas corrigés le 2026-11-04 (module_visits vide depuis le 27/10, bilan jamais marqué « lu », last_seen). Pour « tirer et oublier » : `.then(() => {}, () => {})`.

## Déploiement (màj 2026-09-30 — bascule Vercel faite)

**⚠️ VERCEL + SUPABASE INDÉPENDANT — PLUS LOVABLE.**

- **Adresse des élèves** : `https://dinislam-app.vercel.app` (projet Vercel « dinislam » du compte de Nadia, relié à `Nadelb341/Dinislam`, déploiement automatique à chaque push sur `main` ; ancienne adresse `dinislam-two.vercel.app` toujours active sur le même projet).
- **Base** : Supabase `zgnxqhfcmdonvdxqpekl` (compte nadiaelb341 = connexion GitHub, organisation « Dinislam »). SQL : dashboard Supabase ou `supabase db query --linked` (dossier lié), **jamais l'éditeur SQL Lovable**.
- **Workflow** : modifs locales → `tsc`/build → `git push origin main` → Vercel déploie. **Ne plus pousser vers le remote `lovable`** (ancienne base Lovable Cloud `gewaibmjrwunbluiwkvf` de Mustapha, gardée en l'état comme archive).
- `dinislam.lovable.app` redirige automatiquement vers la nouvelle adresse (script en tête de `index.html`).
- Variables : `.env` versionné (clé publique uniquement) ; aucune variable dans Vercel. Secrets des fonctions (Supabase › Edge Functions › Secrets) : `GOOGLE_AI_API_KEY` (clé Google AI Studio « Dinislam », projet séparé de l'Agenda), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.
- Fonctions : `supabase functions deploy <nom> --project-ref zgnxqhfcmdonvdxqpekl --use-api` ; origine autorisée `https://dinislam-app.vercel.app` (constante `ALLOWED_ORIGINS` en tête de chaque fonction).

## 🖼️ Un contenu incohérent avec son rôle → s'arrêter et demander (ajoutée 2026-09-01)
Voir règle complète dans `~/Projets Claude Code/CLAUDE.md` (section "❓ Demander en cas de doute" → "🖼️ Cas particulier — un contenu qui ne correspond pas à ce qu'il est censé être"). Quand une image/un champ/un libellé/une valeur montré par Nadia ne colle pas à ce qu'il devrait être (ex : écriture manuscrite scannée là où on attend une photo de plat), **le signaler et demander AVANT d'exécuter la demande à la lettre** — ne pas foncer.


