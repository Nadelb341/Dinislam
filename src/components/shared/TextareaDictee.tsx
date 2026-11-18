import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { BoutonDictee } from '@/components/shared/BoutonDictee';
import { cn } from '@/lib/utils';

/**
 * 🎤 Zone de texte AVEC le micro de dictée en bas à droite (Nadia, 2026-11-18 : « mets ce même micro partout où tu juges que
 * c'est nécessaire »). S'utilise exactement comme <Textarea> : le texte dicté s'ajoute à la fin, en passant par le même
 * onChange (le champ contrôlé reste à jour, brouillons compris). Sans reconnaissance vocale sur l'appareil : pas de micro.
 */
export const TextareaDictee = forwardRef<HTMLTextAreaElement, TextareaProps & { conteneurClassName?: string }>(
  ({ className, conteneurClassName, ...props }, ref) => {
    const interne = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => interne.current as HTMLTextAreaElement);
    const ajouter = (t: string) => {
      const el = interne.current;
      if (!el) return;
      const nouveau = el.value ? `${el.value.replace(/\s+$/, '')} ${t}` : t;
      // Écrit comme si on tapait : React reçoit un vrai événement « input » → onChange du formulaire
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      setter?.call(el, nouveau);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    return (
      <div className={cn('relative w-full', conteneurClassName)}>
        <Textarea ref={interne} className={cn('pr-11', className)} {...props} />
        {!props.disabled && !props.readOnly && <BoutonDictee onTexte={ajouter} className="absolute bottom-1.5 right-1.5" />}
      </div>
    );
  },
);
TextareaDictee.displayName = 'TextareaDictee';
