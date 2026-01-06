import { Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';
import { Building2, TrendingUp, Users, Award } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 to-green-100 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-gray-900 mb-6">
                Property Advisory & Investment Guidance
              </h1>
              <p className="text-gray-700 mb-8 text-lg">
                ALDC has been providing expert real estate consultation and investment guidance across the Philippines since 2016. 
                We specialize in subdivisions, farms, resorts, and commercial properties with a strong advisory focus.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/properties" 
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-center"
                >
                  View Properties
                </Link>
                <Link 
                  to="/consultation" 
                  className="bg-white text-green-600 border-2 border-green-600 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors text-center"
                >
                  Request Consultation
                </Link>
              </div>
            </div>
            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1756435292384-1bf32eff7baf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZWFsJTIwZXN0YXRlJTIwcHJvcGVydHklMjBob3VzZXxlbnwxfHx8fDE3Njc2MDYyNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Modern real estate property"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Building2, label: 'Properties Managed', value: '150+' },
              { icon: Users, label: 'Satisfied Clients', value: '500+' },
              { icon: TrendingUp, label: 'Successful Deals', value: '₱2.5B+' },
              { icon: Award, label: 'Years of Service', value: '8+' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <div className="text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Types Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">Property Types We Manage</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From residential subdivisions to agricultural land, we offer comprehensive advisory services across all property types.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Residential',
                description: 'Subdivisions and housing developments',
                image: 'https://images.unsplash.com/photo-1756435292384-1bf32eff7baf?w=400'
              },
              {
                title: 'Agricultural',
                description: 'Farms and agricultural land',
                image: 'https://images.unsplash.com/photo-1653251135161-08703c56be5d?w=400'
              },
              {
                title: 'Commercial',
                description: 'Office buildings and retail spaces',
                image: 'https://images.unsplash.com/photo-1677324574457-645566fea332?w=400'
              },
              {
                title: 'Industrial',
                description: 'Warehouses and industrial facilities',
                image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'
              }
            ].map((type, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-48 overflow-hidden">
                  <ImageWithFallback 
                    src={type.image}
                    alt={type.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-gray-900 mb-2">{type.title}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-4">Ready to Find Your Next Investment?</h2>
          <p className="text-green-100 mb-8 text-lg">
            Schedule a consultation with our expert brokers to discuss your property needs and investment goals.
          </p>
          <Link 
            to="/consultation" 
            className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Request Consultation
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
