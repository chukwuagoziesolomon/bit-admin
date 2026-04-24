'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Upload, Image as ImageIcon, Trash2, Eye, RefreshCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  display_name: string;
}

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  banner_type: string;
  link_type: string;
  image: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  external_url?: string;
  button_text?: string;
  target_product?: string | number;
  target_category?: string | number;
}

interface BannerFormData {
  title: string;
  subtitle: string;
  banner_type: string;
  banner_url: string;
  display_order: string;
  start_date: string;
  end_date: string;
}

export default function Banners() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [loading, setLoading] = useState(false);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [existingBannerImageUrl, setExistingBannerImageUrl] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    banner_type: 'hero',
    banner_url: '',
    display_order: '0',
    start_date: '',
    end_date: '',
  });

  // Mock data - in real app, fetch from API
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/banners/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }

      const json = await response.json();
      const data = json.data ?? json;
      setBanners(data.banners || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch banners');
    } finally {
      setBannersLoading(false);
    }
  };

  const deleteBanner = async (bannerId: number) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    setDeleting(bannerId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/banners/${bannerId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete banner');
      }

      toast.success('Banner deleted successfully!');
      fetchBanners();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete banner');
    } finally {
      setDeleting(null);
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
    if (files && files[0]) {
      setBannerImage(files[0]);
    }
  };

  const removeImage = () => {
    setBannerImage(null);
  };

  const editBanner = (banner: Banner) => {
    setActiveTab('create');
    setEditingBannerId(banner.id);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      banner_type: banner.banner_type || 'hero',
      banner_url: '',
      display_order: String(banner.display_order || 0),
      start_date: '',
      end_date: '',
    });
    setBannerImage(null);
    setExistingBannerImageUrl(banner.image || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });

      // Add image (allow using existing image URL when editing)
      if (bannerImage) {
        formDataToSend.append('image', bannerImage);
      } else if (existingBannerImageUrl) {
        formDataToSend.append('image_url', existingBannerImageUrl);
      } else if (!editingBannerId) {
        throw new Error('Banner image is required');
      }

      // Determine endpoint and method for create vs edit
      const baseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/banners`;
      const endpoint = editingBannerId ? `${baseUrl}/${editingBannerId}/` : `${baseUrl}/`;
      const method = editingBannerId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors
        const errorMessages = Object.entries(result)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n');
        throw new Error(errorMessages);
      }

      toast.success('Banner created successfully!');

      // Reset form
      setFormData({
        title: '',
        subtitle: '',
        banner_type: 'hero',
        banner_url: '',
        display_order: '0',
        start_date: '',
        end_date: '',
      });
      setBannerImage(null);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create banner');
    } finally {
      setLoading(false);
    }
  };

  const bannerTypes = [
    { value: 'hero', label: 'Hero Banner' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'category', label: 'Category' },
    { value: 'seasonal', label: 'Seasonal' },
  ];

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

        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ImageIcon className="text-blue-400" size={32} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Banners Management</h1>
              <p className="text-slate-400">Create and manage website banners</p>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Eye size={20} />
              View Banners
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Upload size={20} />
              Create Banner
            </button>
          </div>

          {/* List View */}
          {activeTab === 'list' && (
            <motion.div
              className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="px-6 py-4 bg-slate-600 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">All Banners</h2>
                  <p className="text-slate-400 text-sm">View and manage all website banners</p>
                </div>
                <button
                  onClick={fetchBanners}
                  disabled={bannersLoading}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-50"
                >
                  <RefreshCw size={20} className={bannersLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {bannersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : banners.length === 0 ? (
                <div className="text-center p-8">
                  <ImageIcon className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-400">No banners found</p>
                  <p className="text-slate-500 text-sm mt-2">Create your first banner to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {banners.map((banner, index) => (
                        <motion.tr
                          key={banner.id}
                          className="hover:bg-slate-600 transition-colors"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-600">
                              {banner.image && (
                                <Image
                                  src={banner.image}
                                  alt={banner.title}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-white">{banner.title}</div>
                              <div className="text-xs text-slate-400">{banner.subtitle}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-slate-600 text-slate-300 rounded">
                              {banner.banner_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                banner.is_active
                                  ? 'bg-green-600 text-white'
                                  : 'bg-red-600 text-white'
                              }`}
                            >
                              {banner.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-300">{banner.display_order}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => editBanner(banner)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit Banner"
                              >
                                <ImageIcon size={16} />
                              </button>
                              <button
                                onClick={() => deleteBanner(banner.id)}
                                disabled={deleting === banner.id}
                                className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:opacity-50 transition-colors"
                                title="Delete Banner"
                              >
                                {deleting === banner.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                                ) : (
                                  <Trash2 size={16} />
                                )}
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

          {/* Create Form */}
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
                  Banner Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Optional subtitle text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Banner Type
                </label>
                <select
                  name="banner_type"
                  value={formData.banner_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  {bannerTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Banner Details Link
                </label>
                <input
                  type="text"
                  name="banner_url"
                  value={formData.banner_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Paste link to banner details"
                />
              </div>
            </div>

            {/* Display Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            {/* Date Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            {/* Banner Image */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Banner Image *
              </label>
              <div className="border-2 border-dashed border-slate-500 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="bannerImage"
                  required
                />
                <label htmlFor="bannerImage" className="cursor-pointer">
                  <Upload className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-400 mb-2">Click to upload banner image</p>
                  <p className="text-slate-500 text-sm">Recommended: 1920x600px, Max 5MB</p>
                </label>
                {bannerImage && (
                  <div className="mt-4">
                    <div className="inline-flex items-center gap-2 bg-slate-600 px-4 py-2 rounded-lg">
                      <ImageIcon size={16} className="text-blue-400" />
                      <span className="text-white text-sm">{bannerImage.name}</span>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                    Creating Banner...
                  </>
                ) : (
                  <>
                    <ImageIcon size={20} />
                    Create Banner
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