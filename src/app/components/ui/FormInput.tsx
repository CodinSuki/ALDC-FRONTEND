import React from 'react';

interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  required?: boolean;
  helperText?: string;
}

export default function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  helperText,
}: FormInputProps) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}
