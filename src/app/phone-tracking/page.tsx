'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Edit, MapPin } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

interface PhoneTrackingRequest {
  tracking_id: string;
  phone_number: string;
  imei_number: string;
  device_model: string;
  last_known_location: string;
  additional_information: string;
  service_plan: string;
  communication_preference: string;
  status: string;
  customer_email: string;
  customer_active_number: string;
  created_at: string;
  updated_at: string;
}

interface Statistics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
}

interface ApiResponse {
  requests: PhoneTrackingRequest[];
  statistics: Statistics;
}

export default function PhoneTracking() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PhoneTrackingRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/phone-tracking/requests/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch phone tracking requests');
      }
      const result: ApiResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (trackingId: string, newStatus: string, additionalInfo?: string) => {
    setUpdating(trackingId);
    try {
      const token = localStorage.getItem('token');
      const body: any = { status: newStatus };
      if (additionalInfo) body.additional_info = additionalInfo;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/phone-tracking/requests/${trackingId}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(body),
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
      case 'processing': return 'bg-blue-600';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getServicePlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-gray-600';
      case 'premium': return 'bg-purple-600';
      case 'enterprise': return 'bg-orange-600';
      default: return 'bg-slate-600';
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
            Phone Tracking Requests
          </motion.h1>

          {/* Statistics */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
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
            {Object.entries(data.statistics).map(([key, value], index) => (
              <motion.div
                key={key}
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <h3 className="text-lg font-semibold text-white capitalize">{key}</h3>
                <p className="text-2xl font-bold text-blue-400">{value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Requests List */}
          <div className="space-y-6">
            {data.requests.map((request, index) => (
              <motion.div
                key={request.tracking_id}
                className="bg-slate-700 p-6 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold text-white">{request.tracking_id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getServicePlanColor(request.service_plan)}`}>
                        {request.service_plan}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Device Information</h4>
                        <p className="text-white">{request.device_model}</p>
                        <p className="text-slate-400 text-sm">IMEI: {request.imei_number}</p>
                        <p className="text-slate-400 text-sm">Phone: {request.phone_number}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <MapPin size={16} />
                          Last Known Location
                        </h4>
                        <p className="text-white">{request.last_known_location}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Customer Contact</h4>
                        <p className="text-slate-400 text-sm">Email: {request.customer_email}</p>
                        <p className="text-slate-400 text-sm">Active Number: {request.customer_active_number}</p>
                        <p className="text-slate-400 text-sm">Communication: {request.communication_preference}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Additional Information</h4>
                        <p className="text-slate-200 bg-slate-600 p-3 rounded text-sm">{request.additional_information}</p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      <p>Created: {new Date(request.created_at).toLocaleString()}</p>
                      <p>Updated: {new Date(request.updated_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                      Update Status
                    </button>
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
            <h3 className="text-lg font-semibold text-white mb-4">Update Status for {selectedRequest.tracking_id}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Status</label>
                <select
                  id="status"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  defaultValue={selectedRequest.status}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Additional Information</label>
                <textarea
                  id="additional_info"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  rows={4}
                  placeholder="Enter additional information or notes"
                  defaultValue={selectedRequest.additional_information}
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
                  const additional_info = (document.getElementById('additional_info') as HTMLTextAreaElement).value;

                  updateStatus(selectedRequest.tracking_id, status, additional_info);
                  setSelectedRequest(null);
                }}
                disabled={updating === selectedRequest.tracking_id}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {updating === selectedRequest.tracking_id ? 'Updating...' : 'Update'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}