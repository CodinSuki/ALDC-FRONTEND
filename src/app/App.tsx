import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import PropertyListings from './pages/PropertyListings';
import PropertyDetail from './pages/PropertyDetail';
import ConsultationForm from './pages/ConsultationForm';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProperties from './pages/admin/Properties';
import AdminClients from './pages/admin/Clients';
import AdminTransactions from './pages/admin/Transactions';
import AdminCommissions from './pages/admin/Commissions';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/properties" element={<PropertyListings />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/consultation" element={<ConsultationForm />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/properties" element={<AdminProperties />} />
        <Route path="/admin/clients" element={<AdminClients />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/commissions" element={<AdminCommissions />} />
      </Routes>
    </BrowserRouter>
  );
}
