import { Component, useState, useCallback, type ReactNode } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// Version « anciens appareils » du moteur PDF (vieux iPad/Safari), assortie à celle de la page (voir vite.config.ts)
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props {
  fileUrl: string;
}

/** Plan B : le cours s'ouvre dans le lecteur PDF du téléphone/de la tablette */
const OpenPdfLink = ({ fileUrl }: Props) => (
  <div className="py-6 text-center space-y-2">
    <p className="text-sm text-muted-foreground">Le cours ne s'affiche pas ici sur cet appareil.</p>
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
    >
      📄 Ouvrir le cours
    </a>
  </div>
);

/** Un souci d'affichage du PDF ne doit jamais faire planter toute la page Nourania (2026-10-14) */
class PdfSafetyNet extends Component<{ fileUrl: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('Lecteur PDF Nourania :', error); }
  render() { return this.state.failed ? <OpenPdfLink fileUrl={this.props.fileUrl} /> : this.props.children; }
}

const PdfDocument = ({ fileUrl }: Props) => {
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0].contentRect.width);
      if (width > 0) setContainerWidth(width);
    });
    observer.observe(node);
    const w = Math.floor(node.offsetWidth);
    if (w > 0) setContainerWidth(w);
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {containerWidth > 0 && (
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chargement du cours...
            </div>
          }
          error={<OpenPdfLink fileUrl={fileUrl} />}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              width={containerWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="block w-full"
            />
          ))}
        </Document>
      )}
    </div>
  );
};

const NouraniaPdfViewer = ({ fileUrl }: Props) => (
  <PdfSafetyNet fileUrl={fileUrl}>
    <PdfDocument fileUrl={fileUrl} />
  </PdfSafetyNet>
);

export default NouraniaPdfViewer;
