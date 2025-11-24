'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout, getAuthToken } from '@/lib/auth';
import { Menu, LogOut, Plus, Trash2, Edit, Search, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Types
interface ShippingPrice {
  id: number;
  state_name: string;
  shipping_price: string;
  shipping_price_usdt?: string;
  is_active: boolean;
  is_free_shipping?: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateShippingPriceData {
  state_name: string;
  shipping_price: string;
  shipping_price_usdt: string;
  is_active: boolean;
}

interface ApiResponse {
  prices: ShippingPrice[];
  pagination: {
    current_page: number;
    per_page: number;
    total_prices: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  statistics: {
    total_prices: number;
    active_prices: number;
    inactive_prices: number;
    free_shipping_states: number;
  };
}

export default function Shipping() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Data states
  const [prices, setPrices] = useState<ShippingPrice[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<ShippingPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_prices: 0,
    active_prices: 0,
    inactive_prices: 0,
    free_shipping_states: 0,
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<ShippingPrice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [createFormData, setCreateFormData] = useState<CreateShippingPriceData>({
    state_name: '',
    shipping_price: '',
    shipping_price_usdt: '',
    is_active: true,
  });

  // Auth check
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
  }, [router]);

  // Fetch prices
  useEffect(() => {
    if (isAuthenticated) {
      fetchPrices();
    }
  }, [isAuthenticated]);

  // Filter prices
  useEffect(() => {
    let filtered = prices;

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.state_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter((p) => p.is_active === isActive);
    }

    setFilteredPrices(filtered);
  }, [prices, searchQuery, statusFilter]);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shipping/interstate-prices/`,
        {
          headers: { 'Authorization': `Token ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch shipping prices');

      const data: ApiResponse = await response.json();
      setPrices(data.prices || []);
      setStats(data.statistics || {
        total_prices: 0,
        active_prices: 0,
        inactive_prices: 0,
        free_shipping_states: 0,
      });
    } catch (err) {
      toast.error('Failed to load shipping prices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.state_name.trim()) {
      toast.error('State name is required');
      return;
    }

    if (!createFormData.shipping_price) {
      toast.error('Shipping price is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shipping/interstate-prices/create/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createFormData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create shipping price');
      }

      toast.success('✓ Shipping price created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        state_name: '',
        shipping_price: '',
        shipping_price_usdt: '',
        is_active: true,
      });
      fetchPrices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create shipping price');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPrice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPrice) return;

    if (!createFormData.state_name.trim()) {
      toast.error('State name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shipping/interstate-prices/${selectedPrice.id}/update/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createFormData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update shipping price');
      }

      toast.success('✓ Shipping price updated successfully');
      setShowEditModal(false);
      setSelectedPrice(null);
      fetchPrices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update shipping price');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrice = async (priceId: number) => {
    if (!confirm('Are you sure you want to delete this shipping price?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shipping/interstate-prices/${priceId}/`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete shipping price');

      toast.success('✓ Shipping price deleted successfully');
      fetchPrices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete shipping price');
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <ProtectedRoute>
        <div className="flex h-screen bg-slate-900">
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 p-4 md:p-8 bg-slate-800 overflow-auto">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden fixed top-4 left-4 z-30 p-2 bg-slate-700 rounded-lg text-white"
            >
              <Menu size={20} />
            </button>

            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <motion.h1
                  className="text-2xl md:text-3xl font-bold gradient-text"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  Shipping Price Management
                </motion.h1>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <motion.div
                  className="bg-slate-700 rounded-lg p-4 border-l-4 border-blue-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-slate-400 text-sm">Total States</p>
                  <p className="text-2xl font-bold text-white">{stats.total_prices}</p>
                </motion.div>

                <motion.div
                  className="bg-slate-700 rounded-lg p-4 border-l-4 border-green-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-slate-400 text-sm">Active</p>
                  <p className="text-2xl font-bold text-white">{stats.active_prices}</p>
                </motion.div>

                <motion.div
                  className="bg-slate-700 rounded-lg p-4 border-l-4 border-orange-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-slate-400 text-sm">Inactive</p>
                  <p className="text-2xl font-bold text-white">{stats.inactive_prices}</p>
                </motion.div>

                <motion.div
                  className="bg-slate-700 rounded-lg p-4 border-l-4 border-purple-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-slate-400 text-sm">Free Shipping</p>
                  <p className="text-2xl font-bold text-white">{stats.free_shipping_states}</p>
                </motion.div>
              </div>

              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Add Shipping Price
                </button>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by state name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Prices Table */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredPrices.length === 0 ? (
                <motion.div
                  className="bg-slate-700 rounded-lg p-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-slate-300">No shipping prices found</p>
                </motion.div>
              ) : (
                <motion.div
                  className="bg-slate-700 rounded-lg overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">State Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Price (₦)</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Price (USDT)</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Created</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {filteredPrices.map((price) => (
                          <motion.tr
                            key={price.id}
                            className="hover:bg-slate-600 transition-colors"
                            whileHover={{ backgroundColor: '#475569' }}
                          >
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-white">{price.state_name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-green-400">₦{parseFloat(price.shipping_price).toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-300">${price.shipping_price_usdt || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                price.is_active
                                  ? 'bg-green-900 text-green-200'
                                  : 'bg-red-900 text-red-200'
                              }`}>
                                {price.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-slate-400">{new Date(price.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedPrice(price);
                                    setCreateFormData({
                                      state_name: price.state_name,
                                      shipping_price: price.shipping_price,
                                      shipping_price_usdt: price.shipping_price_usdt || '',
                                      is_active: price.is_active,
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 p-1"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePrice(price.id)}
                                  className="text-red-400 hover:text-red-300 p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </div>
          </main>

          {/* Create Shipping Price Modal */}
          {showCreateModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                className="bg-slate-700 rounded-lg p-6 w-full max-w-md"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Add New Shipping Price</h2>

                <form onSubmit={handleCreatePrice} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">State Name *</label>
                    <input
                      type="text"
                      value={createFormData.state_name}
                      onChange={(e) => setCreateFormData({...createFormData, state_name: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Lagos, Abuja, Kano"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Price (₦) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.shipping_price}
                      onChange={(e) => setCreateFormData({...createFormData, shipping_price: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Price (USDT)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.shipping_price_usdt}
                      onChange={(e) => setCreateFormData({...createFormData, shipping_price_usdt: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1.02"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={createFormData.is_active}
                      onChange={(e) => setCreateFormData({...createFormData, is_active: e.target.checked})}
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm font-medium text-slate-300">Active</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600"
                    >
                      {isSubmitting ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Edit Shipping Price Modal */}
          {showEditModal && selectedPrice && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                className="bg-slate-700 rounded-lg p-6 w-full max-w-md"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Edit Shipping Price</h2>

                <form onSubmit={handleEditPrice} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">State Name *</label>
                    <input
                      type="text"
                      value={createFormData.state_name}
                      onChange={(e) => setCreateFormData({...createFormData, state_name: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Price (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.shipping_price}
                      onChange={(e) => setCreateFormData({...createFormData, shipping_price: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Price (USDT)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.shipping_price_usdt}
                      onChange={(e) => setCreateFormData({...createFormData, shipping_price_usdt: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={createFormData.is_active}
                      onChange={(e) => setCreateFormData({...createFormData, is_active: e.target.checked})}
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm font-medium text-slate-300">Active</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedPrice(null);
                      }}
                      className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600"
                    >
                      {isSubmitting ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </div>
      </ProtectedRoute>

      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
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
    </>
  );
}
