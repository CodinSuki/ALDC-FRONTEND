import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';
import { Search, Filter, MapPin, Home } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const mockProperties = [
  {
    id: '1',
    name: 'Vista Verde Subdivision',
    type: 'Residential',
    location: 'Laguna',
    size: '120 sqm',
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1756435292384-1bf32eff7baf?w=600'
  },
  {
    id: '2',
    name: 'Greenfield Agricultural Estate',
    type: 'Agricultural',
    location: 'Batangas',
    size: '5 hectares',
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1653251135161-08703c56be5d?w=600'
  },
  {
    id: '3',
    name: 'Metro Business Center',
    type: 'Commercial',
    location: 'Makati',
    size: '500 sqm',
    status: 'Reserved',
    image: 'https://images.unsplash.com/photo-1677324574457-645566fea332?w=600'
  },
  {
    id: '4',
    name: 'Sunrise Beach Resort',
    type: 'Residential',
    location: 'Bataan',
    size: '200 sqm',
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600'
  },
  {
    id: '5',
    name: 'Industrial Park Zone',
    type: 'Industrial',
    location: 'Cavite',
    size: '1000 sqm',
    status: 'Sold',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600'
  },
  {
    id: '6',
    name: 'Mango Farm Estate',
    type: 'Agricultural',
    location: 'Zambales',
    size: '3 hectares',
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600'
  }
];

export default function PropertyListings() {
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProperties = mockProperties.filter(property => {
    const matchesType = selectedType === 'All' || property.type === selectedType;
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      
      {/* Page Header */}
      <div className="bg-green-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4">Property Listings</h1>
          <p className="text-green-100 text-lg">
            Explore our curated selection of properties across the Philippines
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by property name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {['All', 'Residential', 'Agricultural', 'Commercial', 'Industrial'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-6 py-3 rounded-lg whitespace-nowrap transition-colors ${
                    selectedType === type
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="flex-1 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-gray-600">
            Showing {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
          </div>

          {filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map(property => (
                <Link
                  key={property.id}
                  to={`/property/${property.id}`}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-56">
                    <ImageWithFallback 
                      src={property.image}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        property.status === 'Available' ? 'bg-green-500 text-white' :
                        property.status === 'Reserved' ? 'bg-yellow-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {property.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                      <Home className="w-4 h-4" />
                      <span>{property.type}</span>
                    </div>
                    
                    <h3 className="text-gray-900 mb-3">{property.name}</h3>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{property.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span>{property.size}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 italic">
                        Full details available upon consultation
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
