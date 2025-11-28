"use client";

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

interface DropdownProduct {
  id: number;
  name: string;
}

interface DealItem {
  id: number;
  product_id: number;
  title: string;
  subtitle?: string | null;
  deal_price: number;
  original_price?: number;
  start_time: string;
  end_time: string;
  status?: string;
  product_data?: { id: number; name: string } | null;
}
export default function DailyDeals() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<DropdownProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [editingDealId, setEditingDealId] = useState<number | null>(null);
  

  useEffect(() => {
    fetchDropdown();
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoadingDeals(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/admin/daily-deal/list/', {
        headers: token ? { Authorization: `Token ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to load deals');
      const data = await res.json();
      setDeals(data.deals || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load deals');
    } finally {
      setLoadingDeals(false);
    }
  };

  const fetchDropdown = async () => {
    try {
      setLoadingProducts(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/admin/products/dropdown/', {
        headers: token ? { Authorization: `Token ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error('Select a product');
    if (!title.trim()) return toast.error('Title is required');
    if (!dealPrice) return toast.error('Deal price required');
    if (!startTime || !endTime) return toast.error('Start and end times required');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const body = {
        product_id: selectedProduct,
        title,
        subtitle,
        deal_price: Number(dealPrice),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      };

      const res = await fetch('/api/admin/daily-deal/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create deal');

      toast.success('Deal created');
      fetchDeals();
      // clear form
      setSelectedProduct(null);
      setTitle('');
      setSubtitle('');
      setDealPrice('');
      setStartTime('');
      setEndTime('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create deal');
    }
  };

  const startEdit = (deal: DealItem) => {
    setEditingDealId(deal.id);
    setSelectedProduct(deal.product_id ?? null);
    setTitle(deal.title ?? '');
    setSubtitle(deal.subtitle ?? '');
    setDealPrice(String(deal.deal_price ?? ''));
    setStartTime(deal.start_time ? new Date(deal.start_time).toISOString().slice(0,16) : '');
    setEndTime(deal.end_time ? new Date(deal.end_time).toISOString().slice(0,16) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealId) return toast.error('No deal selected');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const body = {
        product_id: selectedProduct,
        title,
        subtitle,
        deal_price: Number(dealPrice),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      };

      const res = await fetch(`/api/admin/daily-deal/${editingDealId}/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update deal');

      toast.success('Deal updated');
      setEditingDealId(null);
      // clear form
      setSelectedProduct(null); setTitle(''); setSubtitle(''); setDealPrice(''); setStartTime(''); setEndTime('');
      fetchDeals();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update deal');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this deal?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/admin/daily-deal/${id}/delete/`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Token ${token}` } : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to delete deal');
      toast.success('Deal deleted');
      fetchDeals();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete deal');
    }
  };


  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 md:p-8 bg-slate-800 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-white">Daily Deals — Create</h1>
              <div className="ml-auto flex gap-2" />
            </motion.div>

            <div className="bg-slate-700 rounded-lg p-6 max-w-3xl">
              <form onSubmit={editingDealId ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Product</label>
                  <select
                    value={selectedProduct ?? ''}
                    onChange={(e) => setSelectedProduct(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Subtitle</label>
                  <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Deal Price</label>
                    <input type="number" step="0.01" value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Start Time</label>
                    <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">End Time</label>
                    <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingDealId ? 'Save Changes' : 'Create Deal'}</button>
                  <button type="button" onClick={() => {
                    setEditingDealId(null); setSelectedProduct(null); setTitle(''); setSubtitle(''); setDealPrice(''); setStartTime(''); setEndTime('');
                  }} className="px-4 py-2 bg-slate-600 text-white rounded">Reset</button>
                </div>
              </form>
            </div>
            
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-4">Existing Deals</h2>
              <div className="bg-slate-700 rounded-lg overflow-hidden">
                {loadingDeals ? (
                  <div className="p-6">Loading...</div>
                ) : deals.length === 0 ? (
                  <div className="p-6 text-slate-300">No deals created yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm text-slate-300">Product</th>
                          <th className="px-4 py-2 text-left text-sm text-slate-300">Title</th>
                          <th className="px-4 py-2 text-left text-sm text-slate-300">Price</th>
                          <th className="px-4 py-2 text-left text-sm text-slate-300">Duration</th>
                          <th className="px-4 py-2 text-left text-sm text-slate-300">Status</th>
                          <th className="px-4 py-2 text-left text-sm text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {deals.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-600">
                            <td className="px-4 py-3 text-white">{d.product_data?.name ?? d.product_id}</td>
                            <td className="px-4 py-3 text-white">{d.title}</td>
                            <td className="px-4 py-3 text-white">₦{Number(d.deal_price).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-300">{new Date(d.start_time).toLocaleString()} - {new Date(d.end_time).toLocaleString()}</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300">{d.status ?? ''}</span></td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => startEdit(d)} className="px-2 py-1 bg-blue-600 text-white rounded">Edit</button>
                                <button onClick={() => handleDelete(d.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Toaster />
      </div>
    </ProtectedRoute>
  );
}