'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Plus, Upload, X, Edit, Eye, Package, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

interface ProductFormData {
    name: string;
    category_id: string;
    brand_id: string;
    description: string;
    short_description: string;
    price: string;
    price_usdt: string;
    discount_percentage: string;
    stock_quantity: string;
    product_condition: string;
    sku: string;
    model: string;
    colors: string[];
    storage_options: string[];
    ram_options: string[];
    display_specs: string;
    chip_specs: string;
    is_featured: boolean;
    is_active: boolean;
    is_coupon_product: boolean;
}

interface CategoryOption {
    id: string;
    name: string;
    display_name: string;
}

interface BrandOption {
    id: string;
    name: string;
    display_name: string;
}


export default function Products() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const emptyForm: ProductFormData = {
    name: '',
    category_id: '',
    brand_id: '',
    description: '',
    short_description: '',
    price: '',
    price_usdt: '',
    discount_percentage: '',
    stock_quantity: '',
    product_condition: 'new',
    sku: '',
    model: '',
    colors: [],
    storage_options: [],
    ram_options: [],
    display_specs: '',
    chip_specs: '',
    is_featured: false,
    is_active: true,
    is_coupon_product: false,
  };
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);


  useEffect(() => {
    fetchCategories();
    fetchBrands();
    if (activeTab === 'list') {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      const data: CategoryOption[] = json.data ?? json.categories ?? [];
      setCategories(data);
    } catch { /* non-blocking */ }
  };

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/brands/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      const data: BrandOption[] = json.data ?? json.results ?? [];
      setBrands(data);
    } catch { /* non-blocking */ }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const json = await response.json();
      // Backend returns { success, data: { results: [...], total, page, pageSize } }
      const result = json.data ?? json;
      setProducts(result.results || result.products || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${productId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete product');
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setLoading(false);
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

  const handleArrayInput = (field: 'colors' | 'storage_options' | 'ram_options', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    }
  };

  const removeArrayItem = (field: 'colors' | 'storage_options' | 'ram_options', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setImageFiles(prev => [...prev, ...Array.from(files)].slice(0, 6));
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const editProduct = (product: any) => {
    setActiveTab('create');
    setEditingProductId(product.id);
    setFormData({
      name: product.name || '',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      description: product.description || '',
      short_description: product.short_description || '',
      price: String(product.price || ''),
      price_usdt: String(product.price_usdt || ''),
      discount_percentage: String(product.discount_percentage || ''),
      stock_quantity: String(product.stock_quantity || ''),
      product_condition: product.product_condition || 'new',
      sku: product.sku || '',
      model: product.model || '',
      colors: Array.isArray(product.colors)
        ? product.colors
        : (product.colors ? tryParseJson(product.colors) : []),
      storage_options: Array.isArray(product.storage_options)
        ? product.storage_options
        : (product.storage_options ? tryParseJson(product.storage_options) : []),
      ram_options: Array.isArray(product.ram_options)
        ? product.ram_options
        : (product.ram_options ? tryParseJson(product.ram_options) : []),
      display_specs: product.display_specs || '',
      chip_specs: product.chip_specs || '',
      is_featured: !!product.is_featured,
      is_active: product.is_active !== false,
      is_coupon_product: !!product.is_coupon_product,
    });
    setImageFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tryParseJson = (val: string): string[] => {
    try { return JSON.parse(val); } catch { return []; }
  };

  const generateSlug = () => {
    // slug is auto-generated on the backend, no-op kept for compat
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const baseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products`;

      if (editingProductId) {
        // Update: send JSON (images not updated via this route)
        const body: Record<string, unknown> = {
          name: formData.name,
          category_id: formData.category_id,
          brand_id: formData.brand_id || undefined,
          description: formData.description,
          short_description: formData.short_description,
          price: formData.price,
          price_usdt: formData.price_usdt || undefined,
          discount_percentage: formData.discount_percentage || '0',
          stock_quantity: formData.stock_quantity || '0',
          product_condition: formData.product_condition,
          sku: formData.sku,
          model: formData.model || undefined,
          colors: formData.colors,
          storage_options: formData.storage_options,
          ram_options: formData.ram_options,
          display_specs: formData.display_specs || undefined,
          chip_specs: formData.chip_specs || undefined,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          is_coupon_product: formData.is_coupon_product,
        };

        const response = await fetch(`${baseUrl}/${editingProductId}/update/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.message || 'Failed to update product');
        toast.success('Product updated successfully!');
      } else {
        // Create: send multipart/form-data with images
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('category_id', formData.category_id);
        fd.append('price', formData.price);
        fd.append('sku', formData.sku);
        if (formData.brand_id) fd.append('brand_id', formData.brand_id);
        if (formData.description) fd.append('description', formData.description);
        if (formData.short_description) fd.append('short_description', formData.short_description);
        if (formData.price_usdt) fd.append('price_usdt', formData.price_usdt);
        fd.append('discount_percentage', formData.discount_percentage || '0');
        fd.append('stock_quantity', formData.stock_quantity || '0');
        fd.append('product_condition', formData.product_condition || 'new');
        if (formData.model) fd.append('model', formData.model);
        if (formData.colors.length) fd.append('colors', JSON.stringify(formData.colors));
        if (formData.storage_options.length) fd.append('storage_options', JSON.stringify(formData.storage_options));
        if (formData.ram_options.length) fd.append('ram_options', JSON.stringify(formData.ram_options));
        if (formData.display_specs) fd.append('display_specs', formData.display_specs);
        if (formData.chip_specs) fd.append('chip_specs', formData.chip_specs);
        fd.append('is_active', String(formData.is_active));
        fd.append('is_featured', String(formData.is_featured));
        fd.append('is_coupon_product', String(formData.is_coupon_product));
        // All images use 'image' field name; first becomes primary
        imageFiles.forEach(file => fd.append('image', file));

        const response = await fetch(`${baseUrl}/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.message || 'Failed to create product');
        toast.success('Product created successfully!');
      }

      setEditingProductId(null);
      setImageFiles([]);
      setFormData(emptyForm);
      setActiveTab('list');
      fetchProducts();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : (editingProductId ? 'Failed to update product' : 'Failed to create product'));
    } finally {
      setLoading(false);
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
              className="flex items-center justify-between gap-4 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-4">
                {editingProductId ? <Edit className="text-blue-400" size={32} /> : <Plus className="text-blue-400" size={32} />}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {editingProductId ? 'Update Product' : 'Create New Product'}
                  </h1>
                  {editingProductId && (
                    <p className="text-gray-400 text-sm mt-1">Editing product ID: {editingProductId}</p>
                  )}
                </div>
              </div>
              {editingProductId && (
                <button
                  onClick={() => {
                    setEditingProductId(null);
                    setImageFiles([]);
                    setFormData(emptyForm);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  Cancel Edit
                </button>
              )}
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
                <h1 className="text-2xl md:text-3xl font-bold text-white">All Products</h1>
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
                              {product.images?.[0]?.url || product.main_image ? (
                                <Image
                                  src={product.images?.[0]?.url || product.main_image}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-lg object-cover mr-3"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-slate-600 mr-3 flex items-center justify-center">
                                  <Package className="text-slate-400" size={24} />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-white">{product.name}</div>
                                <div className="text-sm text-slate-400">{product.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{product.category}</div>
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
                                onClick={() => editProduct(product)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit Product"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                className="text-green-400 hover:text-green-300 transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
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

          {/* Create Product Form */}
          {activeTab === 'create' && (
            <motion.form
              onSubmit={handleSubmit}
              className="bg-slate-700 p-6 rounded-lg shadow-lg space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Product Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="product_type" value="regular"
                      checked={!formData.is_coupon_product}
                      onChange={() => setFormData(prev => ({ ...prev, is_coupon_product: false }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Regular Product</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="product_type" value="coupon"
                      checked={formData.is_coupon_product}
                      onChange={() => setFormData(prev => ({ ...prev, is_coupon_product: true }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Coupon Product</span>
                  </label>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Product Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
                  <select name="category_id" value={formData.category_id} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required>
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.display_name || c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Brand</label>
                  <select name="brand_id" value={formData.brand_id} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white">
                    <option value="">No brand</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.display_name || b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Short Description</label>
                  <textarea name="short_description" value={formData.short_description} onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Price (₦) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange}
                    step="0.01" min="0"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Price (USDT)</label>
                  <input type="number" name="price_usdt" value={formData.price_usdt} onChange={handleInputChange}
                    step="0.01" min="0"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Discount %</label>
                  <input type="number" name="discount_percentage" value={formData.discount_percentage}
                    onChange={handleInputChange} min="0" max="100" step="0.1"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Stock Quantity</label>
                  <input type="number" name="stock_quantity" value={formData.stock_quantity}
                    onChange={handleInputChange} min="0"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">SKU *</label>
                  <input type="text" name="sku" value={formData.sku} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                  <input type="text" name="model" value={formData.model} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Condition *</label>
                  <select name="product_condition" value={formData.product_condition} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required>
                    <option value="new">New</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="used">Used</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Display Specs</label>
                  <input type="text" name="display_specs" value={formData.display_specs} onChange={handleInputChange}
                    placeholder="e.g. 6.1-inch OLED"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Chip Specs</label>
                  <input type="text" name="chip_specs" value={formData.chip_specs} onChange={handleInputChange}
                    placeholder="e.g. A17 Pro"
                    className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
              </div>

              {/* Array Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['colors', 'storage_options', 'ram_options'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-slate-300 mb-2 capitalize">
                      {field.replace('_', ' ')}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" id={`${field}Input`}
                        className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                        placeholder={`Add ${field.replace('_options', '').replace('_', ' ')}`}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            handleArrayInput(field, input.value);
                            input.value = '';
                          }
                        }}
                      />
                      <button type="button"
                        onClick={() => {
                          const input = document.getElementById(`${field}Input`) as HTMLInputElement;
                          handleArrayInput(field, input.value);
                          input.value = '';
                        }}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData[field].map((item, index) => (
                        <span key={index} className="bg-blue-700 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          {item}
                          <X size={12} className="cursor-pointer hover:text-red-300"
                            onClick={() => removeArrayItem(field, index)} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Product Images <span className="text-slate-400 font-normal">(first becomes primary, max 6)</span>
                </label>
                <div className="border-2 border-dashed border-slate-500 rounded-lg p-4 text-center">
                  <input type="file" accept="image/*" multiple id="productImages"
                    onChange={handleImageUpload} className="hidden" />
                  <label htmlFor="productImages" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                    <p className="text-slate-400">Click to upload product images</p>
                  </label>
                  {imageFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-600 p-2 rounded">
                          <span className="text-white text-sm truncate">
                            {index === 0 && <span className="text-yellow-400 mr-2 text-xs">[Primary]</span>}
                            {file.name}
                          </span>
                          <X size={16} className="cursor-pointer text-red-400 hover:text-red-300 flex-shrink-0"
                            onClick={() => removeImageFile(index)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="is_featured" checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="rounded border-slate-500 bg-slate-600 text-blue-600 focus:ring-blue-500" />
                  <span className="text-slate-300">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="is_active" checked={formData.is_active}
                    onChange={handleInputChange}
                    className="rounded border-slate-500 bg-slate-600 text-blue-600 focus:ring-blue-500" />
                  <span className="text-slate-300">Active / Visible</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="is_coupon_product" checked={formData.is_coupon_product}
                    onChange={handleInputChange}
                    className="rounded border-slate-500 bg-slate-600 text-blue-600 focus:ring-blue-500" />
                  <span className="text-slate-300">Coupon Product</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button type="submit" disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingProductId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingProductId ? <Edit size={20} /> : <Plus size={20} />}
                      {editingProductId ? 'Update Product' : 'Create Product'}
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
