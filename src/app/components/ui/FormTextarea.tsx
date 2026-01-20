import React from 'react';

interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export default function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
}: FormTextareaProps) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>
  );
}
