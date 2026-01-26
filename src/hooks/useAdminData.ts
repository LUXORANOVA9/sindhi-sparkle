import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;
export type Wallet = Tables<'wallets'>;
export type AuditLog = Tables<'audit_logs'>;
export type GameTable = Tables<'game_tables'>;
export type GameSession = Tables<'game_sessions'>;

export interface PlayerWithWallet extends Profile {
  wallet?: Wallet;
}

export function useAdminProfiles() {
  return useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useAdminWallets() {
  return useQuery({
    queryKey: ['admin', 'wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Wallet[];
    },
  });
}

export function useAdminAuditLogs() {
  return useQuery({
    queryKey: ['admin', 'audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as AuditLog[];
    },
  });
}

export function useAdminGameTables() {
  return useQuery({
    queryKey: ['admin', 'game_tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_tables')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GameTable[];
    },
  });
}

export function useAdminGameSessions() {
  return useQuery({
    queryKey: ['admin', 'game_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as GameSession[];
    },
  });
}

export function useAdminPlayersWithWallets() {
  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useAdminProfiles();
  const { data: wallets, isLoading: walletsLoading, error: walletsError } = useAdminWallets();

  const playersWithWallets: PlayerWithWallet[] = (profiles || []).map(profile => {
    const wallet = wallets?.find(w => w.user_id === profile.user_id);
    return { ...profile, wallet };
  });

  return {
    data: playersWithWallets,
    isLoading: profilesLoading || walletsLoading,
    error: profilesError || walletsError,
  };
}

export function useAdminStats() {
  const { data: profiles } = useAdminProfiles();
  const { data: wallets } = useAdminWallets();
  const { data: gameTables } = useAdminGameTables();
  const { data: gameSessions } = useAdminGameSessions();
  const { data: auditLogs } = useAdminAuditLogs();

  const totalBalance = wallets?.reduce((sum, w) => sum + Number(w.available) + Number(w.bonus), 0) || 0;
  const activePlayers = profiles?.filter(p => p.is_active).length || 0;
  const activeTables = gameTables?.filter(t => t.is_active).length || 0;
  const activeSessions = gameSessions?.filter(s => s.status === 'playing').length || 0;
  const fraudAlerts = auditLogs?.filter(log => 
    log.action.toLowerCase().includes('fraud') || 
    log.action.toLowerCase().includes('alert')
  ).length || 0;

  return {
    totalBalance,
    activePlayers,
    activeTables,
    activeSessions,
    fraudAlerts,
    totalPlayers: profiles?.length || 0,
  };
}
