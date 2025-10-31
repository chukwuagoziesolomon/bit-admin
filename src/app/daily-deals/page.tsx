'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Percent, Plus, Upload, X, Edit, Eye, Package, AlertTriangle, Calendar, Clock, Menu } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface DailyDealFormData {
  product: string;
  title: string;
  subtitle: string;
  deal_price: string;
  deal_price_usdt: string;
  original_price: string;
  start_time: string;
  end_time: string;
  is_featured: boolean;
  max_quantity: string;
  deal_image: File | null;
  deal_description: string;
  terms_and_conditions: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  main_image: string;
  sku: string;
}

interface DailyDeal {
  id: number;
  product: Product;
  title: string;
  subtitle: string;
  deal_price: number;
  original_price: number;
  discount_percentage: number;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'active' | 'expired';
  is_featured: boolean;
  max_quantity: number | null;
  deal_image: string | null;
  deal_description: string;
  terms_and_conditions: string;
  created_at: string;
}

export default function DailyDeals() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<DailyDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealImage, setDealImage] = useState<File | null>(null);
  const [formData, setFormData] = useState<DailyDealFormData>({
    product: '',
    title: '',
    subtitle: '',
    deal_price: '',
    deal_price_usdt: '',
    original_price: '',
    start_time: '',
    end_time: '',
    is_featured: false,
    max_quantity: '',
    deal_image: null,
    deal_description: '',
    terms_and_conditions: '',
  });

  useEffect(() => {
    if (activeTab === 'list') {
      fetchDeals();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/deals/available-products/?per_page=1000`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch available products');
      }
      const result = await response.json();
      setProducts(result.products || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch available products');
    }
  };

  const fetchDeals = async () => {
    setDealsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/deals/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch deals');
      }
      const result = await response.json();
      setDeals(result.results || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch deals');
    } finally {
      setDealsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setDealImage(files[0]);
  };

  const removeImage = () => {
    setDealImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          formDataToSend.append(key, String(value));
        }
      });

      if (dealImage) {
        formDataToSend.append('deal_image', dealImage);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/deals/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessages = Object.entries(result)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n');
        throw new Error(errorMessages);
      }

      toast.success('Daily deal created successfully!');

      setFormData({
        product: '',
        title: '',
        subtitle: '',
        deal_price: '',
        deal_price_usdt: '',
        original_price: '',
        start_time: '',
        end_time: '',
        is_featured: false,
        max_quantity: '',
        deal_image: null,
        deal_description: '',
        terms_and_conditions: '',
      });
      setDealImage(null);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create daily deal');
    } finally {
      setLoading(false);
    }
  };

  const toggleDealStatus = async (dealId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/deals/${dealId}/toggle-status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle deal status');
      }

      const result = await response.json();
      toast.success(result.message || 'Deal status updated successfully');
      fetchDeals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update deal status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600 text-white';
      case 'scheduled':
        return 'bg-blue-600 text-white';
      case 'expired':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        {/* Sidebar placeholder */}
      </div>

      <main className="flex-1 p-4 md:p-8 bg-slate-800 overflow-auto">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-30 p-2 bg-slate-700 rounded-lg text-white"
        >
          <Menu size={20} />
        </button>

        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Plus size={20} />
              Create Deal
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Percent size={20} />
              All Deals
            </button>
          </div>

          {activeTab === 'create' && (
            <motion.div
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Percent className="text-blue-400" size={32} />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Create Daily Deal</h1>
                <p className="text-slate-400">Set up a special deal for your customers</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'list' && (
            <motion.div
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Percent className="text-green-400" size={32} />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">All Daily Deals</h1>
                <p className="text-slate-400">Manage your daily deals and promotions</p>
              </div>
            </motion.div>
          )}

          {/* Deals List Tab */}
          {activeTab === 'list' && (
            <motion.div
              className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {dealsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : deals.length === 0 ? (
                <div className="text-center p-8">
                  <Percent className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-400">No deals found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Deal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {deals.map((deal, index) => (
                        <motion.tr
                          key={deal.id}
                          className="hover:bg-slate-600 transition-colors"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={deal.deal_image || deal.product.main_image}
                                alt={deal.title}
                                className="w-12 h-12 rounded-lg object-cover mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-white">{deal.title}</div>
                                <div className="text-sm text-slate-400">{deal.subtitle}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{deal.product.name}</div>
                            <div className="text-sm text-slate-400">{deal.product.sku}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              ₦{deal.deal_price?.toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-400 line-through">
                              ₦{deal.original_price?.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">
                              {new Date(deal.start_time).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-slate-400">
                              {new Date(deal.start_time).toLocaleTimeString()} - {new Date(deal.end_time).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deal.status)}`}>
                              {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit Deal"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="text-green-400 hover:text-green-300 transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => toggleDealStatus(deal.id)}
                                className="text-orange-400 hover:text-orange-300 transition-colors"
                                title="Toggle Status"
                              >
                                <AlertTriangle size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Create Deal Form */}
          {activeTab === 'create' && (
            <motion.form
              onSubmit={handleSubmit}
              className="bg-slate-700 p-6 rounded-lg shadow-lg space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Product *
                  </label>
                  <select
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₦{product.price?.toLocaleString()} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Deal Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                    placeholder="e.g., Deal of the Day - iPhone 15 Pro"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Deal Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="e.g., Limited time offer on premium smartphone"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Deal Price (₦) *
                  </label>
                  <input
                    type="number"
                    name="deal_price"
                    value={formData.deal_price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Deal Price (USDT)
                  </label>
                  <input
                    type="number"
                    name="deal_price_usdt"
                    value={formData.deal_price_usdt}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Original Price (₦) *
                  </label>
                  <input
                    type="number"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Quantity
                  </label>
                  <input
                    type="number"
                    name="max_quantity"
                    value={formData.max_quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Optional limit"
                  />
                </div>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  />
                </div>
              </div>

              {/* Description and Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Deal Description
                  </label>
                  <textarea
                    name="deal_description"
                    value={formData.deal_description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Describe the deal..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="terms_and_conditions"
                    value={formData.terms_and_conditions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Terms and conditions..."
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deal Image (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-500 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="dealImage"
                  />
                  <label htmlFor="dealImage" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                    <p className="text-slate-400">Click to upload deal image</p>
                  </label>
                  {dealImage && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-white text-sm">{dealImage.name}</span>
                      <X
                        size={16}
                        className="cursor-pointer text-red-400 hover:text-red-300"
                        onClick={removeImage}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="rounded border-slate-500 bg-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-300">Show on homepage</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Deal...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Create Deal
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </main>

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