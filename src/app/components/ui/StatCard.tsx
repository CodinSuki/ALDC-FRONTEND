import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

/**
 * Metric display card for dashboards and summary views
 * Displays a statistic with optional icon, color, and trend indicator
 */
export default function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color = 'bg-blue-500', 
  change,
  trend,
  className = '' 
}: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-gray-900 text-2xl font-semibold">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple variant without icon - just colored square
 */
export function SimpleStatCard({ 
  label, 
  value, 
  color = 'bg-blue-500',
  className = '' 
}: Omit<StatCardProps, 'icon' | 'change' | 'trend'>) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-gray-900 text-2xl font-semibold">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg`} />
      </div>
    </div>
  );
}
