import React from 'react';

interface RadioGroupProps {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export default function RadioGroup({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
}: RadioGroupProps) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-3">
        {label} {required && '*'}
      </label>
      <div className="flex gap-6">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
              className="w-4 h-4"
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
