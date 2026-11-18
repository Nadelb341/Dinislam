import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { estEnModeFantome } from '@/lib/modeFantome';
import { appareil, useEstInstallee, useInvitationInstallation } from '@/lib/installationAppli';
import { GuideInstallation, GuideNotificationsBloquees } from '@/components/push/GuideInstallation';

/**
 * 🟥 Bandeau rouge d'activation (Nadia, 2026-11-18, idées 5 à 9 : « je veux impérativement qu'ils reçoivent les notifications ») :
 *  1. téléphone et appli pas installée → « 📲 Installe l'appli sur ton écran d'accueil » (+ pas à pas illustré, ouvert tout seul
 *     une fois à chaque ouverture de l'appli) ;
 *  2. sinon, notifications pas activées → « 🔔 Active tes notifications » (bouton = vrai abonnement, `useWebPush`) ;
 *  3. notifications refusées → comment les réautoriser dans les réglages.
 * Collé sous l'en-tête, il revient à chaque ouverture tant que ce n'est pas fait (« ✕ » = caché jusqu'à la prochaine ouverture).
 * Remplace l'ancienne bannière de l'accueil (silencieuse 7 jours après 3 « Plus tard ») et `PushAutoSubscribe`.
 * Rien en mode fantôme (ce téléphone est celui de l'enseignante), rien sans réseau.
 */
const CLE_INSTALLEE = 'dinislam_appli_installee';
let cacheJusquaReouverture = false;
let guideDejaMontre = false;

const permissionActuelle = (): NotificationPermission | 'absent' => ('Notification' in window ? Notification.permission : 'absent');

export default function BandeauActivation() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const installee = useEstInstallee();
  const { dispo, installer } = useInvitationInstallation();
  const { isSupported, isSubscribed, isLoading, subscribe, checkSubscription } = useWebPush();
  const [cache, setCache] = useState(cacheJusquaReouverture);
  const [guide, setGuide] = useState(false);
  const [aideBloquees, setAideBloquees] = useState(false);
  const [permission, setPermission] = useState(permissionActuelle);
  const [envoi, setEnvoi] = useState(false);
  const autoEssaye = useRef(false);
  const qui = appareil();
  const fantome = estEnModeFantome();
  const [installeeAilleurs, setInstalleeAilleurs] = useState(() => { try { return localStorage.getItem(CLE_INSTALLEE) === '1'; } catch { return false; } });

  // Android : installée depuis l'onglet du navigateur → on s'en souvient (l'onglet, lui, reste un onglet)
  useEffect(() => {
    const f = () => { try { localStorage.setItem(CLE_INSTALLEE, '1'); } catch { /* rien */ } setInstalleeAilleurs(true); };
    window.addEventListener('appinstalled', f);
    return () => window.removeEventListener('appinstalled', f);
  }, []);
  useEffect(() => { if (installee) { try { localStorage.setItem(CLE_INSTALLEE, '1'); } catch { /* rien */ } } }, [installee]);

  // Retour dans l'appli après un passage dans les réglages du téléphone : on revérifie
  useEffect(() => {
    const f = () => { if (document.visibilityState === 'visible') { setPermission(permissionActuelle()); void checkSubscription(); } };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, [checkSubscription]);

  const doitInstaller = qui !== 'ordinateur' && !installee;
  const iphoneNonInstalle = qui === 'iphone' && !installee;

  // Notifications déjà autorisées mais pas d'abonnement sur cet appareil → on abonne tout seul (comme l'ancien PushAutoSubscribe)
  useEffect(() => {
    if (!user || fantome || !isOnline || isLoading || !isSupported || isSubscribed || iphoneNonInstalle || autoEssaye.current) return;
    if (permission !== 'granted') return;
    autoEssaye.current = true;
    void subscribe();
  }, [user, fantome, isOnline, isLoading, isSupported, isSubscribed, iphoneNonInstalle, permission, subscribe]);

  // Pas à pas montré tout seul, une fois à chaque ouverture de l'appli, tant que ce n'est pas installé
  useEffect(() => {
    if (!user || fantome || !doitInstaller || guideDejaMontre) return;
    guideDejaMontre = true;
    const t = setTimeout(() => setGuide(true), 1200);
    return () => clearTimeout(t);
  }, [user, fantome, doitInstaller]);

  if (!user || fantome || !isOnline) return null;

  const cacher = () => { cacheJusquaReouverture = true; setCache(true); };
  const activer = async () => {
    setEnvoi(true);
    const ok = await subscribe();
    setEnvoi(false);
    setPermission(permissionActuelle());
    if (ok) toast.success('✅ Notifications activées ! Tu recevras les messages de ton professeur.');
    else if (permissionActuelle() === 'denied') setAideBloquees(true);
    else toast.error('Les notifications ne se sont pas activées. Réessaie, ou touche « Comment faire ? ».');
  };

  let texte: string | null = null;
  let bouton: { label: string; action: () => void } | null = null;
  let aide: { label: string; action: () => void } | null = null;
  if (doitInstaller) {
    if (installeeAilleurs && qui === 'android') {
      texte = '📲 L\'appli est installée : ouvre Dinislam depuis son icône sur ton écran d\'accueil';
      aide = { label: 'Comment faire ?', action: () => setGuide(true) };
    } else {
      texte = '📲 Installe l\'appli sur ton écran d\'accueil pour recevoir les messages de ton professeur';
      if (qui === 'android' && dispo) bouton = { label: 'Installer', action: () => { void installer().then((ok) => { if (ok) toast.success('✅ Dinislam est installée ! Ouvre-la depuis son icône.'); }); } };
      aide = { label: bouton ? 'Comment faire ?' : 'Voir comment faire', action: () => setGuide(true) };
    }
  } else if (isSupported && !isLoading && !isSubscribed) {
    if (permission === 'denied') {
      texte = '🔕 Les notifications sont bloquées : tu ne reçois pas les messages de ton professeur';
      aide = { label: 'Comment les rouvrir ?', action: () => setAideBloquees(true) };
    } else {
      texte = '🔔 Active tes notifications pour recevoir les messages et les devoirs de ton professeur';
      bouton = { label: envoi ? '…' : 'Activer', action: () => void activer() };
    }
  }

  return (
    <>
      {texte && !cache && (
        <div role="alert" className="sticky z-40 border-b-2 border-red-800 bg-red-600 text-white shadow-md dark:bg-red-700"
          style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-3 py-2">
            <p className="min-w-0 flex-1 basis-56 text-sm font-bold leading-snug [overflow-wrap:anywhere]">{texte}</p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {bouton && (
                <button type="button" onClick={bouton.action} disabled={envoi}
                  className="min-h-10 rounded-full bg-white px-4 text-sm font-extrabold text-red-700 shadow-sm active:scale-95 disabled:opacity-60">
                  {bouton.label}
                </button>
              )}
              {aide && (
                <button type="button" onClick={aide.action}
                  className="min-h-10 rounded-full border-2 border-white/80 px-3 text-sm font-bold text-white active:scale-95">
                  {aide.label}
                </button>
              )}
              <button type="button" onClick={cacher} aria-label="Cacher jusqu'à la prochaine ouverture de l'appli"
                className="grid h-10 w-10 place-items-center rounded-full text-white/90 hover:bg-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      <GuideInstallation open={guide} onOpenChange={setGuide} />
      <GuideNotificationsBloquees open={aideBloquees} onOpenChange={setAideBloquees} />
    </>
  );
}
