'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Plus, RefreshCw, Menu, Eye, ShoppingCart, Code } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface CouponProduct {
  id: number;
  name: string;
  sku: string;
  price: string;
  coupon_value: string;
  is_coupon: boolean;
}

interface CouponCode {
  id: number;
  code: string;
  product: number;
  product_name: string;
  product_coupon_value: number;
  is_used: boolean;
  assigned_to_email: string | null;
  assigned_at: string | null;
  is_assigned: boolean;
  created_at: string;
}

interface CouponPurchase {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  payment_method: string;
  payment_method_display: string;
  amount_paid: number;
  status: string;
  status_display: string;
  terms_agreed: boolean;
  payment_reference: string;
  product: number;
  product_name: string;
  product_coupon_value: number;
  coupon_code: number;
  coupon_code_code: string;
  created_at: string;
  updated_at: string;
}

interface GenerateFormData {
  product_id: string;
  count: string;
}

interface CodesFilters {
  product_id: string;
  status: string;
  search: string;
  page: string;
}

interface PurchasesFilters {
  status: string;
  product_id: string;
  search: string;
  page: string;
}

export default function Coupons() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'generate' | 'codes' | 'purchases'>('generate');
  const [couponProducts, setCouponProducts] = useState<CouponProduct[]>([]);
  const [couponCodes, setCouponCodes] = useState<CouponCode[]>([]);
  const [couponPurchases, setCouponPurchases] = useState<CouponPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [codesLoading, setCodesLoading] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [formData, setFormData] = useState<GenerateFormData>({
    product_id: '',
    count: '100',
  });
  const [codesFilters, setCodesFilters] = useState<CodesFilters>({
    product_id: '',
    status: 'all',
    search: '',
    page: '1',
  });
  const [purchasesFilters, setPurchasesFilters] = useState<PurchasesFilters>({
    status: '',
    product_id: '',
    search: '',
    page: '1',
  });

  useEffect(() => {
    fetchCouponProducts();
    if (activeTab === 'codes') {
      fetchCouponCodes();
    } else if (activeTab === 'purchases') {
      fetchCouponPurchases();
    }
  }, [activeTab]);

  const fetchCouponProducts = async () => {
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
      // Filter only coupon products
      const coupons = result.results.filter((product: any) => product.is_coupon);
      setCouponProducts(coupons);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch coupon products');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCouponCodes = async () => {
    setCodesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (codesFilters.product_id) params.append('product_id', codesFilters.product_id);
      if (codesFilters.status && codesFilters.status !== 'all') params.append('status', codesFilters.status);
      if (codesFilters.search) params.append('search', codesFilters.search);
      if (codesFilters.page) params.append('page', codesFilters.page);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupons/codes/?${params}`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch coupon codes');
      }
      const result = await response.json();
      setCouponCodes(result.codes || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch coupon codes');
    } finally {
      setCodesLoading(false);
    }
  };

  const fetchCouponPurchases = async () => {
    setPurchasesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (purchasesFilters.status) params.append('status', purchasesFilters.status);
      if (purchasesFilters.product_id) params.append('product_id', purchasesFilters.product_id);
      if (purchasesFilters.search) params.append('search', purchasesFilters.search);
      if (purchasesFilters.page) params.append('page', purchasesFilters.page);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupons/purchases/?${params}`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch coupon purchases');
      }
      const result = await response.json();
      setCouponPurchases(result.purchases || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch coupon purchases');
    } finally {
      setPurchasesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        product_id: parseInt(formData.product_id),
        count: parseInt(formData.count) || 100,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupons/generate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessages = Object.entries(result)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n');
        throw new Error(errorMessages);
      }

      toast.success(result.message || 'Coupon codes generated successfully!');

      setFormData({
        product_id: '',
        count: '100',
      });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate coupon codes');
    } finally {
      setGenerating(false);
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
          <motion.div
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Ticket className="text-blue-400" size={32} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Coupon Management</h1>
              <p className="text-slate-400">Manage coupon codes, generation, and purchases</p>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Plus size={20} />
              Generate Codes
            </button>
            <button
              onClick={() => setActiveTab('codes')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'codes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Code size={20} />
              View Codes
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'purchases'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <ShoppingCart size={20} />
              View Purchases
            </button>
          </div>

          {/* Generate Codes Tab */}
          {activeTab === 'generate' && (
            <>
              <motion.form
                onSubmit={handleSubmit}
                className="bg-slate-700 p-6 rounded-lg shadow-lg space-y-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Coupon Product *
                </label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Choose a coupon product</option>
                  {couponProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₦{product.coupon_value} - {product.sku}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Number of Codes
                </label>
                <input
                  type="number"
                  name="count"
                  value={formData.count}
                  onChange={handleInputChange}
                  min="1"
                  max="1000"
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="100"
                />
                <p className="text-xs text-slate-400 mt-1">Default: 100 codes</p>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={generating}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Generating Codes...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Generate Codes
                  </>
                )}
              </button>
            </div>
          </motion.form>

          {/* Coupon Products List */}
              <motion.div
                className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
            <div className="px-6 py-4 bg-slate-600">
              <h2 className="text-lg font-semibold text-white">Available Coupon Products</h2>
              <p className="text-slate-400 text-sm">Products that can have coupon codes generated</p>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : couponProducts.length === 0 ? (
              <div className="text-center p-8">
                <Ticket className="mx-auto mb-4 text-slate-400" size={48} />
                <p className="text-slate-400">No coupon products found</p>
                <p className="text-slate-500 text-sm mt-2">Create coupon products first to generate codes</p>
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
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600">
                    {couponProducts.map((product, index) => (
                      <motion.tr
                        key={product.id}
                        className="hover:bg-slate-600 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-400">₦{product.coupon_value}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-400">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">₦{product.price}</div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
              </motion.div>
            </>
          )}

          {/* View Codes Tab */}
          {activeTab === 'codes' && (
            <motion.div
              className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="px-6 py-4 bg-slate-600">
                <h2 className="text-lg font-semibold text-white">Coupon Codes</h2>
                <p className="text-slate-400 text-sm">View and manage all generated coupon codes</p>
              </div>

              {codesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : couponCodes.length === 0 ? (
                <div className="text-center p-8">
                  <Code className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-400">No coupon codes found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {couponCodes.map((code, index) => (
                        <motion.tr
                          key={code.id}
                          className="hover:bg-slate-600 transition-colors"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white font-mono">{code.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">{code.product_name}</div>
                            <div className="text-xs text-slate-500">₦{code.product_coupon_value}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              code.is_used ? 'bg-red-600 text-white' :
                              code.is_assigned ? 'bg-blue-600 text-white' :
                              'bg-green-600 text-white'
                            }`}>
                              {code.is_used ? 'Used' : code.is_assigned ? 'Assigned' : 'Available'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">
                              {code.assigned_to_email || 'Not assigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">
                              {new Date(code.created_at).toLocaleDateString()}
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

          {/* View Purchases Tab */}
          {activeTab === 'purchases' && (
            <motion.div
              className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="px-6 py-4 bg-slate-600">
                <h2 className="text-lg font-semibold text-white">Coupon Purchases</h2>
                <p className="text-slate-400 text-sm">View all coupon purchases and transactions</p>
              </div>

              {purchasesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : couponPurchases.length === 0 ? (
                <div className="text-center p-8">
                  <ShoppingCart className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-400">No coupon purchases found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {couponPurchases.map((purchase, index) => (
                        <motion.tr
                          key={purchase.id}
                          className="hover:bg-slate-600 transition-colors"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{purchase.full_name}</div>
                            <div className="text-sm text-slate-400">{purchase.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">{purchase.product_name}</div>
                            <div className="text-xs text-slate-500">₦{purchase.product_coupon_value}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-400">₦{purchase.amount_paid}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              purchase.status === 'paid' ? 'bg-green-600 text-white' :
                              purchase.status === 'pending' ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {purchase.status_display}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-white">{purchase.coupon_code_code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">
                              {new Date(purchase.created_at).toLocaleDateString()}
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