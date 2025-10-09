'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Plus, Upload, X, Edit, Eye, Package, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';

interface ProductFormData {
   name: string;
   slug: string;
   category: string;
   description: string;
   short_description: string;
   price: string;
   price_usdt: string;
   discount_percentage: string;
   stock_quantity: string;
   product_condition: string;
   sku: string;
   brand: string;
   model: string;
   colors: string[];
   storage_options: string[];
   ram_options: string[];
   specifications: string;
   features: string[];
   is_featured: boolean;
   is_active: boolean;
 }

interface Category {
  id: number;
  name: string;
  display_name: string;
}

export default function Products() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [stockUpdating, setStockUpdating] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    category: '',
    description: '',
    short_description: '',
    price: '',
    price_usdt: '',
    discount_percentage: '',
    stock_quantity: '',
    product_condition: '',
    sku: '',
    brand: '',
    model: '',
    colors: [],
    storage_options: [],
    ram_options: [],
    specifications: '',
    features: [],
    is_featured: false,
    is_active: true,
  });

  // Mock categories - in real app, fetch from API
  useEffect(() => {
    setCategories([
      { id: 1, name: 'phones', display_name: 'Phones' },
      { id: 2, name: 'laptops', display_name: 'Laptops' },
      { id: 3, name: 'tablets', display_name: 'Tablets' },
      { id: 4, name: 'accessories', display_name: 'Accessories' },
    ]);
  }, []);

  // Fetch products when tab changes to list
  useEffect(() => {
    if (activeTab === 'list') {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/products/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const result = await response.json();
      setProducts(result.results || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  };

  const toggleStockStatus = async (productId: number, action: 'out_of_stock' | 'restore', quantity?: number) => {
    setStockUpdating(productId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/products/${productId}/toggle-stock/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          action,
          ...(quantity && { quantity })
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stock status');
      }

      const result = await response.json();
      toast.success(result.message || 'Stock status updated successfully');
      fetchProducts(); // Refresh products list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update stock status');
    } finally {
      setStockUpdating(null);
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

  const handleArrayInput = (field: 'colors' | 'storage_options' | 'ram_options' | 'features', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    }
  };

  const removeArrayItem = (field: 'colors' | 'storage_options' | 'ram_options' | 'features', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean = false) => {
    const files = e.target.files;
    if (!files) return;

    if (isMain) {
      setMainImage(files[0]);
    } else {
      const newImages = Array.from(files);
      setAdditionalImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
    }
  };

  const removeImage = (index: number, isMain: boolean = false) => {
    if (isMain) {
      setMainImage(null);
    } else {
      setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const generateSlug = () => {
    const slug = formData.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, String(value));
        }
      });

      // Add images
      if (mainImage) {
        formDataToSend.append('main_image', mainImage);
      }

      additionalImages.forEach((image) => {
        formDataToSend.append('additional_images', image);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/products/create/`, {
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

      toast.success('Product created successfully!');
      // Reset form
      setFormData({
        name: '',
        slug: '',
        category: '',
        description: '',
        short_description: '',
        price: '',
        price_usdt: '',
        discount_percentage: '',
        stock_quantity: '',
        product_condition: '',
        sku: '',
        brand: '',
        model: '',
        colors: [],
        storage_options: [],
        ram_options: [],
        specifications: '',
        features: [],
        is_featured: false,
        is_active: true,
      });
      setMainImage(null);
      setAdditionalImages([]);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
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
              Create Product
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Package size={20} />
              All Products
            </button>
          </div>

          {activeTab === 'create' && (
            <motion.div
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Plus className="text-blue-400" size={32} />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text">Create New Product</h1>
                <p className="text-slate-400">Add a new product to your inventory</p>
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
              <Package className="text-green-400" size={32} />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text">All Products</h1>
                <p className="text-slate-400">Manage your product inventory</p>
              </div>
            </motion.div>
          )}

          {/* Products List Tab */}
          {activeTab === 'list' && (
            <motion.div
              className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {productsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center p-8">
                  <Package className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-400">No products found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Condition
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
                      {products.map((product, index) => (
                        <motion.tr
                          key={product.id}
                          className="hover:bg-slate-600 transition-colors"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={product.main_image}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-white">{product.name}</div>
                                <div className="text-sm text-slate-400">{product.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{product.category?.display_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              ₦{product.price?.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              product.stock_quantity > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {product.stock_quantity || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              product.product_condition === 'new' ? 'bg-green-600 text-white' :
                              product.product_condition === 'uk_used' ? 'bg-blue-600 text-white' :
                              product.product_condition === 'nigerian_used' ? 'bg-yellow-600 text-white' :
                              'bg-purple-600 text-white'
                            }`}>
                              {product.condition_display || product.product_condition}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              product.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit Product"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="text-green-400 hover:text-green-300 transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              {product.stock_quantity > 0 ? (
                                <button
                                  onClick={() => toggleStockStatus(product.id, 'out_of_stock')}
                                  disabled={stockUpdating === product.id}
                                  className="text-red-400 hover:text-red-300 disabled:text-gray-500 transition-colors"
                                  title="Mark Out of Stock"
                                >
                                  <AlertTriangle size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleStockStatus(product.id, 'restore', 10)}
                                  disabled={stockUpdating === product.id}
                                  className="text-green-400 hover:text-green-300 disabled:text-gray-500 transition-colors"
                                  title="Restore Stock"
                                >
                                  <Package size={16} />
                                </button>
                              )}
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

          {/* Create Product Form */}
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
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Slug
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="auto-generated"
                  />
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Short Description
                </label>
                <textarea
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Price (USDT)
                </label>
                <input
                  type="number"
                  name="price_usdt"
                  value={formData.price_usdt}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Discount %
                </label>
                <input
                  type="number"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Product Condition *
                </label>
                <select
                  name="product_condition"
                  value={formData.product_condition}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Select Condition</option>
                  <option value="new">New</option>
                  <option value="uk_used">UK Used</option>
                  <option value="nigerian_used">Nigerian Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            {/* Array Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Colors
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="colorInput"
                    className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="Add color"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleArrayInput('colors', input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('colorInput') as HTMLInputElement;
                      handleArrayInput('colors', input.value);
                      input.value = '';
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.colors.map((color, index) => (
                    <span key={index} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {color}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-red-300"
                        onClick={() => removeArrayItem('colors', index)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Storage Options
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="storageInput"
                    className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="Add storage"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleArrayInput('storage_options', input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('storageInput') as HTMLInputElement;
                      handleArrayInput('storage_options', input.value);
                      input.value = '';
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.storage_options.map((storage, index) => (
                    <span key={index} className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {storage}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-red-300"
                        onClick={() => removeArrayItem('storage_options', index)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* RAM Options and Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  RAM Options
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="ramInput"
                    className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="Add RAM option"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleArrayInput('ram_options', input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('ramInput') as HTMLInputElement;
                      handleArrayInput('ram_options', input.value);
                      input.value = '';
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.ram_options.map((ram, index) => (
                    <span key={index} className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {ram}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-red-300"
                        onClick={() => removeArrayItem('ram_options', index)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Key Features
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="featureInput"
                    className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="Add feature"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleArrayInput('features', input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('featureInput') as HTMLInputElement;
                      handleArrayInput('features', input.value);
                      input.value = '';
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <span key={index} className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {feature}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-red-300"
                        onClick={() => removeArrayItem('features', index)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Detailed Specifications
              </label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="Enter detailed product specifications..."
              />
            </div>

            {/* Image Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Main Product Image
                </label>
                <div className="border-2 border-dashed border-slate-500 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="hidden"
                    id="mainImage"
                  />
                  <label htmlFor="mainImage" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                    <p className="text-slate-400">Click to upload main image</p>
                  </label>
                  {mainImage && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-white text-sm">{mainImage.name}</span>
                      <X
                        size={16}
                        className="cursor-pointer text-red-400 hover:text-red-300"
                        onClick={() => removeImage(0, true)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Images (Max 5)
                </label>
                <div className="border-2 border-dashed border-slate-500 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e)}
                    className="hidden"
                    id="additionalImages"
                  />
                  <label htmlFor="additionalImages" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                    <p className="text-slate-400">Click to upload additional images</p>
                  </label>
                  {additionalImages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {additionalImages.map((image, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-600 p-2 rounded">
                          <span className="text-white text-sm truncate">{image.name}</span>
                          <X
                            size={16}
                            className="cursor-pointer text-red-400 hover:text-red-300"
                            onClick={() => removeImage(index)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                <span className="text-slate-300">Mark as Featured Product</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded border-slate-500 bg-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-300">Product is Active/Visible</span>
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
                    Creating Product...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Create Product
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