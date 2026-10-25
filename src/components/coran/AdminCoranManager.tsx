import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CoranRevelationTab } from './CoranRevelationTab';
import { CoranStudentsTab } from './CoranStudentsTab';
import { indexOfPage } from '@/data/coranMeta';
import { cn } from '@/lib/utils';

/**
 * Tableau de bord › Coran (2026-10-25, remplace l'ancienne gestion du PDF) :
 * relire et valider les fiches-histoires des sourates, et voir la lecture des élèves.
 */
export default function AdminCoranManager({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'fiches' | 'eleves'>('fiches');
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-[#7a1d22] dark:text-[#e08a8f]">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <div className="rounded-2xl bg-gradient-to-br from-[#7a1d22] to-[#561216] text-white px-4 py-3">
        <h2 className="text-lg font-extrabold">📖 Coran Al-Tajwid</h2>
        <p className="text-xs text-white/80">Les pages du Coran sont déjà en place. Ici : les fiches des sourates et la lecture de tes élèves.</p>
      </div>
      <div className="flex rounded-xl bg-[#f1e5da] dark:bg-[#33201e] p-1">
        {([['fiches', '📜 Fiches des sourates'], ['eleves', '👀 Mes élèves']] as const).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}
            className={cn('flex-1 rounded-lg py-2 text-sm font-bold', tab === id ? 'bg-white text-[#7a1d22] shadow-sm dark:bg-[#221413] dark:text-[#e08a8f]' : 'text-[#75605a] dark:text-[#bfa79f]')}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'fiches'
        ? <CoranRevelationTab onRead={(page) => navigate(`/coran?page=${indexOfPage(page)}`)} />
        : <CoranStudentsTab />}
    </div>
  );
}
