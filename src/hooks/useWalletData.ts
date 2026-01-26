import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type WalletTxType = Database['public']['Enums']['wallet_tx_type'];

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: WalletTxType;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface WalletStats {
  todayChange: number;
  totalWins: number;
  totalLosses: number;
  weeklyGamesPlayed: number;
  weeklyWinRate: number;
  weeklyNetProfit: number;
  pendingWithdrawals: number;
}

// Map database transaction types to display types
export type DisplayTransactionType = 'deposit' | 'withdrawal' | 'win' | 'loss' | 'commission' | 'bonus' | 'transfer';

export function mapTransactionType(dbType: WalletTxType): DisplayTransactionType {
  switch (dbType) {
    case 'deposit':
      return 'deposit';
    case 'withdrawal':
      return 'withdrawal';
    case 'bet':
      return 'loss';
    case 'win':
      return 'win';
    case 'rake':
      return 'commission';
    case 'bonus':
      return 'bonus';
    case 'transfer':
      return 'transfer';
    default:
      return 'transfer';
  }
}

export function isCredit(type: WalletTxType): boolean {
  return ['deposit', 'win', 'bonus'].includes(type);
}

export function useWalletTransactions(walletId: string | undefined) {
  return useQuery({
    queryKey: ['wallet-transactions', walletId],
    queryFn: async () => {
      if (!walletId) return [];
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!walletId,
  });
}

export function useWalletStats(walletId: string | undefined) {
  return useQuery({
    queryKey: ['wallet-stats', walletId],
    queryFn: async (): Promise<WalletStats> => {
      if (!walletId) {
        return {
          todayChange: 0,
          totalWins: 0,
          totalLosses: 0,
          weeklyGamesPlayed: 0,
          weeklyWinRate: 0,
          weeklyNetProfit: 0,
          pendingWithdrawals: 0,
        };
      }

      // Fetch all transactions for the wallet
      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let todayChange = 0;
      let totalWins = 0;
      let totalLosses = 0;
      let weeklyWins = 0;
      let weeklyLosses = 0;
      let weeklyNetProfit = 0;
      let pendingWithdrawals = 0;
      const weeklyGameSessions = new Set<string>();

      (transactions || []).forEach((tx) => {
        const txDate = new Date(tx.created_at);
        const amount = Number(tx.amount);
        const isCreditTx = isCredit(tx.type);

        // Calculate today's change (last 24 hours)
        if (txDate >= oneDayAgo) {
          todayChange += isCreditTx ? amount : -amount;
        }

        // Calculate total wins and losses
        if (tx.type === 'win') {
          totalWins += amount;
        } else if (tx.type === 'bet' || tx.type === 'rake') {
          totalLosses += amount;
        }

        // Weekly stats
        if (txDate >= oneWeekAgo) {
          if (tx.type === 'win') {
            weeklyWins += 1;
            weeklyNetProfit += amount;
          } else if (tx.type === 'bet') {
            weeklyLosses += 1;
            weeklyNetProfit -= amount;
            // Track unique game sessions for games played
            if (tx.reference_id) {
              weeklyGameSessions.add(tx.reference_id);
            }
          } else if (tx.type === 'rake') {
            weeklyNetProfit -= amount;
          }
        }

        // Check for pending withdrawals in metadata
        if (tx.type === 'withdrawal') {
          const metadata = tx.metadata as Record<string, unknown> | null;
          if (metadata?.status === 'pending') {
            pendingWithdrawals += amount;
          }
        }
      });

      const weeklyGamesPlayed = weeklyGameSessions.size || Math.ceil((weeklyWins + weeklyLosses) / 2);
      const weeklyWinRate = weeklyWins + weeklyLosses > 0 
        ? Math.round((weeklyWins / (weeklyWins + weeklyLosses)) * 100) 
        : 0;

      return {
        todayChange,
        totalWins,
        totalLosses,
        weeklyGamesPlayed,
        weeklyWinRate,
        weeklyNetProfit,
        pendingWithdrawals,
      };
    },
    enabled: !!walletId,
  });
}
