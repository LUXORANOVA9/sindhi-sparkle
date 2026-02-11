import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

interface JoinPrivateRoomDialogProps {
  children: React.ReactNode;
}

export function JoinPrivateRoomDialog({ children }: JoinPrivateRoomDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-character code');
      return;
    }

    setIsJoining(true);
    try {
      const { data, error } = await supabase
        .from('game_tables')
        .select('id, name, is_active')
        .eq('room_code', code.toUpperCase())
        .eq('is_private', true)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Room not found or no longer active');
        setIsJoining(false);
        return;
      }

      toast.success(`Joining ${data.name}...`);
      setOpen(false);
      navigate(`/game/${data.id}`);
    } catch (err: any) {
      console.error('Error joining room:', err);
      toast.error(err.message || 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-gold" />
            Join Private Room
          </DialogTitle>
          <DialogDescription>
            Enter the 6-character room code shared by your friend.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            variant="gold"
            className="w-full"
            onClick={handleJoin}
            disabled={isJoining || code.length !== 6}
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
