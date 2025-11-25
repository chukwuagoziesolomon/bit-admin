'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout, getAuthToken } from '@/lib/auth';
import { Menu, LogOut, Plus, Trash2, Edit, Copy, Download, Search, ChevronDown, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Types
interface Coupon {
  id: number;
  code: string;
  coupon_type: string;
  discount_type: string;
  discount_value: number;
  usage_limit: number;
  usage_count: number;
  minimum_order_amount: number;
  expires_at: string | null;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
  assigned_to_email: string | null;
  created_by: string;
}

interface CouponStats {
  discount_coupons: {
    total: number;
    active: number;
    expired: number;
  };
  coupon_codes: {
    total: number;
    used: number;
    available: number;
  };
  most_used_coupons: Array<{
    code: string;
    usage_count: number;
    usage_limit: number;
    discount_value: number;
  }>;
}

interface CouponCode {
  id: number;
  code: string;
  coupon: number;
  is_used: boolean;
  assigned_to_email: string | null;
  assigned_at: string | null;
  used_at: string | null;
  created_at: string;
}

interface CreateCouponData {
  code: string;
  coupon_type: 'campaign' | 'individual';
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  usage_limit: number | null;
  minimum_order_amount: number;
  expires_at: string | null;
  description: string;
  email?: string;
}

interface GenerateCodesData {
  coupon_id: number;
  quantity: number;
}

export default function CouponsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'coupons' | 'codes' | 'stats'>('coupons');

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Coupon codes state
  const [codes, setCodes] = useState<CouponCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<CouponCode[]>([]);
  const [codeSearch, setCodeSearch] = useState('');
  const [codeStatusFilter, setCodeStatusFilter] = useState<'all' | 'used' | 'unused'>('all');

  // Stats state
  const [stats, setStats] = useState<CouponStats | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [codesLoading, setCodesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateCodesModal, setShowGenerateCodesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Form states
  const [createFormData, setCreateFormData] = useState<CreateCouponData>({
    code: '',
    coupon_type: 'campaign',
    discount_type: 'percentage',
    discount_value: 0,
    usage_limit: null,
    minimum_order_amount: 0,
    expires_at: null,
    description: '',
    email: '',
  });

  const [generateCodesData, setGenerateCodesData] = useState<GenerateCodesData>({
    coupon_id: 0,
    quantity: 100,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Fetch data
  useEffect(() => {
    if (isAuthenticated) {
      fetchCoupons();
      fetchCouponCodes();
      fetchStats();
    }
  }, [isAuthenticated]);

  // Filter coupons
  useEffect(() => {
    let filtered = coupons;

    if (couponSearch) {
      filtered = filtered.filter((c) =>
        c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(couponSearch.toLowerCase())
      );
    }

    if (couponStatusFilter !== 'all') {
      filtered = filtered.filter((c) =>
        couponStatusFilter === 'active' ? c.is_active : !c.is_active
      );
    }

    setFilteredCoupons(filtered);
  }, [coupons, couponSearch, couponStatusFilter]);

  // Filter codes
  useEffect(() => {
    let filtered = codes;

    if (codeSearch) {
      filtered = filtered.filter((c) =>
        c.code.toLowerCase().includes(codeSearch.toLowerCase())
      );
    }

    if (codeStatusFilter !== 'all') {
      filtered = filtered.filter((c) =>
        codeStatusFilter === 'used' ? c.is_used : !c.is_used
      );
    }

    setFilteredCodes(filtered);
  }, [codes, codeSearch, codeStatusFilter]);

  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupons/`,
        {
          headers: { 'Authorization': `Token ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch coupons');

      const data = await response.json();
      const couponsList = Array.isArray(data) ? data : data.coupons || [];
      setCoupons(couponsList);
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setCouponsLoading(false);
      setLoading(false);
    }
  };

  const fetchCouponCodes = async () => {
    try {
      setCodesLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupon-codes/`,
        {
          headers: { 'Authorization': `Token ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch codes');

      const data = await response.json();
      const codesList = Array.isArray(data) ? data : data.results || [];
      setCodes(codesList);
    } catch (err) {
      toast.error('Failed to load coupon codes');
    } finally {
      setCodesLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupons/stats/`,
        {
          headers: { 'Authorization': `Token ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      toast.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    if (createFormData.discount_value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      // Only include email if coupon_type is 'individual'
      const payload = { ...createFormData };
      if (payload.coupon_type !== 'individual') {
        delete payload.email;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupons/generate/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create coupon');
      }

      toast.success('✓ Coupon created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        code: '',
        coupon_type: 'campaign',
        discount_type: 'percentage',
        discount_value: 0,
        usage_limit: null,
        minimum_order_amount: 0,
        expires_at: null,
        description: '',
        email: '',
      });
      fetchCoupons();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();

    if (generateCodesData.coupon_id === 0) {
      toast.error('Please select a coupon');
      return;
    }

    if (generateCodesData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupon-codes/generate/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(generateCodesData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate codes');
      }

      toast.success(`✓ Generated ${generateCodesData.quantity} coupon codes`);
      setShowGenerateCodesModal(false);
      setGenerateCodesData({ coupon_id: 0, quantity: 100 });
      fetchCouponCodes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate codes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupons/${couponId}/delete/`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete coupon');

      toast.success('✓ Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  const handleEditCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCoupon) return;

    if (!createFormData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    if (createFormData.discount_value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/coupons/${selectedCoupon.id}/update/`,
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
        throw new Error(error.message || 'Failed to update coupon');
      }

      toast.success('✓ Coupon updated successfully');
      setShowEditModal(false);
      setSelectedCoupon(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('✓ Copied to clipboard');
  };

  const handleLogout = () => {
    logout();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-white">Loading...</p>
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
                Coupon Management
              </motion.h1>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-600">
              {['coupons', 'codes', 'stats'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Coupons Tab */}
            {activeTab === 'coupons' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Create & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus size={18} />
                    Create Coupon
                  </button>

                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by code or description..."
                      value={couponSearch}
                      onChange={(e) => setCouponSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={couponStatusFilter}
                    onChange={(e) => setCouponStatusFilter(e.target.value as any)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Coupons Table */}
                {couponsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredCoupons.length === 0 ? (
                  <motion.div
                    className="bg-slate-700 rounded-lg p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-slate-300">No coupons found</p>
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
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Code</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Type</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Discount</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Usage</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Min Order</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Expires</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-600">
                          {filteredCoupons.map((coupon) => (
                            <motion.tr
                              key={coupon.id}
                              className="hover:bg-slate-600 transition-colors"
                              whileHover={{ backgroundColor: '#475569' }}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <code className="font-mono font-semibold text-blue-400">{coupon.code}</code>
                                  <button
                                    onClick={() => copyToClipboard(coupon.code)}
                                    className="text-slate-400 hover:text-slate-300 p-1"
                                  >
                                    <Copy size={14} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  coupon.coupon_type === 'campaign' ? 'bg-purple-900 text-purple-200' : 'bg-indigo-900 text-indigo-200'
                                }`}>
                                  {coupon.coupon_type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm">
                                  {coupon.discount_type === 'percentage' ? (
                                    <span className="text-green-400">{coupon.discount_value}%</span>
                                  ) : (
                                    <span className="text-green-400">₦{coupon.discount_value.toLocaleString()}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm">
                                  {coupon.usage_limit ? (
                                    <span>{coupon.usage_count} / {coupon.usage_limit}</span>
                                  ) : (
                                    <span className="text-slate-400">Unlimited ({coupon.usage_count})</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm">
                                  ₦{coupon.minimum_order_amount.toLocaleString()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm">
                                  {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  coupon.is_active ? 'bg-green-900 text-green-200' : 'bg-gray-900 text-gray-200'
                                }`}>
                                  {coupon.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedCoupon(coupon);
                                      setCreateFormData({
                                        code: coupon.code,
                                        coupon_type: coupon.coupon_type as any,
                                        discount_type: coupon.discount_type as any,
                                        discount_value: coupon.discount_value,
                                        usage_limit: coupon.usage_limit,
                                        minimum_order_amount: coupon.minimum_order_amount,
                                        expires_at: coupon.expires_at,
                                        description: coupon.description,
                                      });
                                      setShowEditModal(true);
                                    }}
                                    className="text-blue-400 hover:text-blue-300 p-1"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCoupon(coupon.id)}
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
              </motion.div>
            )}

            {/* Codes Tab */}
            {activeTab === 'codes' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Generate & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <button
                    onClick={() => setShowGenerateCodesModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Plus size={18} />
                    Generate Codes
                  </button>

                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by code..."
                      value={codeSearch}
                      onChange={(e) => setCodeSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={codeStatusFilter}
                    onChange={(e) => setCodeStatusFilter(e.target.value as any)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="used">Used</option>
                    <option value="unused">Unused</option>
                  </select>
                </div>

                {/* Codes Table */}
                {codesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredCodes.length === 0 ? (
                  <motion.div
                    className="bg-slate-700 rounded-lg p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-slate-300">No coupon codes found</p>
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
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Code</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Assigned To</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Assigned At</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Used At</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-600">
                          {filteredCodes.map((code) => (
                            <motion.tr
                              key={code.id}
                              className="hover:bg-slate-600 transition-colors"
                              whileHover={{ backgroundColor: '#475569' }}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <code className="font-mono font-semibold text-blue-400">{code.code}</code>
                                  <button
                                    onClick={() => copyToClipboard(code.code)}
                                    className="text-slate-400 hover:text-slate-300 p-1"
                                  >
                                    <Copy size={14} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  code.is_used ? 'bg-green-900 text-green-200' : 'bg-blue-900 text-blue-200'
                                }`}>
                                  {code.is_used ? 'Used' : 'Available'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-400">
                                  {code.assigned_to_email || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-400">
                                  {code.assigned_at ? new Date(code.assigned_at).toLocaleDateString() : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-400">
                                  {code.used_at ? new Date(code.used_at).toLocaleDateString() : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-400">
                                  {new Date(code.created_at).toLocaleDateString()}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {statsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : stats ? (
                  <div className="space-y-6">
                    {/* Discount Coupons Stats */}
                    <div className="bg-slate-700 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-4">Discount Coupons</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div
                          className="bg-slate-800 p-6 rounded-lg"
                          whileHover={{ scale: 1.05 }}
                        >
                          <p className="text-slate-400 text-sm mb-2">Total</p>
                          <p className="text-3xl font-bold text-blue-400">{stats.discount_coupons.total}</p>
                        </motion.div>

                        <motion.div
                          className="bg-slate-800 p-6 rounded-lg"
                          whileHover={{ scale: 1.05 }}
                        >
                          <p className="text-slate-400 text-sm mb-2">Active</p>
                          <p className="text-3xl font-bold text-green-400">{stats.discount_coupons.active}</p>
                        </motion.div>

                        <motion.div
                          className="bg-slate-800 p-6 rounded-lg"
                          whileHover={{ scale: 1.05 }}
                        >
                          <p className="text-slate-400 text-sm mb-2">Expired</p>
                          <p className="text-3xl font-bold text-red-400">{stats.discount_coupons.expired}</p>
                        </motion.div>
                      </div>
                    </div>

                    {/* Coupon Codes Stats */}
                    <div className="bg-slate-700 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-4">Coupon Codes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div
                          className="bg-slate-800 p-6 rounded-lg"
                          whileHover={{ scale: 1.05 }}
                        >
                          <p className="text-slate-400 text-sm mb-2">Total</p>
                          <p className="text-3xl font-bold text-blue-400">{stats.coupon_codes.total}</p>
                        </motion.div>

                        <motion.div
                          className="bg-slate-800 p-6 rounded-lg"
                          whileHover={{ scale: 1.05 }}
                        >
                          <p className="text-slate-400 text-sm mb-2">Used</p>
                          <p className="text-3xl font-bold text-green-400">{stats.coupon_codes.used}</p>
                        </motion.div>

                        <motion.div
                          className="bg-slate-800 p-6 rounded-lg"
                          whileHover={{ scale: 1.05 }}
                        >
                          <p className="text-slate-400 text-sm mb-2">Available</p>
                          <p className="text-3xl font-bold text-purple-400">{stats.coupon_codes.available}</p>
                        </motion.div>
                      </div>
                    </div>

                    {/* Most Used Coupons */}
                    {stats.most_used_coupons && stats.most_used_coupons.length > 0 && (
                      <div className="bg-slate-700 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-4">Most Used Coupons</h3>
                        <div className="space-y-3">
                          {stats.most_used_coupons.map((coupon, index) => (
                            <motion.div
                              key={index}
                              className="bg-slate-800 p-4 rounded-lg flex justify-between items-center"
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex-1">
                                <p className="font-mono font-semibold text-blue-400">{coupon.code}</p>
                                <p className="text-xs text-slate-400">
                                  Discount: {coupon.discount_value} {coupon.discount_value % 1 !== 0 ? '₦' : '%'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-400">Used: {coupon.usage_count}</p>
                                <p className="text-xs text-slate-500">
                                  Limit: {coupon.usage_limit === 0 ? 'Unlimited' : coupon.usage_limit}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </motion.div>
            )}
          </div>
        </main>

        {/* Create Coupon Modal */}
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="bg-slate-700 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Create New Coupon</h2>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateCoupon(e);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Code *</label>
                  <input
                    type="text"
                    value={createFormData.code}
                    onChange={(e) => setCreateFormData({...createFormData, code: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type *</label>
                  <select
                    value={createFormData.coupon_type}
                    onChange={(e) => setCreateFormData({...createFormData, coupon_type: e.target.value as any})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    required
                  >
                    <option value="campaign">Campaign</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>

                {createFormData.coupon_type === 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={createFormData.email || ''}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      required={createFormData.coupon_type === 'individual'}
                      placeholder="user@example.com"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Discount Type *</label>
                    <select
                      value={createFormData.discount_type}
                      onChange={(e) => setCreateFormData({...createFormData, discount_type: e.target.value as any})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      required
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Discount Value *</label>
                    <input
                      type="number"
                      value={createFormData.discount_value}
                      onChange={(e) => setCreateFormData({...createFormData, discount_value: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Usage Limit</label>
                  <input
                    type="number"
                    value={createFormData.usage_limit || ''}
                    onChange={(e) => setCreateFormData({...createFormData, usage_limit: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Min Order Amount (₦) *</label>
                  <input
                    type="number"
                    value={createFormData.minimum_order_amount}
                    onChange={(e) => setCreateFormData({...createFormData, minimum_order_amount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Expiration Date</label>
                  <input
                    type="datetime-local"
                    value={createFormData.expires_at || ''}
                    onChange={(e) => setCreateFormData({...createFormData, expires_at: e.target.value || null})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    rows={3}
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

        {/* Edit Coupon Modal */}
        {showEditModal && selectedCoupon && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              className="bg-slate-700 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Edit Coupon</h2>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleEditCoupon(e);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Code *</label>
                  <input
                    type="text"
                    value={createFormData.code}
                    onChange={(e) => setCreateFormData({...createFormData, code: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <select
                    value={createFormData.coupon_type}
                    onChange={(e) => setCreateFormData({...createFormData, coupon_type: e.target.value as any})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    disabled
                  >
                    <option value="campaign">Campaign</option>
                    <option value="individual">Individual</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Type cannot be changed</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Discount Type</label>
                    <select
                      value={createFormData.discount_type}
                      onChange={(e) => setCreateFormData({...createFormData, discount_type: e.target.value as any})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      disabled
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Discount Value *</label>
                    <input
                      type="number"
                      value={createFormData.discount_value}
                      onChange={(e) => setCreateFormData({...createFormData, discount_value: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Usage Limit</label>
                  <input
                    type="number"
                    value={createFormData.usage_limit || ''}
                    onChange={(e) => setCreateFormData({...createFormData, usage_limit: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Min Order Amount (₦) *</label>
                  <input
                    type="number"
                    value={createFormData.minimum_order_amount}
                    onChange={(e) => setCreateFormData({...createFormData, minimum_order_amount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Expiration Date</label>
                  <input
                    type="datetime-local"
                    value={createFormData.expires_at || ''}
                    onChange={(e) => setCreateFormData({...createFormData, expires_at: e.target.value || null})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCoupon(null);
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

        {/* Generate Codes Modal */}
        {showGenerateCodesModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowGenerateCodesModal(false)}
          >
            <motion.div
              className="bg-slate-700 rounded-lg p-6 w-full max-w-md"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Generate Coupon Codes</h2>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleGenerateCodes(e);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select Coupon *</label>
                  <select
                    value={generateCodesData.coupon_id}
                    onChange={(e) => setGenerateCodesData({...generateCodesData, coupon_id: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    required
                  >
                    <option value="">Choose a coupon</option>
                    {coupons.map((coupon) => (
                      <option key={coupon.id} value={coupon.id}>
                        {coupon.code} - {coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : '₦'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Number of Codes *</label>
                  <input
                    type="number"
                    value={generateCodesData.quantity}
                    onChange={(e) => setGenerateCodesData({...generateCodesData, quantity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    min="1"
                    max="1000"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGenerateCodesModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600"
                  >
                    {isSubmitting ? 'Generating...' : 'Generate'}
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