import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface MetricsCardProps {
  title: string;
  metrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ title, metrics, targetMetrics }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      </div>
      <div className="p-4 space-y-3">
        {Object.entries(metrics).map(([key, value]) => {
          const target = targetMetrics[key];
          const isSuccess = value >= target;
          const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs font-medium text-gray-700 capitalize">{formattedKey}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
                  isSuccess ? "text-green-600" : "text-red-600"
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