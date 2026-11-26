import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { appareil, iphoneAutreNavigateur, iphoneHorsSafari, useInvitationInstallation } from '@/lib/installationAppli';
import { toast } from 'sonner';

/**
 * 📲 Pas à pas illustré pour installer Dinislam sur l'écran d'accueil (Nadia, 2026-11-18, idée 6).
 * Dessins faits maison (pas de captures d'écran de marque), selon l'appareil : iPhone/iPad, Android, ordinateur.
 * Aussi « 🔕 notifications bloquées » : comment les réautoriser.
 */

/* ---------- Petits dessins (téléphone stylisé, couleurs de l'appli, lisibles en clair et en sombre) ---------- */
const Tel = ({ children, label }: { children: ReactNode; label: string }) => (
  <svg viewBox="0 0 120 200" role="img" aria-label={label} className="mx-auto h-40 w-auto drop-shadow-sm">
    <rect x="4" y="4" width="112" height="192" rx="18" fill="#1d2340" />
    <rect x="10" y="12" width="100" height="176" rx="12" fill="#fffaf2" />
    <rect x="46" y="16" width="28" height="5" rx="2.5" fill="#1d2340" opacity=".85" />
    {children}
  </svg>
);
const Lignes = ({ y = 30 }: { y?: number }) => (
  <g fill="#e5d6bd">
    <rect x="20" y={y} width="80" height="8" rx="4" />
    <rect x="20" y={y + 14} width="60" height="8" rx="4" />
    <rect x="20" y={y + 28} width="70" height="8" rx="4" />
  </g>
);
const Doigt = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r="11" fill="#f2a33a" opacity=".25"><animate attributeName="r" values="8;13;8" dur="1.6s" repeatCount="indefinite" /></circle>
    <circle r="5" fill="#f2a33a" />
  </g>
);
const IconeAppli = ({ x, y, s = 22 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={s} height={s} rx={s * 0.24} fill="#2d4a9a" />
    <path d={`M${s / 2} ${s * 0.18} l${s * 0.09} ${s * 0.2} ${s * 0.22} 0 -${s * 0.18} ${s * 0.14} ${s * 0.07} ${s * 0.22} -${s * 0.2} -${s * 0.13} -${s * 0.2} ${s * 0.13} ${s * 0.07} -${s * 0.22} -${s * 0.18} -${s * 0.14} ${s * 0.22} 0z`} fill="#f2c14e" />
  </g>
);

/* iPhone 1 : barre de Safari en bas, bouton Partager */
const IphonePartager = () => (
  <Tel label="Safari : toucher le bouton Partager en bas">
    <Lignes />
    <rect x="10" y="160" width="100" height="28" fill="#f1e9dc" />
    <g stroke="#8a7a66" strokeWidth="2" fill="none" strokeLinecap="round"><path d="M24 174h6M36 171l-3 3 3 3" /></g>
    <g stroke="#2d4a9a" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="54" y="170" width="12" height="11" rx="2" /><path d="M60 175v-11M56 167l4-4 4 4" />
    </g>
    <Doigt x={60} y={172} />
  </Tel>
);
/* iPhone 2 : menu « Sur l'écran d'accueil » */
const IphoneMenu = () => (
  <Tel label="Toucher « Sur l'écran d'accueil »">
    <rect x="10" y="70" width="100" height="118" rx="10" fill="#f1e9dc" />
    <rect x="18" y="82" width="84" height="18" rx="6" fill="#fffaf2" />
    <rect x="18" y="106" width="84" height="22" rx="6" fill="#fffaf2" stroke="#f2a33a" strokeWidth="2" />
    <rect x="24" y="112" width="10" height="10" rx="2" fill="none" stroke="#2d4a9a" strokeWidth="1.8" />
    <path d="M29 114v6M26 117h6" stroke="#2d4a9a" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="40" y="114" width="52" height="6" rx="3" fill="#2d4a9a" opacity=".75" />
    <rect x="18" y="134" width="84" height="18" rx="6" fill="#fffaf2" />
    <Doigt x={84} y={117} />
  </Tel>
);
/* Écran d'accueil avec l'icône Dinislam */
const EcranAccueil = () => (
  <Tel label="Ouvrir Dinislam depuis son icône sur l'écran d'accueil">
    <rect x="10" y="12" width="100" height="176" rx="12" fill="#cfe0f7" />
    {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => (r === 1 && c === 1 ? null : <rect key={`${r}${c}`} x={22 + c * 30} y={36 + r * 34} width="20" height="20" rx="5" fill="#ffffff" opacity=".7" />)))}
    <IconeAppli x={49} y={67} />
    <Doigt x={60} y={78} />
  </Tel>
);
/* Android 1 : menu ⋮ de Chrome en haut à droite */
const AndroidMenu = () => (
  <Tel label="Chrome : toucher les 3 points en haut à droite">
    <rect x="10" y="24" width="100" height="18" fill="#f1e9dc" />
    <rect x="16" y="28" width="70" height="10" rx="5" fill="#fffaf2" />
    <g fill="#2d4a9a"><circle cx="99" cy="29" r="1.6" /><circle cx="99" cy="33" r="1.6" /><circle cx="99" cy="37" r="1.6" /></g>
    <Lignes y={54} />
    <Doigt x={99} y={33} />
  </Tel>
);
/* Android 2 : « Installer l'appli » */
const AndroidInstaller = () => (
  <Tel label="Toucher « Installer l'appli » ou « Ajouter à l'écran d'accueil »">
    <rect x="44" y="26" width="64" height="100" rx="8" fill="#f1e9dc" />
    <rect x="50" y="34" width="52" height="10" rx="4" fill="#fffaf2" />
    <rect x="50" y="50" width="52" height="16" rx="4" fill="#fffaf2" stroke="#f2a33a" strokeWidth="2" />
    <rect x="55" y="55" width="6" height="6" rx="1.5" fill="#2d4a9a" />
    <rect x="65" y="56" width="32" height="4" rx="2" fill="#2d4a9a" opacity=".75" />
    <rect x="50" y="72" width="52" height="10" rx="4" fill="#fffaf2" />
    <rect x="50" y="88" width="52" height="10" rx="4" fill="#fffaf2" />
    <Doigt x={90} y={58} />
  </Tel>
);
/* Ordinateur : icône d'installation dans la barre d'adresse */
const Ordinateur = () => (
  <svg viewBox="0 0 200 130" role="img" aria-label="Ordinateur : bouton Installer à droite de la barre d'adresse" className="mx-auto h-32 w-auto">
    <rect x="10" y="8" width="180" height="104" rx="10" fill="#1d2340" />
    <rect x="16" y="14" width="168" height="92" rx="6" fill="#fffaf2" />
    <rect x="16" y="14" width="168" height="18" rx="6" fill="#f1e9dc" />
    <rect x="24" y="18" width="130" height="10" rx="5" fill="#fffaf2" />
    <g stroke="#2d4a9a" strokeWidth="1.8" fill="none" strokeLinecap="round"><rect x="160" y="18" width="12" height="10" rx="2" /><path d="M166 20v5M163.5 23l2.5 2.5 2.5-2.5" /></g>
    <Lignes y={44} />
    <rect x="80" y="112" width="40" height="8" rx="3" fill="#1d2340" />
    <Doigt x={166} y={23} />
  </svg>
);

function Etape({ n, titre, children, dessin }: { n: number; titre: ReactNode; children?: ReactNode; dessin: ReactNode }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-3 space-y-2">
      <p className="flex items-start gap-2 font-bold text-foreground">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm text-primary-foreground">{n}</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">{titre}</span>
      </p>
      {children && <p className="text-sm text-muted-foreground">{children}</p>}
      {dessin}
    </li>
  );
}

export function GuideInstallation({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qui = appareil();
  const { dispo, installer } = useInvitationInstallation();
  const horsSafari = iphoneHorsSafari();
  const autreNavigateur = iphoneAutreNavigateur();
  const installerDirect = async () => {
    const ok = await installer();
    if (ok) { toast.success('✅ Dinislam est installée ! Ouvre-la depuis son icône.'); onOpenChange(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📲 Installer Dinislam sur ton écran d'accueil</DialogTitle>
          <DialogDescription>
            C'est obligatoire pour recevoir les messages et les devoirs de ton professeur. Ça prend 30 secondes, et c'est gratuit.
          </DialogDescription>
        </DialogHeader>

        {qui === 'android' && dispo && (
          <Button className="w-full h-auto min-h-12 whitespace-normal text-base font-bold" onClick={() => void installerDirect()}>
            📲 Installer maintenant
          </Button>
        )}

        {qui === 'iphone' && horsSafari ? (
          <ol className="space-y-3">
            <Etape n={1} titre="Ouvre cette page dans Safari" dessin={<EcranAccueil />}>
              Ici, l'appli ne peut pas s'installer (lien ouvert dans une autre appli, ou iPhone pas à jour). Copie l'adresse de cette page, ouvre Safari (la boussole bleue) et colle-la.
            </Etape>
            <Etape n={2} titre="Puis suis les étapes de Safari" dessin={<IphonePartager />}>
              Bouton Partager ⬆️, puis « Sur l'écran d'accueil ».
            </Etape>
          </ol>
        ) : qui === 'iphone' && autreNavigateur ? (
          // 🔄 2026-11-26 (M3) : depuis iOS 16.4, Chrome, Edge et Firefox savent aussi installer l'appli
          <ol className="space-y-3">
            <Etape n={1} titre={<>Touche le bouton Partager ⬆️</>} dessin={<IphonePartager />}>
              {autreNavigateur === 'chrome'
                ? 'Dans Chrome : en haut à droite, dans la barre d\'adresse (ou dans le menu « … » en bas).'
                : autreNavigateur === 'edge' ? 'Dans Edge : touche le menu ☰ en bas, puis « Partager ».'
                  : 'Dans Firefox : touche le menu ☰ en bas, puis « Partager ».'}
            </Etape>
            <Etape n={2} titre="Touche « Sur l'écran d'accueil »" dessin={<IphoneMenu />}>
              Descends un peu dans la liste si tu ne le vois pas. Puis touche « Ajouter » en haut à droite.
            </Etape>
            <Etape n={3} titre="Ouvre Dinislam depuis son icône" dessin={<EcranAccueil />}>
              Ouvre l'appli avec la nouvelle icône. Ensuite, touche « Activer » sur le bandeau rouge pour les notifications.
              Tu ne trouves pas « Sur l'écran d'accueil » ? Ouvre cette page dans Safari et refais les mêmes étapes.
            </Etape>
          </ol>
        ) : qui === 'iphone' ? (
          <ol className="space-y-3">
            <Etape n={1} titre={<>Touche le bouton Partager ⬆️</>} dessin={<IphonePartager />}>
              En bas de Safari (sur iPad : en haut à droite). C'est un carré avec une flèche vers le haut.
            </Etape>
            <Etape n={2} titre="Touche « Sur l'écran d'accueil »" dessin={<IphoneMenu />}>
              Descends un peu dans la liste si tu ne le vois pas. Puis touche « Ajouter » en haut à droite.
            </Etape>
            <Etape n={3} titre="Ouvre Dinislam depuis son icône" dessin={<EcranAccueil />}>
              Ferme Safari et ouvre l'appli avec la nouvelle icône. Ensuite, touche « Activer » sur le bandeau rouge pour les notifications.
            </Etape>
          </ol>
        ) : qui === 'android' ? (
          <ol className="space-y-3">
            <Etape n={1} titre="Touche les 3 points ⋮ en haut à droite" dessin={<AndroidMenu />}>
              Dans Chrome (ou Samsung Internet : les 3 traits ☰ en bas).
            </Etape>
            <Etape n={2} titre="Touche « Installer l'appli » ou « Ajouter à l'écran d'accueil »" dessin={<AndroidInstaller />}>
              Puis confirme avec « Installer ».
            </Etape>
            <Etape n={3} titre="Ouvre Dinislam depuis son icône" dessin={<EcranAccueil />}>
              Ensuite, touche « Activer » sur le bandeau rouge pour les notifications.
            </Etape>
          </ol>
        ) : (
          <ol className="space-y-3">
            <Etape n={1} titre="Clique sur le bouton Installer de la barre d'adresse" dessin={<Ordinateur />}>
              Dans Chrome ou Edge : la petite icône à droite de l'adresse. Sinon, menu ⋮ › « Installer Dinislam ». Sur un téléphone, c'est encore mieux !
            </Etape>
          </ol>
        )}
        <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>J'ai compris</Button>
      </DialogContent>
    </Dialog>
  );
}

/** 🔕 Notifications refusées : comment les réautoriser dans les réglages du téléphone */
export function GuideNotificationsBloquees({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qui = appareil();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔕 Réautoriser les notifications</DialogTitle>
          <DialogDescription>Tu as refusé les notifications : seul ton téléphone peut les rouvrir. Voici comment faire.</DialogDescription>
        </DialogHeader>
        {qui === 'iphone' ? (
          <ol className="list-decimal space-y-2 ps-5 text-sm text-foreground">
            <li>Ouvre l'appli <b>Réglages</b> ⚙️ de l'iPhone.</li>
            <li>Touche <b>Notifications</b>, puis <b>Dinislam</b> dans la liste.</li>
            <li>Allume <b>Autoriser les notifications</b>.</li>
            <li>Reviens dans Dinislam : le bandeau rouge disparaît tout seul.</li>
          </ol>
        ) : qui === 'android' ? (
          <ol className="list-decimal space-y-2 ps-5 text-sm text-foreground">
            <li>Appuie longtemps sur l'icône <b>Dinislam</b> de l'écran d'accueil.</li>
            <li>Touche <b>Infos sur l'appli</b> (ⓘ), puis <b>Notifications</b>.</li>
            <li>Allume <b>Autoriser les notifications</b>.</li>
            <li>Reviens dans Dinislam et touche « Activer » sur le bandeau rouge.</li>
          </ol>
        ) : (
          <ol className="list-decimal space-y-2 ps-5 text-sm text-foreground">
            <li>Clique sur le petit cadenas 🔒 à gauche de l'adresse du site.</li>
            <li>À la ligne <b>Notifications</b>, choisis <b>Autoriser</b>.</li>
            <li>Recharge la page et clique sur « Activer » sur le bandeau rouge.</li>
          </ol>
        )}
        <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>J'ai compris</Button>
      </DialogContent>
    </Dialog>
  );
}
