import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlayingCard } from '@/components/game/PlayingCard';
import { ChipStack } from '@/components/game/ChipStack';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate auth delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: mode === 'login' ? 'Welcome back!' : 'Account created!',
      description: 'Redirecting to lobby...',
    });

    setTimeout(() => {
      navigate('/lobby');
    }, 1000);
    
    setIsLoading(false);
  };

  const mockCards = [
    { suit: 'hearts' as const, rank: '9' as const, id: '9_hearts' },
    { suit: 'spades' as const, rank: '8' as const, id: '8_spades' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold via-gold-light to-gold flex items-center justify-center shadow-gold">
              <span className="font-display font-bold text-xl text-primary-foreground">SP</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Sindhi Patta</h1>
              <p className="text-xs text-muted-foreground">29 Cards</p>
            </div>
          </Link>

          {/* Title */}
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'login' 
                ? 'Sign in to continue to your tables' 
                : 'Join thousands of players worldwide'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-gold hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button 
              type="submit" 
              variant="hero" 
              className="w-full gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-gold hover:underline font-medium"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-velvet via-card to-background">
        {/* Background pattern */}
        <div className="absolute inset-0 table-spotlight opacity-50" />
        
        {/* Floating elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Cards */}
            <motion.div 
              className="absolute -top-20 -left-10"
              animate={{ y: [0, -10, 0], rotate: [-10, -15, -10] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <PlayingCard card={mockCards[0]} size="lg" highlighted />
            </motion.div>
            
            <motion.div 
              className="absolute -top-10 left-16"
              animate={{ y: [0, -15, 0], rotate: [10, 15, 10] }}
              transition={{ repeat: Infinity, duration: 4.5, delay: 0.5 }}
            >
              <PlayingCard card={mockCards[1]} size="lg" />
            </motion.div>

            {/* Chips */}
            <motion.div 
              className="absolute top-32 -left-20"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <ChipStack value={5000} size="lg" />
            </motion.div>

            {/* Center text */}
            <div className="text-center mt-48">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gold/20 mb-6">
                <Crown className="w-10 h-10 text-gold" />
              </div>
              <h3 className="font-display text-3xl font-bold mb-4 text-foreground">
                Play Like a Pro
              </h3>
              <p className="text-muted-foreground max-w-xs">
                Join the most trusted platform for Sindhi Patta. Fair play guaranteed.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
