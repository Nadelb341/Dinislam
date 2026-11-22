import type { MessageQuiz } from '@/hooks/useDeuxChances';

/** 💡 Le message éphémère après la 2e chance : la bonne réponse + pourquoi (même style que l'explication 💡). Toucher = passer. */
export function MessageReponse({ m, onPasser }: { m: MessageQuiz; onPasser: () => void }) {
  return (
    <button type="button" onClick={onPasser} className="relative w-full overflow-hidden rounded-2xl bg-muted p-3 text-start animate-fade-in">
      <p className="text-sm font-bold">{m.ok ? '👍 Bien, à la 2e chance !' : '💪 Pas cette fois.'} La bonne réponse : <span dir="auto" className="[overflow-wrap:anywhere]">{m.bonne}</span></p>
      {m.explication && <p className="mt-1 text-sm [overflow-wrap:anywhere]">💡 {m.explication}</p>}
      <span aria-hidden className="absolute bottom-0 start-0 h-1 bg-primary/60" style={{ animation: `message-quiz ${m.duree}ms linear forwards` }} />
      <style>{'@keyframes message-quiz { from { width: 100%; } to { width: 0%; } }'}</style>
    </button>
  );
}
