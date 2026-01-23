import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { WalletCard, TransactionItem } from '@/components/wallet/WalletCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle2
} from 'lucide-react';

const mockUser = {
  name: 'Player One',
  chips: 25000,
  role: 'player' as const
};

const mockTransactions = [
  {
    type: 'win' as const,
    amount: 5200,
    description: 'Won at High Rollers Table',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'completed' as const
  },
  {
    type: 'loss' as const,
    amount: 1500,
    description: 'Lost at Beginner\'s Fortune',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'completed' as const
  },
  {
    type: 'deposit' as const,
    amount: 10000,
    description: 'Bank Transfer Deposit',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'completed' as const
  },
  {
    type: 'withdrawal' as const,
    amount: 5000,
    description: 'Withdrawal to Bank Account',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: 'pending' as const
  },
  {
    type: 'win' as const,
    amount: 8500,
    description: 'Won at Festival Special',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    status: 'completed' as const
  },
  {
    type: 'commission' as const,
    amount: 250,
    description: 'Table Commission',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 73),
    status: 'completed' as const
  }
];

export default function Wallet() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredTransactions = mockTransactions.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'deposits') return tx.type === 'deposit';
    if (activeTab === 'withdrawals') return tx.type === 'withdrawal';
    if (activeTab === 'games') return tx.type === 'win' || tx.type === 'loss';
    return true;
  });

  const totalWins = mockTransactions
    .filter(tx => tx.type === 'win')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalLosses = mockTransactions
    .filter(tx => tx.type === 'loss' || tx.type === 'commission')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header user={mockUser} />
      
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
              balance={mockUser.chips}
              todayChange={3700}
              onDeposit={() => console.log('Deposit')}
              onWithdraw={() => console.log('Withdraw')}
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
                <p className="text-2xl font-bold text-accent">₹{totalWins.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-destructive">₹{totalLosses.toLocaleString()}</p>
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
                  {filteredTransactions.map((tx, index) => (
                    <TransactionItem key={index} {...tx} />
                  ))}
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
                <Button variant="gold" className="w-full gap-2 justify-start">
                  <ArrowDownLeft className="w-4 h-4" />
                  Add Funds
                </Button>
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <ArrowUpRight className="w-4 h-4" />
                  Withdraw
                </Button>
              </div>
            </div>

            {/* Pending */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/50">
              <h3 className="font-display text-lg font-semibold mb-4">Pending</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/10 border border-gold/30">
                  <Clock className="w-5 h-5 text-gold" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Withdrawal Processing</p>
                    <p className="text-xs text-muted-foreground">₹5,000 • Est. 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent activity summary */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/50">
              <h3 className="font-display text-lg font-semibold mb-4">This Week</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Games Played</span>
                  <span className="font-bold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="font-bold text-accent">67%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Net Profit</span>
                  <span className="font-bold text-accent">+₹11,950</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
