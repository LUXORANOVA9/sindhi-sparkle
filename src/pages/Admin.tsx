import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatChips } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  BarChart3,
  Shield,
  Table2,
  Crown,
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Coins,
  UserCheck,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';

const stats = [
  { 
    title: 'Total Revenue', 
    value: '₹12,45,000', 
    change: '+12.5%', 
    trend: 'up',
    icon: Coins 
  },
  { 
    title: 'Active Players', 
    value: '1,248', 
    change: '+8.2%', 
    trend: 'up',
    icon: Users 
  },
  { 
    title: 'Active Tables', 
    value: '32', 
    change: '-2.1%', 
    trend: 'down',
    icon: Table2 
  },
  { 
    title: 'Fraud Alerts', 
    value: '3', 
    change: '+1', 
    trend: 'up',
    icon: AlertTriangle 
  },
];

const recentPlayers = [
  { name: 'Rajesh Kumar', email: 'rajesh@email.com', balance: 45000, status: 'active' },
  { name: 'Priya Sharma', email: 'priya@email.com', balance: 32000, status: 'active' },
  { name: 'Amit Patel', email: 'amit@email.com', balance: 18500, status: 'suspended' },
  { name: 'Sneha Gupta', email: 'sneha@email.com', balance: 67000, status: 'active' },
  { name: 'Vikram Singh', email: 'vikram@email.com', balance: 125000, status: 'vip' },
];

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Users, label: 'Players' },
  { icon: Table2, label: 'Tables' },
  { icon: Wallet, label: 'Transactions' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Shield, label: 'Anti-Fraud' },
  { icon: Settings, label: 'Settings' },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside 
        className="w-64 bg-card border-r border-border/50 flex flex-col"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border/50">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold via-gold-light to-gold flex items-center justify-center shadow-gold">
              <span className="font-display font-bold text-primary-foreground">SP</span>
            </div>
            <div>
              <h1 className="font-display font-bold">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Sindhi Patta</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  item.active 
                    ? 'bg-gold/10 text-gold border border-gold/30' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <Avatar className="w-10 h-10 border-2 border-gold/30">
              <AvatarFallback className="bg-gold/20 text-gold font-bold">SA</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Super Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@sindhipatta.com</p>
            </div>
          </div>
        </div>
      </motion.aside>

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
                <p className="text-sm text-muted-foreground">Welcome back, Super Admin</p>
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
          <div className="grid grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          stat.trend === 'up' ? 'bg-accent/20' : 'bg-destructive/20'
                        )}>
                          <Icon className={cn(
                            'w-5 h-5',
                            stat.trend === 'up' ? 'text-accent' : 'text-destructive'
                          )} />
                        </div>
                        <div className={cn(
                          'flex items-center gap-1 text-sm font-medium',
                          stat.trend === 'up' ? 'text-accent' : 'text-destructive'
                        )}>
                          {stat.trend === 'up' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {stat.change}
                        </div>
                      </div>
                      <p className="text-2xl font-bold mb-1">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Content tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="players">Recent Players</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue chart placeholder */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-gold" />
                      Revenue Overview
                    </CardTitle>
                    <CardDescription>Daily revenue for the past week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between gap-2">
                      {[65, 40, 80, 55, 90, 75, 85].map((height, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 bg-gold/20 rounded-t-lg relative group"
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                        >
                          <div className="absolute inset-x-0 bottom-0 bg-gold rounded-t-lg" 
                               style={{ height: `${height * 0.6}%` }} 
                          />
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Active tables */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-accent" />
                      Live Tables
                    </CardTitle>
                    <CardDescription>Currently active game tables</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'High Rollers', players: 5, pot: 125000 },
                      { name: 'Beginner\'s Fortune', players: 3, pot: 8500 },
                      { name: 'Cold Soul Arena', players: 4, pot: 45000 },
                    ].map((table, i) => (
                      <motion.div
                        key={table.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          <div>
                            <p className="font-medium">{table.name}</p>
                            <p className="text-xs text-muted-foreground">{table.players} players</p>
                          </div>
                        </div>
                        <p className="font-bold text-gold">{formatChips(table.pot)}</p>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="players">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Recent Players</CardTitle>
                  <CardDescription>Players who joined recently</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPlayers.map((player, i) => (
                      <motion.div
                        key={player.email}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-secondary">
                              {player.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">{player.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold text-gold">{formatChips(player.balance)}</p>
                            <p className="text-xs text-muted-foreground">Balance</p>
                          </div>
                          <div className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            player.status === 'active' && 'bg-accent/20 text-accent',
                            player.status === 'suspended' && 'bg-destructive/20 text-destructive',
                            player.status === 'vip' && 'bg-gold/20 text-gold'
                          )}>
                            {player.status.toUpperCase()}
                          </div>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>Recent system activity and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'New player registered', user: 'Sneha Gupta', time: '2 min ago', type: 'info' },
                      { action: 'Withdrawal approved', user: 'Rajesh Kumar', time: '15 min ago', type: 'success' },
                      { action: 'Fraud alert triggered', user: 'Unknown', time: '32 min ago', type: 'warning' },
                      { action: 'Table created', user: 'Panel Admin', time: '1 hour ago', type: 'info' },
                      { action: 'Large deposit received', user: 'Vikram Singh', time: '2 hours ago', type: 'success' },
                    ].map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-3 rounded-lg"
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          log.type === 'info' && 'bg-blue-400',
                          log.type === 'success' && 'bg-accent',
                          log.type === 'warning' && 'bg-gold'
                        )} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.user}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.time}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
