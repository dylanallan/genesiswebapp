import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Cpu, MemoryStick as Memory, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { startPerformanceMonitoring } from '../lib/performance';

interface MetricsCardProps {
  title: string;
  metrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ title, metrics, targetMetrics }) => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    fps: 0
  });

  useEffect(() => {
    const stopMonitoring = startPerformanceMonitoring((metrics) => {
      setPerformanceMetrics({
        cpuUsage: metrics.cpuUsage,
        memoryUsage: metrics.memoryUsage,
        fps: metrics.fps
      });
    });

    return () => stopMonitoring();
  }, []);

  return (
    <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-100">{title}</h3>
      </div>
      
      <div className="p-4 space-y-3">
        {/* System Performance Metrics */}
        <div className="space-y-3 mb-4 pb-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-gray-300">CPU Usage</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${performanceMetrics.cpuUsage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-blue-400">
                {performanceMetrics.cpuUsage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Memory className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-gray-300">Memory Usage</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${performanceMetrics.memoryUsage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-purple-400">
                {performanceMetrics.memoryUsage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-gray-300">FPS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${(performanceMetrics.fps / 60) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-green-400">
                {performanceMetrics.fps}
              </span>
            </div>
          </div>
        </div>

        {/* Original Metrics */}
        {Object.entries(metrics).map(([key, value]) => {
          const target = targetMetrics[key];
          const isSuccess = value >= target;
          const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-xs font-medium text-gray-300 capitalize">{formattedKey}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isSuccess ? "bg-green-500" : "bg-red-500"
                    )}
                    style={{ width: `${(value * 100)}%` }}
                  />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isSuccess ? "text-green-400" : "text-red-400"
                )}>
                  {(value * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};