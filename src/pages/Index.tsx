import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { PlayingCard } from '@/components/game/PlayingCard';
import { ChipStack, SingleChip } from '@/components/game/ChipStack';
import { 
  Zap, 
  Shield, 
  Users, 
  Trophy,
  ArrowRight,
  Sparkles,
  Crown
} from 'lucide-react';

const mockUser = {
  name: 'Player One',
  chips: 25000,
  role: 'player' as const
};

const features = [
  {
    icon: Zap,
    title: 'Real-Time Gameplay',
    description: 'Experience lightning-fast multiplayer action with WebSocket technology'
  },
  {
    icon: Shield,
    title: 'Secure & Fair',
    description: 'Cryptographic RNG and server-side shuffling ensure fair play'
  },
  {
    icon: Users,
    title: 'Multi-Table Support',
    description: 'Join Classic Chaal or Cold Soul rooms with configurable limits'
  },
  {
    icon: Trophy,
    title: 'Festival Mode',
    description: 'Special 4-phase gameplay with unique rules and bigger pots'
  }
];

const mockCards = [
  { suit: 'hearts' as const, rank: '9' as const, id: '9_hearts' },
  { suit: 'spades' as const, rank: '8' as const, id: '8_spades' },
  { suit: 'diamonds' as const, rank: '7' as const, id: '7_diamonds' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header user={mockUser} />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-velvet/20 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-gold">Premium Gaming Experience</span>
              </motion.div>

              <h1 className="font-display text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-foreground">Master the Art of</span>
                <br />
                <span className="gold-shimmer bg-clip-text text-transparent">Sindhi Patta</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-lg">
                The legendary 29-card game. Play Classic Chaal or Cold Soul rooms with 
                real players worldwide. Where skill meets fortune.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/lobby">
                  <Button variant="hero" size="xl" className="gap-3">
                    Play Now
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="xl">
                  Learn Rules
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12">
                <div>
                  <p className="font-display text-3xl font-bold text-gold">10K+</p>
                  <p className="text-sm text-muted-foreground">Active Players</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-gold">₹50L+</p>
                  <p className="text-sm text-muted-foreground">Daily Pots</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-gold">99.9%</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
              </div>
            </motion.div>

            {/* Right - Animated cards and chips */}
            <motion.div 
              className="relative h-[500px] hidden lg:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Floating cards */}
              <motion.div 
                className="absolute top-20 left-20"
                animate={{ y: [0, -10, 0], rotate: [-5, -8, -5] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <PlayingCard card={mockCards[0]} size="lg" highlighted />
              </motion.div>
              
              <motion.div 
                className="absolute top-32 left-44"
                animate={{ y: [0, -15, 0], rotate: [3, 6, 3] }}
                transition={{ repeat: Infinity, duration: 4.5, delay: 0.5 }}
              >
                <PlayingCard card={mockCards[1]} size="lg" />
              </motion.div>
              
              <motion.div 
                className="absolute top-44 left-28"
                animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 3.5, delay: 1 }}
              >
                <PlayingCard card={mockCards[2]} size="lg" />
              </motion.div>

              {/* Floating chips */}
              <motion.div 
                className="absolute bottom-32 right-20"
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <ChipStack value={5000} size="lg" />
              </motion.div>

              <motion.div 
                className="absolute bottom-48 right-40"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: 0.3 }}
              >
                <SingleChip color="gold" label="1K" size="lg" />
              </motion.div>

              <motion.div 
                className="absolute bottom-20 right-32"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3.2, delay: 0.6 }}
              >
                <SingleChip color="red" label="500" size="md" />
              </motion.div>

              {/* Decorative glow */}
              <div className="absolute inset-0 bg-gradient-radial from-gold/20 via-transparent to-transparent opacity-50" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Why Choose <span className="text-gold">Sindhi Patta</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge technology for the most authentic card gaming experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-gold/30 transition-all hover:shadow-gold/10 hover:shadow-xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 velvet-texture opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/20 mb-6">
              <Crown className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">
              Ready to Test Your Fortune?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of players competing in real-time matches. 
              Your table awaits.
            </p>
            <Link to="/lobby">
              <Button variant="hero" size="xl" className="gap-3">
                Enter the Lobby
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
                <span className="font-display font-bold text-sm text-primary-foreground">SP</span>
              </div>
              <span className="text-sm text-muted-foreground">
                © 2024 Sindhi Patta. All rights reserved.
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
