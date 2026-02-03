import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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

import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProjects from './pages/admin/Projects';
import AdminProperties from './pages/admin/Properties';
import AdminClients from './pages/admin/Clients';
import AdminInquiries from './pages/admin/Inquiries';
import AdminTransactions from './pages/admin/Transactions';
import AdminAgents from './pages/admin/Agents';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AdminCommissions from './pages/admin/Commissions';



export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          
          {/* Admin Login Route */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute><AdminProjects /></ProtectedRoute>} />
          <Route path="/admin/properties" element={<ProtectedRoute><AdminProperties /></ProtectedRoute>} />
          <Route path="/admin/clients" element={<ProtectedRoute><AdminClients /></ProtectedRoute>} />
          <Route path="/admin/inquiries" element={<ProtectedRoute><AdminInquiries /></ProtectedRoute>} />
          <Route path="/admin/transactions" element={<ProtectedRoute><AdminTransactions /></ProtectedRoute>} />
          <Route path="/admin/agents" element={<ProtectedRoute><AdminAgents /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/commissions" element={<ProtectedRoute><AdminCommissions /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}