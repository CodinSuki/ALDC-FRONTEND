import React from 'react';

interface LoadingErrorProps {
  loading?: boolean;
  error?: string | null;
  loadingMessage?: string;
  className?: string;
}

/**
 * Displays loading and error states typically shown at the top of tables
 * Standardized styling for consistency across all data-fetching pages
 */
export default function LoadingError({ 
  loading, 
  error, 
  loadingMessage = 'Loading...', 
  className = '' 
}: LoadingErrorProps) {
  if (!loading && !error) return null;

  return (
    <>
      {loading && (
        <div className={`px-6 py-3 text-sm text-gray-500 border-b border-gray-200 ${className}`}>
          {loadingMessage}
        </div>
      )}
      {error && (
        <div className={`px-6 py-3 text-sm text-red-600 border-b border-gray-200 ${className}`}>
          {error}
        </div>
      )}
    </>
  );
}
