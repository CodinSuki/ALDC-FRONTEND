import React from 'react';
import LoadingError from './LoadingError';
import { TableEmptyState } from './EmptyState';

interface DataTableWrapperProps {
  loading?: boolean;
  error?: string | null;
  loadingMessage?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
  colSpan?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper for data tables with built-in loading, error, and empty state handling
 * Simplifies table components by handling common states consistently
 */
export default function DataTableWrapper({ 
  loading, 
  error, 
  loadingMessage,
  emptyMessage = 'No data available',
  isEmpty = false,
  colSpan = 5,
  children,
  className = '' 
}: DataTableWrapperProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      <LoadingError loading={loading} error={error} loadingMessage={loadingMessage} />
      <div className="overflow-x-auto">
        <table className="w-full">
          {children}
          {isEmpty && !loading && !error && (
            <tbody>
              <TableEmptyState colSpan={colSpan} message={emptyMessage} />
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

/**
 * Standard table header cell
 */
export function TableHeaderCell({ 
  children, 
  align = 'left',
  className = '' 
}: { 
  children: React.ReactNode; 
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  
  return (
    <th className={`px-6 py-3 ${alignClass} text-xs text-gray-600 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

/**
 * Standard table data cell
 */
export function TableDataCell({ 
  children, 
  align = 'left',
  className = '' 
}: { 
  children: React.ReactNode; 
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${alignClass} ${className}`}>
      {children}
    </td>
  );
}
