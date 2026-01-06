import { MapPin, Phone, Mail, Home } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-8 h-8 text-green-500" />
              <div>
                <div className="font-bold text-white">ALDC</div>
                <div className="text-sm">Est. 2016</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed">
              Alderite Land Development Corporation provides professional property advisory and investment guidance across the Philippines.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-green-500 transition-colors">Home</a></li>
              <li><a href="/properties" className="hover:text-green-500 transition-colors">Properties</a></li>
              <li><a href="/consultation" className="hover:text-green-500 transition-colors">Request Consultation</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-green-500" />
                <span>Metro Manila, Philippines</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-green-500" />
                <span>+63 XXX XXX XXXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 text-green-500" />
                <span>info@aldc.ph</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Alderite Land Development Corporation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
