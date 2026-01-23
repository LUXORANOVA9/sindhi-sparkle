import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GameState, formatChips } from '@/lib/gameLogic';
import { PlayerSeat } from './PlayerSeat';
import { ChipStack } from './ChipStack';
import { PlayingCard } from './PlayingCard';

interface GameTableProps {
  gameState: GameState;
  currentUserId?: string;
  className?: string;
}

const seatPositions = [
  'bottom',
  'left',
  'top-left', 
  'top',
  'top-right',
  'right',
] as const;

export function GameTable({ gameState, currentUserId, className }: GameTableProps) {
  // Arrange players so current user is at bottom
  const arrangedPlayers = [...gameState.players];
  const currentUserIndex = arrangedPlayers.findIndex(p => p.id === currentUserId);
  if (currentUserIndex > 0) {
    const before = arrangedPlayers.slice(0, currentUserIndex);
    const after = arrangedPlayers.slice(currentUserIndex);
    arrangedPlayers.splice(0, arrangedPlayers.length, ...after, ...before);
  }

  return (
    <div className={cn('relative w-full h-full min-h-[500px]', className)}>
      {/* Table background with velvet texture */}
      <motion.div 
        className={cn(
          'absolute inset-8 rounded-[100px] overflow-hidden',
          'velvet-texture animate-table-glow',
          'border-8 border-secondary/80',
          'shadow-table'
        )}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Table felt pattern */}
        <div className="absolute inset-0 table-spotlight" />
        
        {/* Inner border (rail) */}
        <div className="absolute inset-4 rounded-[80px] border-2 border-gold/20" />
        
        {/* Center area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          {/* Pot display */}
          {gameState.pot > 0 && (
            <motion.div 
              className="flex flex-col items-center gap-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              <ChipStack value={gameState.pot} size="lg" />
              <div className="px-4 py-1 rounded-full bg-card/80 backdrop-blur-sm border border-gold/30">
                <span className="text-sm font-bold text-gold">
                  Pot: {formatChips(gameState.pot)}
                </span>
              </div>
            </motion.div>
          )}

          {/* Community cards */}
          {gameState.communityCards.length > 0 && (
            <div className="flex gap-2 mt-4">
              {gameState.communityCards.map((card, i) => (
                <PlayingCard 
                  key={card.id} 
                  card={card} 
                  size="md" 
                  delay={i * 0.15}
                />
              ))}
            </div>
          )}

          {/* Game phase indicator */}
          <motion.div 
            className={cn(
              'absolute bottom-8 px-6 py-2 rounded-full',
              'bg-card/60 backdrop-blur-sm border border-border/50'
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {gameState.phase === 'waiting' && 'Waiting for players...'}
              {gameState.phase === 'dealing' && 'Dealing cards...'}
              {gameState.phase === 'betting' && `Round ${gameState.round} • Betting`}
              {gameState.phase === 'showdown' && 'Showdown!'}
              {gameState.phase === 'festival' && '🎉 Festival Mode'}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Player seats */}
      {arrangedPlayers.map((player, index) => (
        <PlayerSeat
          key={player.id}
          player={player}
          position={seatPositions[index % seatPositions.length]}
          isCurrentUser={player.id === currentUserId}
          showCards={gameState.phase === 'showdown'}
        />
      ))}

      {/* Empty seats for remaining positions */}
      {Array.from({ length: 6 - arrangedPlayers.length }).map((_, i) => (
        <PlayerSeat
          key={`empty-${i}`}
          position={seatPositions[(arrangedPlayers.length + i) % seatPositions.length]}
        />
      ))}
    </div>
  );
}
