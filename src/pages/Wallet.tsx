import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { WalletCard, TransactionItem, TransactionType } from '@/components/wallet/WalletCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletTransactions, useWalletStats, mapTransactionType } from '@/hooks/useWalletData';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Wallet as WalletIcon
} from 'lucide-react';
import { formatChips } from '@/lib/gameLogic';

export default function Wallet() {
  const [activeTab, setActiveTab] = useState('all');
  const { user, profile, wallet, getHighestRole, signOut, isLoading: authLoading } = useAuth();
  
  const { data: transactions = [], isLoading: txLoading } = useWalletTransactions(wallet?.id);
  const { data: stats, isLoading: statsLoading } = useWalletStats(wallet?.id);

  const isLoading = authLoading || txLoading || statsLoading;

  // Map database transactions to display format
  const mappedTransactions = transactions.map(tx => ({
    id: tx.id,
    type: mapTransactionType(tx.type) as TransactionType,
    amount: Number(tx.amount),
    description: tx.description,
    timestamp: new Date(tx.created_at),
    status: 'completed' as const
  }));

  const filteredTransactions = mappedTransactions.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'deposits') return tx.type === 'deposit' || tx.type === 'bonus';
    if (activeTab === 'withdrawals') return tx.type === 'withdrawal';
    if (activeTab === 'games') return tx.type === 'win' || tx.type === 'loss' || tx.type === 'commission';
    return true;
  });

  const handleDeposit = () => {
    toast({
      title: "Deposit",
      description: "Deposit functionality coming soon!",
    });
  };

  const handleWithdraw = () => {
    toast({
      title: "Withdraw",
      description: "Withdrawal functionality coming soon!",
    });
  };

  // Build user object for Header
  const headerUser = user ? {
    name: profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Player',
    chips: wallet?.available || 0,
    role: getHighestRole() || 'player'
  } : undefined;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={headerUser} onLogout={signOut} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl font-bold mb-2">Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and view transaction history</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main wallet card */}
          <div className="lg:col-span-2">
            <WalletCard
              balance={wallet?.available || 0}
              todayChange={stats?.todayChange || 0}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              className="mb-8"
            />

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <motion.div 
                className="p-4 rounded-xl bg-accent/10 border border-accent/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground">Total Winnings</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-accent">₹{(stats?.totalWins || 0).toLocaleString()}</p>
                )}
              </motion.div>
              
              <motion.div 
                className="p-4 rounded-xl bg-destructive/10 border border-destructive/30"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Total Losses</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-destructive">₹{(stats?.totalLosses || 0).toLocaleString()}</p>
                )}
              </motion.div>
            </div>

            {/* Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold">Transaction History</h2>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="games">Games</TabsTrigger>
                    <TabsTrigger value="deposits">Deposits</TabsTrigger>
                    <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="space-y-3">
                  {txLoading ? (
                    <>
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <WalletIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions found</p>
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <TransactionItem key={tx.id} {...tx} />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Quick actions */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/50">
              <h3 className="font-display text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="gold" className="w-full gap-2 justify-start" onClick={handleDeposit}>
                  <ArrowDownLeft className="w-4 h-4" />
                  Add Funds
                </Button>
                <Button variant="outline" className="w-full gap-2 justify-start" onClick={handleWithdraw}>
                  <ArrowUpRight className="w-4 h-4" />
                  Withdraw
                </Button>
              </div>
            </div>

            {/* Pending */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/50">
              <h3 className="font-display text-lg font-semibold mb-4">Pending</h3>
              <div className="space-y-3">
                {statsLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : stats?.pendingWithdrawals && stats.pendingWithdrawals > 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/10 border border-gold/30">
                    <Clock className="w-5 h-5 text-gold" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Withdrawal Processing</p>
                      <p className="text-xs text-muted-foreground">₹{formatChips(stats.pendingWithdrawals)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No pending transactions</p>
                )}
              </div>
            </div>

            {/* Recent activity summary */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/50">
              <h3 className="font-display text-lg font-semibold mb-4">This Week</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Games Played</span>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-8" />
                  ) : (
                    <span className="font-bold">{stats?.weeklyGamesPlayed || 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-12" />
                  ) : (
                    <span className="font-bold text-accent">{stats?.weeklyWinRate || 0}%</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Net Profit</span>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <span className={`font-bold ${(stats?.weeklyNetProfit || 0) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {(stats?.weeklyNetProfit || 0) >= 0 ? '+' : ''}₹{formatChips(stats?.weeklyNetProfit || 0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
