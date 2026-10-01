// Fonctions propres à certains navigateurs (Safari iOS, Chrome) utilisées par l'appli, absentes des types standards.

interface SpeechRecognitionResultLike { readonly transcript: string }
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>> }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  webkitAudioContext?: typeof AudioContext;
}

interface Navigator {
  /** iOS : appli lancée depuis l'écran d'accueil */
  standalone?: boolean;
}

interface DeviceOrientationEvent {
  /** iOS : cap de la boussole en degrés */
  readonly webkitCompassHeading?: number;
}

interface HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitRequestFullscreen?: () => Promise<void> | void;
}
