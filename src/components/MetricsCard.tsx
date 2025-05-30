import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  metrics: Record<string, number>;
  targetMetrics: Record<string, number>;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ title, metrics, targetMetrics }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
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
                <span className="capitalize">{formattedKey}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={isSuccess ? "text-green-600" : "text-red-600"}>
                  {(value * 100).toFixed(1)}%
                </span>
                <span className="text-gray-400">/ {(target * 100).toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};