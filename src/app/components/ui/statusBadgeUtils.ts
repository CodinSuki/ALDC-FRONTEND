export type StatusColor = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple' | 'indigo';

export const colorClasses: Record<StatusColor, string> = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
  purple: 'bg-purple-100 text-purple-800',
  indigo: 'bg-indigo-100 text-indigo-800',
};

/**
 * Helper function to automatically determine badge color based on status text
 */
export function getStatusColor(status: string): StatusColor {
  const normalizedStatus = status.toLowerCase();
  
  // Active/Success/Approved states
  if (normalizedStatus.includes('active') || 
      normalizedStatus.includes('published') || 
      normalizedStatus.includes('approved') ||
      normalizedStatus.includes('paid') ||
      normalizedStatus.includes('completed') ||
      normalizedStatus.includes('full')) {
    return 'green';
  }
  
  // Pending/In Progress states
  if (normalizedStatus.includes('pending') || 
      normalizedStatus.includes('scheduled') ||
      normalizedStatus.includes('partial') ||
      normalizedStatus.includes('assigned')) {
    return 'yellow';
  }
  
  // Draft/New states
  if (normalizedStatus.includes('draft') || 
      normalizedStatus.includes('new') ||
      normalizedStatus.includes('received')) {
    return 'blue';
  }
  
  // Error/Rejected states
  if (normalizedStatus.includes('rejected') || 
      normalizedStatus.includes('failed') ||
      normalizedStatus.includes('overdue') ||
      normalizedStatus.includes('closed')) {
    return 'red';
  }
  
  // Inactive/Archived states
  if (normalizedStatus.includes('inactive') || 
      normalizedStatus.includes('archived')) {
    return 'gray';
  }
  
  return 'gray';
}
