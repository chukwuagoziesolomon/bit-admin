'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Folder, Upload, Image } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';

interface CategoryFormData {
  name: string;
  display_name: string;
  description: string;
  image: string;
}

export default function Categories() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    display_name: '',
    description: '',
    image: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setImageFile(files[0]);
    }
  };

  const removeImage = () => {
    setImageFile(null);
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

      // Add image if provided
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/add/`, {
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

      toast.success('Category created successfully!');

      // Reset form
      setFormData({
        name: '',
        display_name: '',
        description: '',
        image: '',
      });
      setImageFile(null);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
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

        <div className="max-w-4xl mx-auto">
          <motion.div
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Folder className="text-blue-400" size={32} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">Create New Category</h1>
              <p className="text-slate-400">Add a new category to your catalog</p>
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="e.g., tablets"
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
                  placeholder="e.g., Tablets"
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
                placeholder="Describe the category..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category Image
              </label>
              <div className="border-2 border-dashed border-slate-500 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="categoryImage"
                />
                <label htmlFor="categoryImage" className="cursor-pointer">
                  <Upload className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-400 mb-2">Click to upload category image</p>
                  <p className="text-slate-500 text-sm">Recommended: Square image, Max 2MB</p>
                </label>
                {imageFile && (
                  <div className="mt-4">
                    <div className="inline-flex items-center gap-2 bg-slate-600 px-4 py-2 rounded-lg">
                      <Image className="text-blue-400" size={16} />
                      <span className="text-white text-sm">{imageFile.name}</span>
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
                    Creating Category...
                  </>
                ) : (
                  <>
                    <Folder size={20} />
                    Create Category
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