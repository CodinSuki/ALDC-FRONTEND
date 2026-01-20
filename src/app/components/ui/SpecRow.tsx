/**
 * SpecRow Component
 * Displays a labeled property specification as a key-value pair
 * Used in property detail pages to show specifications
 */

interface SpecRowProps {
  label: string;
  value: string | boolean | undefined;
}

export default function SpecRow({ label, value }: SpecRowProps) {
  // Convert boolean to Yes/No, handle undefined/null
  const displayValue = 
    typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
    value || 'Not specified';

  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm text-gray-900">{displayValue}</span>
    </div>
  );
}
