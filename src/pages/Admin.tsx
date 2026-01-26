import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid';
import { AdminPlayersTab } from '@/components/admin/AdminPlayersTab';
import { AdminActivityTab } from '@/components/admin/AdminActivityTab';
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab';
import { 
  useAdminPlayersWithWallets, 
  useAdminAuditLogs, 
  useAdminGameTables,
  useAdminGameSessions,
  useAdminStats 
} from '@/hooks/useAdminData';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Search, Crown } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  
  const { data: playersWithWallets, isLoading: playersLoading } = useAdminPlayersWithWallets();
  const { data: auditLogs, isLoading: logsLoading } = useAdminAuditLogs();
  const { data: gameTables, isLoading: tablesLoading } = useAdminGameTables();
  const { data: gameSessions, isLoading: sessionsLoading } = useAdminGameSessions();
  const stats = useAdminStats();

  const isLoading = playersLoading || logsLoading || tablesLoading || sessionsLoading;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar userEmail={user?.email} />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <motion.header 
          className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-display text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.email?.split('@')[0] || 'Admin'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search players, tables..." 
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="gold">
                <Crown className="w-4 h-4 mr-2" />
                Create Admin
              </Button>
            </div>
          </div>
        </motion.header>

        <div className="p-8">
          {/* Stats grid */}
          {isLoading ? (
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <AdminStatsGrid 
              totalBalance={stats.totalBalance}
              activePlayers={stats.activePlayers}
              activeTables={stats.activeTables}
              fraudAlerts={stats.fraudAlerts}
            />
          )}

          {/* Content tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="players">Recent Players</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminOverviewTab 
                gameTables={gameTables || []}
                gameSessions={gameSessions || []}
                isLoading={tablesLoading || sessionsLoading}
              />
            </TabsContent>

            <TabsContent value="players">
              <AdminPlayersTab 
                players={playersWithWallets || []}
                isLoading={playersLoading}
              />
            </TabsContent>

            <TabsContent value="activity">
              <AdminActivityTab 
                logs={auditLogs || []}
                isLoading={logsLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
