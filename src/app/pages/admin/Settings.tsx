import { useState } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Save, User, Bell, Lock, Database } from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'system'>('profile');
  
  const [profileData, setProfileData] = useState({
    companyName: 'Alderite Land Development Corporation',
    email: 'admin@aldc.ph',
    phone: '+63 (2) 8XXX-XXXX',
    address: 'Metro Manila, Philippines',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newInquiry: true,
    paymentReceived: true,
    transactionComplete: false,
    overduePayment: true,
  });

  const handleSaveProfile = () => {
    alert('Profile settings saved successfully!');
  };

  const handleSaveNotifications = () => {
    alert('Notification settings saved successfully!');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage system configuration and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 flex gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'notifications'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'security'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Lock className="w-4 h-4" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'system'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Database className="w-4 h-4" />
            System
          </button>
        </div>

        {/* Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-900 mb-6">Company Profile</h3>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={profileData.companyName}
                  onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button 
                onClick={handleSaveProfile}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-900 mb-6">Notification Preferences</h3>
            <div className="space-y-4 max-w-2xl">
              {[
                { key: 'newInquiry', label: 'New Inquiry', description: 'Receive notifications when new inquiries are submitted' },
                { key: 'paymentReceived', label: 'Payment Received', description: 'Get notified when payments are recorded' },
                { key: 'transactionComplete', label: 'Transaction Complete', description: 'Alert when transactions are completed' },
                { key: 'overduePayment', label: 'Overdue Payment', description: 'Receive alerts for overdue payments' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-start justify-between py-3 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <p className="text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        [setting.key]: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              ))}

              <button 
                onClick={handleSaveNotifications}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors mt-6"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-900 mb-6">Security Settings</h3>
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-gray-900 mb-4">Change Password</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                    <Lock className="w-5 h-5" />
                    Update Password
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-gray-900 mb-4">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Add an extra layer of security to your account
                </p>
                <button className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-900 mb-6">System Configuration</h3>
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-gray-900 mb-4">Database Connection</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Database Host
                    </label>
                    <input
                      type="text"
                      defaultValue="localhost"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="localhost"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Database Name
                    </label>
                    <input
                      type="text"
                      defaultValue="aldc_db"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="aldc_db"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-800">Database connection is active</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-gray-900 mb-4">Backup & Maintenance</h4>
                <div className="space-y-3">
                  <button className="w-full border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900">Backup Database</p>
                        <p className="text-sm text-gray-600">Last backup: January 15, 2026</p>
                      </div>
                      <Database className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>

                  <button className="w-full border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900">Clear Cache</p>
                        <p className="text-sm text-gray-600">Improve system performance</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-gray-900 mb-2">System Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Version</span>
                    <span className="text-gray-900">1.0.0</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Established</span>
                    <span className="text-gray-900">2016</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-gray-900">January 16, 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
