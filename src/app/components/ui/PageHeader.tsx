import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Standardized page header with title, optional description, and optional action button
 * Used across all admin pages for consistency
 */
export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-gray-900">{title}</h2>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
