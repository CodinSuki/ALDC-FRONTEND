import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import About from './pages/About';
import OurTeam from './pages/OurTeam';
import Resources from './pages/Resources';
import Contact from './pages/Contact';
import FAQs from './pages/FAQs';
import PropertyListings from './pages/PropertyListings';
import PropertyDetail from './pages/PropertyDetail';
import ConsultationForm from './pages/ConsultationForm';
import BuyerInterestForm from './pages/BuyerInterestForm';
import SellerForm from './components/ui/SellerForm';

import AdminDashboard from './pages/admin/Dashboard';
import AdminProjects from './pages/admin/Projects';
import AdminProperties from './pages/admin/Properties';
import AdminLocations from './pages/admin/Locations';
import AdminClients from './pages/admin/Clients';
import AdminInquiries from './pages/admin/Inquiries';
import AdminTransactions from './pages/admin/Transactions';
import AdminPayments from './pages/admin/Payments';
import AdminAgents from './pages/admin/Agents';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AdminCommissions from './pages/admin/Commissions';



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/team" element={<OurTeam />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/properties" element={<PropertyListings />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/property/:id/inquire" element={<BuyerInterestForm />} />
        <Route path="/consultation" element={<ConsultationForm />} />
        <Route path="/sell" element={<SellerForm />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="  " replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/properties" element={<AdminProperties />} />
        <Route path="/admin/locations" element={<AdminLocations />} />
        <Route path="/admin/clients" element={<AdminClients />} />
        <Route path="/admin/inquiries" element={<AdminInquiries />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/agents" element={<AdminAgents />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/commissions" element={<AdminCommissions />} />
      </Routes>
    </BrowserRouter>
  );
}