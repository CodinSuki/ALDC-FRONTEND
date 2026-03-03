type BrokerFormProps = {
  formData: any;
  onChange: (field: string, value: string) => void;
};

export default function BrokerForm({ formData, onChange }: BrokerFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Full name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="email@aldc.ph"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.contact_number}
            onChange={(e) => onChange('contact_number', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="09XX XXX XXXX"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            PRC License <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.prc_license}
            onChange={(e) => onChange('prc_license', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="PRC-BRK-YYYY-XXX"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
}
