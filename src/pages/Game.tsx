import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GameTable } from '@/components/game/GameTable';
import { BettingControls } from '@/components/game/BettingControls';
import { Button } from '@/components/ui/button';
import { 
  GameState, 
  createDeck, 
  shuffleDeck, 
  dealCards,
  generateMockPlayer,
  formatChips
} from '@/lib/gameLogic';
import { 
  ArrowLeft, 
  MessageSquare, 
  Settings, 
  Volume2, 
  VolumeX,
  Users,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Game() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState(30);

  // Mock game state
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = shuffleDeck(createDeck());
    const hands = dealCards(deck, 4, 3);
    
    const players = [
      { ...generateMockPlayer('user-1', 'You', 25000), hand: hands[0], isCurrent: true },
      { ...generateMockPlayer('bot-1', 'Rajesh K.', 18500), hand: hands[1], isDealer: true },
      { ...generateMockPlayer('bot-2', 'Priya M.', 32000), hand: hands[2] },
      { ...generateMockPlayer('bot-3', 'Amit S.', 15000), hand: hands[3], bet: 100 },
    ];

    return {
      id: tableId || 'game-1',
      phase: 'betting',
      players,
      pot: 300,
      communityCards: [],
      currentPlayerIndex: 0,
      dealerIndex: 1,
      minBet: 50,
      maxBet: 5000,
      round: 1
    };
  });

  // Timer countdown
  useEffect(() => {
    if (gameState.phase === 'betting' && gameState.players[gameState.currentPlayerIndex].id === 'user-1') {
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            // Auto fold on timeout
            handleFold();
            return 30;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState.phase, gameState.currentPlayerIndex]);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const userPlayer = gameState.players.find(p => p.id === 'user-1');
  const isUserTurn = currentPlayer.id === 'user-1';

  const handleFold = () => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === 'user-1' ? { ...p, hasFolded: true, isCurrent: false } : p
      ),
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
    }));
    setTimer(30);
  };

  const handleCall = () => {
    const callAmount = 100; // Current bet to match
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === 'user-1' 
          ? { ...p, chips: p.chips - callAmount, bet: p.bet + callAmount, isCurrent: false } 
          : p
      ),
      pot: prev.pot + callAmount,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
    }));
    setTimer(30);
  };

  const handleRaise = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === 'user-1' 
          ? { ...p, chips: p.chips - amount, bet: p.bet + amount, isCurrent: false } 
          : p
      ),
      pot: prev.pot + amount,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
    }));
    setTimer(30);
  };

  const handleCheck = () => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === 'user-1' ? { ...p, isCurrent: false } : p
      ),
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
    }));
    setTimer(30);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-velvet/10 via-background to-background" />

      {/* Top bar */}
      <motion.div 
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/lobby')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="glass px-4 py-2 rounded-full flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{gameState.players.length}/6</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pot:</span>
              <span className="text-sm font-bold text-gold">{formatChips(gameState.pot)}</span>
            </div>
          </div>
        </div>

        {/* Timer (when it's user's turn) */}
        {isUserTurn && (
          <motion.div 
            className={cn(
              'absolute left-1/2 -translate-x-1/2',
              'px-6 py-2 rounded-full',
              'flex items-center gap-2',
              timer <= 10 ? 'bg-destructive/20 border-destructive' : 'bg-card/80',
              'border'
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Clock className={cn(
              'w-4 h-4',
              timer <= 10 ? 'text-destructive' : 'text-muted-foreground'
            )} />
            <span className={cn(
              'font-bold tabular-nums',
              timer <= 10 ? 'text-destructive' : 'text-foreground'
            )}>
              {timer}s
            </span>
          </motion.div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Game table */}
      <div className="h-screen pt-16 pb-48">
        <GameTable 
          gameState={gameState} 
          currentUserId="user-1"
        />
      </div>

      {/* Betting controls */}
      {userPlayer && !userPlayer.hasFolded && (
        <BettingControls
          minBet={gameState.minBet}
          maxBet={gameState.maxBet}
          currentBet={100}
          playerChips={userPlayer.chips}
          isPlayerTurn={isUserTurn}
          onFold={handleFold}
          onCall={handleCall}
          onRaise={handleRaise}
          onCheck={handleCheck}
          canCheck={false}
        />
      )}
    </div>
  );
}
