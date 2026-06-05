import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle, AlertTriangle, Zap, TrendingUp,
  Upload, MessageSquare, ArrowRight, Languages
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { useSelector } from 'react-redux';
import DocumentCard, { DocumentCardSkeleton } from '../components/features/DocumentCard';
import { Skeleton } from '../components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis } from 'recharts';

const COLORS = ['#38BDF8', '#22D3EE', '#0EA5E9', '#7DD3FC', '#BAE6FD', '#475569'];

function AnimatedStat({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-[${color}1A]`}
             style={{ background: `${color}1A` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <motion.p
        className="text-2xl font-bold text-text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        {value ?? '—'}
      </motion.p>
      <p className="text-text-tertiary text-xs mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const user = useSelector((state) => state.auth.user);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => documentAPI.analytics(),
    staleTime: 60000,
  });

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', { limit: 6 }],
    queryFn: () => documentAPI.getAll({ limit: 6, sort: '-createdAt' }),
    staleTime: 30000,
  });

  const analytics = analyticsData?.data;
  const docs = docsData?.data;

  const typeChartData = analytics?.documentTypes?.map((t) => ({
    name: t._id?.replace(/_/g, ' ') || 'other',
    value: t.count,
  })) || [];

  const activityData = analytics?.recentActivity?.slice(-14).map((d, i) => ({
    day: i,
    docs: 1,
  })).reduce((acc, curr) => {
    const last = acc[acc.length - 1];
    if (last) last.docs += 1;
    else acc.push(curr);
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-text-tertiary text-sm mt-0.5">
            Your document intelligence hub
          </p>
        </div>
        <Link to="/upload" className="btn-primary flex items-center gap-2 text-sm">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Document</span>
        </Link>
      </motion.div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStat label="Total Documents" value={analytics?.overview?.total ?? '—'} icon={FileText} color="#38BDF8" delay={0} />
        <AnimatedStat label="Processed" value={analytics?.overview?.completed ?? '—'} icon={CheckCircle} color="#22D3EE" delay={0.05} />
        <AnimatedStat label="Avg Confidence" value={analytics?.overview?.avgConfidence ? `${analytics.overview.avgConfidence}%` : '—'} icon={Zap} color="#0EA5E9" delay={0.1} />
        <AnimatedStat label="Needs Review" value={analytics?.overview?.needsReview ?? '—'} icon={AlertTriangle} color="#F59E0B" delay={0.15} />
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5 lg:col-span-2"
        >
          <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky" /> Processing Activity
          </h3>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={analytics?.recentActivity?.slice(-14) || []}>
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis hide />
              <Tooltip
                contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 8, fontSize: 12 }}
                labelFormatter={() => ''}
                formatter={(v) => [v, 'docs']}
              />
              <Area type="monotone" dataKey="confidenceScore" stroke="#38BDF8" strokeWidth={2} fill="url(#skyGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5"
        >
          <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
            <Languages className="w-4 h-4 text-sky" /> Document Types
          </h3>
          {typeChartData.length > 0 ? (
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={typeChartData} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                    {typeChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 flex-1 min-w-0">
                {typeChartData.slice(0, 4).map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                    <span className="text-text-secondary capitalize truncate">{t.name}</span>
                    <span className="ml-auto text-text-tertiary">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-text-tertiary text-sm">No data yet</div>
          )}
        </motion.div>
      </div>

      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {[
          { icon: Upload, label: 'Upload Document', desc: 'Add new files for processing', path: '/upload', color: '#38BDF8' },
          { icon: MessageSquare, label: 'Ask AI', desc: 'Chat about your documents', path: '/chat', color: '#22D3EE' },
          { icon: FileText, label: 'Browse Library', desc: 'Search all documents', path: '/documents', color: '#0EA5E9' },
        ].map(({ icon: Icon, label, desc, path, color }) => (
          <Link key={path} to={path}>
            <motion.div
              whileHover={{ y: -2, borderColor: color }}
              className="card p-4 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: `${color}1A` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-sm font-medium text-text-primary group-hover:text-sky transition-colors">{label}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{desc}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Recent Documents</h2>
          <Link to="/documents" className="text-sky text-sm flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {docsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-3">
                <Skeleton className="w-full h-32 rounded-lg" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : docs?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {docs.map((doc, i) => (
              <DocumentCard key={doc._id} doc={doc} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 flex flex-col items-center gap-3 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center">
              <FileText className="w-7 h-7 text-text-tertiary" />
            </div>
            <p className="text-text-secondary font-medium">No documents yet</p>
            <p className="text-text-tertiary text-sm">Upload your first Indian document to get started</p>
            <Link to="/upload" className="btn-primary text-sm mt-2">Upload now</Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
