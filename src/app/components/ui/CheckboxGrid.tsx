import React from 'react';

interface CheckboxGridProps {
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}

export default function CheckboxGrid({
  label,
  options,
  values,
  onToggle,
}: CheckboxGridProps) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-3">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onToggle(option)}
              className="w-4 h-4"
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
