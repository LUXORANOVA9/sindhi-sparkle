import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Copy, Lock, Check } from 'lucide-react';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface CreatePrivateRoomDialogProps {
  children: React.ReactNode;
}

export function CreatePrivateRoomDialog({ children }: CreatePrivateRoomDialogProps) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('6');
  const [smallBlind, setSmallBlind] = useState('10');
  const [bigBlind, setBigBlind] = useState('20');
  const [minBuyIn, setMinBuyIn] = useState('1000');
  const [maxBuyIn, setMaxBuyIn] = useState('10000');

  const handleCreate = async () => {
    if (!user || !roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    setIsCreating(true);
    const code = generateRoomCode();

    try {
      const tenantId = profile?.tenant_id;
      if (!tenantId) {
        toast.error('No tenant assigned. Please contact support.');
        setIsCreating(false);
        return;
      }

      const { error } = await supabase.from('game_tables').insert({
        name: roomName.trim(),
        room_code: code,
        is_private: true,
        created_by: user.id,
        tenant_id: tenantId,
        max_players: parseInt(maxPlayers),
        small_blind: parseInt(smallBlind),
        big_blind: parseInt(bigBlind),
        min_buy_in: parseInt(minBuyIn),
        max_buy_in: parseInt(maxBuyIn),
        room_type: 'classic',
      });

      if (error) throw error;

      setRoomCode(code);
      toast.success('Private room created!');
    } catch (err: any) {
      console.error('Error creating room:', err);
      toast.error(err.message || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success('Room code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setRoomCode(null);
      setRoomName('');
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gold" />
            {roomCode ? 'Room Created!' : 'Create Private Room'}
          </DialogTitle>
          <DialogDescription>
            {roomCode
              ? 'Share this code with your friends to join.'
              : 'Set up a private room for you and your friends.'}
          </DialogDescription>
        </DialogHeader>

        {roomCode ? (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Room Code</p>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border-2 border-gold/40"
              >
                <span className="font-display text-3xl font-bold tracking-[0.3em] text-gold">
                  {roomCode}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
                </Button>
              </motion.div>
            </div>
            <Button variant="gold" className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                placeholder="My Private Table"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Players</Label>
                <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} Players</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Small Blind</Label>
                <Select value={smallBlind} onValueChange={setSmallBlind}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 25, 50, 100].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Buy-in</Label>
                <Input
                  type="number"
                  value={minBuyIn}
                  onChange={(e) => setMinBuyIn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Buy-in</Label>
                <Input
                  type="number"
                  value={maxBuyIn}
                  onChange={(e) => setMaxBuyIn(e.target.value)}
                />
              </div>
            </div>

            <Button
              variant="gold"
              className="w-full"
              onClick={handleCreate}
              disabled={isCreating || !roomName.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
