import { Search, X } from 'lucide-react';

/**
 * 🔍 Barre de recherche des 99 noms (demande de Nadia, 27/11) : français, phonétique (avec ou sans accents, tirets, « Al- »),
 * arabe (avec ou sans voyelles), numéro, ou sens. Les résultats s'affichent en direct dans la grille.
 */
export function RechercheNoms({ valeur, onChange, nbResultats }: {
  valeur: string; onChange: (v: string) => void; nbResultats: number | null;
}) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <label htmlFor="recherche-noms" className="sr-only">Chercher un nom d'Allah</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: 'hsl(38 92% 60%)' }} aria-hidden="true" />
        <input
          id="recherche-noms"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
          placeholder="Nom, arabe, numéro, sens…"
          className="w-full rounded-2xl border py-3 pl-11 pr-12 text-base text-white placeholder:text-white/45 focus:outline-none focus:ring-2 [&::-webkit-search-cancel-button]:hidden"
          style={{ background: 'hsl(222 55% 12%)', borderColor: 'rgba(217,119,6,0.45)', boxShadow: '0 2px 12px rgba(0,0,0,0.35)' }}
        />
        {valeur && (
          <button type="button" onClick={() => onChange('')} aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-md hover:bg-[#DC2626]">
            <X className="h-5 w-5" strokeWidth={2.75} />
          </button>
        )}
      </div>
      {nbResultats !== null && (
        <p className="mt-2 text-center text-sm font-semibold" role="status" aria-live="polite" style={{ color: nbResultats ? 'hsl(38 92% 65%)' : 'hsl(0 85% 75%)' }}>
          {nbResultats === 0
            ? '🔍 Aucun nom ne correspond. Essaie autrement : en français, en phonétique (Rahmân), en arabe (الرحمن) ou avec son numéro.'
            : nbResultats === 1 ? '1 nom trouvé' : `${nbResultats} noms trouvés`}
        </p>
      )}
    </div>
  );
}
