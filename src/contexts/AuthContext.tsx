import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { rememberPassword } from '@/lib/rememberPassword';
import type { TablesUpdate } from '@/integrations/supabase/types';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean | null;
  /** La vérification « compte validé ? » n'a pas pu aboutir (réseau, navigateur…) : ni oui ni non */
  approvalCheckFailed: boolean;
  /** Relance la vérification « compte validé ? » */
  recheckApproval: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string, gender?: string, dateOfBirth?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [approvalCheckFailed, setApprovalCheckFailed] = useState(false);
  // Seule la dernière vérification lancée a le droit de modifier l'état (une réponse lente et ratée ne doit pas écraser une bonne)
  const approvalRun = useRef(0);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) { console.error('Error checking admin role:', error); return false; }
      return !!data;
    } catch (err) { console.error('Error in checkAdminRole:', err); return false; }
  }, []);

  /**
   * « Compte validé ? » → true / false quand la base a répondu, null quand elle n'a pas pu répondre.
   * Avant le 2026-10-14, le moindre raté (réseau, navigateur Xiaomi…) donnait « false » : une élève acceptée
   * (Lina Nebian) restait bloquée sur « Inscription en attente ». Désormais : 3 essais, et un raté n'est jamais un « non ».
   */
  const checkApprovalStatus = useCallback(async (userId: string): Promise<boolean | null> => {
    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && data) return data.is_approved === true;
        // Aucune ligne visible = la connexion n'a pas été jointe à la demande (le profil existe toujours)
        lastError = error ? `${error.code ?? ''} ${error.message}` : 'profil non visible (connexion non jointe ?)';
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 800 * attempt));
    }
    console.error('Vérification « compte validé ? » impossible :', lastError);
    // Trace visible dans Monitoring, pour connaître la vraie cause sur l'appareil de l'élève
    supabase.from('app_logs').insert({
      user_id: userId, level: 'warn', action: 'Vérification « compte validé ? » impossible',
      details: { error: lastError, user_agent: navigator.userAgent },
    }).then(() => {}, () => {});
    return null;
  }, []);

  /** Applique le résultat ; un raté laisse « validé » tel quel et affiche l'écran « Réessayer » si on ne sait rien */
  const applyApproval = useCallback(async (userId: string) => {
    const run = ++approvalRun.current;
    const [approved, admin] = await Promise.all([checkApprovalStatus(userId), checkAdminRole(userId)]);
    if (run !== approvalRun.current) return;
    setIsAdmin(admin);
    if (admin) { setIsApproved(true); setApprovalCheckFailed(false); return; }
    if (approved === null) { setApprovalCheckFailed(true); return; }
    setIsApproved(approved);
    setApprovalCheckFailed(false);
  }, [checkApprovalStatus, checkAdminRole]);

  // Re-check approval when app comes back to foreground
  const recheckApproval = useCallback(async () => {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;
    await applyApproval(currentUser.id);
  }, [applyApproval]);

  useEffect(() => {
    let mounted = true;

    // SAFETY TIMEOUT: loading passes to false after 2s max no matter what
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
          clearTimeout(safetyTimer);

          // Roles in background, never block rendering
          applyApproval(session.user.id);

          // Update last_seen silently
          supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('user_id', session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Détection confirmation email : Supabase ajoute type=signup dans le hash
        if (event === 'SIGNED_IN' && window.location.hash.includes('type=signup')) {
          await supabase.auth.signOut();
          window.location.replace('/auth?email_confirmed=1');
          return;
        }

        // Lien « mot de passe oublié » arrivé ailleurs que sur la page prévue : on y emmène l'élève
        if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/reset-password') {
          window.location.replace('/reset-password');
          return;
        }

        setSession(session);
        if (session?.user) {
          setUser(session.user);
          applyApproval(session.user.id);
        } else {
          approvalRun.current++;
          setUser(null);
          setIsAdmin(false);
          setIsApproved(null);
          setApprovalCheckFailed(false);
        }
      }
    );

    // Re-check approval on visibility change (tab focus)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        recheckApproval();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [applyApproval, recheckApproval]);

  const signUp = async (email: string, password: string, fullName?: string, gender?: string, dateOfBirth?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName, gender, date_of_birth: dateOfBirth },
        },
      });
      if (error) throw error;

      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        const updateData: TablesUpdate<'profiles'> = { full_name: fullName, gender };
        if (dateOfBirth) { updateData.date_of_birth = dateOfBirth; updateData.dob_set_by_user = true; }
        await supabase.from('profiles').update(updateData).eq('user_id', newUser.id);
        supabase.functions.invoke('send-push-notification', {
          body: { title: '📝 Nouvelle demande d\'inscription', category: 'adm_reg', body: `${fullName || email} a rempli le formulaire — en attente de confirmation email.`, type: 'admin', data: { url: '/?admin=users' } },
        }).catch(err => console.error('Push notification error:', err));
      }

      return { error: null };
    } catch (error) { return { error: error as Error }; }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      rememberPassword(password, 'connexion');
      return { error: null };
    } catch (error) { return { error: error as Error }; }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsApproved(null);
    setApprovalCheckFailed(false);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Toujours l'adresse officielle (une autre adresse n'est pas autorisée par Supabase → le lien menait à l'accueil)
        redirectTo: `${window.location.hostname === 'localhost' ? window.location.origin : 'https://dinislam-app.vercel.app'}/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) { return { error: error as Error }; }
  };

  const value = { user, session, loading, isAdmin, isApproved, approvalCheckFailed, recheckApproval, signUp, signIn, signOut, resetPassword };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
