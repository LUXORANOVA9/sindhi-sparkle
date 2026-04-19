import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { TableCard } from '@/components/lobby/TableCard';
import { CreatePrivateRoomDialog } from '@/components/lobby/CreatePrivateRoomDialog';
import { JoinPrivateRoomDialog } from '@/components/lobby/JoinPrivateRoomDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Table } from '@/lib/gameLogic';
import {
  Search,
  Filter,
  Zap,
  Snowflake,
  Plus,
  RefreshCw,
  Users,
  Coins,
  Lock,
  KeyRound,
  Loader2,
} from 'lucide-react';

type RoomFilter = 'all' | 'classic' | 'coldsoul';

interface RawTable {
  id: string;
  name: string;
  room_type: string;
  min_buy_in: number;
  max_buy_in: number;
  small_blind: number;
  big_blind: number;
  max_players: number;
  is_active: boolean;
  is_private: boolean;
  created_by: string | null;
}

export default function Lobby() {
  const navigate = useNavigate();
  const { user, profile, wallet } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [filter, setFilter] = useState<RoomFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTables = async () => {
    setLoading(true);
    // Fetch tables (RLS will filter): public active + own private
    const { data: tableRows } = await supabase
      .from('game_tables')
      .select('id, name, room_type, min_buy_in, max_buy_in, small_blind, big_blind, max_players, is_active, is_private, created_by')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const rows = (tableRows ?? []) as RawTable[];

    // Get player counts per table from active sessions
    const counts: Record<string, number> = {};
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select('id, game_table_id, status')
        .in('game_table_id', ids)
        .in('status', ['waiting', 'playing']);
      const sessionIds = (sessions ?? []).map((s: any) => s.id);
      if (sessionIds.length > 0) {
        const { data: ps } = await supabase
          .from('game_players')
          .select('game_session_id')
          .in('game_session_id', sessionIds);
        const sessionToTable: Record<string, string> = {};
        (sessions ?? []).forEach((s: any) => { sessionToTable[s.id] = s.game_table_id; });
        (ps ?? []).forEach((p: any) => {
          const tid = sessionToTable[p.game_session_id];
          if (tid) counts[tid] = (counts[tid] ?? 0) + 1;
        });
      }
    }

    const mapped: Table[] = rows
      .filter((r) => !r.is_private || r.created_by === user?.id)
      .map((r) => {
        const cur = counts[r.id] ?? 0;
        const status: Table['status'] = cur >= r.max_players ? 'full' : cur > 0 ? 'playing' : 'waiting';
        return {
          id: r.id,
          name: r.name,
          roomType: (r.room_type === 'coldsoul' ? 'coldsoul' : 'classic') as Table['roomType'],
          minBuyIn: Number(r.min_buy_in),
          maxBuyIn: Number(r.max_buy_in),
          blinds: { small: Number(r.small_blind), big: Number(r.big_blind) },
          maxPlayers: r.max_players,
          currentPlayers: cur,
          status,
        };
      });

    setTables(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchTables();
    const ch = supabase
      .channel('lobby-tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_tables' }, () => fetchTables())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, () => fetchTables())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players' }, () => fetchTables())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredTables = tables.filter((table) => {
    const matchesFilter = filter === 'all' || table.roomType === filter;
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleJoinTable = (tableId: string) => {
    navigate(`/game/${tableId}`);
  };

  const totalPlayers = tables.reduce((sum, t) => sum + t.currentPlayers, 0);
  const activeTables = tables.filter((t) => t.status === 'playing').length;

  const headerUser = {
    name: profile?.display_name ?? profile?.username ?? user?.email ?? 'Player',
    chips: Number(wallet?.available ?? 0),
    role: 'player' as const,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={headerUser} />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-2">Game Lobby</h1>
          <p className="text-muted-foreground">Choose a table and start playing</p>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalPlayers}</p>
              <p className="text-xs text-muted-foreground">Online Players</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeTables}</p>
              <p className="text-xs text-muted-foreground">Active Games</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-velvet/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tables.length}</p>
              <p className="text-xs text-muted-foreground">Total Tables</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search tables..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'gold' : 'outline'} size="sm" onClick={() => setFilter('all')} className="gap-2">
              <Filter className="w-4 h-4" /> All
            </Button>
            <Button variant={filter === 'classic' ? 'gold' : 'outline'} size="sm" onClick={() => setFilter('classic')} className="gap-2">
              <Zap className="w-4 h-4" /> Classic
            </Button>
            <Button variant={filter === 'coldsoul' ? 'gold' : 'outline'} size="sm" onClick={() => setFilter('coldsoul')} className="gap-2">
              <Snowflake className="w-4 h-4" /> Cold Soul
            </Button>
          </div>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="icon" onClick={fetchTables}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <JoinPrivateRoomDialog>
              <Button variant="outline" className="gap-2">
                <KeyRound className="w-4 h-4" /> Join Room
              </Button>
            </JoinPrivateRoomDialog>
            <CreatePrivateRoomDialog>
              <Button variant="velvet" className="gap-2">
                <Lock className="w-4 h-4" /> Private Room
              </Button>
            </CreatePrivateRoomDialog>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTables.map((table, index) => (
              <motion.div key={table.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }}>
                <TableCard table={table} onJoin={handleJoinTable} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredTables.length === 0 && (
          <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No tables found</h3>
            <p className="text-muted-foreground mb-6">Create a private room to play with friends.</p>
            <CreatePrivateRoomDialog>
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" /> Create Private Room
              </Button>
            </CreatePrivateRoomDialog>
          </motion.div>
        )}
      </main>
    </div>
  );
}
