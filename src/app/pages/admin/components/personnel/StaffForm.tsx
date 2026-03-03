type StaffFormProps = {
  formData: any;
  onChange: (field: string, value: string) => void;
};

export default function StaffForm({ formData, onChange }: StaffFormProps) {
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Department <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => onChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Operations"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Position <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => onChange('position', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Admin Officer"
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
