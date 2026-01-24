import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = 'master_super_admin' | 'super_admin' | 'broker' | 'player';

interface Profile {
  id: string;
  user_id: string;
  tenant_id: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  tenant_id: string | null;
  role: AppRole;
}

interface Wallet {
  id: string;
  user_id: string;
  tenant_id: string | null;
  available: number;
  locked: number;
  bonus: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  wallet: Wallet | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  hasRole: (role: AppRole, tenantId?: string | null) => boolean;
  isMasterAdmin: () => boolean;
  isSuperAdmin: (tenantId?: string | null) => boolean;
  isBroker: (tenantId?: string | null) => boolean;
  getHighestRole: () => AppRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile, roles, and wallet in parallel
      const [profileResult, rolesResult, walletResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_roles').select('*').eq('user_id', userId),
        supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data as Profile);
      }

      if (rolesResult.data) {
        setRoles(rolesResult.data as UserRole[]);
      }

      if (walletResult.data) {
        setWallet(walletResult.data as Wallet);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshUserData = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserData(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setWallet(null);
        }

        if (event === 'INITIAL_SESSION') {
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchUserData(existingSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setWallet(null);
  };

  const hasRole = (role: AppRole, tenantId?: string | null): boolean => {
    return roles.some(r => 
      r.role === role && 
      (tenantId === undefined || r.tenant_id === tenantId)
    );
  };

  const isMasterAdmin = (): boolean => {
    return roles.some(r => r.role === 'master_super_admin' && r.tenant_id === null);
  };

  const isSuperAdmin = (tenantId?: string | null): boolean => {
    if (isMasterAdmin()) return true;
    return roles.some(r => 
      r.role === 'super_admin' && 
      (tenantId === undefined || r.tenant_id === tenantId)
    );
  };

  const isBroker = (tenantId?: string | null): boolean => {
    if (isSuperAdmin(tenantId)) return true;
    return roles.some(r => 
      r.role === 'broker' && 
      (tenantId === undefined || r.tenant_id === tenantId)
    );
  };

  const getHighestRole = (): AppRole | null => {
    const roleHierarchy: AppRole[] = ['master_super_admin', 'super_admin', 'broker', 'player'];
    for (const role of roleHierarchy) {
      if (roles.some(r => r.role === role)) {
        return role;
      }
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        wallet,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshUserData,
        hasRole,
        isMasterAdmin,
        isSuperAdmin,
        isBroker,
        getHighestRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
