import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Table, formatChips } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import { Users, Coins, Zap, Snowflake } from 'lucide-react';

interface TableCardProps {
  table: Table;
  onJoin: (tableId: string) => void;
  className?: string;
}

export function TableCard({ table, onJoin, className }: TableCardProps) {
  const isColdsoul = table.roomType === 'coldsoul';
  const isFull = table.status === 'full';
  const isPlaying = table.status === 'playing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-card via-card/95 to-card/90',
        'border border-border/50',
        'shadow-card hover:shadow-gold/20 transition-all duration-300',
        isFull && 'opacity-70',
        className
      )}
    >
      {/* Room type badge */}
      <div className={cn(
        'absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold',
        'flex items-center gap-1',
        isColdsoul 
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
          : 'bg-gold/20 text-gold border border-gold/30'
      )}>
        {isColdsoul ? <Snowflake className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
        {isColdsoul ? 'Cold Soul' : 'Classic'}
      </div>

      {/* Status indicator */}
      <div className={cn(
        'absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-semibold uppercase',
        table.status === 'waiting' && 'bg-green-500/20 text-green-400',
        table.status === 'playing' && 'bg-gold/20 text-gold animate-pulse',
        table.status === 'full' && 'bg-destructive/20 text-destructive'
      )}>
        {table.status}
      </div>

      <div className="p-6 pt-12">
        {/* Table name */}
        <h3 className="font-display text-xl font-bold text-foreground mb-4">
          {table.name}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Buy-in</p>
            <p className="text-sm font-bold text-foreground">
              {formatChips(table.minBuyIn)} - {formatChips(table.maxBuyIn)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Blinds</p>
            <p className="text-sm font-bold text-foreground">
              {formatChips(table.blinds.small)} / {formatChips(table.blinds.big)}
            </p>
          </div>
        </div>

        {/* Players */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {table.currentPlayers} / {table.maxPlayers} players
            </span>
          </div>
          {/* Player count bar */}
          <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gold"
              initial={{ width: 0 }}
              animate={{ width: `${(table.currentPlayers / table.maxPlayers) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
        </div>

        {/* Join button */}
        <Button
          variant={isFull ? 'outline' : 'gold'}
          className="w-full"
          disabled={isFull}
          onClick={() => onJoin(table.id)}
        >
          {isFull ? 'Table Full' : isPlaying ? 'Watch' : 'Join Table'}
        </Button>
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gold/5 rounded-full blur-2xl" />
    </motion.div>
  );
}
