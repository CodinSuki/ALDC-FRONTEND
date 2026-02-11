import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';
import { CheckCircle, ArrowLeft, AlertCircle, X, Upload } from 'lucide-react';
import FormInput from '../components/ui/FormInput';
import FormTextarea from '../components/ui/FormTextarea';
import FormSelect from '../components/ui/FormSelect';

const AGRI_LOT_TYPES = [
  'Crop Farms',
  'Mixed Farms',
  'Livestock Farms',
];

const AGRI_AMENITIES = [
  { label: 'Farmhouse', field: 'has_farmhouse' },
  { label: 'Barns', field: 'has_barns' },
  { label: 'Warehouse / Storage', field: 'has_warehouse_storage' },
  { label: 'Rivers / Streams', field: 'has_rivers_streams' },
  { label: 'Irrigation / Canal', field: 'has_irrigation_canal' },
  { label: 'Lake / Lagoon', field: 'has_lake_lagoon' },
];

const ISLANDS = ['Luzon', 'Visayas', 'Mindanao'];
const REGIONS = ['Region I', 'Region II', 'Region III', 'NCR', 'CALABARZON', 'MIMAROPA'];

export default function SellerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state organized by database table relationships
  const [formData, setFormData] = useState({
    // CLIENT TABLE
    client: {
      first_name: '',
      middle_name: '',
      last_name: '',
      email_address: '',
      contact_number: '',
      additional_email_address: '',
      additional_contact_number: '',
    },

    // PROPERTY TABLE (minimal data - only required fields)
    property: {
      property_name: '',
      property_type_id: '',
      property_ownership_id: '',
      project_id: '',
    },

    // PROPERTY LOCATION TABLE
    property_location: {
      property_island: '',
      property_region: '',
      property_province: '',
      property_city: '',
      property_barangay: '',
      property_street: '',
    },

    // PROPERTY UTILITIES TABLE (boolean flags)
    property_utilities: {
      property_has_water: false,
      property_has_electricity: false,
      property_has_internet: false,
      property_has_mobile_signal: false,
    },

    // PROPERTY ACCESSIBILITY TABLE
    property_accessibility: {
      property_by_motorcycle: false,
      property_by_car: false,
      property_by_truck: false,
      property_by_access_road: false,
      property_by_cemented_road: false,
      property_by_rough_road: false,
      property_other_details: '',
    },

    // AGRICULTURAL PROPERTY AMENITIES (if applicable)
    agricultural_amenities: {
      has_farmhouse: false,
      has_barns: false,
      has_warehouse_storage: false,
      has_rivers_streams: false,
      has_irrigation_canal: false,
      has_lake_lagoon: false,
      amenities_notes: '',
    },

    // AGRICULTURAL PROPERTY LOT TYPES (if applicable)
    agricultural_lot_types: [] as string[],

    // PHOTOS (stored separately)
    photos: [] as string[],

    // ADDITIONAL SELLER INFORMATION (for display/reference)
    seller_notes: {
      selling_reason: '',
      lot_size: '',
      price: '',
      price_type: '',
    },
  });

  // Handle client field changes
  const handleClientChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      client: { ...prev.client, [name]: value },
    }));
  };

  // Handle property field changes
  const handlePropertyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      property: { ...prev.property, [name]: value },
    }));
  };

  // Handle location field changes
  const handleLocationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      property_location: { ...prev.property_location, [name]: value },
    }));
  };

  // Handle generic checkbox changes for boolean tables
  const handleCheckboxChange = (
    table: keyof typeof formData,
    field: string,
    value: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [table]: { ...prev[table as keyof typeof prev], [field]: value },
    }));
  };

  // Handle agricultural lot type toggles
  const handleAgriculturalLotTypeToggle = (lotType: string) => {
    setFormData(prev => ({
      ...prev,
      agricultural_lot_types: prev.agricultural_lot_types.includes(lotType)
        ? prev.agricultural_lot_types.filter(t => t !== lotType)
        : [...prev.agricultural_lot_types, lotType],
    }));
  };

  // Handle textarea changes for notes
  const handleTextAreaChange = (
    table: keyof typeof formData,
    field: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [table]: { ...prev[table as keyof typeof prev], [field]: value },
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentPhotoCount = formData.photos.length;
    const remainingSlots = 10 - currentPhotoCount;

    if (files.length > remainingSlots) {
      setError(
        `You can only upload ${remainingSlots} more photo(s). Maximum is 10.`
      );
      return;
    }

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload only image files.');
        return;
      }

      const reader = new FileReader();
      reader.onload = event => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, base64],
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSellerNotesChange = (
    field: keyof typeof formData.seller_notes,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      seller_notes: { ...prev.seller_notes, [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate required client fields
      if (
        !formData.client.first_name ||
        !formData.client.last_name ||
        !formData.client.email_address ||
        !formData.client.contact_number
      ) {
        throw new Error('Please fill in all required client fields.');
      }

      // Validate required property fields
      if (
        !formData.property.property_name ||
        !formData.property.property_type_id ||
        !formData.property.property_ownership_id
      ) {
        throw new Error('Please fill in all required property fields.');
      }

      // Validate required location fields
      if (
        !formData.property_location.property_city ||
        !formData.property_location.property_barangay
      ) {
        throw new Error('Please fill in property location.');
      }

      // Build payload matching database structure
      const payload = {
        client: formData.client,
        property: formData.property,
        property_location: formData.property_location,
        property_utilities: formData.property_utilities,
        property_accessibility: formData.property_accessibility,
        ...(formData.property.property_type_id === '1' && {
          agricultural_amenities: formData.agricultural_amenities,
          agricultural_lot_types: formData.agricultural_lot_types,
        }),
        photos: formData.photos,
        seller_notes: formData.seller_notes,
      };

      // Send to backend
      const response = await fetch('/api/seller/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit property.');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Submission failed.');
      }

      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <div className="flex-1 bg-gray-50 flex items-center justify-center py-12">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-gray-900 mb-4 text-2xl font-semibold">
                Submission Received
              </h2>
              <p className="text-gray-600 mb-6">
                Our team will review your property and contact you shortly.
              </p>
              <Link
                to="/"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      {/* Header */}
      <div className="bg-green-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="mb-4 text-3xl font-bold">Sell Your Property</h1>
          <p className="text-green-100 text-lg">
            Provide your property details for evaluation and listing.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-red-900 font-semibold">Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* SELLER INFORMATION */}
            <section>
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">
                Seller Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  label="First Name"
                  name="first_name"
                  value={formData.client.first_name}
                  onChange={handleClientChange}
                  required
                  placeholder="First Name"
                />
                <FormInput
                  label="Middle Name"
                  name="middle_name"
                  value={formData.client.middle_name}
                  onChange={handleClientChange}
                  placeholder="Middle Name"
                />
                <FormInput
                  label="Last Name"
                  name="last_name"
                  value={formData.client.last_name}
                  onChange={handleClientChange}
                  required
                  placeholder="Last Name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <FormInput
                  label="Email Address"
                  name="email_address"
                  type="email"
                  value={formData.client.email_address}
                  onChange={handleClientChange}
                  required
                  placeholder="Email Address"
                />
                <FormInput
                  label="Contact Number"
                  name="contact_number"
                  type="tel"
                  value={formData.client.contact_number}
                  onChange={handleClientChange}
                  required
                  placeholder="Contact Number"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <FormInput
                  label="Additional Email (Optional)"
                  name="additional_email_address"
                  type="email"
                  value={formData.client.additional_email_address}
                  onChange={handleClientChange}
                  placeholder="Additional Email"
                />
                <FormInput
                  label="Additional Contact (Optional)"
                  name="additional_contact_number"
                  type="tel"
                  value={formData.client.additional_contact_number}
                  onChange={handleClientChange}
                  placeholder="Additional Contact"
                />
              </div>
            </section>

            {/* PROPERTY INFORMATION */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">
                Property Information
              </h2>

              <FormInput
                label="Property Name"
                name="property_name"
                value={formData.property.property_name}
                onChange={handlePropertyChange}
                required
                placeholder="Property Name"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <FormSelect
                  label="Property Type"
                  name="property_type_id"
                  value={formData.property.property_type_id}
                  onChange={handlePropertyChange}
                  required
                >
                  <option value="">Select Property Type</option>
                  <option value="1">Agricultural</option>
                  <option value="2">Residential</option>
                  <option value="3">Commercial</option>
                </FormSelect>

                <FormSelect
                  label="Property Ownership"
                  name="property_ownership_id"
                  value={formData.property.property_ownership_id}
                  onChange={handlePropertyChange}
                  required
                >
                  <option value="">Select Property Ownership</option>
                  <option value="1">Single Ownership</option>
                  <option value="2">Joint Ownership</option>
                </FormSelect>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <FormInput
                  label="Lot Size"
                  name="lot_size"
                  value={formData.seller_notes.lot_size}
                  onChange={e => handleSellerNotesChange('lot_size', e.target.value)}
                  placeholder="e.g., 1000 sqm"
                />
                <FormInput
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.seller_notes.price}
                  onChange={e => handleSellerNotesChange('price', e.target.value)}
                  placeholder="Property Price"
                />
                <FormSelect
                  label="Price Type"
                  name="price_type"
                  value={formData.seller_notes.price_type}
                  onChange={e => handleSellerNotesChange('price_type', (e.target as HTMLSelectElement).value)}
                >
                  <option value="">Select Price Type</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Negotiable">Negotiable</option>
                </FormSelect>
              </div>

              <div className="mt-6">
                <FormTextarea
                  label="Reason for Selling"
                  name="selling_reason"
                  value={formData.seller_notes.selling_reason}
                  onChange={e => handleSellerNotesChange('selling_reason', e.target.value)}
                  rows={3}
                  placeholder="Tell us why you're selling..."
                />
              </div>
            </section>

            {/* PROPERTY LOCATION */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">
                Property Location
              </h2>

              <FormSelect
                label="Island"
                name="property_island"
                value={formData.property_location.property_island}
                onChange={handleLocationChange}
                required
              >
                <option value="">Select Island</option>
                {ISLANDS.map(island => (
                  <option key={island} value={island}>
                    {island}
                  </option>
                ))}
              </FormSelect>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <FormSelect
                  label="Region"
                  name="property_region"
                  value={formData.property_location.property_region}
                  onChange={handleLocationChange}
                  required
                >
                  <option value="">Select Region</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </FormSelect>

                <FormInput
                  label="Province"
                  name="property_province"
                  value={formData.property_location.property_province}
                  onChange={handleLocationChange}
                  required
                  placeholder="e.g., Laguna"
                />

                <FormInput
                  label="City"
                  name="property_city"
                  value={formData.property_location.property_city}
                  onChange={handleLocationChange}
                  required
                  placeholder="e.g., Santa Rosa"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <FormInput
                  label="Barangay"
                  name="property_barangay"
                  value={formData.property_location.property_barangay}
                  onChange={handleLocationChange}
                  required
                  placeholder="e.g., Pacita Complex"
                />

                <FormInput
                  label="Street Address"
                  name="property_street"
                  value={formData.property_location.property_street}
                  onChange={handleLocationChange}
                  required
                  placeholder="e.g., Pacita Complex Road"
                />
              </div>
            </section>

            {/* UTILITIES */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">
                Utilities Available
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_utilities.property_has_water}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_utilities',
                        'property_has_water',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Water</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_utilities.property_has_electricity}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_utilities',
                        'property_has_electricity',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Electricity</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_utilities.property_has_internet}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_utilities',
                        'property_has_internet',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Internet</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_utilities.property_has_mobile_signal}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_utilities',
                        'property_has_mobile_signal',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Mobile Signal</span>
                </label>
              </div>
            </section>

            {/* ACCESSIBILITY */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">
                Property Accessibility
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_accessibility.property_by_motorcycle}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_accessibility',
                        'property_by_motorcycle',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">By Motorcycle</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_accessibility.property_by_car}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_accessibility',
                        'property_by_car',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">By Car</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_accessibility.property_by_truck}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_accessibility',
                        'property_by_truck',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">By Truck</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_accessibility.property_by_access_road}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_accessibility',
                        'property_by_access_road',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Access Road</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_accessibility.property_by_cemented_road}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_accessibility',
                        'property_by_cemented_road',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Cemented Road</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.property_accessibility.property_by_rough_road}
                    onChange={e =>
                      handleCheckboxChange(
                        'property_accessibility',
                        'property_by_rough_road',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Rough Road</span>
                </label>
              </div>

              <div className="mt-6">
                <FormTextarea
                  label="Other Accessibility Details"
                  name="property_other_details"
                  value={formData.property_accessibility.property_other_details}
                  onChange={e =>
                    handleTextAreaChange('property_accessibility', 'property_other_details', e.target.value)
                  }
                  rows={3}
                  placeholder="Any other accessibility information..."
                />
              </div>
            </section>

            {/* AGRICULTURAL SECTION (conditional) */}
            {formData.property.property_type_id === '1' && (
              <>
                <section className="border-t border-green-200 bg-green-50 rounded-lg p-6 pt-6">
                  <h2 className="text-gray-900 mb-6 text-xl font-semibold">
                    Agricultural Lot Types
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {AGRI_LOT_TYPES.map(lotType => (
                      <label key={lotType} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agricultural_lot_types.includes(lotType)}
                          onChange={() => handleAgriculturalLotTypeToggle(lotType)}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">{lotType}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="border-t border-green-200 bg-green-50 rounded-lg p-6 pt-6">
                  <h2 className="text-gray-900 mb-6 text-xl font-semibold">
                    Agricultural Amenities
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {AGRI_AMENITIES.map(amenity => (
                      <label key={amenity.field} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            formData.agricultural_amenities[
                              amenity.field as keyof typeof formData.agricultural_amenities
                            ] as boolean
                          }
                          onChange={e =>
                            handleCheckboxChange(
                              'agricultural_amenities',
                              amenity.field,
                              e.target.checked
                            )
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">{amenity.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6">
                    <FormTextarea
                      label="Amenities Notes"
                      name="amenities_notes"
                      value={formData.agricultural_amenities.amenities_notes}
                      onChange={e =>
                        handleTextAreaChange('agricultural_amenities', 'amenities_notes', e.target.value)
                      }
                      rows={3}
                      placeholder="Additional information about amenities..."
                    />
                  </div>
                </section>
              </>
            )}

            {/* PHOTOS SECTION */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">Property Photos</h2>
              <p className="text-gray-600 mb-4">
                Upload up to 10 photos of your property. These photos will be displayed on the property listing and details pages.
              </p>

              {/* File Input */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={formData.photos.length >= 10}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-green-300 rounded-lg p-8 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <Upload className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="text-green-600 font-medium">
                      {formData.photos.length >= 10
                        ? 'Maximum photos reached'
                        : 'Click to upload photos'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formData.photos.length}/10 photos uploaded
                    </p>
                  </div>
                </button>
              </div>

              {/* Photo Gallery */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Property photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-500 mt-1 text-center">Photo {index + 1}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SUBMIT */}
            <section className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Submit Property'}
              </button>
              <p className="text-sm text-gray-500 text-center mt-4">
                By submitting this form, you confirm that all information provided is accurate.
              </p>
            </section>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
