import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';
import { CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import RadioGroup from '../components/ui/RadioGroup';
import CheckboxGrid from '../components/ui/CheckboxGrid';
import FormSection from '../components/ui/FormSection';
import FormInput from '../components/ui/FormInput';
import FormTextarea from '../components/ui/FormTextarea';
import FormSelect from '../components/ui/FormSelect';
import { submitSellerProperty } from '../services/sellerSubmissionService';

const AGRI_LOT_TYPES = [
  'Crop Farms',
  'Mixed Farms',
  'Livestock Farms',
];

const AGRI_AMENITIES = [
  'Farmhouse',
  'Barns',
  'Warehouse / Storage',
  'Rivers / Streams',
  'Irrigation / Canal',
  'Lake / Lagoon',
];

const URBAN_LOT_TYPES = [
  'Entire Lot',
  'Interior Lot',
  'Key Lot',
  'Cul-de-sac Lot',
  'Corner Lot',
  'Through Lot',
  'Flag Lot',
  'T-intersection Lot',
];

const URBAN_AMENITIES = [
  'Gated',
  'Security',
  'Clubhouse / Function Hall',
  'Sports & Fitness Center',
  'Parks & Playgrounds',
];


export default function SellerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    /* Property Background */
    ownerName: '',
    ownerAlive: '',
    authorityToSell: '',
    exclusiveBroker: '',
    brokerExtension: '',
    taxResponsibility: '',
    documents: [] as string[],
    commissionType: '',
    sellingReason: '',

    /* Contact */
    title: '',
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    email: '',
    phone2: '',
    email2: '',
    social: '',

    /* Property Basic */
    propertyName: '',
    description: '',
    locationIsland: '',
    locationRegion: '',
    locationProvince: '',
    locationCity: '',
    locationBarangay: '',
    locationStreet: '',
    lotSize: '',
    propertyType: '',

    /* Agricultural */
    agriLotTypes: [] as string[],
    agriAmenities: [] as string[],

    /* Other Lot Types */
    lotType: '',
    amenities: [] as string[],
    titled: '',
    overlooking: '',
    topography: '',

    /* Pricing */
    price: '',
    pricingType: '',

    /* Access & Utilities */
    access: [] as string[],
    roads: [] as string[],
    utilities: [] as string[],
    /* Property Utilities (normalized) */
    utilitiesWater: '',
    utilitiesElectricity: '',
    utilitiesSIM: '',
    utilitiesInternet: '',
    /* Property Facilities & Amenities */
    facilitiesGated: '',
    facilitiesSecurity: '',
    facilitiesClubhouse: '',
    facilitiesSports: '',
    facilitiesParks: '',
    facilitiesPool: '',
    facilitiesOther: '',
    /* Property Accessibility & Vicinity */
    accessMotorcycle: '',
    accessCar: '',
    accessTruck: '',
    accessRoad: '',
    accessCementedRoad: '',
    accessRoughRoad: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (group: string, value: string) => {
    setFormData(prev => {
      const list = prev[group as keyof typeof prev] as string[];
      return {
        ...prev,
        [group]: list.includes(value)
          ? list.filter(v => v !== value)
          : [...list, value],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate required contact fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Please fill in all required contact fields.');
      setIsLoading(false);
      return;
    }

    // Validate required property fields
    if (!formData.propertyName || !formData.locationCity || !formData.lotSize || !formData.propertyType) {
      setError('Please fill in all required property fields.');
      setIsLoading(false);
      return;
    }

    // Build seller submission payload
    const payload = {
      client: {
        first_name: formData.firstName,
        middle_name: formData.middleName || null,
        last_name: formData.lastName,
        contact_email: formData.email,
        contact_number: formData.phone,
        role: 'seller' as const,
        source: 'seller_form' as const,
      },
      property: {
        // Property Background
        owner_name: formData.ownerName,
        owner_alive: formData.ownerAlive,
        authority_to_sell: formData.authorityToSell,
        exclusive_broker: formData.exclusiveBroker,
        broker_extension: formData.brokerExtension,
        tax_responsibility: formData.taxResponsibility,
        documents: formData.documents,
        commission_type: formData.commissionType,
        selling_reason: formData.sellingReason,

        // Contact (secondary)
        title: formData.title,
        phone2: formData.phone2,
        email2: formData.email2,
        social: formData.social,

        // Property Basic
        property_name: formData.propertyName,
        description: formData.description,
        location_island: formData.locationIsland,
        location_region: formData.locationRegion,
        location_province: formData.locationProvince,
        location_city: formData.locationCity,
        location_barangay: formData.locationBarangay,
        location_street: formData.locationStreet,
        lot_size: formData.lotSize,
        property_type: formData.propertyType,

        // Agricultural
        agri_lot_types: formData.agriLotTypes,
        agri_amenities: formData.agriAmenities,

        // Other Lot Types
        lot_type: formData.lotType,
        amenities: formData.amenities,
        titled: formData.titled,
        overlooking: formData.overlooking,
        topography: formData.topography,

        // Pricing
        price: formData.price,
        pricing_type: formData.pricingType,

        // Utilities
        utilities_water: formData.utilitiesWater,
        utilities_electricity: formData.utilitiesElectricity,
        utilities_sim: formData.utilitiesSIM,
        utilities_internet: formData.utilitiesInternet,

        // Facilities & Amenities
        facilities_gated: formData.facilitiesGated,
        facilities_security: formData.facilitiesSecurity,
        facilities_clubhouse: formData.facilitiesClubhouse,
        facilities_sports: formData.facilitiesSports,
        facilities_parks: formData.facilitiesParks,
        facilities_pool: formData.facilitiesPool,
        facilities_other: formData.facilitiesOther,

        // Accessibility & Vicinity
        access_motorcycle: formData.accessMotorcycle,
        access_car: formData.accessCar,
        access_truck: formData.accessTruck,
        access_road: formData.accessRoad,
        access_cemented_road: formData.accessCementedRoad,
        access_rough_road: formData.accessRoughRoad,
      },
    };

    try {
      const result = await submitSellerProperty(payload);

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || result.message || 'Failed to submit property');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Form submission error:', err);
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
              <h2 className="text-gray-900 mb-4">Submission Received</h2>
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
          <Link to="/" className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="mb-4">Sell Your Property</h1>
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

            {/* PROPERTY BACKGROUND */}
            <section>
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">Property Background</h2>

              <FormInput
                label="Property Owner Name"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                placeholder="Property Owner Name"
              />

              <div className="mt-6">
                <RadioGroup
                  label="Is the owner alive?"
                  name="ownerAlive"
                  value={formData.ownerAlive}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Authority to Sell?"
                  name="authorityToSell"
                  value={formData.authorityToSell}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Exclusive Broker?"
                  name="exclusiveBroker"
                  value={formData.exclusiveBroker}
                  options={['Yes', 'No', 'MisterBroker']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-700 mb-3">
                  Broker Extension? *
                </label>
                <div className="flex gap-6">
                  {['Yes', 'No', 'MisterBroker'].map((o) => (
                    <label key={o} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="brokerExtension"
                        value={o}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{o}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-700 mb-3">
                  Who pays Capital Gains & Doc Tax? *
                </label>
                <div className="flex gap-6">
                  {['Seller', 'Broker'].map((o) => (
                    <label key={o} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taxResponsibility"
                        value={o}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{o}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-700 mb-3">
                  Documents Available
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['TCT', 'Tax Declaration', 'RPT', 'SPA', 'Valid IDs'].map((o) => (
                    <label key={o} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.documents.includes(o)}
                        onChange={() => handleCheckbox('documents', o)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{o}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-700 mb-3">
                  Commission *
                </label>
                <div className="flex gap-6">
                  {['5%', 'Net of Commission'].map((o) => (
                    <label key={o} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="commissionType"
                        value={o}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{o}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <FormTextarea
                  label="Reason for Selling"
                  name="sellingReason"
                  value={formData.sellingReason}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us why you're selling..."
                />
              </div>
            </section>

            {/* CONTACT INFORMATION */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">Contact Information</h2>

              <FormSelect
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              >
                <option value="">Select title...</option>
                <option value="Property Owner">Property Owner</option>
                <option value="Broker">Broker</option>
                <option value="Salesperson">Salesperson</option>
                <option value="Agent">Agent</option>
              </FormSelect>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <FormInput
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="First Name"
                />
                <FormInput
                  label="Middle Name"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Middle Name"
                />
                <FormInput
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Last Name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <FormInput
                  label="Contact Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+63 XXX XXX XXXX"
                />
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <FormInput
                  label="Secondary Contact Number"
                  name="phone2"
                  type="tel"
                  value={formData.phone2}
                  onChange={handleChange}
                  placeholder="+63 XXX XXX XXXX"
                />
                <FormInput
                  label="Secondary Email Address"
                  name="email2"
                  type="email"
                  value={formData.email2}
                  onChange={handleChange}
                  placeholder="email@example.com"
                />
              </div>

              <div className="mt-6">
                <FormInput
                  label="Social Media / Messenger"
                  name="social"
                  value={formData.social}
                  onChange={handleChange}
                  placeholder="Facebook, Messenger, etc."
                />
              </div>
            </section>

            {/* PROPERTY DETAILS */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">Property Details</h2>

              <FormInput
                label="Property Name / Caption"
                name="propertyName"
                value={formData.propertyName}
                onChange={handleChange}
                required
                placeholder="e.g., Beachfront Farmland, Metro Residential Lot"
              />

              <div className="mt-6">
                <FormTextarea
                  label="Property Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Provide detailed information about your property..."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-700 mb-6 font-semibold">Property Location Details</label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormSelect
                    label="Island"
                    name="locationIsland"
                    value={formData.locationIsland}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select island...</option>
                    <option value="Luzon">Luzon</option>
                    <option value="Visayas">Visayas</option>
                    <option value="Mindanao">Mindanao</option>
                  </FormSelect>

                  <FormInput
                    label="Region"
                    name="locationRegion"
                    value={formData.locationRegion}
                    onChange={handleChange}
                    placeholder="e.g., CALABARZON"
                  />

                  <FormInput
                    label="Province"
                    name="locationProvince"
                    value={formData.locationProvince}
                    onChange={handleChange}
                    placeholder="e.g., Laguna"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <FormInput
                    label="City / Municipality"
                    name="locationCity"
                    value={formData.locationCity}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Santa Rosa"
                  />

                  <FormInput
                    label="Barangay"
                    name="locationBarangay"
                    value={formData.locationBarangay}
                    onChange={handleChange}
                    placeholder="e.g., Pacita Complex"
                  />
                </div>

                <div className="mt-4">
                  <FormInput
                    label="Street / Specific Location"
                    name="locationStreet"
                    value={formData.locationStreet}
                    onChange={handleChange}
                    placeholder="e.g., Pacita Complex Road"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <FormInput
                  label="Lot Size"
                  name="lotSize"
                  value={formData.lotSize}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 1000 sqm or 5 hectares"
                  helperText="Specify in sqm (square meters) or hectares"
                />

                <FormSelect
                  label="Property Type"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </FormSelect>
              </div>

              {/* AGRICULTURAL */}
              {formData.propertyType === 'Agricultural' && (
                <section className="border border-green-200 bg-green-50 rounded-lg p-6 mt-6 transition-all duration-300">
                  <h3 className="text-gray-900 font-semibold mb-6">Agricultural Property Details</h3>

                  <CheckboxGrid
                    label="Agricultural Lot Type"
                    options={AGRI_LOT_TYPES}
                    values={formData.agriLotTypes}
                    onToggle={(option) => handleCheckbox('agriLotTypes', option)}
                  />

                  <div className="mt-6">
                    <CheckboxGrid
                      label="Facilities & Amenities"
                      options={AGRI_AMENITIES}
                      values={formData.agriAmenities}
                      onToggle={(option) => handleCheckbox('agriAmenities', option)}
                    />
                  </div>
                </section>
              )}

              {/* RESIDENTIAL / COMMERCIAL / INDUSTRIAL */}
              {['Residential', 'Commercial', 'Industrial'].includes(formData.propertyType) && (
                <section className="border border-blue-200 bg-blue-50 rounded-lg p-6 mt-6 transition-all duration-300">
                  <h3 className="text-gray-900 font-semibold mb-6">Lot Type & Facilities</h3>

                  <FormSelect
                    label="Lot Type"
                    name="lotType"
                    value={formData.lotType}
                    onChange={handleChange}
                  >
                    <option value="">Select lot type...</option>
                    {URBAN_LOT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </FormSelect>

                  <div className="mt-6">
                    <CheckboxGrid
                      label="Facilities & Amenities"
                      options={URBAN_AMENITIES}
                      values={formData.amenities}
                      onToggle={(option) => handleCheckbox('amenities', option)}
                    />
                  </div>

                  <div className="mt-6">
                    <RadioGroup
                      label="Land Titled?"
                      name="titled"
                      value={formData.titled}
                      options={['Yes', 'No']}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mt-6">
                    <RadioGroup
                      label="Overlooking?"
                      name="overlooking"
                      value={formData.overlooking}
                      options={['Yes', 'No']}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mt-6">
                    <FormSelect
                      label="Topography"
                      name="topography"
                      value={formData.topography}
                      onChange={handleChange}
                    >
                      <option value="">Select topography...</option>
                      <option value="Flat">Flat</option>
                      <option value="Rolling">Rolling</option>
                      <option value="Sloping">Sloping</option>
                      <option value="Mountainous">Mountainous</option>
                    </FormSelect>
                  </div>
                </section>
              )}
            </section>

            {/* PRICING */}
            <FormSection title="Property Utilities">
              <RadioGroup
                label="Water"
                name="utilitiesWater"
                value={formData.utilitiesWater}
                options={['Yes', 'No']}
                onChange={handleChange}
                required
              />

              <div className="mt-6">
                <RadioGroup
                  label="Electricity"
                  name="utilitiesElectricity"
                  value={formData.utilitiesElectricity}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="SIM Network"
                  name="utilitiesSIM"
                  value={formData.utilitiesSIM}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Internet"
                  name="utilitiesInternet"
                  value={formData.utilitiesInternet}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>
            </FormSection>

            <FormSection title="Property Facilities & Amenities">
              <RadioGroup
                label="Gated"
                name="facilitiesGated"
                value={formData.facilitiesGated}
                options={['Yes', 'No']}
                onChange={handleChange}
                required
              />

              <div className="mt-6">
                <RadioGroup
                  label="Security"
                  name="facilitiesSecurity"
                  value={formData.facilitiesSecurity}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Clubhouse / Function Hall"
                  name="facilitiesClubhouse"
                  value={formData.facilitiesClubhouse}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Sports and Fitness Center"
                  name="facilitiesSports"
                  value={formData.facilitiesSports}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Parks and Playgrounds"
                  name="facilitiesParks"
                  value={formData.facilitiesParks}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Swimming Pool"
                  name="facilitiesPool"
                  value={formData.facilitiesPool}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-700 mb-2">Other Facilities and Amenities</label>
                <textarea name="facilitiesOther" value={formData.facilitiesOther} onChange={handleChange} rows={3} placeholder="Describe any other facilities or amenities..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
            </FormSection>

            <FormSection title="Property Accessibility & Vicinity">
              <RadioGroup
                label="Accessible by Motorcycle"
                name="accessMotorcycle"
                value={formData.accessMotorcycle}
                options={['Yes', 'No']}
                onChange={handleChange}
                required
              />

              <div className="mt-6">
                <RadioGroup
                  label="Accessible by Car"
                  name="accessCar"
                  value={formData.accessCar}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Accessible by Truck"
                  name="accessTruck"
                  value={formData.accessTruck}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Access Road"
                  name="accessRoad"
                  value={formData.accessRoad}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Cemented Road"
                  name="accessCementedRoad"
                  value={formData.accessCementedRoad}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-6">
                <RadioGroup
                  label="Rough Road"
                  name="accessRoughRoad"
                  value={formData.accessRoughRoad}
                  options={['Yes', 'No']}
                  onChange={handleChange}
                  required
                />
              </div>
            </FormSection>

            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">Pricing</h2>

              <FormInput
                label="Property Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="e.g., 5000000"
              />

              <div className="mt-6">
                <RadioGroup
                  label="Pricing Type"
                  name="pricingType"
                  value={formData.pricingType}
                  options={['Negotiable', 'Fixed']}
                  onChange={handleChange}
                  required
                />
              </div>
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
