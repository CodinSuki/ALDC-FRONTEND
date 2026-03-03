import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import PropertyIdentityForm from './PropertyIdentityForm';
import PropertyOwnershipForm from './PropertyOwnershipForm';
import PropertyFinancialForm from './PropertyFinancialForm';

type Project = {
  projectid: number;
  projectname: string;
};

type Seller = {
  clientid: number;
  name: string;
};

type PropertyType = {
  propertytypeid: number;
  propertytypename: string;
};

type PropertyListingStatus = {
  propertylistingstatusid: number;
  propertylistingstatusname: string;
};

type UrbanLotType = {
  urbanreflottypeid: number;
  urbanreflottypename: string;
};

type AgriculturalLotType = {
  agriculturalreflottypeid: number;
  agriculturalreflottypename: string;
};

type PropertyDialogFormData = {
  propertyname?: string;
  projectid?: number;
  sellerclientid?: number | null;
  propertytypeid?: number | null;
  propertylistingstatusid?: number;
  propertyownershipid?: number | null;
  location_island?: string;
  location_region?: string;
  location_province?: string;
  location_city?: string;
  location_barangay?: string;
  location_street?: string;
  lot_size?: number;
  urbanreflottypeid?: number | null;
  utilities_water?: boolean;
  utilities_electricity?: boolean;
  utilities_sim?: boolean;
  utilities_internet?: boolean;
  access_motorcycle?: boolean;
  access_car?: boolean;
  access_truck?: boolean;
  access_road?: boolean;
  access_cemented_road?: boolean;
  access_rough_road?: boolean;
  facilities_gated?: boolean;
  facilities_security?: boolean;
  facilities_clubhouse?: boolean;
  facilities_sports?: boolean;
  facilities_parks?: boolean;
  agriculturalreflottypeids?: number[];
  agri_hasfarmhouse?: boolean;
  agri_hasbarns?: boolean;
  agri_haswarehousestorage?: boolean;
  agri_hasriversstreams?: boolean;
  agri_hasirrigationcanal?: boolean;
  agri_haslakelagoon?: boolean;
};

type PropertyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PropertyDialogFormData;
  projects: Project[];
  sellers: Seller[];
  propertyTypes: PropertyType[];
  listingStatuses: PropertyListingStatus[];
  urbanLotTypes: UrbanLotType[];
  agriculturalLotTypes: AgriculturalLotType[];
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditMode: boolean;
};

export default function PropertyDialog({
  open,
  onOpenChange,
  formData,
  projects,
  sellers,
  propertyTypes,
  listingStatuses,
  urbanLotTypes,
  agriculturalLotTypes,
  onChange,
  onSubmit,
  onCancel,
  isEditMode,
}: PropertyDialogProps) {
  const selectedPropertyType = propertyTypes.find(
    (propertyType) => propertyType.propertytypeid === formData.propertytypeid
  );
  const isAgricultural = selectedPropertyType?.propertytypename
    ?.toLowerCase()
    .includes('agri');

  const toggleAgriculturalLotType = (lotTypeId: number) => {
    const current = formData.agriculturalreflottypeids ?? [];
    const next = current.includes(lotTypeId)
      ? current.filter((id) => id !== lotTypeId)
      : [...current, lotTypeId];
    onChange('agriculturalreflottypeids', next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Property' : 'Add Property'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the property details' : 'Fill in the details to add a new property'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <PropertyIdentityForm
            formData={formData}
            projects={projects}
            propertyTypes={propertyTypes}
            onChange={onChange}
          />

          <PropertyOwnershipForm
            formData={formData}
            sellers={sellers}
            onChange={onChange}
          />

          <PropertyFinancialForm
            formData={formData}
            listingStatuses={listingStatuses}
            onChange={onChange}
          />

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Island</label>
                <select
                  value={formData.location_island || 'Luzon'}
                  onChange={(e) => onChange('location_island', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Luzon">Luzon</option>
                  <option value="Visayas">Visayas</option>
                  <option value="Mindanao">Mindanao</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Region *</label>
                <input
                  type="text"
                  value={formData.location_region || ''}
                  onChange={(e) => onChange('location_region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Province *</label>
                <input
                  type="text"
                  value={formData.location_province || ''}
                  onChange={(e) => onChange('location_province', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.location_city || ''}
                  onChange={(e) => onChange('location_city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Barangay *</label>
                <input
                  type="text"
                  value={formData.location_barangay || ''}
                  onChange={(e) => onChange('location_barangay', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Street *</label>
                <input
                  type="text"
                  value={formData.location_street || ''}
                  onChange={(e) => onChange('location_street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Lot Size (sqm) *</label>
                <input
                  type="number"
                  min={0}
                  value={formData.lot_size ?? 0}
                  onChange={(e) => onChange('lot_size', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Lot Type{isAgricultural ? 's' : ''}</label>
                {isAgricultural ? (
                  <div className="space-y-2 border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {agriculturalLotTypes.map((lotType) => (
                      <label key={lotType.agriculturalreflottypeid} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={(formData.agriculturalreflottypeids ?? []).includes(lotType.agriculturalreflottypeid)}
                          onChange={() => toggleAgriculturalLotType(lotType.agriculturalreflottypeid)}
                        />
                        <span>{lotType.agriculturalreflottypename}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <select
                    value={formData.urbanreflottypeid || ''}
                    onChange={(e) => onChange('urbanreflottypeid', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select lot type</option>
                    {urbanLotTypes.map((lotType) => (
                      <option key={lotType.urbanreflottypeid} value={lotType.urbanreflottypeid}>
                        {lotType.urbanreflottypename}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Utilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                ['utilities_water', 'Water'],
                ['utilities_electricity', 'Electricity'],
                ['utilities_sim', 'SIM'],
                ['utilities_internet', 'Internet'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[key as keyof PropertyDialogFormData])}
                    onChange={(e) => onChange(key, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Facilities & Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {(isAgricultural
                ? [
                    ['agri_hasfarmhouse', 'Farmhouse'],
                    ['agri_hasbarns', 'Barns'],
                    ['agri_haswarehousestorage', 'Warehouse / Storage'],
                    ['agri_hasriversstreams', 'Rivers / Streams'],
                    ['agri_hasirrigationcanal', 'Irrigation / Canal'],
                    ['agri_haslakelagoon', 'Lake / Lagoon'],
                  ]
                : [
                    ['facilities_gated', 'Gated'],
                    ['facilities_security', 'Security'],
                    ['facilities_clubhouse', 'Clubhouse'],
                    ['facilities_sports', 'Sports'],
                    ['facilities_parks', 'Parks'],
                  ]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[key as keyof PropertyDialogFormData])}
                    onChange={(e) => onChange(key, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Accessibility</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                ['access_motorcycle', 'Motorcycle'],
                ['access_car', 'Car'],
                ['access_truck', 'Truck'],
                ['access_road', 'Access Road'],
                ['access_cemented_road', 'Cemented Road'],
                ['access_rough_road', 'Rough Road'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[key as keyof PropertyDialogFormData])}
                    onChange={(e) => onChange(key, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className={`ml-2 px-4 py-2 rounded-lg text-white ${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isEditMode ? 'Update Property' : 'Add Property'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
