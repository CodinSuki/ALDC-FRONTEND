import React from 'react';

interface Props {
  region?: string;
  province?: string;
  city?: string;
  barangay?: string;
  street?: string;
  onChange: (field: string, value: any) => void;
}

export default function PropertyLocationForm({ region = '', province = '', city = '', barangay = '', street = '', onChange }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Region</label>
          <input
            type="text"
            value={region}
            onChange={e => onChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Province</label>
          <input
            type="text"
            value={province}
            onChange={e => onChange('province', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={city}
            onChange={e => onChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Barangay</label>
          <input
            type="text"
            value={barangay}
            onChange={e => onChange('barangay', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Street</label>
          <input
            type="text"
            value={street}
            onChange={e => onChange('street', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </>
  );
}
