'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Sidebar from '@/components/Sidebar';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
// Import Unlink icon
import { Save, User, CloudLightning, RefreshCw, Unlink } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { register, handleSubmit, setValue } = useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('googleCalendarId', user.googleCalendarId);
    }
  }, [user, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.put('/users/me', data);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await api.get('/auth/google/url');
      window.location.href = res.data.url;
    } catch (err) {
      toast.error('Could not initiate Google Auth');
    }
  };

  const handleDisconnectGoogle = async () => {
    if(!confirm("Are you sure you want to disconnect Google Calendar?")) return;
    
    try {
      await api.post('/auth/google/disconnect');
      await refreshUser(); // Reload user data to update UI
      toast.success('Google Calendar disconnected');
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const handleSyncGoogle = async () => {
    const toastId = toast.loading("Syncing events...");
    try {
        const res = await api.post('/events/sync-google');
        toast.update(toastId, { render: res.data.message, type: "success", isLoading: false, autoClose: 3000 });
    } catch (err: any) {
        toast.update(toastId, { render: "Sync failed. Connect account first?", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">Profile Settings</h1>

        <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                <input
                  {...register('name')}
                  className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 ring-blue-500 outline-none transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 ring-blue-500 outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Integrations</h3>
              
              <div className="flex flex-col gap-4">
                {/* ID Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Google Calendar ID</label>
                  <input
                    {...register('googleCalendarId')}
                    placeholder="primary"
                    className="w-full p-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 focus:ring-2 ring-blue-500 outline-none font-mono text-sm"
                  />
                </div>

                {/* Integration Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  
                  {/* Logic: If NOT connected, show Connect. If Connected, show Sync & Disconnect */}
                  {!user?.is_google_connected ? (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm font-medium"
                    >
                      <CloudLightning className="w-4 h-4 text-yellow-500" />
                      Connect Google Account
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSyncGoogle}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Sync Now
                      </button>

                      <button
                        type="button"
                        onClick={handleDisconnectGoogle}
                        className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors shadow-sm font-medium"
                      >
                        <Unlink className="w-4 h-4" />
                        Disconnect
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}