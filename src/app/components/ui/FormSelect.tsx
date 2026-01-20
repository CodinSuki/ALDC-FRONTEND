import React from 'react';

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
  children: React.ReactNode;
}

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  required,
  children,
}: FormSelectProps) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
      >
        {children}
      </select>
    </div>
  );
}
