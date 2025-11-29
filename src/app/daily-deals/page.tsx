"use client";

import { useEffect, useState, useRef } from 'react';
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
  is_featured?: boolean;
  max_quantity?: number | null;
  main_image?: string | null;
  deal_price_usdt?: string | null;
  deal_description?: string | null;
  terms_and_conditions?: string | null;
  cta_url?: string | null;
}
export default function DailyDeals() {
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Handle file input (no upload, just show file name)
  const handleMainImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
    }
  };
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<DropdownProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [dealPriceUsdt, setDealPriceUsdt] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [dealDescription, setDealDescription] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [editingDealId, setEditingDealId] = useState<number | null>(null);
  

  useEffect(() => {
    fetchDropdown();
    fetchDeals();
  }, []);

  // Client-side API base (use NEXT_PUBLIC_API_BASE_URL to point to external backend)
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const buildUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

  const fetchDeals = async () => {
    try {
      setLoadingDeals(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(buildUrl('/api/admin/daily-deal/list/'), {
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
      const res = await fetch(buildUrl('/api/admin/products/dropdown/'), {
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
      const body: any = {
        product: String(selectedProduct),
        title,
        subtitle,
        deal_price: dealPrice,
        is_featured: isFeatured,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      };
      if (dealPriceUsdt) body.deal_price_usdt = dealPriceUsdt;
      if (originalPrice) body.original_price = originalPrice;
      if (maxQuantity) body.max_quantity = maxQuantity;
      if (dealDescription) body.deal_description = dealDescription;
      if (termsAndConditions) body.terms_and_conditions = termsAndConditions;
      if (ctaUrl) body.cta_url = ctaUrl;
      if (discountPercentage) {
        // Ensure at most 3 digits before decimal
        const dp = discountPercentage.match(/^\d{1,3}(\.\d+)?$/) ? discountPercentage : String(Number(discountPercentage).toFixed(2));
        body.discount_percentage = dp;
      }
      if (mainImage) {
        body.main_image = mainImage;
      }

      const res = await fetch(buildUrl('/api/admin/daily-deal/create/'), {
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
      setOriginalPrice('');
      setDealPriceUsdt('');
      setStartTime('');
      setEndTime('');
      setIsFeatured(false);
      setMaxQuantity('');
      setMainImage('');
      setDealDescription('');
      setTermsAndConditions('');
      setCtaUrl('');
      setDiscountPercentage('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create deal');
    }
  };

  // Remove file upload handler

  const startEdit = (deal: DealItem) => {
    setEditingDealId(deal.id);
    setSelectedProduct(deal.product_id ?? null);
    setTitle(deal.title ?? '');
    setSubtitle(deal.subtitle ?? '');
    setDealPrice(String(deal.deal_price ?? ''));
    setOriginalPrice(deal.original_price != null ? String(deal.original_price) : '');
    setDealPriceUsdt(deal.deal_price_usdt ?? '');
    setStartTime(deal.start_time ? new Date(deal.start_time).toISOString().slice(0,16) : '');
    setEndTime(deal.end_time ? new Date(deal.end_time).toISOString().slice(0,16) : '');
    setIsFeatured(!!deal.is_featured);
    setMaxQuantity(deal.max_quantity != null ? String(deal.max_quantity) : '');
    setMainImage(deal.main_image ?? '');
    setDealDescription(deal.deal_description ?? '');
    setTermsAndConditions(deal.terms_and_conditions ?? '');
    setCtaUrl(deal.cta_url ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealId) return toast.error('No deal selected');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const isExternal = !!API_BASE;
      const baseBody: any = {
        product_id: selectedProduct,
        title,
        subtitle,
        deal_price: Number(dealPrice),
        deal_price_usdt: dealPriceUsdt || null,
        original_price: originalPrice ? Number(originalPrice) : undefined,
        is_featured: isFeatured,
        max_quantity: maxQuantity ? Number(maxQuantity) : null,
        main_image: mainImage || null,
        deal_description: dealDescription || null,
        terms_and_conditions: termsAndConditions || null,
        cta_url: ctaUrl || null,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      };

      const body: any = { ...baseBody };
      if (isExternal) {
        body.product = baseBody.product_id;
        delete body.product_id;
        body.main_image = baseBody.main_image || '';
        const orig = baseBody.original_price != null ? Number(baseBody.original_price) : null;
        const deal = Number(baseBody.deal_price || 0);
        body.discount_percentage = orig && orig > 0 ? Math.round(((orig - deal) / orig) * 100) : 0;
      }

      const res = await fetch(buildUrl(`/api/admin/daily-deal/${editingDealId}/update/`), {
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
      setOriginalPrice(''); setDealPriceUsdt('');
      setIsFeatured(false); setMaxQuantity(''); setMainImage(''); setDealDescription(''); setTermsAndConditions(''); setCtaUrl('');
      fetchDeals();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update deal');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this deal?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(buildUrl(`/api/admin/daily-deal/${id}/delete/`), {
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Original Price</label>
                    <input type="number" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="e.g. 100.00" className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Discount Percentage</label>
                    <input type="number" step="0.01" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} placeholder="e.g. 20.5" className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Deal Price (USDT)</label>
                    <input value={dealPriceUsdt} onChange={(e) => setDealPriceUsdt(e.target.value)} placeholder="e.g. 79.990000" className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <input id="is_featured" type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4" />
                    <label htmlFor="is_featured" className="text-sm text-slate-300">Feature this deal</label>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Max Quantity</label>
                    <input type="number" min={0} value={maxQuantity} onChange={(e) => setMaxQuantity(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-slate-300 mb-1">Main Image URL or File</label>
                    <div className="flex gap-2 items-center">
                      <input value={mainImage} onChange={(e) => setMainImage(e.target.value)} placeholder="Paste image URL" className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                      <button
                        type="button"
                        className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose File
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleMainImageFile}
                      />
                    </div>
                    {selectedImageFile && (
                      <div className="mt-3 text-slate-300 text-sm">Selected file: {selectedImageFile.name}</div>
                    )}
                    {mainImage ? (
                      <div className="mt-3">
                        <img src={mainImage} alt="Main" className="max-h-40 rounded border border-slate-600" />
                      </div>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-slate-300 mb-1">Deal Description</label>
                    <textarea value={dealDescription} onChange={(e) => setDealDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-slate-300 mb-1">Terms &amp; Conditions</label>
                    <textarea value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-slate-300 mb-1">CTA URL</label>
                    <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingDealId ? 'Save Changes' : 'Create Deal'}</button>
                  <button type="button" onClick={() => {
                    setEditingDealId(null);
                    setSelectedProduct(null);
                    setTitle(''); setSubtitle(''); setDealPrice(''); setStartTime(''); setEndTime('');
                    setIsFeatured(false); setMaxQuantity(''); setMainImage(''); setDealDescription(''); setTermsAndConditions(''); setCtaUrl('');
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