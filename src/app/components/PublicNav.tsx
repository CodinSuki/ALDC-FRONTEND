import { Link } from 'react-router-dom';
import { Home, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Home className="w-8 h-8 text-green-600" />
            <div>
              <div className="font-bold text-gray-900">ALDC</div>
              <div className="text-xs text-gray-600">Alderite Land Development</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link to="/properties" className="text-gray-700 hover:text-green-600 transition-colors">
              Properties
            </Link>
            <Link 
              to="/consultation" 
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Request Consultation
            </Link>
            <Link
              to="/sell"
              className="border-2 border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              Sell Property
            </Link>

          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            <Link 
              to="/" 
              className="block text-gray-700 hover:text-green-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/properties" 
              className="block text-gray-700 hover:text-green-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Properties
            </Link>
            <Link 
              to="/consultation" 
              className="block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Request Consultation
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
