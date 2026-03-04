import React from 'react';
import { type StatusColor, colorClasses } from './statusBadgeUtils';

interface StatusBadgeProps {
  status: string;
  color?: StatusColor;
  className?: string;
}

/**
 * Color-coded status badge component
 * Provides consistent status display across tables and detail views
 */
export default function StatusBadge({ status, color = 'gray', className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${colorClasses[color]} ${className}`}>
      {status}
    </span>
  );
}
