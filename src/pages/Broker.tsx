import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatChips } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';

interface AssignedPlayer {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  is_active: boolean;
  wallet_balance: number;
}

export default function Broker() {
  const navigate = useNavigate();
  const { user, profile, wallet } = useAuth();
  const [activeTab, setActiveTab] = useState('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedPlayers, setAssignedPlayers] = useState<AssignedPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignedPlayers();
    }
  }, [user]);

  const fetchAssignedPlayers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch broker_players assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('broker_players')
        .select('player_user_id')
        .eq('broker_user_id', user.id);

      if (assignmentError) throw assignmentError;

      if (assignments && assignments.length > 0) {
        const playerIds = assignments.map(a => a.player_user_id);
        
        // Fetch profiles for assigned players
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, display_name, username, is_active')
          .in('user_id', playerIds);

        if (profileError) throw profileError;

        // Fetch wallets for assigned players
        const { data: wallets, error: walletError } = await supabase
          .from('wallets')
          .select('user_id, available')
          .in('user_id', playerIds);

        if (walletError) throw walletError;

        const playersWithWallets = (profiles || []).map(p => ({
          ...p,
          wallet_balance: wallets?.find(w => w.user_id === p.user_id)?.available || 0
        }));

        setAssignedPlayers(playersWithWallets);
      } else {
        setAssignedPlayers([]);
      }
    } catch (error) {
      console.error('Error fetching assigned players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlayers = assignedPlayers.filter(player => 
    (player.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     player.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPlayerBalance = assignedPlayers.reduce((sum, p) => sum + p.wallet_balance, 0);
  const activePlayersCount = assignedPlayers.filter(p => p.is_active).length;

  const stats = [
    { 
      label: 'Assigned Players', 
      value: assignedPlayers.length.toString(), 
      icon: Users, 
      color: 'text-primary' 
    },
    { 
      label: 'Active Players', 
      value: activePlayersCount.toString(), 
      icon: TrendingUp, 
      color: 'text-accent' 
    },
    { 
      label: 'Total Balance', 
      value: formatChips(totalPlayerBalance), 
      icon: Wallet, 
      color: 'text-gold' 
    },
  ];

  const mockUser = {
    name: profile?.display_name || 'Broker',
    chips: wallet?.available || 0,
    role: 'broker' as const
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={mockUser} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
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
            <div>
              <h1 className="font-display text-3xl font-bold">Broker Dashboard</h1>
              <p className="text-muted-foreground">Manage your assigned players</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAssignedPlayers}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="p-6 rounded-2xl bg-card/50 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-3 rounded-xl bg-background", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                <TabsTrigger value="players">My Players</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg bg-card/50 border border-border/50 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <TabsContent value="players" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading players...
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'No players match your search' : 'No players assigned yet'}
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    className="p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card/70 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-lg font-bold">
                            {(player.display_name || player.username || 'P')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{player.display_name || player.username || 'Unknown'}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={player.is_active ? 'default' : 'secondary'} className="text-xs">
                              {player.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Balance</p>
                          <p className="font-bold text-gold">{formatChips(player.wallet_balance)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="activity">
              <div className="text-center py-12 text-muted-foreground">
                Activity log coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
