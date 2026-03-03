type SellerOption = {
  clientid: number;
  name: string;
};

type PropertyOwnershipFormProps = {
  formData: any;
  sellers: SellerOption[];
  onChange: (field: string, value: any) => void;
};

export default function PropertyOwnershipForm({
  formData,
  sellers,
  onChange,
}: PropertyOwnershipFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Seller</label>
        <select
          value={formData.sellerclientid || ''}
          onChange={e => onChange('sellerclientid', e.target.value ? Number(e.target.value) : null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select Seller (Optional)</option>
          {sellers.map(seller => (
            <option key={seller.clientid} value={seller.clientid}>
              {seller.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
