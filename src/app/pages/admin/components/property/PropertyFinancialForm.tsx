type PropertyFinancialFormProps = {
  formData: any;
  listingStatuses: Array<{
    propertylistingstatusid: number;
    propertylistingstatusname: string;
  }>;
  onChange: (field: string, value: any) => void;
};

export default function PropertyFinancialForm({
  formData,
  listingStatuses,
  onChange,
}: PropertyFinancialFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Status</label>
        <select
          value={formData.propertylistingstatusid || ''}
          onChange={e => onChange('propertylistingstatusid', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select Status</option>
          {listingStatuses.map(status => (
            <option key={status.propertylistingstatusid} value={status.propertylistingstatusid}>
              {status.propertylistingstatusname}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
