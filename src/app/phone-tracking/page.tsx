'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Menu, Edit, Trash2, MapPin, Filter } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

type TrackingStatus = 'submitted' | 'processing' | 'located' | 'not_found';

interface PhoneTrackingRequest {
  id: string;
  status: TrackingStatus;
  phone_model: string;
  estimated_amount: number | null;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface ApiResponse {
  requests: PhoneTrackingRequest[];
  pagination: Pagination;
}

export default function PhoneTracking() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PhoneTrackingRequest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PhoneTrackingRequest | null>(null);

  // Filters & pagination
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 10;
  const [offset, setOffset] = useState(0);

  // Status update form state
  const [newStatus, setNewStatus] = useState<TrackingStatus>('submitted');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/phone-tracking/?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to fetch phone tracking requests');
      const json = await response.json();
      const result = (json.data ?? json) as ApiResponse;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [limit, offset, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const openUpdateModal = (request: PhoneTrackingRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setLocationAddress('');
    setLocationLat('');
    setLocationLng('');
  };

  const updateStatus = async () => {
    if (!selectedRequest) return;
    setUpdating(selectedRequest.id);
    try {
      const token = localStorage.getItem('token');
      const body: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'located') {
        const location: Record<string, unknown> = { address: locationAddress };
        if (locationLat) location.lat = parseFloat(locationLat);
        if (locationLng) location.lng = parseFloat(locationLng);
        body.location = location;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/phone-tracking/requests/${selectedRequest.id}/status/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) throw new Error('Failed to update status');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUpdating(null);
    }
  };

  const deleteRequest = async (trackingId: string) => {
    setDeleting(trackingId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/phone-tracking/${trackingId}/`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok && response.status !== 204) throw new Error('Failed to delete tracking request');
      setConfirmDelete(null);
      fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-600';
      case 'processing': return 'bg-blue-600';
      case 'located': return 'bg-green-600';
      case 'not_found': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / limit) : 1;

  if (loading && !data) {
    return (
      <div className="flex h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-8 bg-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </main>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-8 bg-slate-800 flex items-center justify-center">
          <div className="bg-red-600 text-white p-4 rounded-lg">
            Error: {error}
          </div>
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
            className="text-2xl md:text-3xl font-bold gradient-text mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Phone Tracking Requests
          </motion.h1>

          {/* Filters */}
          <motion.div
            className="bg-slate-700 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <span className="text-sm text-slate-400">Filter by status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
              className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="processing">Processing</option>
              <option value="located">Located</option>
              <option value="not_found">Not Found</option>
            </select>
            {data && (
              <span className="text-sm text-slate-400 ml-auto">
                Total: {data.pagination?.total ?? 0} requests
              </span>
            )}
          </motion.div>

          {/* Requests Table */}
          <motion.div
            className="bg-slate-700 rounded-lg shadow-lg overflow-hidden mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Phone Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Est. Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600">
                    {data?.requests?.map((request, index) => (
                      <motion.tr
                        key={request.id}
                        className="hover:bg-slate-600 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-slate-300 truncate max-w-[140px]" title={request.id}>
                            {request.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{request.phone_model}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-400">
                            {request.estimated_amount != null
                              ? `₦${request.estimated_amount.toLocaleString()}`
                              : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-400">
                            {new Date(request.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openUpdateModal(request)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                            >
                              <Edit size={14} />
                              Update
                            </button>
                            <button
                              onClick={() => setConfirmDelete(request)}
                              disabled={deleting === request.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {data?.requests?.length === 0 && (
                  <div className="text-center py-12">
                    <MapPin className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-300">No tracking requests found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {statusFilter ? 'Try changing the status filter' : 'No records available'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Pagination */}
          {data && data.pagination && data.pagination.total > limit && (
            <motion.div
              className="bg-slate-700 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-sm text-slate-400">
                Showing {offset + 1}–{Math.min(offset + limit, data.pagination?.total ?? 0)} of {data.pagination?.total ?? 0} requests
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-400">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= (data.pagination?.total ?? 0)}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Status Update Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-slate-800 p-6 rounded-lg w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-1">Update Status</h3>
            <p className="text-sm text-slate-400 mb-4">{selectedRequest.phone_model}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TrackingStatus)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="submitted">Submitted</option>
                  <option value="processing">Processing</option>
                  <option value="located">Located</option>
                  <option value="not_found">Not Found</option>
                </select>
              </div>

              {newStatus === 'located' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                      <MapPin size={14} /> Location Address
                    </label>
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="e.g. Lagos, Nigeria"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
                      <input
                        type="number"
                        value={locationLat}
                        onChange={(e) => setLocationLat(e.target.value)}
                        placeholder="6.5"
                        step="any"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
                      <input
                        type="number"
                        value={locationLng}
                        onChange={(e) => setLocationLng(e.target.value)}
                        placeholder="3.4"
                        step="any"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateStatus}
                disabled={updating === selectedRequest.id}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {updating === selectedRequest.id ? 'Updating...' : 'Update'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-slate-800 p-6 rounded-lg w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Delete Tracking Request</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to delete the request for{' '}
              <strong className="text-white">{confirmDelete.phone_model}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRequest(confirmDelete.id)}
                disabled={deleting === confirmDelete.id}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {deleting === confirmDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}