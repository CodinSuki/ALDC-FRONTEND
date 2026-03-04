import React from 'react';
import { Eye, Edit, Trash2, LucideIcon } from 'lucide-react';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  customActions?: Array<{
    icon: LucideIcon;
    onClick: () => void;
    color?: string;
    label?: string;
  }>;
  disabled?: boolean;
  className?: string;
}

/**
 * Standardized action buttons for table rows
 * Provides View, Edit, Delete actions with consistent styling
 */
export default function ActionButtons({ 
  onView, 
  onEdit, 
  onDelete, 
  customActions,
  disabled = false,
  className = '' 
}: ActionButtonsProps) {
  return (
    <div className={`flex items-center justify-end space-x-3 ${className}`}>
      {onView && (
        <button
          onClick={onView}
          disabled={disabled}
          className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="View"
          aria-label="View"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          disabled={disabled}
          className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Edit"
          aria-label="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={disabled}
          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {customActions?.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={index}
            onClick={action.onClick}
            disabled={disabled}
            className={`${action.color || 'text-gray-600 hover:text-gray-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
            title={action.label}
            aria-label={action.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
