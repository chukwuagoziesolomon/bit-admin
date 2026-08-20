'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Edit } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

interface Contact {
  full_name: string;
  email_address: string;
  phone_number: string;
}

interface PhoneSwapRequest {
  swap_id: string;
  id: string;
  status: string;
  current_phone: string;
  desired_phone: string;
  trade_in_phone: string;
  condition: string;
  balance_to_pay: number | null;
  user_email: string;
  contact: Contact;
  price_range: string;
  additional_notes: string;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface ApiResponse {
  requests: PhoneSwapRequest[];
  pagination: Pagination;
}

export default function PhoneSwaps() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PhoneSwapRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: '20', offset: '0' });
      if (statusFilter) params.set('status', statusFilter);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/phone-swap/?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to fetch phone swap requests');
      const json = await response.json();
      setData(json.data ?? json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (swapId: string, newStatus: string) => {
    setUpdating(swapId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/phone-swap/${swapId}/status/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) throw new Error('Failed to update status');
      fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUpdating(null);
      setSelectedRequest(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'approved': return 'bg-green-600';
      case 'rejected': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-8 bg-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-8 bg-slate-800 flex items-center justify-center">
          <div className="bg-red-600 text-white p-4 rounded-lg">Error: {error}</div>
        </main>
      </div>
    );
  }

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
          <motion.h1
            className="text-2xl md:text-3xl font-bold gradient-text mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Phone Swap Requests
          </motion.h1>

          <div className="flex items-center gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <span className="text-slate-400 text-sm">
              {data.pagination?.total ?? 0} total request{(data.pagination?.total ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-6">
            {data.requests.length === 0 ? (
              <div className="bg-slate-700 p-8 rounded-lg text-center text-slate-400">
                No swap requests found.
              </div>
            ) : (
              data.requests.map((request) => (
                <motion.div
                  key={request.swap_id}
                  className="bg-slate-700 p-6 rounded-lg shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-sm font-mono text-slate-300">{request.swap_id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-1">Current Phone</h4>
                          <p className="text-white">{request.current_phone || request.trade_in_phone || '—'}</p>
                          <p className="text-slate-400 text-sm">Condition: {request.condition || '—'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-1">Desired Phone</h4>
                          <p className="text-white">{request.desired_phone || '—'}</p>
                          <p className="text-slate-400 text-sm">Price range: {request.price_range || '—'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-1">Customer</h4>
                          <p className="text-white">{request.contact?.full_name || '—'}</p>
                          <p className="text-slate-400 text-sm">{request.contact?.email_address || request.user_email || '—'}</p>
                          <p className="text-slate-400 text-sm">{request.contact?.phone_number || '—'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-1">Balance to Pay</h4>
                          <p className="text-white font-medium">
                            {request.balance_to_pay != null ? `\u20A6${Number(request.balance_to_pay).toLocaleString()}` : 'Not set'}
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            Submitted: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {request.additional_notes && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-1">Notes</h4>
                          <p className="text-slate-200 bg-slate-600 p-3 rounded text-sm">{request.additional_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 lg:mt-0 lg:ml-6">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        disabled={updating === request.swap_id}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                        {updating === request.swap_id ? 'Updating...' : 'Update Status'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-slate-800 p-6 rounded-lg w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Update Status</h3>
            <p className="text-slate-400 text-sm mb-4 font-mono break-all">{selectedRequest.swap_id}</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">New Status</label>
              <select
                id="swap-status"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                defaultValue={selectedRequest.status}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const status = (document.getElementById('swap-status') as HTMLSelectElement).value;
                  updateStatus(selectedRequest.swap_id, status);
                }}
                disabled={updating === selectedRequest.swap_id}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {updating === selectedRequest.swap_id ? 'Updating...' : 'Update'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}