'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Menu, Folder, Upload, Image, Edit, Trash2, RotateCcw, Plus, Eye } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';

interface CategoryFormData {
  name: string;
  display_name: string;
  description: string;
  image: string;
}

interface Category {
  id: number;
  name: string;
  display_name: string;
  description: string;
  image?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export default function Categories() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    display_name: '',
    description: '',
    image: '',
  });

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [showDeleted]); // loadCategories is stable, no need to include in deps

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const token = localStorage.getItem('token');
      const url = showDeleted 
        ? '/api/admin/categories?include_deleted=true'
        : '/api/admin/categories';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load categories');
      
      const result = await response.json();
      setCategories(result.categories || []);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } finally {
      setLoadingCategories(false);
    }
  };

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
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories/create';
      
      const method = editingCategory ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save category');
      }

      toast.success(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');

      // Reset form and reload categories
      setFormData({
        name: '',
        display_name: '',
        description: '',
        image: '',
      });
      setImageFile(null);
      setShowCreateForm(false);
      setEditingCategory(null);
      loadCategories();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      display_name: category.display_name,
      description: category.description,
      image: category.image || '',
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? It will be moved to trash.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/categories/${categoryId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      loadCategories();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  const handleRestore = async (categoryId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/categories/${categoryId}/restore`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to restore category');
      }

      toast.success('Category restored successfully');
      loadCategories();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      image: '',
    });
    setImageFile(null);
    setEditingCategory(null);
    setShowCreateForm(false);
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

        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4">
              <Folder className="text-blue-400" size={32} />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text">Category Management</h1>
                <p className="text-slate-400">Manage your product categories</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showDeleted 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                <Eye size={16} className="inline mr-2" />
                {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus size={16} className="inline mr-2" />
                New Category
              </button>
            </div>
          </motion.div>

          {/* Categories Table */}
          {!showCreateForm && (
            <motion.div
              className="bg-slate-700 rounded-lg shadow-lg overflow-hidden mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <div className="p-6 border-b border-slate-600">
                <h2 className="text-xl font-semibold text-white">
                  {showDeleted ? 'Deleted Categories' : 'Active Categories'}
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                {loadingCategories ? (
                  <div className="p-8 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    Loading categories...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    {showDeleted ? 'No deleted categories found' : 'No categories found. Create your first category!'}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Name (ID)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {categories.map((category) => (
                        <tr key={category.id} className="hover:bg-slate-600">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center mr-4">
                                {category.image ? (
                                  <img
                                    src={category.image}
                                    alt={category.display_name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <Folder className="text-slate-300" size={20} />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {category.display_name}
                                </div>
                                <div className="text-sm text-slate-400 max-w-xs truncate">
                                  {category.description || 'No description'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">{category.name}</div>
                            <div className="text-xs text-slate-400">ID: {category.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                category.is_deleted
                                  ? 'bg-red-100 text-red-800'
                                  : category.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {category.is_deleted ? 'Deleted' : category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {new Date(category.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {category.is_deleted ? (
                                <button
                                  onClick={() => handleRestore(category.id)}
                                  className="text-green-400 hover:text-green-300 p-1"
                                  title="Restore category"
                                >
                                  <RotateCcw size={16} />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEdit(category)}
                                    className="text-blue-400 hover:text-blue-300 p-1"
                                    title="Edit category"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(category.id)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                    title="Delete category"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* Create/Edit Form */}
          {showCreateForm && (
            <motion.form
              onSubmit={handleSubmit}
              className="bg-slate-700 p-6 rounded-lg shadow-lg space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-300"
                >
                  ✕
                </button>
              </div>
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
            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingCategory ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Folder size={20} />
                    {editingCategory ? 'Update Category' : 'Create Category'}
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