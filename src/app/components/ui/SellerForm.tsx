import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNav from '../PublicNav';
import Footer from '../Footer';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import RadioGroup from './RadioGroup';
import CheckboxGrid from './CheckboxGrid';
import FormSection from './FormSection';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData); // frontend-only
    setSubmitted(true);
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

            {/* PROPERTY BACKGROUND */}
            <section>
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">Property Background</h2>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Property Owner Name *
                </label>
                <input 
                  type="text"
                  name="ownerName" 
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  placeholder="Property Owner Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

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
                <label className="block text-sm text-gray-700 mb-2">
                  Reason for Selling
                </label>
                <textarea 
                  name="sellingReason" 
                  value={formData.sellingReason}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us why you're selling..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </section>

            {/* CONTACT INFORMATION */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">Contact Information</h2>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Title *
                </label>
                <select 
                  name="title" 
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select title...</option>
                  <option value="Property Owner">Property Owner</option>
                  <option value="Broker">Broker</option>
                  <option value="Salesperson">Salesperson</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input 
                    type="text"
                    name="firstName" 
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="First Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input 
                    type="text"
                    name="middleName" 
                    value={formData.middleName}
                    onChange={handleChange}
                    placeholder="Middle Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input 
                    type="text"
                    name="lastName" 
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Last Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input 
                    type="tel"
                    name="phone" 
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+63 XXX XXX XXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input 
                    type="email"
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Secondary Contact Number
                  </label>
                  <input 
                    type="tel"
                    name="phone2" 
                    value={formData.phone2}
                    onChange={handleChange}
                    placeholder="+63 XXX XXX XXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Secondary Email Address
                  </label>
                  <input 
                    type="email"
                    name="email2" 
                    value={formData.email2}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-700 mb-2">
                  Social Media / Messenger
                </label>
                <input 
                  type="text"
                  name="social" 
                  value={formData.social}
                  onChange={handleChange}
                  placeholder="Facebook, Messenger, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </section>

            {/* PROPERTY DETAILS */}
            <section className="border-t border-gray-200 pt-6">
              <h2 className="text-gray-900 mb-6 text-xl font-semibold">Property Details</h2>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Property Name / Caption *
                </label>
                <input 
                  type="text"
                  name="propertyName" 
                  value={formData.propertyName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Beachfront Farmland, Metro Residential Lot"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-700 mb-2">
                  Property Description
                </label>
                <textarea 
                  name="description" 
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Provide detailed information about your property..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-700 mb-6 font-semibold">Property Location Details</label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Island *</label>
                    <select
                      name="locationIsland"
                      value={formData.locationIsland}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select island...</option>
                      <option value="Luzon">Luzon</option>
                      <option value="Visayas">Visayas</option>
                      <option value="Mindanao">Mindanao</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Region</label>
                    <input type="text" name="locationRegion" value={formData.locationRegion} onChange={handleChange} placeholder="e.g., CALABARZON" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Province</label>
                    <input type="text" name="locationProvince" value={formData.locationProvince} onChange={handleChange} placeholder="e.g., Laguna" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">City / Municipality *</label>
                    <input type="text" name="locationCity" value={formData.locationCity} onChange={handleChange} required placeholder="e.g., Santa Rosa" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Barangay</label>
                    <input type="text" name="locationBarangay" value={formData.locationBarangay} onChange={handleChange} placeholder="e.g., Pacita Complex" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm text-gray-700 mb-2">Street / Specific Location</label>
                  <input type="text" name="locationStreet" value={formData.locationStreet} onChange={handleChange} placeholder="e.g., Pacita Complex Road" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Lot Size *
                  </label>
                  <input 
                    type="text"
                    name="lotSize" 
                    value={formData.lotSize}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 1000 sqm or 5 hectares"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Specify in sqm (square meters) or hectares</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select 
                    name="propertyType" 
                    value={formData.propertyType} 
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select type...</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
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

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Lot Type
                    </label>
                    <select
                      name="lotType"
                      value={formData.lotType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select lot type...</option>
                      {URBAN_LOT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

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
                    <label className="block text-sm text-gray-700 mb-2">
                      Topography
                    </label>
                    <select
                      name="topography"
                      value={formData.topography}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select topography...</option>
                      <option value="Flat">Flat</option>
                      <option value="Rolling">Rolling</option>
                      <option value="Sloping">Sloping</option>
                      <option value="Mountainous">Mountainous</option>
                    </select>
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

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Property Price *
                </label>
                <input 
                  type="text"
                  name="price" 
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 5000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

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
                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Submit Property
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
/* ===== Helper Components ===== */

// RadioGroup and CheckboxGroup components removed - now inlined in main form
// This improves readability and allows for better styling control
