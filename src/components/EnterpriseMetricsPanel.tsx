import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Zap, 
  TrendingUp, 
  Database, 
  Clock, 
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  color: string;
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend = 'stable', 
  change = 0,
  color,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${color}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        {icon}
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {change !== 0 && (
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{Math.abs(change)}%
          </span>
        )}
      </div>
    </motion.div>
  );
};

interface EnterpriseMetricsPanelProps {
  metrics: {
    totalUsers: number;
    activeAutomations: number;
    systemHealth: number;
    aiRequests: number;
    culturalArtifacts: number;
    businessProcesses: number;
    responseTime?: number;
    uptime?: number;
  };
}

const EnterpriseMetricsPanel: React.FC<EnterpriseMetricsPanelProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        title="Total Users"
        value={metrics.totalUsers.toLocaleString()}
        icon={<Users className="w-5 h-5 text-blue-500" />}
        trend="up"
        change={12}
        color="hover:border-blue-200"
        delay={0.1}
      />
      
      <MetricCard
        title="Active Automations"
        value={metrics.activeAutomations.toLocaleString()}
        icon={<Zap className="w-5 h-5 text-purple-500" />}
        trend="up"
        change={8}
        color="hover:border-purple-200"
        delay={0.2}
      />
      
      <MetricCard
        title="AI Requests"
        value={metrics.aiRequests.toLocaleString()}
        icon={<BarChart3 className="w-5 h-5 text-green-500" />}
        trend="up"
        change={15}
        color="hover:border-green-200"
        delay={0.3}
      />
      
      <MetricCard
        title="System Health"
        value={`${metrics.systemHealth}%`}
        icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        trend="stable"
        color="hover:border-green-200"
        delay={0.4}
      />
      
      <MetricCard
        title="Cultural Artifacts"
        value={metrics.culturalArtifacts.toLocaleString()}
        icon={<Database className="w-5 h-5 text-amber-500" />}
        trend="up"
        change={5}
        color="hover:border-amber-200"
        delay={0.5}
      />
      
      <MetricCard
        title="Business Processes"
        value={metrics.businessProcesses.toLocaleString()}
        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        trend="up"
        change={10}
        color="hover:border-blue-200"
        delay={0.6}
      />
      
      <MetricCard
        title="Avg Response Time"
        value={`${metrics.responseTime || 120}ms`}
        icon={<Clock className="w-5 h-5 text-indigo-500" />}
        trend="down"
        change={8}
        color="hover:border-indigo-200"
        delay={0.7}
      />
      
      <MetricCard
        title="Uptime"
        value={`${metrics.uptime || 99.98}%`}
        icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        trend="stable"
        color="hover:border-green-200"
        delay={0.8}
      />
    </div>
  );
};

export default EnterpriseMetricsPanel;