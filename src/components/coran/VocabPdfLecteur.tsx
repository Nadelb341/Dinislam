import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// Même moteur PDF que les cours Nourania (version « anciens appareils », voir vite.config.ts)
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * 📄 Lecteur PDF du « Vocabulaire du Coran » (2026-11-26) : même moteur que `NouraniaPdfViewer` (react-pdf),
 * mais les pages ne sont dessinées que lorsqu'elles approchent de l'écran (un PDF entier peut faire 178 pages :
 * tout dessiner d'un coup ferait planter un vieux téléphone). Hors ligne : le service worker garde le PDF
 * sur l'appareil dès la 1re ouverture (`/pdf/`, mémoire `dinislam-pdf`).
 * 📑 `pageDepart` (2026-11-26, sous-sommaire) : une fois le document prêt, on descend jusqu'à cette page.
 */
const OuvrirAilleurs = ({ url }: { url: string }) => (
  <div className="py-6 text-center space-y-2">
    <p className="text-sm text-muted-foreground">Le document ne s'affiche pas ici sur cet appareil.</p>
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
      📄 Ouvrir le document
    </a>
  </div>
);

/** Un souci d'affichage du PDF ne doit jamais faire planter la page du Coran */
class FiletPdf extends Component<{ url: string; children: ReactNode }, { rate: boolean }> {
  state = { rate: false };
  static getDerivedStateFromError() { return { rate: true }; }
  componentDidCatch(error: Error) { console.error('Lecteur PDF Vocabulaire :', error); }
  render() { return this.state.rate ? <OuvrirAilleurs url={this.props.url} /> : this.props.children; }
}

/** Une page : dessinée seulement près de l'écran (place gardée sinon, pour que le défilement ne saute pas) */
function PageParesseuse({ numero, largeur, ratio }: { numero: number; largeur: number; ratio: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [proche, setProche] = useState(numero <= 2);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setProche(true); return; }
    const obs = new IntersectionObserver(([e]) => setProche(e.isIntersecting), { rootMargin: '1200px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} data-page={numero} className="relative bg-white shadow-sm rounded-sm overflow-hidden scroll-mt-20" style={{ width: largeur, minHeight: Math.round(largeur * ratio) }}>
      {proche ? (
        <Page pageNumber={numero} width={largeur} renderAnnotationLayer={false} renderTextLayer={false} className="block w-full"
          loading={<div className="grid place-items-center text-xs text-muted-foreground" style={{ height: Math.round(largeur * ratio) }}>Page {numero}…</div>} />
      ) : (
        <div className="grid place-items-center text-xs text-muted-foreground" style={{ height: Math.round(largeur * ratio) }}>Page {numero}</div>
      )}
    </div>
  );
}

function Lecteur({ url, pageDepart }: { url: string; pageDepart?: number | null }) {
  const boite = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(0);
  const [nbPages, setNbPages] = useState(0);
  const [ratio, setRatio] = useState(1.414);
  // La place de chaque page dépend du ratio : on attend de le connaître avant de descendre à la bonne page
  const [ratioPret, setRatioPret] = useState(false);
  const pageAtteinte = useRef<number | null>(null);

  useEffect(() => {
    if (!pageDepart || pageDepart <= 1 || !nbPages || !ratioPret || !largeur) return;
    const cible = Math.min(pageDepart, nbPages);
    if (pageAtteinte.current === cible) return;
    const id = window.setTimeout(() => {
      const el = boite.current?.querySelector<HTMLElement>(`[data-page="${cible}"]`);
      if (!el) return;
      el.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
      pageAtteinte.current = cible;
    }, 60);
    return () => window.clearTimeout(id);
  }, [pageDepart, nbPages, ratioPret, largeur]);

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const mesurer = () => setLargeur(Math.floor(el.clientWidth));
    mesurer();
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(mesurer) : null;
    obs?.observe(el);
    return () => obs?.disconnect();
  }, []);

  return (
    <div ref={boite} className="w-full">
      {largeur > 0 && (
        <Document file={url}
          onLoadSuccess={(pdf) => {
            setNbPages(pdf.numPages);
            pdf.getPage(1).then((p) => { const v = p.getViewport({ scale: 1 }); if (v.width > 0) setRatio(v.height / v.width); setRatioPret(true); }, () => { setRatioPret(true); /* ratio A4 gardé */ });
          }}
          loading={<div className="py-8 text-center text-sm text-muted-foreground">Chargement du document…</div>}
          error={<OuvrirAilleurs url={url} />}>
          <div className="flex flex-col items-center gap-2">
            {Array.from({ length: nbPages }, (_, i) => <PageParesseuse key={i + 1} numero={i + 1} largeur={largeur} ratio={ratio} />)}
          </div>
        </Document>
      )}
    </div>
  );
}

export function VocabPdfLecteur({ url, pageDepart }: { url: string; pageDepart?: number | null }) {
  // key = url : un nouveau document repart de zéro (et le filet d'erreur aussi)
  return <FiletPdf key={url} url={url}><Lecteur url={url} pageDepart={pageDepart} /></FiletPdf>;
}
