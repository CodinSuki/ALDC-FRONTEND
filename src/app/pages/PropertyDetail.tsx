import { useParams, Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';
import { MapPin, Home, Ruler, ArrowLeft, Calendar } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import SpecRow from '../components/ui/SpecRow';

const mockPropertyData: Record<string, any> = {
  '1': {
    name: 'Vista Verde Subdivision',
    type: 'Residential',
    location: 'Laguna',
    province: 'Laguna',
    city: 'Santa Rosa',
    size: '120 sqm',
    status: 'Available',
    images: [
      'https://images.unsplash.com/photo-1756435292384-1bf32eff7baf?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    description: 'A premium residential subdivision offering modern living spaces with excellent connectivity and amenities.',
    // Property Specifications
    property_type: 'Residential',
    lot_size: '120 sqm',
    titled: true,
    overlooking: false,
    lot_type: 'Corner Lot',
    topography: 'Flat',
    // Utilities
    utilities: {
      water: true,
      electricity: true,
      sim: true,
      internet: true,
    },
    // Facilities & Amenities
    facilities: {
      gated: true,
      security: true,
      clubhouse: true,
      sports: true,
      parks: true,
      pool: false,
      other: 'Basketball court, Multi-purpose hall',
    },
    // Accessibility & Vicinity
    accessibility: {
      motorcycle: true,
      car: true,
      truck: false,
      access_road: true,
      cemented_road: true,
      rough_road: false,
    },
  }
};

export default function PropertyDetail() {
  const { id } = useParams();
  const property = mockPropertyData[id || '1'] || mockPropertyData['1'];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      
      {/* Back Button */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/properties" className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600">
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden h-96">
                <ImageWithFallback 
                  src={property.images[0]}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {property.images.slice(1).map((img: string, index: number) => (
                  <div key={index} className="rounded-lg overflow-hidden h-24">
                    <ImageWithFallback 
                      src={img}
                      alt={`${property.name} ${index + 2}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                  property.status === 'Available' ? 'bg-green-500 text-white' :
                  property.status === 'Reserved' ? 'bg-yellow-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {property.status}
                </span>
                {/* Payment status badge — shown here for visibility. Real status is available under admin Transactions. */}
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800`}>Payment Status: N/A</span>
                </div>
              </div>

              <h1 className="text-gray-900 mb-2">{property.name}</h1>
              
              <div className="flex items-center gap-2 text-green-600 mb-6">
                <Home className="w-5 h-5" />
                <span>{property.type}</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Location</div>
                    <div className="text-gray-900">{property.location}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Ruler className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Property Size</div>
                    <div className="text-gray-900">{property.size}</div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-gray-900 mb-3">About This Property</h2>
                <p className="text-gray-600 leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Property Overview Section */}
              <div className="mb-8">
                <h2 className="text-gray-900 mb-4 text-lg font-semibold">Property Overview</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <SpecRow label="Property Type" value={property.property_type} />
                  <SpecRow label="Lot Size" value={property.lot_size} />
                  <SpecRow label="Land Title" value={property.titled} />
                  <SpecRow label="Overlooking" value={property.overlooking} />
                  <SpecRow label="Lot Type" value={property.lot_type} />
                  <SpecRow label="Topography" value={property.topography} />
                </div>
              </div>

              {/* Property Utilities Section */}
              <div className="mb-8">
                <h2 className="text-gray-900 mb-4 text-lg font-semibold">Property Utilities</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <SpecRow label="Water" value={property.utilities?.water} />
                  <SpecRow label="Electricity" value={property.utilities?.electricity} />
                  <SpecRow label="SIM Network" value={property.utilities?.sim} />
                  <SpecRow label="Internet" value={property.utilities?.internet} />
                </div>
              </div>

              {/* Property Facilities & Amenities Section */}
              <div className="mb-8">
                <h2 className="text-gray-900 mb-4 text-lg font-semibold">Facilities & Amenities</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <SpecRow label="Gated Community" value={property.facilities?.gated} />
                  <SpecRow label="Security" value={property.facilities?.security} />
                  <SpecRow label="Clubhouse / Function Hall" value={property.facilities?.clubhouse} />
                  <SpecRow label="Sports & Fitness Center" value={property.facilities?.sports} />
                  <SpecRow label="Parks & Playgrounds" value={property.facilities?.parks} />
                  <SpecRow label="Swimming Pool" value={property.facilities?.pool} />
                  {property.facilities?.other && (
                    <div className="py-3 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">Other Amenities</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {property.facilities.other.split(',').map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{item.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Accessibility & Vicinity Section */}
              <div className="mb-8">
                <h2 className="text-gray-900 mb-4 text-lg font-semibold">Accessibility & Vicinity</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <SpecRow label="Accessible by Motorcycle" value={property.accessibility?.motorcycle} />
                  <SpecRow label="Accessible by Car" value={property.accessibility?.car} />
                  <SpecRow label="Accessible by Truck" value={property.accessibility?.truck} />
                  <SpecRow label="Access Road" value={property.accessibility?.access_road} />
                  <SpecRow label="Cemented Road" value={property.accessibility?.cemented_road} />
                  <SpecRow label="Rough Road" value={property.accessibility?.rough_road} />
                </div>
              </div>

              {/* Advisory Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h3 className="text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                  Interested in This Property?
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Register your interest and our expert brokers will contact you with detailed information, pricing, and site visit scheduling.
                </p>
                <Link 
                  to={`/property/${id}/inquire`} 
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Inquire About This Property
                </Link>
              </div>

              {/* Additional Info */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-500">
                  Property ID: #{id?.padStart(6, '0')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
