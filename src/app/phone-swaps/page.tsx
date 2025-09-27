'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Edit } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

interface PhoneSwapRequest {
  swap_id: string;
  current_brand: string;
  current_model: string;
  current_storage: string;
  current_color: string;
  purchase_date: string;
  desired_brand: string;
  desired_model: string;
  desired_storage: string;
  desired_color: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  location: string;
  screen_condition: string;
  battery_condition: string;
  physical_condition: string;
  original_box: boolean;
  charger: boolean;
  earphones: boolean;
  screen_protector: boolean;
  case: boolean;
  additional_notes: string;
  functional_issues: string;
  terms_accepted: boolean;
  status: string;
  estimated_value: number | null;
  final_value: number | null;
  swap_difference: number | null;
  created_at: string;
  updated_at: string;
  inspection_date: string | null;
  completion_date: string | null;
}

interface Statistics {
  total: number;
  pending: number;
  approved: number;
  inspection_scheduled: number;
  completed: number;
}

interface ApiResponse {
  requests: PhoneSwapRequest[];
  statistics: Statistics;
}

interface StatusUpdateData {
  estimated_value?: number;
  final_value?: number;
  swap_difference?: number;
  inspection_date?: string;
  completion_date?: string;
  additional_notes?: string;
}

export default function PhoneSwaps() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PhoneSwapRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/phone-swap/requests/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch phone swap requests');
      }
      const result: ApiResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (swapId: string, newStatus: string, additionalData?: Record<string, unknown>) => {
    setUpdating(swapId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/phone-swap/requests/${swapId}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      const result = await response.json();
      alert(result.message);
      fetchRequests(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'approved': return 'bg-green-600';
      case 'inspection_scheduled': return 'bg-blue-600';
      case 'completed': return 'bg-purple-600';
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
            Phone Swap Requests
          </motion.h1>

          {/* Statistics */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {Object.entries(data.statistics).map(([key, value]) => (
              <motion.div
                key={key}
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <h3 className="text-lg font-semibold text-white capitalize">{key.replace('_', ' ')}</h3>
                <p className="text-2xl font-bold text-blue-400">{value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Requests List */}
          <div className="space-y-6">
            {data.requests.map((request, index) => (
              <motion.div
                key={request.swap_id}
                className="bg-slate-700 p-6 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold text-white">{request.swap_id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Current Device</h4>
                        <p className="text-white">{request.current_brand} {request.current_model}</p>
                        <p className="text-slate-400 text-sm">{request.current_storage} • {request.current_color}</p>
                        <p className="text-slate-400 text-sm">Purchased: {new Date(request.purchase_date).toLocaleDateString()}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Desired Device</h4>
                        <p className="text-white">{request.desired_brand} {request.desired_model}</p>
                        <p className="text-slate-400 text-sm">{request.desired_storage} • {request.desired_color}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Customer Info</h4>
                        <p className="text-white">{request.full_name}</p>
                        <p className="text-slate-400 text-sm">{request.email_address}</p>
                        <p className="text-slate-400 text-sm">{request.phone_number}</p>
                        <p className="text-slate-400 text-sm">{request.location}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Device Condition</h4>
                        <p className="text-slate-400 text-sm">Screen: {request.screen_condition}</p>
                        <p className="text-slate-400 text-sm">Battery: {request.battery_condition}</p>
                        <p className="text-slate-400 text-sm">Physical: {request.physical_condition}</p>
                        <p className="text-slate-400 text-sm">Functional Issues: {request.functional_issues || 'None'}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Accessories</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.original_box && <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Original Box</span>}
                        {request.charger && <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Charger</span>}
                        {request.earphones && <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Earphones</span>}
                        {request.screen_protector && <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Screen Protector</span>}
                        {request.case && <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Case</span>}
                      </div>
                    </div>

                    {request.additional_notes && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Additional Notes</h4>
                        <p className="text-slate-200 bg-slate-600 p-3 rounded">{request.additional_notes}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Estimated Value:</span>
                        <p className="text-white font-medium">{request.estimated_value ? `₦${request.estimated_value.toLocaleString()}` : 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Final Value:</span>
                        <p className="text-white font-medium">{request.final_value ? `₦${request.final_value.toLocaleString()}` : 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Swap Difference:</span>
                        <p className="text-white font-medium">{request.swap_difference ? `₦${request.swap_difference.toLocaleString()}` : 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                      Update Status
                    </button>

                    <div className="text-xs text-slate-400">
                      <p>Created: {new Date(request.created_at).toLocaleString()}</p>
                      <p>Updated: {new Date(request.updated_at).toLocaleString()}</p>
                      {request.inspection_date && <p>Inspection: {new Date(request.inspection_date).toLocaleString()}</p>}
                      {request.completion_date && <p>Completed: {new Date(request.completion_date).toLocaleString()}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
            <h3 className="text-lg font-semibold text-white mb-4">Update Status for {selectedRequest.swap_id}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Status</label>
                <select
                  id="status"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  defaultValue={selectedRequest.status}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="inspection_scheduled">Inspection Scheduled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Value (₦)</label>
                <input
                  type="number"
                  id="estimated_value"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  defaultValue={selectedRequest.estimated_value || ''}
                  placeholder="Enter estimated value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Final Value (₦)</label>
                <input
                  type="number"
                  id="final_value"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  defaultValue={selectedRequest.final_value || ''}
                  placeholder="Enter final value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Swap Difference (₦)</label>
                <input
                  type="number"
                  id="swap_difference"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  defaultValue={selectedRequest.swap_difference || ''}
                  placeholder="Enter swap difference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Inspection Date</label>
                <input
                  type="datetime-local"
                  id="inspection_date"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  defaultValue={selectedRequest.inspection_date ? new Date(selectedRequest.inspection_date).toISOString().slice(0, 16) : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Completion Date</label>
                <input
                  type="datetime-local"
                  id="completion_date"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  defaultValue={selectedRequest.completion_date ? new Date(selectedRequest.completion_date).toISOString().slice(0, 16) : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes</label>
                <textarea
                  id="additional_notes"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  rows={3}
                  placeholder="Enter admin notes"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const status = (document.getElementById('status') as HTMLSelectElement).value;
                  const estimated_value = (document.getElementById('estimated_value') as HTMLInputElement).value;
                  const final_value = (document.getElementById('final_value') as HTMLInputElement).value;
                  const swap_difference = (document.getElementById('swap_difference') as HTMLInputElement).value;
                  const inspection_date = (document.getElementById('inspection_date') as HTMLInputElement).value;
                  const completion_date = (document.getElementById('completion_date') as HTMLInputElement).value;
                  const additional_notes = (document.getElementById('additional_notes') as HTMLTextAreaElement).value;

                  const additionalData: Record<string, unknown> = {};
                  if (estimated_value) additionalData.estimated_value = parseFloat(estimated_value);
                  if (final_value) additionalData.final_value = parseFloat(final_value);
                  if (swap_difference) additionalData.swap_difference = parseFloat(swap_difference);
                  if (inspection_date) additionalData.inspection_date = new Date(inspection_date).toISOString();
                  if (completion_date) additionalData.completion_date = new Date(completion_date).toISOString();
                  if (additional_notes) additionalData.additional_notes = additional_notes;

                  updateStatus(selectedRequest.swap_id, status, additionalData);
                  setSelectedRequest(null);
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