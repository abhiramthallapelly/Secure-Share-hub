import { useStats } from "@/hooks/use-stats";
import { Sidebar } from "@/components/Sidebar";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FileText, Download, Share2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Sample chart data - normally this would come from an API
const chartData = [
  { name: 'Mon', downloads: 4 },
  { name: 'Tue', downloads: 8 },
  { name: 'Wed', downloads: 15 },
  { name: 'Thu', downloads: 9 },
  { name: 'Fri', downloads: 22 },
  { name: 'Sat', downloads: 12 },
  { name: 'Sun', downloads: 7 },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();
  const { user } = useAuth();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-5xl mx-auto space-y-8"
        >
          <motion.div variants={item}>
            <h1 className="font-display text-3xl font-bold">Welcome back, {user?.firstName || 'User'}</h1>
            <p className="text-muted-foreground mt-2">Here's what's happening with your shared files.</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon={FileText} 
              label="Total Files" 
              value={stats?.totalFiles ?? 0} 
              loading={isLoading} 
            />
            <StatCard 
              icon={Download} 
              label="Total Downloads" 
              value={stats?.totalDownloads ?? 0} 
              loading={isLoading} 
            />
            <StatCard 
              icon={Share2} 
              label="Active Links" 
              value={stats?.activeLinks ?? 0} 
              loading={isLoading} 
            />
          </motion.div>

          {/* Analytics Chart */}
          <motion.div variants={item} className="glass-card p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-xl font-bold">Download Activity</h2>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1d2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar 
                    dataKey="downloads" 
                    fill="hsl(var(--primary))" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading }: { icon: any, label: string, value: number, loading: boolean }) {
  return (
    <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-white/5 animate-pulse rounded mt-1" />
        ) : (
          <p className="text-3xl font-display font-bold text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
