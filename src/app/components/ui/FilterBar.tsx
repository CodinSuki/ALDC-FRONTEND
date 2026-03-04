import React from 'react';
import SearchBar from './SearchBar';

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Filter[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Combined search and filter bar component
 * Provides consistent filtering UI across all list pages
 */
export default function FilterBar({ 
  searchValue, 
  onSearchChange, 
  searchPlaceholder = 'Search...',
  filters = [],
  actions,
  className = '' 
}: FilterBarProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        {onSearchChange && searchValue !== undefined && (
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="flex-1"
          />
        )}

        {/* Filters */}
        {filters.map((filter, index) => (
          <select
            key={index}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

        {/* Actions (e.g., Add button) */}
        {actions && <div className="flex items-center">{actions}</div>}
      </div>
    </div>
  );
}
