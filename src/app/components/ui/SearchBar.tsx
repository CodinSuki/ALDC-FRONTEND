import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Standardized search bar with icon
 * Used across all pages with search functionality
 */
export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  ariaLabel = 'Search',
  className = '' 
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search aria-hidden="true" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>
  );
}
