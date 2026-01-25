import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Check if user arrived via reset link
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (type === 'recovery' && accessToken) {
      // User arrived via password reset link - session is automatically set by Supabase
      console.log('Password reset session detected');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        toast({
          title: 'Reset failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setIsSuccess(true);
        toast({
          title: 'Password updated!',
          description: 'Your password has been successfully reset.',
        });
        
        // Redirect to lobby after a short delay
        setTimeout(() => {
          navigate('/lobby');
        }, 2000);
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <motion.div 
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Password Reset!</h2>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully updated. Redirecting to lobby...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
          <h2 className="font-display text-3xl font-bold mb-2">Set New Password</h2>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
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

          <Button 
            type="submit" 
            variant="hero" 
            className="w-full gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-pulse">Updating...</span>
            ) : (
              <>
                Update Password
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-gold">
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
