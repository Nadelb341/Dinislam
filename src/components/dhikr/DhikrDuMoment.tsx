import { useId } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useJournee, useMaintenant } from '@/hooks/useDhikrLocal';
import { dhikrDuMoment, lireReglages, type CleQuotidien } from '@/lib/dhikr';
import { cn } from '@/lib/utils';
import { ApercuChapelet } from './Perles';
import { ambianceDe } from './Ambiance';

/**
 * 📿 IDÉE 5 · Petite carte « Dhikr du moment » de l'accueil (élèves), jolie et compacte :
 * jusqu'à midi = la série du matin ; de midi à 19 h = 3 dhikr du quotidien au choix (chacun disparaît une fois fait, puis
 * « Tous faits aujourd'hui, ma shâ' Allah ✨ ») ; après 19 h = la série du soir. Toucher = le chapelet / la série s'ouvre directement.
 * Tout est lu sur l'appareil (marche sans réseau). Aucun hook après un `return` (règle « l'appli doit toujours s'ouvrir »).
 */
const QUOTIDIENS_TEXTE: Record<CleQuotidien, { court: string; lien: string }> = {
  apres_priere: { court: '33 · 33 · 33 + Lâ ilâha illa-llâh', lien: '/module/dhikr?onglet=apres' },
  astaghfirullah: { court: '100 × Astaghfirou-llâh', lien: '/module/dhikr?onglet=chapelet&dhikr=astaghfirullah' },
  subhanallah_wabihamdihi: { court: '100 × Soubhâna-llâhi wa bihamdihi', lien: '/module/dhikr?onglet=chapelet&dhikr=subhanallah_wabihamdihi' },
};
const FONDS = {
  jour: 'linear-gradient(120deg, #d7ecff 0%, #eef7ff 60%, #fff6dc 100%)',
  couchant: 'linear-gradient(120deg, #ffd29a 0%, #f2a07b 45%, #b97ab8 100%)',
  nuit: 'linear-gradient(120deg, #0d1a4a 0%, #1b2a6b 70%, #2b2a6e 100%)',
};

export default function DhikrDuMoment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const maintenant = useMaintenant();
  const journee = useJournee(user?.id);
  const uid = useId().replace(/:/g, '');
  const carte = dhikrDuMoment(maintenant, journee);
  const amb = ambianceDe(maintenant);
  const nuit = amb === 'nuit';
  const texte = nuit ? '#f3f6ff' : '#1b2450';
  const or = nuit ? '#f5d27a' : '#8a5a00';
  const chapelet = lireReglages().chapelet;

  const titre = carte.creneau === 'matin' ? '🌅 La série du matin' : carte.creneau === 'soir' ? '🌙 La série du soir · avant de dormir' : '☀️ Un dhikr de la journée';
  const ouvrirSerie = () => navigate(`/module/dhikr?onglet=series&serie=${carte.creneau === 'soir' ? 'soir' : 'matin'}`);

  return (
    <section aria-label="Dhikr du moment" className="rounded-2xl overflow-hidden shadow-md border-2 border-amber-300 animate-fade-in" style={{ background: FONDS[amb], color: texte }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-16 shrink-0" aria-hidden><ApercuChapelet style={chapelet} uid={uid} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: or }}>📿 Dhikr du moment</p>
          <h3 className="text-sm sm:text-base font-black leading-tight [overflow-wrap:anywhere]">{titre}</h3>
          {carte.creneau !== 'journee' && (
            carte.faite
              ? <p className="text-xs font-bold mt-0.5">✅ Faite aujourd'hui, ma shâ' Allah ✨</p>
              : <p className="text-xs mt-0.5 opacity-90">{carte.creneau === 'matin' ? 'Pour bien commencer la journée' : 'Quelques gestes, et tu dors protégé'}</p>
          )}
        </div>
        {carte.creneau !== 'journee' && (
          <button type="button" onClick={ouvrirSerie}
            className={cn('shrink-0 rounded-full px-3 py-2 text-sm font-extrabold shadow active:scale-95', carte.faite ? 'bg-white/80 text-slate-800 border' : 'bg-amber-400 text-amber-950')}>
            {carte.faite ? 'Revoir' : 'Commencer ›'}
          </button>
        )}
      </div>
      {carte.creneau === 'journee' && (
        <div className="px-3 pb-2.5">
          {carte.restants.length ? (
            <div className="flex flex-wrap gap-1.5">
              {carte.restants.map((k) => (
                <button key={k} type="button" onClick={() => navigate(QUOTIDIENS_TEXTE[k].lien)}
                  className={cn('rounded-full border-2 border-amber-300 px-3 py-1.5 text-xs sm:text-sm font-bold active:scale-95 [overflow-wrap:anywhere]', nuit ? 'bg-white/10 text-white' : 'bg-white/85 text-slate-900')}>
                  📿 {QUOTIDIENS_TEXTE[k].court}
                </button>
              ))}
            </div>
          ) : <p className="text-sm font-bold">Tous faits aujourd'hui, ma shâ' Allah ✨</p>}
        </div>
      )}
    </section>
  );
}
