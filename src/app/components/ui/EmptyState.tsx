import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty state component for tables and lists
 * Displays when no data is available with optional icon and action
 */
export default function EmptyState({ 
  icon: Icon, 
  title = 'No data available', 
  description,
  action,
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
      <h3 className="text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * TableEmptyState - Specialized variant for table rows
 * Displays empty state as a table row with proper colspan
 */
export function TableEmptyState({ 
  colSpan, 
  message = 'No data available',
  className = ''
}: { 
  colSpan: number; 
  message?: string;
  className?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={`px-6 py-12 text-center text-gray-500 ${className}`}>
        {message}
      </td>
    </tr>
  );
}
