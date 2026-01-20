import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="border-t border-gray-200 pt-6">
      <h2 className="text-gray-900 mb-6 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
