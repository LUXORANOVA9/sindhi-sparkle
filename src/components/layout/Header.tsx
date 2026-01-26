import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatChips } from '@/lib/gameLogic';
import { 
  Wallet, 
  LogOut, 
  Settings, 
  User, 
  Crown, 
  Menu,
  Home,
  Grid3X3,
  History
} from 'lucide-react';

interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
    chips: number;
    role: 'player' | 'broker' | 'super_admin' | 'master_super_admin';
  };
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Header({ user, onLogin, onLogout }: HeaderProps) {
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/lobby', label: 'Tables', icon: Grid3X3 },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/history', label: 'History', icon: History },
  ];

  const isAdmin = user?.role === 'master_super_admin' || user?.role === 'super_admin';

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-background/80 backdrop-blur-xl',
        'border-b border-border/50'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.div 
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold via-gold-light to-gold flex items-center justify-center shadow-gold"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <span className="font-display font-bold text-lg text-primary-foreground">SP</span>
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold text-foreground">Sindhi Patta</h1>
              <p className="text-[10px] text-muted-foreground -mt-1">29 Cards</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link key={link.href} to={link.href}>
                  <Button 
                    variant={isActive ? 'secondary' : 'ghost'} 
                    size="sm"
                    className={cn(
                      'gap-2',
                      isActive && 'bg-gold/10 text-gold'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-2 text-gold">
                  <Crown className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Wallet balance */}
                <Link to="/wallet">
                  <motion.div 
                    className={cn(
                      'hidden sm:flex items-center gap-2 px-4 py-2 rounded-full',
                      'bg-gold/10 border border-gold/30',
                      'hover:bg-gold/20 transition-colors cursor-pointer'
                    )}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Wallet className="w-4 h-4 text-gold" />
                    <span className="font-bold text-gold">{formatChips(user.chips)}</span>
                  </motion.div>
                </Link>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="w-9 h-9 border-2 border-gold/30">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="gold" onClick={onLogin}>
                Sign In
              </Button>
            )}

            {/* Mobile menu */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
