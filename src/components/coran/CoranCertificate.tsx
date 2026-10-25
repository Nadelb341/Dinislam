import { useEffect } from 'react';
import { useConfetti } from '@/hooks/useConfetti';
import { PLAN_LABELS, type Programme } from '@/lib/coranPlan';

/** 🏆 Certificat « J'ai lu tout le Coran » (2026-10-25), aux couleurs de la couverture : bordeaux et or. */
export function CoranCertificate({ name, plan }: { name: string; plan: Programme }) {
  const { fireConfetti } = useConfetti();
  useEffect(() => { fireConfetti(); }, [fireConfetti]);
  const first = name.trim().split(/\s+/)[0] || '';
  const date = new Date((plan.finishedOn || new Date().toISOString().slice(0, 10)) + 'T12:00:00')
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="relative overflow-hidden rounded-3xl p-1.5 bg-gradient-to-br from-[#c39a3e] via-[#f3d38b] to-[#a77a1c] shadow-lg">
      <div className="rounded-[20px] bg-gradient-to-br from-[#7a1d22] to-[#561216] px-5 py-7 text-center text-white">
        <p className="font-arabic text-2xl text-[#f3d38b]">مَا شَاءَ اللَّهُ</p>
        <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#f3d38b]/90">Certificat</p>
        <h2 className="mt-1 text-2xl font-extrabold [text-wrap:balance]">J'ai lu tout le Coran</h2>
        <p className="mt-3 text-lg">🏆 {first ? `Bravo ${first} !` : 'Bravo !'}</p>
        <p className="mt-1 text-sm text-white/85">Programme {PLAN_LABELS[plan.plan].emoji} {PLAN_LABELS[plan.plan].title} · {plan.totalDays} jours · terminé le {date}</p>
        <div className="mx-auto my-4 h-px w-24 bg-[#f3d38b]/70" />
        <p className="font-arabic text-xl leading-loose text-[#f3d38b]">خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</p>
        <p className="text-xs text-white/80">« Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne. » · Al-Bukhârî n° 5027</p>
      </div>
    </div>
  );
}
