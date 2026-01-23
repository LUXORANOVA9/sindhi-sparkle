import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatChips } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface WalletCardProps {
  balance: number;
  todayChange: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  className?: string;
}

export function WalletCard({ 
  balance, 
  todayChange, 
  onDeposit, 
  onWithdraw,
  className 
}: WalletCardProps) {
  const isPositive = todayChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-3xl p-6',
        'bg-gradient-to-br from-secondary via-card to-card',
        'border border-gold/30',
        'shadow-gold/10 shadow-2xl',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-gold" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-xs text-muted-foreground/60">Available for play</p>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-6">
          <motion.h2 
            className="font-display text-5xl font-bold gold-shimmer bg-clip-text text-transparent"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            ₹{formatChips(balance)}
          </motion.h2>
          
          {/* Today's change */}
          <div className={cn(
            'flex items-center gap-1 mt-2',
            isPositive ? 'text-accent' : 'text-destructive'
          )}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">
              {isPositive ? '+' : ''}{formatChips(todayChange)} today
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button 
            variant="gold" 
            className="flex-1 gap-2"
            onClick={onDeposit}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Deposit
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={onWithdraw}
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface TransactionProps {
  type: 'deposit' | 'withdrawal' | 'win' | 'loss' | 'commission';
  amount: number;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export function TransactionItem({ type, amount, description, timestamp, status }: TransactionProps) {
  const isCredit = type === 'deposit' || type === 'win';
  
  const icons = {
    deposit: ArrowDownLeft,
    withdrawal: ArrowUpRight,
    win: TrendingUp,
    loss: TrendingDown,
    commission: Wallet
  };
  
  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl',
        'bg-card/50 border border-border/30',
        'hover:bg-card transition-colors'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        isCredit ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
      )}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        <p className="font-medium text-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">
          {timestamp.toLocaleDateString()} • {timestamp.toLocaleTimeString()}
        </p>
      </div>

      <div className="text-right">
        <p className={cn(
          'font-bold',
          isCredit ? 'text-accent' : 'text-destructive'
        )}>
          {isCredit ? '+' : '-'}₹{formatChips(Math.abs(amount))}
        </p>
        <p className={cn(
          'text-xs capitalize',
          status === 'completed' && 'text-accent',
          status === 'pending' && 'text-gold',
          status === 'failed' && 'text-destructive'
        )}>
          {status}
        </p>
      </div>
    </motion.div>
  );
}
