import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GameTable } from '@/components/game/GameTable';
import { BettingControls } from '@/components/game/BettingControls';
import { Button } from '@/components/ui/button';
import { useGameSession } from '@/hooks/useGameSession';
import { useAuth } from '@/contexts/AuthContext';
import { formatChips } from '@/lib/gameLogic';
import {
  ArrowLeft,
  MessageSquare,
  Settings,
  Volume2,
  VolumeX,
  Users,
  Clock,
  Loader2,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

export default function Game() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState(30);
  const isMobile = useIsMobile();

  const { loading, error, gameState, myPlayer, isMyTurn, fold, call, raise, check } =
    useGameSession(tableId);

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobile]);

  // Redirect to auth if not signed in
  useEffect(() => {
    if (!user && !loading) navigate('/auth');
  }, [user, loading, navigate]);

  // Show last-round winner toast
  useEffect(() => {
    const winnerId = (gameState as any)?.lastWinnerUserId;
    if (winnerId) {
      toast.success(winnerId === user?.id ? 'You won the pot!' : 'Round ended');
    }
  }, [gameState?.phase]);

  // Turn countdown (resets when turn changes)
  useEffect(() => {
    if (!isMyTurn || gameState?.phase !== 'betting') {
      setTimer(30);
      return;
    }
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          fold().catch(() => {});
          return 30;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isMyTurn, gameState?.phase, gameState?.currentPlayerIndex]);

  const handleAction = async (fn: () => Promise<void>, label: string) => {
    try { await fn(); } catch (e: any) { toast.error(e?.message ?? `Failed to ${label}`); }
  };

  if (loading || !gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <p className="text-muted-foreground">Joining table…</p>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button variant="ghost" onClick={() => navigate('/lobby')}>Back to Lobby</Button>
      </div>
    );
  }

  const currentBet = gameState.players.reduce((m, p) => Math.max(m, p.bet), 0);
  const callAmount = myPlayer ? Math.max(0, currentBet - myPlayer.bet) : 0;
  const isWaiting = gameState.phase === 'waiting' || gameState.players.length < 2;

  return (
    <div className={cn('bg-background relative', isMobile ? 'game-container' : 'min-h-screen overflow-hidden')}>
      <div className="absolute inset-0 bg-gradient-to-b from-velvet/10 via-background to-background" />

      {/* Top bar */}
      <motion.div
        className={cn(
          'absolute top-0 left-0 right-0 z-50 flex items-center justify-between safe-area-top',
          isMobile ? 'p-2' : 'p-4',
        )}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lobby')} className="rounded-full">
            <ArrowLeft className={cn(isMobile ? 'w-4 h-4' : 'w-5 h-5')} />
          </Button>

          <div className={cn('glass rounded-full flex items-center', isMobile ? 'px-2 py-1 gap-2' : 'px-4 py-2 gap-3')}>
            <div className="flex items-center gap-1 sm:gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">{gameState.players.length}/6</span>
            </div>
            <div className="w-px h-3 sm:h-4 bg-border" />
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Pot:</span>
              <span className="text-xs sm:text-sm font-bold text-gold">{formatChips(gameState.pot)}</span>
            </div>
          </div>
        </div>

        {isMyTurn && gameState.phase === 'betting' && (
          <motion.div
            className={cn(
              isMobile
                ? 'px-3 py-1 rounded-full flex items-center gap-1'
                : 'absolute left-1/2 -translate-x-1/2 px-6 py-2 rounded-full flex items-center gap-2',
              timer <= 10 ? 'bg-destructive/20 border-destructive' : 'bg-card/80',
              'border',
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Clock className={cn(isMobile ? 'w-3 h-3' : 'w-4 h-4', timer <= 10 ? 'text-destructive' : 'text-muted-foreground')} />
            <span className={cn('font-bold tabular-nums', isMobile ? 'text-xs' : 'text-base', timer <= 10 ? 'text-destructive' : 'text-foreground')}>
              {timer}s
            </span>
          </motion.div>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className={cn('rounded-full', isMobile && 'w-8 h-8')}>
            <MessageSquare className={cn(isMobile ? 'w-4 h-4' : 'w-5 h-5')} />
          </Button>
          <Button variant="ghost" size="icon" className={cn('rounded-full', isMobile && 'w-8 h-8')} onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className={cn(isMobile ? 'w-4 h-4' : 'w-5 h-5')} /> : <Volume2 className={cn(isMobile ? 'w-4 h-4' : 'w-5 h-5')} />}
          </Button>
          <Button variant="ghost" size="icon" className={cn('rounded-full', isMobile && 'w-8 h-8')}>
            <Settings className={cn(isMobile ? 'w-4 h-4' : 'w-5 h-5')} />
          </Button>
        </div>
      </motion.div>

      {/* Table */}
      <div className={cn('pt-12 sm:pt-16', isMobile ? 'h-[calc(100dvh-180px)]' : 'h-screen pb-48')}>
        <GameTable gameState={gameState} currentUserId={user?.id ?? ''} />
      </div>

      {/* Waiting overlay */}
      <AnimatePresence>
        {isWaiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm"
          >
            <div className="text-center px-6">
              <Loader2 className="w-10 h-10 animate-spin text-gold mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">Waiting for players…</h2>
              <p className="text-muted-foreground text-sm">
                {gameState.players.length}/2 minimum players. Game starts automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Showdown overlay */}
      <AnimatePresence>
        {gameState.phase === 'showdown' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none"
          >
            <div className="text-center">
              <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
              <h2 className="font-display text-3xl font-bold">Round Over</h2>
              <p className="text-muted-foreground mt-2">Next hand starting…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      {myPlayer && !myPlayer.hasFolded && gameState.phase === 'betting' && (
        <BettingControls
          minBet={gameState.minBet}
          maxBet={Math.min(gameState.maxBet, myPlayer.chips)}
          currentBet={currentBet}
          playerChips={myPlayer.chips}
          isPlayerTurn={isMyTurn}
          onFold={() => handleAction(fold, 'fold')}
          onCall={() => handleAction(call, 'call')}
          onRaise={(amt) => handleAction(() => raise(amt), 'raise')}
          onCheck={() => handleAction(check, 'check')}
          canCheck={callAmount === 0}
        />
      )}
    </div>
  );
}
