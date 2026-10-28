/**
 * 📤 Envoi du bilan par message (2026-10-28, choix A + C de Nadia) : une image (lisible d'un coup d'œil) + un PDF (pour imprimer),
 * construits à partir de l'écran du bilan, et un lien de secours (si l'image ou le PDF ne s'ouvre pas).
 * ⚡ Les deux outils (html-to-image, jsPDF) ne se chargent qu'au moment de l'envoi.
 */

/** Capture d'un bloc de l'écran en image PNG (toujours en thème clair, comme une feuille) */
export async function capturerPng(node: HTMLElement): Promise<Blob> {
  const { toBlob } = await import('html-to-image');
  const html = document.documentElement;
  const sombre = html.classList.contains('dark');
  if (sombre) html.classList.remove('dark');
  try {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
    if (!blob) throw new Error("L'image n'a pas pu être fabriquée");
    return blob;
  } finally {
    if (sombre) html.classList.add('dark');
  }
}

const dimensions = (blob: Blob) => new Promise<{ w: number; h: number; url: string }>((resolve, reject) => {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight, url });
  img.onerror = reject;
  img.src = url;
});

/** PDF A4 : chaque image sur sa page (découpée en plusieurs pages si elle est longue) */
export async function fabriquerPdf(images: Blob[]): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210; const pageH = 297; const marge = 10;
  let premiere = true;
  for (const blob of images) {
    const { w, h, url } = await dimensions(blob);
    const largeur = pageW - 2 * marge;
    const hauteurTotale = (h * largeur) / w;
    const hauteurUtile = pageH - 2 * marge;
    const data = await new Promise<string>((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result as string); fr.readAsDataURL(blob); });
    for (let y = 0; y < hauteurTotale; y += hauteurUtile) {
      if (!premiere) pdf.addPage();
      premiere = false;
      pdf.addImage(data, 'PNG', marge, marge - y, largeur, hauteurTotale);
    }
    URL.revokeObjectURL(url);
  }
  return pdf.output('blob');
}

/** Ouvre WhatsApp / Messages sur le téléphone avec les fichiers ; sinon télécharge les fichiers et copie le texte */
export async function partagerBilan(fichiers: File[], texte: string): Promise<'partage' | 'telecharge'> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: fichiers })) {
    try {
      await nav.share({ files: fichiers, text: texte });
      return 'partage';
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
    }
  }
  for (const f of fichiers) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  try { await navigator.clipboard?.writeText(texte); } catch { /* copie impossible : le texte reste affiché */ }
  return 'telecharge';
}

/** Nom de fichier sans accents ni espaces : Bilan_Wiam_Noel_2026 */
export const nomFichier = (prenom: string, periode: string) =>
  `Bilan_${prenom}_${periode}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/_+$/, '');
