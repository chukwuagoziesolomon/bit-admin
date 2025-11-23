'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout, getAuthToken } from '@/lib/auth';
import { Menu, LogOut, Plus, Trash2, Edit, Copy, Eye, Search, ChevronDown, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Types
interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

interface ProductData {
  id: number;
  name: string;
  slug: string;
  main_image: string;
  images: ProductImage[];
  short_description: string;
  brand_name: string;
  category_name: string;
}

interface Deal {
  id: number;
  product: number;
  product_data: ProductData;
  title: string;
  subtitle: string | null;
  deal_price: string;
  deal_price_usdt: string;
  original_price: string;
  discount_percentage: string;
  status: 'active' | 'scheduled' | 'expired' | 'cancelled';
  start_time: string;
  end_time: string;
  is_featured: boolean;
  max_quantity: number;
  sold_quantity: number;
  deal_image: string;
  deal_description: string;
  terms_and_conditions: string;
  cta_url: string;
  cta_url_display: string;
  created_at: string;
  updated_at: string;
}

interface CreateDealData {
  product: number;
  title: string;
  subtitle: string;
  deal_price: string;
  deal_price_usdt: string;
  original_price: string;
  start_time: string;
  end_time: string;
  is_featured: boolean;
  max_quantity: number;
  deal_image: string;
  deal_description: string;
  terms_and_conditions: string;
  cta_url: string;
}

interface ApiResponse {
  deals: Deal[];
  total: number;
}

export default function DailyDeals() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Data states
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'cancelled'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [createFormData, setCreateFormData] = useState<CreateDealData>({
    product: 0,
    title: '',
    subtitle: '',
    deal_price: '',
    deal_price_usdt: '',
    original_price: '',
    start_time: '',
    end_time: '',
    is_featured: true,
    max_quantity: 0,
    deal_image: '',
    deal_description: '',
    terms_and_conditions: '',
    cta_url: '',
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

  // Fetch deals
  useEffect(() => {
    if (isAuthenticated) {
      fetchDeals();
    }
  }, [isAuthenticated]);

  // Filter deals
  useEffect(() => {
    let filtered = deals;

    if (searchQuery) {
      filtered = filtered.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.product_data.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    setFilteredDeals(filtered);
  }, [deals, searchQuery, statusFilter]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/deals/`,
        {
          headers: { 'Authorization': `Token ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch deals');

      const data: ApiResponse = await response.json();
      setDeals(data.deals || []);
    } catch (err) {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.title.trim()) {
      toast.error('Deal title is required');
      return;
    }

    if (!createFormData.product) {
      toast.error('Please select a product');
      return;
    }

    if (parseFloat(createFormData.deal_price) >= parseFloat(createFormData.original_price)) {
      toast.error('Deal price must be less than original price');
      return;
    }

    if (new Date(createFormData.end_time) <= new Date(createFormData.start_time)) {
      toast.error('End time must be after start time');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/deals/create/`,
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
        throw new Error(error.error || 'Failed to create deal');
      }

      toast.success('✓ Deal created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        product: 0,
        title: '',
        subtitle: '',
        deal_price: '',
        deal_price_usdt: '',
        original_price: '',
        start_time: '',
        end_time: '',
        is_featured: true,
        max_quantity: 0,
        deal_image: '',
        deal_description: '',
        terms_and_conditions: '',
        cta_url: '',
      });
      fetchDeals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDeal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDeal) return;

    if (!createFormData.title.trim()) {
      toast.error('Deal title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/deals/${selectedDeal.id}/update/`,
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
        throw new Error(error.error || 'Failed to update deal');
      }

      toast.success('✓ Deal updated successfully');
      setShowEditModal(false);
      setSelectedDeal(null);
      fetchDeals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeal = async (dealId: number) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/deals/${dealId}/`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete deal');

      toast.success('✓ Deal deleted successfully');
      fetchDeals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete deal');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('✓ Copied to clipboard');
  };

  const handleLogout = () => {
    logout();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-200';
      case 'scheduled':
        return 'bg-blue-900 text-blue-200';
      case 'expired':
        return 'bg-gray-900 text-gray-200';
      case 'cancelled':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-slate-900 text-slate-200';
    }
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
                  Daily Deals Management
                </motion.h1>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>

              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Create Deal
                </button>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by deal title or product name..."
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
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Deals Table */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredDeals.length === 0 ? (
                <motion.div
                  className="bg-slate-700 rounded-lg p-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-slate-300">No deals found</p>
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
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Product</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Deal Title</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Pricing</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Duration</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Sales</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {filteredDeals.map((deal) => (
                          <motion.tr
                            key={deal.id}
                            className="hover:bg-slate-600 transition-colors"
                            whileHover={{ backgroundColor: '#475569' }}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {deal.product_data.main_image && (
                                  <img
                                    src={deal.product_data.main_image}
                                    alt={deal.product_data.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-white">{deal.product_data.name}</p>
                                  <p className="text-xs text-slate-400">{deal.product_data.category_name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-white">{deal.title}</p>
                                <p className="text-xs text-slate-400">{deal.subtitle}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <p className="text-green-400 font-semibold">₦{parseFloat(deal.deal_price).toLocaleString()}</p>
                                <p className="text-xs text-slate-400 line-through">₦{parseFloat(deal.original_price).toLocaleString()}</p>
                                <p className="text-xs text-yellow-400">{deal.discount_percentage}% off</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-300">
                                <p className="text-xs text-slate-400">Start: {new Date(deal.start_time).toLocaleDateString()}</p>
                                <p className="text-xs text-slate-400">End: {new Date(deal.end_time).toLocaleDateString()}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                {deal.max_quantity > 0 ? (
                                  <>
                                    <p className="text-white">{deal.sold_quantity} / {deal.max_quantity}</p>
                                    <p className="text-xs text-slate-400">
                                      {Math.round((deal.sold_quantity / deal.max_quantity) * 100)}% sold
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-slate-400">Unlimited</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deal.status)}`}>
                                {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedDeal(deal);
                                    setCreateFormData({
                                      product: deal.product,
                                      title: deal.title,
                                      subtitle: deal.subtitle || '',
                                      deal_price: deal.deal_price,
                                      deal_price_usdt: deal.deal_price_usdt,
                                      original_price: deal.original_price,
                                      start_time: deal.start_time.slice(0, 16),
                                      end_time: deal.end_time.slice(0, 16),
                                      is_featured: deal.is_featured,
                                      max_quantity: deal.max_quantity,
                                      deal_image: deal.deal_image,
                                      deal_description: deal.deal_description,
                                      terms_and_conditions: deal.terms_and_conditions,
                                      cta_url: deal.cta_url,
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 p-1"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteDeal(deal.id)}
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

          {/* Create Deal Modal */}
          {showCreateModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                className="bg-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Create New Deal</h2>

                <form onSubmit={handleCreateDeal} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Product ID *</label>
                      <input
                        type="number"
                        value={createFormData.product}
                        onChange={(e) => setCreateFormData({...createFormData, product: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Deal Title *</label>
                      <input
                        type="text"
                        value={createFormData.title}
                        onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Subtitle</label>
                    <input
                      type="text"
                      value={createFormData.subtitle}
                      onChange={(e) => setCreateFormData({...createFormData, subtitle: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Deal Price (₦) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={createFormData.deal_price}
                        onChange={(e) => setCreateFormData({...createFormData, deal_price: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Original Price (₦) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={createFormData.original_price}
                        onChange={(e) => setCreateFormData({...createFormData, original_price: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Start Time *</label>
                      <input
                        type="datetime-local"
                        value={createFormData.start_time}
                        onChange={(e) => setCreateFormData({...createFormData, start_time: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">End Time *</label>
                      <input
                        type="datetime-local"
                        value={createFormData.end_time}
                        onChange={(e) => setCreateFormData({...createFormData, end_time: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Max Quantity</label>
                      <input
                        type="number"
                        value={createFormData.max_quantity}
                        onChange={(e) => setCreateFormData({...createFormData, max_quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        placeholder="0 for unlimited"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createFormData.is_featured}
                        onChange={(e) => setCreateFormData({...createFormData, is_featured: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <label className="text-sm font-medium text-slate-300">Featured on Homepage</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Deal Description</label>
                    <textarea
                      value={createFormData.deal_description}
                      onChange={(e) => setCreateFormData({...createFormData, deal_description: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Terms & Conditions</label>
                    <textarea
                      value={createFormData.terms_and_conditions}
                      onChange={(e) => setCreateFormData({...createFormData, terms_and_conditions: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">CTA URL</label>
                    <input
                      type="text"
                      value={createFormData.cta_url}
                      onChange={(e) => setCreateFormData({...createFormData, cta_url: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      placeholder="/products/product-slug/"
                    />
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

          {/* Edit Deal Modal */}
          {showEditModal && selectedDeal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                className="bg-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Edit Deal</h2>

                <form onSubmit={handleEditDeal} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Deal Title *</label>
                      <input
                        type="text"
                        value={createFormData.title}
                        onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Subtitle</label>
                      <input
                        type="text"
                        value={createFormData.subtitle}
                        onChange={(e) => setCreateFormData({...createFormData, subtitle: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Deal Price (₦)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={createFormData.deal_price}
                        onChange={(e) => setCreateFormData({...createFormData, deal_price: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Original Price (₦)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={createFormData.original_price}
                        onChange={(e) => setCreateFormData({...createFormData, original_price: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={createFormData.start_time}
                        onChange={(e) => setCreateFormData({...createFormData, start_time: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={createFormData.end_time}
                        onChange={(e) => setCreateFormData({...createFormData, end_time: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Max Quantity</label>
                      <input
                        type="number"
                        value={createFormData.max_quantity}
                        onChange={(e) => setCreateFormData({...createFormData, max_quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createFormData.is_featured}
                        onChange={(e) => setCreateFormData({...createFormData, is_featured: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <label className="text-sm font-medium text-slate-300">Featured on Homepage</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Deal Description</label>
                    <textarea
                      value={createFormData.deal_description}
                      onChange={(e) => setCreateFormData({...createFormData, deal_description: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Terms & Conditions</label>
                    <textarea
                      value={createFormData.terms_and_conditions}
                      onChange={(e) => setCreateFormData({...createFormData, terms_and_conditions: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">CTA URL</label>
                    <input
                      type="text"
                      value={createFormData.cta_url}
                      onChange={(e) => setCreateFormData({...createFormData, cta_url: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedDeal(null);
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