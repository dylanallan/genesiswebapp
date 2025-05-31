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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {Object.entries(metrics).map(([key, value]) => {
          const target = targetMetrics[key];
          const isSuccess = value >= target;
          const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-medium text-gray-700 capitalize">{formattedKey}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isSuccess ? "bg-green-500" : "bg-red-500"
                    )}
                    style={{ width: `${(value * 100)}%` }}
                  />
                </div>
                <span className={cn(
                  "text-sm font-medium",
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