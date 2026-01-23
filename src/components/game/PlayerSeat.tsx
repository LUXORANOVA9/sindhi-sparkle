import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Player, formatChips } from '@/lib/gameLogic';
import { PlayingCard } from './PlayingCard';
import { ChipStack } from './ChipStack';
import { User, Crown, Eye, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PlayerSeatProps {
  player?: Player;
  position: 'top' | 'top-left' | 'top-right' | 'bottom' | 'left' | 'right';
  isCurrentUser?: boolean;
  showCards?: boolean;
  className?: string;
}

export function PlayerSeat({ 
  player, 
  position, 
  isCurrentUser = false,
  showCards = false,
  className 
}: PlayerSeatProps) {
  const positionClasses = {
    'top': 'top-4 left-1/2 -translate-x-1/2',
    'top-left': 'top-8 left-[15%]',
    'top-right': 'top-8 right-[15%]',
    'bottom': 'bottom-4 left-1/2 -translate-x-1/2',
    'left': 'left-4 top-1/2 -translate-y-1/2',
    'right': 'right-4 top-1/2 -translate-y-1/2',
  };

  const cardPosition = ['top', 'top-left', 'top-right'].includes(position) ? 'below' : 'above';

  if (!player) {
    // Empty seat
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'absolute',
          positionClasses[position],
          'w-24 h-32',
          className
        )}
      >
        <div className={cn(
          'w-full h-full rounded-xl border-2 border-dashed border-gold/20',
          'flex flex-col items-center justify-center gap-2',
          'bg-card/30 backdrop-blur-sm',
          'hover:border-gold/40 hover:bg-card/50 cursor-pointer transition-all'
        )}>
          <User className="w-6 h-6 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground/50">Join</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'absolute',
        positionClasses[position],
        className
      )}
    >
      <div className={cn(
        'flex flex-col items-center gap-2',
        cardPosition === 'above' && 'flex-col-reverse'
      )}>
        {/* Player cards */}
        <div className="flex gap-1">
          {player.hand.map((card, i) => (
            <PlayingCard
              key={card.id}
              card={showCards || isCurrentUser ? card : undefined}
              faceDown={!showCards && !isCurrentUser}
              size="sm"
              delay={i * 0.1}
            />
          ))}
          {player.hand.length === 0 && !player.hasFolded && (
            <>
              <PlayingCard faceDown size="sm" delay={0} />
              <PlayingCard faceDown size="sm" delay={0.1} />
              <PlayingCard faceDown size="sm" delay={0.2} />
            </>
          )}
        </div>

        {/* Player info */}
        <motion.div 
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-xl',
            'bg-card/80 backdrop-blur-sm border',
            player.isCurrent ? 'border-gold ring-2 ring-gold/30' : 'border-border/50',
            player.hasFolded && 'opacity-50',
            isCurrentUser && 'ring-2 ring-accent/50'
          )}
          animate={player.isCurrent ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-gold/30">
              <AvatarImage src={player.avatar} />
              <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                {player.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {player.isDealer && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            {player.hasFolded && (
              <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center">
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-xs font-semibold text-foreground truncate max-w-20">
              {player.name}
            </p>
            <p className="text-[10px] text-gold font-bold">
              {formatChips(player.chips)}
            </p>
          </div>

          {/* Current bet */}
          {player.bet > 0 && (
            <div className="flex items-center gap-1">
              <ChipStack value={player.bet} size="sm" animate={false} />
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
