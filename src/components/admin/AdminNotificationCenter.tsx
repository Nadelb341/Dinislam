import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, X, User, BookOpen, GraduationCap, Mail, ClipboardList, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: string;
  type: 'registration' | 'sourate' | 'nourania' | 'message' | 'homework';
  title: string;
  description: string;
  userId?: string;
  itemId?: string | number;
  createdAt: string;
}

const AdminNotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // ── Fetch all pending notifications ──────────────────────────────────
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['admin-all-notifications'],
    queryFn: async () => {
      const items: Notification[] = [];

      // 1. Nouvelles inscriptions en attente
      const { data: regPending } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, created_at')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      for (const r of regPending || []) {
        items.push({
          id: `reg-${r.user_id}`,
          type: 'registration',
          title: 'Nouvelle inscription',
          description: r.full_name || r.email || 'Élève inconnu',
          userId: r.user_id,
          createdAt: r.created_at,
        });
      }

      // 2. Validations Sourates en attente
      const { data: souPending } = await supabase
        .from('sourate_validation_requests')
        .select('id, user_id, sourate_id, created_at, sourates(name_french), profiles(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      for (const s of souPending || []) {
        const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
        const sourate = Array.isArray(s.sourates) ? s.sourates[0] : s.sourates;
        items.push({
          id: `sou-${s.id}`,
          type: 'sourate',
          title: 'Validation Sourate',
          description: `${profile?.full_name || 'Élève'} — ${sourate?.name_french || `S. ${s.sourate_id}`}`,
          userId: s.user_id,
          itemId: s.id,
          createdAt: s.created_at,
        });
      }

      // 3. Validations Nourania en attente
      const { data: nouPending } = await supabase
        .from('nourania_validation_requests')
        .select('id, user_id, lesson_id, created_at, nourania_lessons(title_french), profiles(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      for (const n of nouPending || []) {
        const profile = Array.isArray(n.profiles) ? n.profiles[0] : n.profiles;
        const lesson = Array.isArray(n.nourania_lessons) ? n.nourania_lessons[0] : n.nourania_lessons;
        items.push({
          id: `nou-${n.id}`,
          type: 'nourania',
          title: 'Validation Nourania',
          description: `${profile?.full_name || 'Élève'} — ${lesson?.title_french || `L. ${n.lesson_id}`}`,
          userId: n.user_id,
          itemId: n.id,
          createdAt: n.created_at,
        });
      }

      // 4. Messages non lus
      const { data: unreadMsgs } = await supabase
        .from('user_messages')
        .select('user_id, created_at, profiles(full_name)')
        .eq('sender_type', 'user')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      // Group by user to avoid duplicate message entries
      const seenUsers = new Set<string>();
      for (const m of unreadMsgs || []) {
        if (!seenUsers.has(m.user_id)) {
          seenUsers.add(m.user_id);
          const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          items.push({
            id: `msg-${m.user_id}`,
            type: 'message',
            title: 'Message non lu',
            description: profile?.full_name || 'Élève',
            userId: m.user_id,
            createdAt: m.created_at,
          });
        }
      }

      // 5. Devoirs complétés (dernières 24h)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: hwDone } = await supabase
        .from('homework_assignments')
        .select('id, user_id, title, completed_at, profiles(full_name)')
        .eq('status', 'completed')
        .gte('completed_at', since)
        .order('completed_at', { ascending: false });

      for (const h of hwDone || []) {
        const profile = Array.isArray(h.profiles) ? h.profiles[0] : h.profiles;
        items.push({
          id: `hw-${h.id}`,
          type: 'homework',
          title: 'Devoir rendu',
          description: `${profile?.full_name || 'Élève'} — ${h.title}`,
          userId: h.user_id,
          itemId: h.id,
          createdAt: h.completed_at || '',
        });
      }

      // Sort by date desc
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // ── Realtime ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('admin-notif-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sourate_validation_requests' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nourania_validation_requests' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_messages' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework_assignments' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refetch]);

  // ── Mutations ─────────────────────────────────────────────────────────
  const markProcessing = (id: string, val: boolean) => {
    setProcessingIds(prev => {
      const next = new Set(prev);
      if (val) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleApproveRegistration = async (notif: Notification) => {
    markProcessing(notif.id, true);
    try {
      await supabase.from('profiles').update({ is_approved: true }).eq('user_id', notif.userId!);
      toast({ title: '✅ Élève approuvé', description: notif.description });
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-registrations-count'] });
      refetch();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { markProcessing(notif.id, false); }
  };

  const handleRejectRegistration = async (notif: Notification) => {
    markProcessing(notif.id, true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId: notif.userId }),
      });
      toast({ title: '🗑️ Inscription refusée', description: notif.description });
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      refetch();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { markProcessing(notif.id, false); }
  };

  const handleApproveSourate = async (notif: Notification) => {
    markProcessing(notif.id, true);
    try {
      const reqId = notif.itemId as string;
      const { data: req } = await supabase.from('sourate_validation_requests').select('sourate_id, user_id').eq('id', reqId).single();
      if (!req) throw new Error('not found');
      await supabase.from('sourate_validation_requests').update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user!.id }).eq('id', reqId);
      await supabase.from('user_sourate_progress').upsert({ user_id: req.user_id, sourate_id: req.sourate_id, is_validated: true, progress_percentage: 100 }, { onConflict: 'user_id,sourate_id' });
      toast({ title: '✅ Sourate validée' });
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      refetch();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { markProcessing(notif.id, false); }
  };

  const handleRejectSourate = async (notif: Notification) => {
    markProcessing(notif.id, true);
    try {
      await supabase.from('sourate_validation_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user!.id }).eq('id', notif.itemId as string);
      toast({ title: '❌ Sourate refusée' });
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      refetch();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { markProcessing(notif.id, false); }
  };

  const handleApproveNourania = async (notif: Notification) => {
    markProcessing(notif.id, true);
    try {
      const reqId = notif.itemId as string;
      const { data: req } = await supabase.from('nourania_validation_requests').select('lesson_id, user_id').eq('id', reqId).single();
      if (!req) throw new Error('not found');
      await supabase.from('nourania_validation_requests').update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user!.id }).eq('id', reqId);
      await supabase.from('user_nourania_progress').upsert({ user_id: req.user_id, lesson_id: req.lesson_id, is_validated: true }, { onConflict: 'user_id,lesson_id' });
      toast({ title: '✅ Leçon Nourania validée' });
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-nourania-count'] });
      refetch();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { markProcessing(notif.id, false); }
  };

  const handleRejectNourania = async (notif: Notification) => {
    markProcessing(notif.id, true);
    try {
      await supabase.from('nourania_validation_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user!.id }).eq('id', notif.itemId as string);
      toast({ title: '❌ Leçon refusée' });
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      refetch();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { markProcessing(notif.id, false); }
  };

  const handleMarkMessageRead = async (notif: Notification) => {
    markProcessing(notif.id, true);
    try {
      await supabase.from('user_messages').update({ is_read: true }).eq('user_id', notif.userId!).eq('sender_type', 'user').eq('is_read', false);
      toast({ title: '✅ Messages marqués comme lus' });
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
      refetch();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { markProcessing(notif.id, false); }
  };

  const handleAcknowledgeHomework = async (notif: Notification) => {
    markProcessing(notif.id, true);
    // Navigate to admin and remove from list by marking as "seen" (we just navigate)
    setOpen(false);
    navigate('/admin');
    markProcessing(notif.id, false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'registration': return <User className="h-4 w-4 text-blue-500" />;
      case 'sourate': return <BookOpen className="h-4 w-4 text-purple-500" />;
      case 'nourania': return <GraduationCap className="h-4 w-4 text-amber-500" />;
      case 'message': return <Mail className="h-4 w-4 text-orange-500" />;
      case 'homework': return <ClipboardList className="h-4 w-4 text-green-600" />;
    }
  };

  const getTypeBg = (type: Notification['type']) => {
    switch (type) {
      case 'registration': return 'bg-blue-500/10';
      case 'sourate': return 'bg-purple-500/10';
      case 'nourania': return 'bg-amber-500/10';
      case 'message': return 'bg-orange-500/10';
      case 'homework': return 'bg-green-500/10';
    }
  };

  const renderActions = (notif: Notification) => {
    const isProc = processingIds.has(notif.id);

    if (notif.type === 'registration') {
      return (
        <div className="flex gap-1 mt-2">
          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => handleApproveRegistration(notif)} disabled={isProc}>
            {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Accepter</>}
          </Button>
          <Button size="sm" variant="destructive" className="h-7 text-xs flex-1" onClick={() => handleRejectRegistration(notif)} disabled={isProc}>
            {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><X className="h-3 w-3 mr-1" />Refuser</>}
          </Button>
        </div>
      );
    }
    if (notif.type === 'sourate') {
      return (
        <div className="flex gap-1 mt-2">
          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => handleApproveSourate(notif)} disabled={isProc}>
            {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Valider</>}
          </Button>
          <Button size="sm" variant="destructive" className="h-7 text-xs flex-1" onClick={() => handleRejectSourate(notif)} disabled={isProc}>
            {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><X className="h-3 w-3 mr-1" />Refuser</>}
          </Button>
        </div>
      );
    }
    if (notif.type === 'nourania') {
      return (
        <div className="flex gap-1 mt-2">
          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => handleApproveNourania(notif)} disabled={isProc}>
            {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Valider</>}
          </Button>
          <Button size="sm" variant="destructive" className="h-7 text-xs flex-1" onClick={() => handleRejectNourania(notif)} disabled={isProc}>
            {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><X className="h-3 w-3 mr-1" />Refuser</>}
          </Button>
        </div>
      );
    }
    if (notif.type === 'message') {
      return (
        <div className="flex gap-1 mt-2">
          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => handleMarkMessageRead(notif)} disabled={isProc}>
            {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Marquer lu</>}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => { setOpen(false); navigate('/admin'); }}>
            <ChevronRight className="h-3 w-3 mr-1" />Répondre
          </Button>
        </div>
      );
    }
    if (notif.type === 'homework') {
      return (
        <div className="flex gap-1 mt-2">
          <Button size="sm" variant="outline" className="h-7 text-xs w-full" onClick={() => handleAcknowledgeHomework(notif)}>
            <ChevronRight className="h-3 w-3 mr-1" />Voir le devoir
          </Button>
        </div>
      );
    }
  };

  const totalCount = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10 relative"
        >
          <Shield className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge
              className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 border-2 border-primary ${totalCount > 0 ? 'animate-pulse' : ''}`}
            >
              {totalCount > 9 ? '9+' : totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-xl border bg-popover z-[200]"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Centre de notifications</span>
          </div>
          {totalCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs">
              {totalCount} en attente
            </Badge>
          )}
        </div>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Tout est à jour ! ✨</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="divide-y">
              {notifications.map((notif, idx) => (
                <div key={notif.id} className="px-3 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getTypeBg(notif.type)}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                      {renderActions(notif)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <Separator />
        <div className="px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => { setOpen(false); navigate('/admin'); }}
          >
            Voir le tableau de bord complet
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotificationCenter;
