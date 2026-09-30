import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useWebPush } from '@/hooks/useWebPush';

/** Activer / désactiver les notifications sur CET appareil (utilisé dans le bouclier › Notifs pour l'enseignante) */
const PushToggle = () => {
  const { isSubscribed, isLoading, subscribe, unsubscribe, error } = useWebPush();

  const change = async (on: boolean) => {
    if (on) {
      const ok = await subscribe();
      if (ok) toast.success('✅ Notifications activées sur cet appareil');
      else toast.error(error || 'Autorise les notifications dans le navigateur, puis réessaie');
    } else {
      await unsubscribe();
      toast('Notifications désactivées sur cet appareil');
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
      <span className="text-lg" aria-hidden="true">{isSubscribed ? '✅' : '❌'}</span>
      <p className="flex-1 min-w-0 font-medium [overflow-wrap:anywhere]">
        {isSubscribed ? 'Notifications activées sur cet appareil' : 'Notifications désactivées sur cet appareil'}
      </p>
      <Switch aria-label="Activer les notifications sur cet appareil" checked={isSubscribed} disabled={isLoading} onCheckedChange={change} />
    </div>
  );
};

export default PushToggle;
