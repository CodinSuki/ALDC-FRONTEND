import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import type { ChangeEvent } from 'react';
import { Upload, X } from 'lucide-react';
import type { AdminPropertyPhotoUpload } from '@/app/services/adminPropertyService';

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
  photos?: AdminPropertyPhotoUpload[];
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

/* ===== Helper Components ===== */

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-200 pt-6">
      <h2 className="text-gray-900 mb-6 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function RadioGroup({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
}: {
  label: string;
  name: string;
  value: string | boolean;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const optionValue = option.toLowerCase() === 'yes' ? 'true' : option.toLowerCase() === 'no' ? 'false' : option;
          const isChecked = typeof value === 'boolean' 
            ? (option.toLowerCase() === 'yes' ? value === true : value === false)
            : String(value) === option;
            
          return (
            <label
              key={option}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                isChecked
                  ? 'bg-green-50 border-green-600 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={isChecked}
                onChange={onChange}
                required={required}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="font-medium">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

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

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const currentPhotos = formData.photos ?? [];
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length !== selectedFiles.length) {
      alert('Only image files are allowed.');
      event.target.value = '';
      return;
    }

    const availableSlots = 10 - currentPhotos.length;
    if (imageFiles.length > availableSlots) {
      alert(`You can upload ${availableSlots} more photo(s). Maximum is 10.`);
      event.target.value = '';
      return;
    }

    try {
      const encodedPhotos = await Promise.all(
        imageFiles.map(
          (file) =>
            new Promise<AdminPropertyPhotoUpload>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  dataUrl: String(reader.result ?? ''),
                  fileName: file.name,
                  mimeType: file.type,
                  fileSize: file.size,
                });
              };
              reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      );

      onChange('photos', [...currentPhotos, ...encodedPhotos]);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to process selected photos.');
    } finally {
      event.target.value = '';
    }
  };

  const removePhoto = (photoIndex: number) => {
    const currentPhotos = formData.photos ?? [];
    onChange(
      'photos',
      currentPhotos.filter((_, index) => index !== photoIndex)
    );
  };

  const handleRadioChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === 'true' || value === 'false') {
      onChange(field, value === 'true');
    } else {
      onChange(field, value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{isEditMode ? 'Edit Property' : 'Add Property'}</DialogTitle>
          <DialogDescription className="text-base">
            {isEditMode ? 'Update the property details below' : 'Fill in the details to add a new property to the system'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* PROPERTY IDENTITY */}
          <section>
            <h2 className="text-gray-900 mb-6 text-xl font-semibold">Property Identity</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.propertyname || ''}
                onChange={(e) => onChange('propertyname', e.target.value)}
                required
                placeholder="e.g., Beachfront Farmland, Metro Residential Lot"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.projectid || ''}
                  onChange={(e) => onChange('projectid', Number(e.target.value))}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.projectid} value={project.projectid}>
                      {project.projectname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.propertytypeid || ''}
                  onChange={(e) => onChange('propertytypeid', e.target.value ? Number(e.target.value) : null)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Property Type</option>
                  {propertyTypes.map((type) => (
                    <option key={type.propertytypeid} value={type.propertytypeid}>
                      {type.propertytypename}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPropertyType && (
              <div className={`mt-4 p-4 rounded-lg ${isAgricultural ? 'bg-blue-50 border border-blue-200' : 'bg-amber-50 border border-amber-200'}`}>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Selected Type</p>
                <p className={`text-lg font-semibold mt-1 ${isAgricultural ? 'text-blue-700' : 'text-amber-700'}`}>
                  {selectedPropertyType.propertytypename}
                </p>
              </div>
            )}
          </section>

          {/* PROPERTY CLASSIFICATION */}
          <FormSection title="Property Classification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seller / Landowner</label>
                <select
                  value={formData.sellerclientid || ''}
                  onChange={(e) => onChange('sellerclientid', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">No seller linked</option>
                  {sellers.map((seller) => (
                    <option key={seller.clientid} value={seller.clientid}>
                      {seller.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.propertylistingstatusid || ''}
                  onChange={(e) => onChange('propertylistingstatusid', Number(e.target.value))}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Status</option>
                  {listingStatuses.map((status) => (
                    <option key={status.propertylistingstatusid} value={status.propertylistingstatusid}>
                      {status.propertylistingstatusname}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FormSection>

          {/* LOCATION DETAILS */}
          <FormSection title="Location Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Island <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.location_island || 'Luzon'}
                  onChange={(e) => onChange('location_island', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Luzon">Luzon</option>
                  <option value="Visayas">Visayas</option>
                  <option value="Mindanao">Mindanao</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location_region || ''}
                  onChange={(e) => onChange('location_region', e.target.value)}
                  required
                  placeholder="e.g., NCR, CALABARZON"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location_province || ''}
                  onChange={(e) => onChange('location_province', e.target.value)}
                  required
                  placeholder="e.g., Laguna"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location_city || ''}
                  onChange={(e) => onChange('location_city', e.target.value)}
                  required
                  placeholder="e.g., Calamba"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barangay <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location_barangay || ''}
                  onChange={(e) => onChange('location_barangay', e.target.value)}
                  required
                  placeholder="e.g., Parian"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location_street || ''}
                  onChange={(e) => onChange('location_street', e.target.value)}
                  required
                  placeholder="e.g., Main Road"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lot Size (sqm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.lot_size ?? 0}
                  onChange={(e) => onChange('lot_size', Number(e.target.value))}
                  required
                  placeholder="e.g., 1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </FormSection>

          {/* LOT TYPE & DETAILS */}
          <FormSection title={isAgricultural ? 'Agricultural Lot Details' : 'Urban Lot Details'}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {isAgricultural ? 'Agricultural Lot Types' : 'Urban Lot Type'}
              </label>
              {isAgricultural ? (
                <div className="space-y-3 border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                  {agriculturalLotTypes.map((lotType) => (
                    <label
                      key={lotType.agriculturalreflottypeid}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white hover:border-green-400 transition-colors bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={(formData.agriculturalreflottypeids ?? []).includes(lotType.agriculturalreflottypeid)}
                        onChange={() => toggleAgriculturalLotType(lotType.agriculturalreflottypeid)}
                        className="text-green-600 focus:ring-green-500 rounded"
                      />
                      <span className="font-medium text-gray-700">{lotType.agriculturalreflottypename}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <select
                  value={formData.urbanreflottypeid || ''}
                  onChange={(e) => onChange('urbanreflottypeid', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          </FormSection>

          {/* UTILITIES */}
          <FormSection title="Property Utilities">
            <RadioGroup
              label="Water"
              name="utilitiesWater"
              value={formData.utilities_water ?? false}
              options={['Yes', 'No']}
              onChange={handleRadioChange('utilities_water')}
              required
            />

            <div className="mt-6">
              <RadioGroup
                label="Electricity"
                name="utilitiesElectricity"
                value={formData.utilities_electricity ?? false}
                options={['Yes', 'No']}
                onChange={handleRadioChange('utilities_electricity')}
                required
              />
            </div>

            <div className="mt-6">
              <RadioGroup
                label="SIM Network"
                name="utilitiesSIM"
                value={formData.utilities_sim ?? false}
                options={['Yes', 'No']}
                onChange={handleRadioChange('utilities_sim')}
                required
              />
            </div>

            <div className="mt-6">
              <RadioGroup
                label="Internet"
                name="utilitiesInternet"
                value={formData.utilities_internet ?? false}
                options={['Yes', 'No']}
                onChange={handleRadioChange('utilities_internet')}
                required
              />
            </div>
          </FormSection>

          {/* FACILITIES & AMENITIES */}
          <FormSection title={isAgricultural ? 'Facilities & Water Features' : 'Facilities & Amenities'}>
            {isAgricultural ? (
              <>
                <RadioGroup
                  label="Farmhouse"
                  name="agriFarmhouse"
                  value={formData.agri_hasfarmhouse ?? false}
                  options={['Yes', 'No']}
                  onChange={handleRadioChange('agri_hasfarmhouse')}
                  required
                />

                <div className="mt-6">
                  <RadioGroup
                    label="Barns"
                    name="agriBarns"
                    value={formData.agri_hasbarns ?? false}
                    options={['Yes', 'No']}
                    onChange={handleRadioChange('agri_hasbarns')}
                    required
                  />
                </div>

                <div className="mt-6">
                  <RadioGroup
                    label="Warehouse / Storage"
                    name="agriWarehouse"
                    value={formData.agri_haswarehousestorage ?? false}
                    options={['Yes', 'No']}
                    onChange={handleRadioChange('agri_haswarehousestorage')}
                    required
                  />
                </div>

                <div className="mt-6">
                  <RadioGroup
                    label="Rivers / Streams"
                    name="agriRivers"
                    value={formData.agri_hasriversstreams ?? false}
                    options={['Yes', 'No']}
                    onChange={handleRadioChange('agri_hasriversstreams')}
                    required
                  />
                </div>

                <div className="mt-6">
                  <RadioGroup
                    label="Irrigation / Canal"
                    name="agriIrrigation"
                    value={formData.agri_hasirrigationcanal ?? false}
                    options={['Yes', 'No']}
                    onChange={handleRadioChange('agri_hasirrigationcanal')}
                    required
                  />
                </div>

                <div className="mt-6">
                  <RadioGroup
                    label="Lake / Lagoon"
                    name="agriLake"
                    value={formData.agri_haslakelagoon ?? false}
                    options={['Yes', 'No']}
                    onChange={handleRadioChange('agri_haslakelagoon')}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <RadioGroup
                  label="Gated"
                  name="facilitiesGated"
                  value={formData.facilities_gated ?? false}
                  options={['Yes', 'No']}
                  onChange={handleRadioChange('facilities_gated')}
                  required
                />

                <div className="mt-6">
                  <RadioGroup
                    label="Security"
                    name="facilitiesSecurity"
                    value={formData.facilities_security ?? false}
                    options={['Yes', 'No']}
                    onChange={handleRadioChange('facilities_security')}
                    required
                  />
                </div>

                <div className="mt-6">
                  <RadioGroup
                    label="Clubhouse / Function Hall"
                    name="facilitiesClubhouse"
                    value={formData.facilities_clubhouse ?? false}
                    options={['Yes', 'No']}
                    onChange={handleRadioChange('facilities_clubhouse')}
                    required
                  />
                </div>

                <div className="mt-6">
                  <RadioGroup
                    label="Sports & Fitness Center"
                    name="facilitiesSports"
                    value={formData.facilities_sports ?? false}
                    options={['Yes', 'No']}
                    onChange={handleRadioChange('facilities_sports')}
                    required
                  />
                </div>

                <div className="mt-6">
                  <RadioGroup
                    label="Parks & Playgrounds"
                    name="facilitiesParks"
                    value={formData.facilities_parks ?? false}
                    options={['Yes', 'No']}
                    onChange={handleRadioChange('facilities_parks')}
                    required
                  />
                </div>
              </>
            )}
          </FormSection>

          {/* ACCESSIBILITY */}
          <FormSection title="Property Accessibility & Vicinity">
            <RadioGroup
              label="Accessible by Motorcycle"
              name="accessMotorcycle"
              value={formData.access_motorcycle ?? false}
              options={['Yes', 'No']}
              onChange={handleRadioChange('access_motorcycle')}
              required
            />

            <div className="mt-6">
              <RadioGroup
                label="Accessible by Car"
                name="accessCar"
                value={formData.access_car ?? false}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_car')}
                required
              />
            </div>

            <div className="mt-6">
              <RadioGroup
                label="Accessible by Truck"
                name="accessTruck"
                value={formData.access_truck ?? false}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_truck')}
                required
              />
            </div>

            <div className="mt-6">
              <RadioGroup
                label="Has Access Road"
                name="accessRoad"
                value={formData.access_road ?? false}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_road')}
                required
              />
            </div>

            <div className="mt-6">
              <RadioGroup
                label="Has Cemented Road"
                name="accessCementedRoad"
                value={formData.access_cemented_road ?? false}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_cemented_road')}
                required
              />
            </div>

            <div className="mt-6">
              <RadioGroup
                label="Has Rough Road"
                name="accessRoughRoad"
                value={formData.access_rough_road ?? false}
                options={['Yes', 'No']}
                onChange={handleRadioChange('access_rough_road')}
                required
              />
            </div>
          </FormSection>

          {/* PHOTOS */}
          <FormSection title="Property Photos">
            <p className="text-sm text-gray-600 mb-4">
              Upload up to 10 property images. {isEditMode ? 'New uploads will replace existing photos.' : 'Accepted formats: JPG, PNG, WebP'}
            </p>
            
            <label className="inline-flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer text-sm transition-colors">
              <Upload className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Choose Photos to Upload</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>

            {(formData.photos ?? []).length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Selected Photos ({formData.photos?.length ?? 0}/10)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(formData.photos ?? []).map((photo, index) => (
                    <div
                      key={`${photo.fileName}-${index}`}
                      className="relative rounded-lg border-2 border-gray-200 overflow-hidden bg-white hover:border-green-500 transition-colors group"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.fileName}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white truncate">{photo.fileName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        aria-label="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </FormSection>
        </div>

        <DialogFooter className="gap-2">
          <button
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
              isEditMode 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isEditMode ? 'Update Property' : 'Add Property'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
