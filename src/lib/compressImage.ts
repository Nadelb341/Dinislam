/**
 * Compresse une image côté client avant envoi (Canvas du navigateur, aucune dépendance).
 * Recopié de l'Agenda (règle globale « Compression automatique des images », 2026-08-18) et adapté :
 * - redimensionne si besoin (plus grande dimension max) puis réencode ;
 * - une image avec transparence (PNG d'illustration) est réencodée en WebP pour garder la transparence,
 *   les autres en JPEG ;
 * - PDF, audio, vidéo, GIF (animation) et SVG sont renvoyés tels quels ;
 * - si le résultat n'est pas plus léger (ou en cas d'échec), le fichier d'origine est conservé.
 * Ne s'applique qu'aux NOUVEAUX envois : les fichiers déjà stockés ne sont jamais retouchés.
 */
export async function compressImage(
  file: File,
  { maxWidthOrHeight = 1600, quality = 0.8 }: { maxWidthOrHeight?: number; quality?: number } = {}
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
      const scale = maxWidthOrHeight / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    let transparent = false;
    if (file.type !== "image/jpeg") {
      const data = ctx.getImageData(0, 0, width, height).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) { transparent = true; break; }
      }
    }

    const type = transparent ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.type !== type || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + (transparent ? ".webp" : ".jpg");
    return new File([blob], newName, { type, lastModified: Date.now() });
  } catch {
    // En cas d'échec (format non décodable par le navigateur...), on garde l'original plutôt que de bloquer l'envoi
    return file;
  }
}

/** Photos « casuelles » (messagerie…) — priorité au poids léger. */
export const compressPhoto = (file: File) => compressImage(file, { maxWidthOrHeight: 1600, quality: 0.8 });

/** Contenus à lire (cartes de cours, devoirs, pages…) — priorité à la lisibilité. */
export const compressDocument = (file: File) => compressImage(file, { maxWidthOrHeight: 2200, quality: 0.9 });
