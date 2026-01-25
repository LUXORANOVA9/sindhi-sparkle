import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  ArrowLeft,
  Crown,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/lobby';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Handle forgot password
    if (mode === 'forgot') {
      try {
        const redirectUrl = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: redirectUrl,
        });
        
        if (error) {
          toast({
            title: 'Reset failed',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          setResetEmailSent(true);
          toast({
            title: 'Check your email',
            description: 'We sent you a password reset link.',
          });
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred.',
          variant: 'destructive'
        });
      }
      setIsLoading(false);
      return;
    }

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          toast({
            title: 'Sign up failed',
            description: error.message || 'Could not create account.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to Sindhi Patta!',
          });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: error.message || 'Invalid email or password.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'Redirecting to lobby...',
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    }
    
    setIsLoading(false);
  };

  const mockCards = [
    { suit: 'hearts' as const, rank: '9' as const, id: '9_hearts' },
    { suit: 'spades' as const, rank: '8' as const, id: '8_spades' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'login' 
                ? 'Sign in to continue to your tables' 
                : mode === 'signup'
                ? 'Join thousands of players worldwide'
                : 'Enter your email to receive a reset link'}
            </p>
          </div>

          {/* Form */}
          {mode === 'forgot' && resetEmailSent ? (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Check Your Email</h3>
              <p className="text-muted-foreground mb-6">
                We sent a password reset link to<br />
                <span className="text-foreground font-medium">{formData.email}</span>
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setMode('login');
                  setResetEmailSent(false);
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10"
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

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-gold hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
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
                      minLength={6}
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
              )}

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
                      minLength={6}
                    />
                  </div>
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
                    {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Toggle mode */}
          {!resetEmailSent && (
            <div className="mt-6 text-center">
              {mode === 'forgot' ? (
                <button
                  onClick={() => setMode('login')}
                  className="text-sm text-gold hover:underline font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Sign In
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="ml-2 text-gold hover:underline font-medium"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-velvet via-card to-background">
        <div className="absolute inset-0 table-spotlight opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
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
            <motion.div 
              className="absolute top-32 -left-20"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <ChipStack value={5000} size="lg" />
            </motion.div>
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
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
