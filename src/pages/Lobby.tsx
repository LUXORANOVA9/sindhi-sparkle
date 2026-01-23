import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { TableCard } from '@/components/lobby/TableCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateMockTables, Table } from '@/lib/gameLogic';
import { 
  Search, 
  Filter, 
  Zap, 
  Snowflake, 
  Plus,
  RefreshCw,
  Users,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockUser = {
  name: 'Player One',
  chips: 25000,
  role: 'player' as const
};

type RoomFilter = 'all' | 'classic' | 'coldsoul';

export default function Lobby() {
  const navigate = useNavigate();
  const [tables] = useState<Table[]>(generateMockTables());
  const [filter, setFilter] = useState<RoomFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTables = tables.filter(table => {
    const matchesFilter = filter === 'all' || table.roomType === filter;
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleJoinTable = (tableId: string) => {
    navigate(`/game/${tableId}`);
  };

  const totalPlayers = tables.reduce((sum, t) => sum + t.currentPlayers, 0);
  const activeTables = tables.filter(t => t.status === 'playing').length;

  return (
    <div className="min-h-screen bg-background">
      <Header user={mockUser} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl font-bold mb-2">Game Lobby</h1>
          <p className="text-muted-foreground">Choose a table and start playing</p>
        </motion.div>

        {/* Stats bar */}
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

        {/* Filters and search */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              All
            </Button>
            <Button
              variant={filter === 'classic' ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setFilter('classic')}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Classic
            </Button>
            <Button
              variant={filter === 'coldsoul' ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setFilter('coldsoul')}
              className="gap-2"
            >
              <Snowflake className="w-4 h-4" />
              Cold Soul
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="gold" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Table
            </Button>
          </div>
        </motion.div>

        {/* Tables grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTables.map((table, index) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <TableCard 
                table={table} 
                onJoin={handleJoinTable}
              />
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {filteredTables.length === 0 && (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No tables found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or create a new table</p>
            <Button variant="gold" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Table
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
