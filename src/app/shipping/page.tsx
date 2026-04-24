'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout, getAuthToken } from '@/lib/auth';
import { Menu, LogOut, Plus, Trash2, Edit, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface ShippingPrice {
  id: string;
  state_from: string;
  state_to: string;
  price: number;
  created_at: string;
}

interface ApiResponse {
  count: number;
  page: number;
  pageSize: number;
  pages: number;
  results: ShippingPrice[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export default function Shipping() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [prices, setPrices] = useState<ShippingPrice[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<ShippingPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<ShippingPrice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stateFrom, setStateFrom] = useState('');
  const [stateTo, setStateTo] = useState('');
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { router.push('/'); return; }
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) fetchPrices();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredPrices(prices); return; }
    const q = searchQuery.toLowerCase();
    setFilteredPrices(prices.filter(p =>
      p.state_from.toLowerCase().includes(q) || p.state_to.toLowerCase().includes(q)
    ));
  }, [prices, searchQuery]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/shipping/prices/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data: ApiResponse = json.data ?? json;
      setPrices(data.results ?? []);
      setTotalCount(data.count ?? 0);
    } catch {
      toast.error('Failed to load shipping prices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateFrom.trim() || !stateTo.trim() || !priceInput) {
      toast.error('All fields are required'); return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/shipping/prices/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ state_from: stateFrom.trim(), state_to: stateTo.trim(), price: Number(priceInput) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create route');
      toast.success('Shipping route created');
      setShowCreateModal(false);
      setStateFrom(''); setStateTo(''); setPriceInput('');
      fetchPrices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creating route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrice || !priceInput) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/shipping/prices/${selectedPrice.id}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ price: Number(priceInput) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to update price');
      toast.success('Shipping price updated');
      setShowEditModal(false); setSelectedPrice(null); setPriceInput('');
      fetchPrices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error updating price');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shipping route?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/shipping/prices/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      toast.success('Shipping route deleted');
      fetchPrices();
    } catch {
      toast.error('Failed to delete route');
    }
  };

  const openEditModal = (price: ShippingPrice) => {
    setSelectedPrice(price);
    setPriceInput(String(price.price));
    setShowEditModal(true);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-slate-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <ProtectedRoute>
        <div className="flex h-screen bg-slate-900">
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 p-4 md:p-8 bg-slate-800 overflow-auto">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden fixed top-4 left-4 z-30 p-2 bg-slate-700 rounded-lg text-white">
              <Menu size={20} />
            </button>

            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <motion.h1 className="text-2xl md:text-3xl font-bold gradient-text" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  Shipping Price Management
                </motion.h1>
                <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <LogOut size={18} /> Logout
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <motion.div className="bg-slate-700 rounded-lg p-4 border-l-4 border-blue-500" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <p className="text-slate-400 text-sm">Total Routes</p>
                  <p className="text-2xl font-bold text-white">{totalCount}</p>
                </motion.div>
                <motion.div className="bg-slate-700 rounded-lg p-4 border-l-4 border-green-500" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <p className="text-slate-400 text-sm">Showing</p>
                  <p className="text-2xl font-bold text-white">{filteredPrices.length}</p>
                </motion.div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <button onClick={() => { setStateFrom(''); setStateTo(''); setPriceInput(''); setShowCreateModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Plus size={18} /> Add Route
                </button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="text" placeholder="Search by state name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
              ) : filteredPrices.length === 0 ? (
                <motion.div className="bg-slate-700 rounded-lg p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-slate-300">No shipping routes found</p>
                </motion.div>
              ) : (
                <motion.div className="bg-slate-700 rounded-lg overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">From</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">To</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Price (₦)</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Created</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {filteredPrices.map((price) => (
                          <motion.tr key={price.id} className="hover:bg-slate-600 transition-colors" whileHover={{ backgroundColor: '#475569' }}>
                            <td className="px-6 py-4 text-sm font-medium text-white">{price.state_from}</td>
                            <td className="px-6 py-4 text-sm font-medium text-white">{price.state_to}</td>
                            <td className="px-6 py-4 text-sm font-medium text-green-400">₦{price.price.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs text-slate-400">{new Date(price.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => openEditModal(price)} className="text-blue-400 hover:text-blue-300 p-1"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(price.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </div>
          </main>

          {showCreateModal && (
            <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowCreateModal(false)}>
              <motion.div className="bg-slate-700 rounded-lg p-6 w-full max-w-md" initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">Add Shipping Route</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">From State *</label>
                    <input type="text" value={stateFrom} onChange={(e) => setStateFrom(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Lagos" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">To State *</label>
                    <input type="text" value={stateTo} onChange={(e) => setStateTo(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Abuja" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Price (₦) *</label>
                    <input type="number" min="0" step="1" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 5000" required />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">{isSubmitting ? 'Creating...' : 'Create'}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {showEditModal && selectedPrice && (
            <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { setShowEditModal(false); setSelectedPrice(null); }}>
              <motion.div className="bg-slate-700 rounded-lg p-6 w-full max-w-md" initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">Edit Shipping Price</h2>
                <form onSubmit={handleEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Route</label>
                    <p className="text-white text-sm px-3 py-2 bg-slate-800 border border-slate-600 rounded">{selectedPrice.state_from} → {selectedPrice.state_to}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Price (₦) *</label>
                    <input type="number" min="0" step="1" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setShowEditModal(false); setSelectedPrice(null); }} className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">{isSubmitting ? 'Updating...' : 'Update'}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </div>
      </ProtectedRoute>

      <Toaster position="bottom-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#f1f5f9' }, success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } }, error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } } }} />
    </>
  );
}
