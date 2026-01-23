import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatChips } from '@/lib/gameLogic';
import { Eye, EyeOff, TrendingUp, X, Check } from 'lucide-react';

interface BettingControlsProps {
  minBet: number;
  maxBet: number;
  currentBet: number;
  playerChips: number;
  isPlayerTurn: boolean;
  onFold: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  onCheck: () => void;
  canCheck: boolean;
  className?: string;
}

export function BettingControls({
  minBet,
  maxBet,
  currentBet,
  playerChips,
  isPlayerTurn,
  onFold,
  onCall,
  onRaise,
  onCheck,
  canCheck,
  className
}: BettingControlsProps) {
  const [raiseAmount, setRaiseAmount] = useState(minBet * 2);
  const [isBlind, setIsBlind] = useState(false);

  const callAmount = currentBet;
  const canRaise = playerChips > callAmount;

  const presetRaises = [
    { label: '2x', value: minBet * 2 },
    { label: '3x', value: minBet * 3 },
    { label: '5x', value: minBet * 5 },
    { label: 'All In', value: playerChips },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 p-4',
        'bg-gradient-to-t from-background via-background/95 to-transparent',
        'border-t border-border/50',
        className
      )}
    >
      <div className="max-w-4xl mx-auto">
        {/* Blind toggle for Cold Soul mode */}
        <div className="flex justify-center mb-4">
          <Button
            variant="velvet"
            size="sm"
            onClick={() => setIsBlind(!isBlind)}
            className="gap-2"
          >
            {isBlind ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isBlind ? 'Playing Blind' : 'Seen Cards'}
          </Button>
        </div>

        {/* Raise slider */}
        {canRaise && isPlayerTurn && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Raise Amount</span>
              <span className="font-bold text-gold">{formatChips(raiseAmount)}</span>
            </div>
            <Slider
              value={[raiseAmount]}
              onValueChange={([value]) => setRaiseAmount(value)}
              min={Math.max(minBet, currentBet + minBet)}
              max={playerChips}
              step={minBet}
              className="w-full"
            />
            <div className="flex gap-2 justify-center">
              {presetRaises.map(preset => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setRaiseAmount(Math.min(preset.value, playerChips))}
                  disabled={preset.value > playerChips}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="destructive"
            size="lg"
            onClick={onFold}
            disabled={!isPlayerTurn}
            className="min-w-24 gap-2"
          >
            <X className="w-4 h-4" />
            Fold
          </Button>

          {canCheck ? (
            <Button
              variant="velvet"
              size="lg"
              onClick={onCheck}
              disabled={!isPlayerTurn}
              className="min-w-24 gap-2"
            >
              <Check className="w-4 h-4" />
              Check
            </Button>
          ) : (
            <Button
              variant="gold"
              size="lg"
              onClick={onCall}
              disabled={!isPlayerTurn || playerChips < callAmount}
              className="min-w-28 gap-2"
            >
              Call {formatChips(callAmount)}
            </Button>
          )}

          {canRaise && (
            <Button
              variant="hero"
              size="lg"
              onClick={() => onRaise(raiseAmount)}
              disabled={!isPlayerTurn}
              className="min-w-32 gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Raise {formatChips(raiseAmount)}
            </Button>
          )}
        </div>

        {/* Player chips display */}
        <div className="mt-4 text-center">
          <span className="text-sm text-muted-foreground">Your Stack: </span>
          <span className="text-lg font-bold text-gold">{formatChips(playerChips)}</span>
        </div>
      </div>
    </motion.div>
  );
}
