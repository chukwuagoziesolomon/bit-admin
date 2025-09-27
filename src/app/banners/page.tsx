'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Upload, Image as ImageIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';

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

interface BannerFormData {
  title: string;
  subtitle: string;
  banner_type: string;
  link_type: string;
  target_product: string;
  target_category: string;
  external_url: string;
  button_text: string;
  is_active: boolean;
  display_order: string;
  start_date: string;
  end_date: string;
}

export default function Banners() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    banner_type: 'hero',
    link_type: 'none',
    target_product: '',
    target_category: '',
    external_url: '',
    button_text: 'Shop Now',
    is_active: true,
    display_order: '0',
    start_date: '',
    end_date: '',
  });

  // Mock data - in real app, fetch from API
  useEffect(() => {
    setProducts([
      { id: 1, name: 'iPhone 15 Pro', slug: 'iphone-15-pro' },
      { id: 2, name: 'Samsung Galaxy S24', slug: 'samsung-galaxy-s24' },
      { id: 3, name: 'MacBook Pro 16"', slug: 'macbook-pro-16' },
    ]);

    setCategories([
      { id: 1, name: 'phones', display_name: 'Phones' },
      { id: 2, name: 'laptops', display_name: 'Laptops' },
      { id: 3, name: 'tablets', display_name: 'Tablets' },
      { id: 4, name: 'accessories', display_name: 'Accessories' },
    ]);
  }, []);

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

      // Add image
      if (bannerImage) {
        formDataToSend.append('image', bannerImage);
      } else {
        throw new Error('Banner image is required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/banners/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
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
        link_type: 'none',
        target_product: '',
        target_category: '',
        external_url: '',
        button_text: 'Shop Now',
        is_active: true,
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

  const linkTypes = [
    { value: 'none', label: 'No Link' },
    { value: 'product', label: 'Product Page' },
    { value: 'category', label: 'Category Page' },
    { value: 'external', label: 'External URL' },
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

        <div className="max-w-4xl mx-auto">
          <motion.div
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ImageIcon className="text-blue-400" size={32} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">Create New Banner</h1>
              <p className="text-slate-400">Add a new banner to your website</p>
            </div>
          </motion.div>

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
                  Link Type
                </label>
                <select
                  name="link_type"
                  value={formData.link_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  {linkTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Link Fields */}
            {formData.link_type === 'product' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Product *
                </label>
                <select
                  name="target_product"
                  value={formData.target_product}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required={formData.link_type === 'product'}
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.link_type === 'category' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Category *
                </label>
                <select
                  name="target_category"
                  value={formData.target_category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required={formData.link_type === 'category'}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.display_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.link_type === 'external' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  External URL *
                </label>
                <input
                  type="url"
                  name="external_url"
                  value={formData.external_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="https://example.com"
                  required={formData.link_type === 'external'}
                />
              </div>
            )}

            {/* Button & Display Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  name="button_text"
                  value={formData.button_text}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Shop Now"
                />
              </div>

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

            {/* Settings */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded border-slate-500 bg-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-300">Banner is Active/Visible</span>
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