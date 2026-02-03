import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, Users, FileText, DollarSign, Menu, X, FolderKanban, MapPin, UserSearch, MessageSquare, CreditCard, UserCog, BarChart3, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navigation: Array<{ name: string; path: string; icon: any; disabled?: boolean }> = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
  { name: 'Projects', path: '/admin/projects', icon: FolderKanban },
  { name: 'Properties', path: '/admin/properties', icon: Building2 },
  { name: 'Clients', path: '/admin/clients', icon: Users },
  { name: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare },
  { name: 'Transactions', path: '/admin/transactions', icon: FileText },
  { name: 'Agents & Brokers', path: '/admin/agents', icon: UserCog },
  { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <div>
            <div className="text-white">ALDC Admin</div>
            <div className="text-xs text-gray-400">Dashboard</div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            // Render disabled items as inert buttons with reduced opacity and aria-disabled
            if (item.disabled) {
              return (
                <div
                  key={item.path}
                  aria-disabled
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed opacity-60`}
                  title={item.name + ' (disabled — managed inside related workflows)'}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
              A
            </div>
            <div className="flex-1">
              <div className="text-sm text-white">Admin User</div>
              <div className="text-xs text-gray-400">admin@aldc.ph</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 lg:ml-0 ml-4">
            <h1 className="text-gray-900">
              {navigation.find(item => item.path === location.pathname)?.name || 'Admin'}
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              View Public Site
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}