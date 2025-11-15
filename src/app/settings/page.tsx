'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';

interface SiteSettings {
   tax_percentage: number;
   tax_amount: number;
   shipping_amount: number;
   default_interstate_shipping_fee: number;
   current_admin_state: string;
   current_admin_city: string;
   nigerian_states: string[];
   updated_at: string;
 }

interface InterstatePrice {
   id: number;
   state_name: string;
   shipping_price: string;
   is_active: boolean;
   is_free_shipping: boolean;
   created_at: string;
   updated_at: string;
 }

export default function Settings() {
   const [sidebarOpen, setSidebarOpen] = useState(true);
   const [settings, setSettings] = useState<SiteSettings | null>(null);
   const [interstatePrices, setInterstatePrices] = useState<InterstatePrice[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newStateName, setNewStateName] = useState('');
   const [newStatePrice, setNewStatePrice] = useState('');
   const [newStateActive, setNewStateActive] = useState(true);
   const [newStateFreeShipping, setNewStateFreeShipping] = useState(false);

  const fetchInterstatePrices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shipping/interstate-prices/?per_page=1000`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch interstate prices');
      }
      const result = await response.json();
      setInterstatePrices(result.prices || []);
    } catch (err) {
      console.error('Error fetching interstate prices:', err);
    }
  };

  const updateInterstatePrice = async (id: number, updates: Partial<InterstatePrice>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shipping/interstate-prices/${id}/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update price');
      }
      const result = await response.json();
      setInterstatePrices(prev => prev.map(p => p.id === id ? result.price : p));
      toast.success('Price updated successfully');
    } catch (err) {
      toast.error('Failed to update price');
    }
  };

  const removeInterstatePrice = async (id: number) => {
    // Since no delete API, set inactive
    await updateInterstatePrice(id, { is_active: false });
  };

  const openAddStateModal = () => {
    setNewStateName('');
    setNewStatePrice('');
    setNewStateActive(true);
    setNewStateFreeShipping(false);
    setIsModalOpen(true);
  };

  const handleAddState = async () => {
    const stateName = newStateName.trim();
    const price = parseFloat(newStatePrice);

    if (!stateName) {
      toast.error('Please enter a state name');
      return;
    }

    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price (must be 0 or greater)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shipping/interstate-prices/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          state_name: stateName,
          shipping_price: price.toString(),
          is_active: newStateActive,
          is_free_shipping: newStateFreeShipping,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create price');
      }
      const result = await response.json();
      setInterstatePrices(prev => [...prev, result.price]);
      setIsModalOpen(false);
      toast.success(`Added ${stateName} with price ₦${price.toLocaleString()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add state');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch settings
        const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/site/settings/`, {
          headers: {
            'Authorization': `Token ${token}`,
          },
        });
        if (!settingsResponse.ok) {
          throw new Error('Failed to fetch settings');
        }
        const settingsResult: SiteSettings = await settingsResponse.json();
        setSettings(settingsResult);

        // Fetch interstate prices
        await fetchInterstatePrices();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setValidationErrors(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/site/settings/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          tax_percentage: settings.tax_percentage,
          default_interstate_shipping_fee: settings.default_interstate_shipping_fee,
          current_admin_state: settings.current_admin_state,
          current_admin_city: settings.current_admin_city,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error && result.details) {
          setValidationErrors(result.details);
          return;
        }
        throw new Error(result.error || 'Failed to update settings');
      }

      setSettings(result.settings);
      toast.success(result.message || 'Settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-8 bg-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </main>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="flex h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-8 bg-slate-800 flex items-center justify-center">
          <div className="bg-red-600 text-white p-4 rounded-lg">
            Error: {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 p-4 md:p-8 bg-slate-800 overflow-auto">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-30 p-2 bg-slate-700 rounded-lg text-white"
        >
          <Menu size={20} />
        </button>

        <div className="max-w-4xl mx-auto">
          <motion.h1
            className="text-2xl md:text-3xl font-bold gradient-text mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Site Settings
          </motion.h1>

          <motion.div
            className="bg-slate-700 p-6 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tax Percentage
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.tax_percentage || 0}
                  onChange={(e) => setSettings({ ...settings, tax_percentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Default Interstate Shipping Fee (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.default_interstate_shipping_fee || 0}
                  onChange={(e) => setSettings({ ...settings, default_interstate_shipping_fee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Admin State
                </label>
                <select
                  value={settings.current_admin_state || ''}
                  onChange={(e) => setSettings({ ...settings, current_admin_state: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  {(settings.nigerian_states || []).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Admin City
                </label>
                <input
                  type="text"
                  value={settings.current_admin_city || ''}
                  onChange={(e) => setSettings({ ...settings, current_admin_city: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Interstate Shipment Prices</h3>
              <div className="bg-slate-600 p-4 rounded-lg">
                <div className="space-y-4 mb-4">
                  {interstatePrices.map((price) => (
                    <div key={price.id} className="flex items-center gap-4 p-3 bg-slate-700 rounded">
                      <span className="text-slate-300 w-32 font-medium">{price.state_name}:</span>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-slate-400">₦</span>
                        <input
                          type="number"
                          value={price.shipping_price}
                          onChange={(e) => updateInterstatePrice(price.id, { shipping_price: e.target.value })}
                          className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={price.is_active}
                            onChange={(e) => updateInterstatePrice(price.id, { is_active: e.target.checked })}
                            className="rounded"
                          />
                          Active
                        </label>
                        <label className="flex items-center gap-1 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={price.is_free_shipping}
                            onChange={(e) => updateInterstatePrice(price.id, { is_free_shipping: e.target.checked })}
                            className="rounded"
                          />
                          Free
                        </label>
                      </div>
                      <button
                        onClick={() => removeInterstatePrice(price.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                      >
                        Deactivate
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={openAddStateModal}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  + Add New State
                </button>
              </div>
            </div>

            {validationErrors && (
              <div className="mt-6 p-4 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
                <h4 className="text-red-400 font-semibold mb-2">Validation Errors:</h4>
                <ul className="text-red-300 text-sm">
                  {Object.entries(validationErrors).map(([field, errors]) => (
                    <li key={field}>
                      <span className="font-medium capitalize">{field.replace('_', ' ')}:</span> {errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Add State Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-slate-800 p-6 rounded-lg w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Add New State</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  State Name
                </label>
                <input
                  type="text"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                  placeholder="Enter state name (e.g., Rivers)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Shipment Price (₦)
                </label>
                <input
                  type="number"
                  value={newStatePrice}
                  onChange={(e) => setNewStatePrice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                  placeholder="Enter price (e.g., 10000)"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={newStateActive}
                    onChange={(e) => setNewStateActive(e.target.checked)}
                    className="rounded"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={newStateFreeShipping}
                    onChange={(e) => setNewStateFreeShipping(e.target.checked)}
                    className="rounded"
                  />
                  Free Shipping
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddState}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add State
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #475569',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
    </div>
  );
}