'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Tag, Upload, Globe, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';

interface BrandFormData {
  name: string;
  display_name: string;
  description: string;
  website: string;
  is_active: boolean;
}

interface Brand {
  id: number;
  name: string;
  display_name: string;
  description: string;
  logo: string | null;
  website: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export default function Brands() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    display_name: '',
    description: '',
    website: '',
    is_active: true,
  });

  useEffect(() => {
    if (activeTab === 'list') {
      fetchBrands();
    }
  }, [activeTab]);

  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/brands/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const result = await response.json();
      setBrands(result.results || result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch brands');
    } finally {
      setBrandsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setLogoFile(files[0]);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      display_name: brand.display_name,
      description: brand.description,
      website: brand.website,
      is_active: brand.is_active,
    });
    setActiveTab('create');
  };

  const handleDelete = async (brandId: number) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/brands/${brandId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete brand');
      }

      toast.success('Brand deleted successfully!');
      fetchBrands();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete brand');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, String(value));
      });

      // Add logo if provided
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const method = editingBrand ? 'PUT' : 'POST';
      const url = editingBrand
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/brands/${editingBrand.id}/`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/brands/`;

      const response = await fetch(url, {
        method,
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

      toast.success(editingBrand ? 'Brand updated successfully!' : 'Brand created successfully!');

      // Reset form
      setFormData({
        name: '',
        display_name: '',
        description: '',
        website: '',
        is_active: true,
      });
      setLogoFile(null);
      setEditingBrand(null);

      if (activeTab === 'list') {
        fetchBrands();
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create brand');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Tag className="text-blue-400" size={32} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Brand Management</h1>
              <p className="text-slate-400">Create, view, edit, and manage brands</p>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => {
                setActiveTab('create');
                setEditingBrand(null);
                setFormData({
                  name: '',
                  display_name: '',
                  description: '',
                  website: '',
                  is_active: true,
                });
                setLogoFile(null);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Plus size={20} />
              {editingBrand ? 'Edit Brand' : 'Create Brand'}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Eye size={20} />
              All Brands
            </button>
          </div>

          {/* Create/Edit Brand Tab */}
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="e.g., apple"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Unique identifier, lowercase, no spaces</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="e.g., Apple Inc."
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Name displayed to customers</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="Describe the brand..."
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Brand Logo
              </label>
              <div className="border-2 border-dashed border-slate-500 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="brandLogo"
                />
                <label htmlFor="brandLogo" className="cursor-pointer">
                  <Upload className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-400 mb-2">Click to upload brand logo</p>
                  <p className="text-slate-500 text-sm">Recommended: Square image, Max 2MB</p>
                </label>
                {logoFile && (
                  <div className="mt-4">
                    <div className="inline-flex items-center gap-2 bg-slate-600 px-4 py-2 rounded-lg">
                      <Tag className="text-blue-400" size={16} />
                      <span className="text-white text-sm">{logoFile.name}</span>
                      <button
                        type="button"
                        onClick={removeLogo}
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
                <span className="text-slate-300">Brand is Active/Visible</span>
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
                    {editingBrand ? 'Updating Brand...' : 'Creating Brand...'}
                  </>
                ) : (
                  <>
                    <Tag size={20} />
                    {editingBrand ? 'Update Brand' : 'Create Brand'}
                  </>
                )}
              </button>
            </div>
          </motion.form>
         )}

         {/* All Brands Tab */}
         {activeTab === 'list' && (
           <motion.div
             className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2, duration: 0.6 }}
           >
             <div className="px-6 py-4 bg-slate-600">
               <h2 className="text-lg font-semibold text-white">All Brands</h2>
               <p className="text-slate-400 text-sm">Manage your brand catalog</p>
             </div>

             {brandsLoading ? (
               <div className="flex items-center justify-center p-8">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
               </div>
             ) : brands.length === 0 ? (
               <div className="text-center p-8">
                 <Tag className="mx-auto mb-4 text-slate-400" size={48} />
                 <p className="text-slate-400">No brands found</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-slate-600">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                         Brand
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                         Website
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                         Products
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
                     {brands.map((brand, index) => (
                       <motion.tr
                         key={brand.id}
                         className="hover:bg-slate-600 transition-colors"
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: index * 0.05, duration: 0.4 }}
                       >
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center">
                             {brand.logo && (
                               <img
                                 src={brand.logo}
                                 alt={brand.display_name}
                                 className="w-10 h-10 rounded-lg object-cover mr-3"
                               />
                             )}
                             <div>
                               <div className="text-sm font-medium text-white">{brand.display_name}</div>
                               <div className="text-sm text-slate-400">@{brand.name}</div>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           {brand.website ? (
                             <a
                               href={brand.website}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-blue-400 hover:text-blue-300 text-sm"
                             >
                               {brand.website}
                             </a>
                           ) : (
                             <span className="text-slate-500 text-sm">No website</span>
                           )}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-white">{brand.product_count || 0}</div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                             brand.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                           }`}>
                             {brand.is_active ? 'Active' : 'Inactive'}
                           </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                           <div className="flex gap-2">
                             <button
                               onClick={() => handleEdit(brand)}
                               className="text-blue-400 hover:text-blue-300 transition-colors"
                               title="Edit Brand"
                             >
                               <Edit size={16} />
                             </button>
                             <button
                               onClick={() => handleDelete(brand.id)}
                               className="text-red-400 hover:text-red-300 transition-colors"
                               title="Delete Brand"
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
             )}
           </motion.div>
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