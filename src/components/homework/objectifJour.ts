/** Date locale « AAAA-MM-JJ » (l'« 🎯 Objectif du jour » a été retiré à la demande de Nadia le 2026-11-04) */
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
