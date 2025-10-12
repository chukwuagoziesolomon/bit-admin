'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, ShoppingCart, Edit, Eye, CheckCircle, Truck, CreditCard, RefreshCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';

interface Order {
   id: number;
   order_id: string;
   first_name: string;
   last_name: string;
   email: string;
   phone_number: string;
   street_address: string;
   city: string;
   state: string;
   postal_code: string;
   country: string;
   payment_method: string;
   cart_items: { [key: string]: number };
   subtotal: string;
   shipping_cost: string;
   total_amount: string;
   status: string;
   payment_reference?: string;
   additional_info?: string;
   created_at: string;
   updated_at: string;
 }

 interface Pagination {
   current_page: number;
   per_page: number;
   total_orders: number;
   total_pages: number;
   has_next: boolean;
   has_previous: boolean;
 }

 interface Statistics {
   total: number;
   pending: number;
   payment_processing: number;
   paid: number;
   processing: number;
   en_route: number;
   shipped: number;
   delivered: number;
   cancelled: number;
   refunded: number;
 }

 interface FiltersApplied {
   status: string | null;
   search: string | null;
 }

 interface ApiResponse {
   orders: Order[];
   pagination: Pagination;
   statistics: Statistics;
   filters_applied: FiltersApplied;
 }

export default function Orders() {
   const [sidebarOpen, setSidebarOpen] = useState(true);
   const [data, setData] = useState<ApiResponse | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [updating, setUpdating] = useState<string | null>(null);
   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
   const [newStatus, setNewStatus] = useState('');
   const [confirmingPayment, setConfirmingPayment] = useState<string | null>(null);

   // New feature states
   const [trackingModal, setTrackingModal] = useState<Order | null>(null);
   const [refundModal, setRefundModal] = useState<Order | null>(null);
   const [paymentConfirmModal, setPaymentConfirmModal] = useState<Order | null>(null);

   // Form states
   const [trackingNumber, setTrackingNumber] = useState('');
   const [carrierName, setCarrierName] = useState('');
   const [trackingNotes, setTrackingNotes] = useState('');
   const [refundReason, setRefundReason] = useState('');
   const [refundAmount, setRefundAmount] = useState('');
   const [adminNotes, setAdminNotes] = useState('');
   const [paymentReference, setPaymentReference] = useState('');
   const [confirmationNotes, setConfirmationNotes] = useState('');

   // Pagination and filtering state
   const [currentPage, setCurrentPage] = useState(1);
   const [perPage, setPerPage] = useState(20);
   const [searchQuery, setSearchQuery] = useState('');
   const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [currentPage, perPage, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/orders/?${params}`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const result: ApiResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/orders/${orderId}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      const result = await response.json();
      toast.success(result.message || 'Order status updated successfully');
      fetchOrders(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(null);
      setSelectedOrder(null);
      setNewStatus('');
    }
  };

  const confirmPayment = async (orderId: string) => {
    setConfirmingPayment(orderId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/checkout/confirm-payment/${orderId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          manual_override: true,
          payment_reference: `manual_confirm_${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      const result = await response.json();
      toast.success(result.message || 'Payment confirmed successfully');
      fetchOrders(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm payment');
    } finally {
      setConfirmingPayment(null);
    }
  };

  const updateTracking = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/orders/${orderId}/tracking/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          tracking_number: trackingNumber,
          carrier_name: carrierName,
          status: 'shipped',
          tracking_notes: trackingNotes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tracking');
      }

      const result = await response.json();
      toast.success(result.message || 'Tracking updated successfully');
      fetchOrders(); // Refresh data
      setTrackingModal(null);
      setTrackingNumber('');
      setCarrierName('');
      setTrackingNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update tracking');
    }
  };

  const processRefund = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/orders/${orderId}/refund/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          refund_reason: refundReason,
          refund_amount: parseFloat(refundAmount),
          admin_notes: adminNotes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      const result = await response.json();
      toast.success(result.message || 'Refund processed successfully');
      fetchOrders(); // Refresh data
      setRefundModal(null);
      setRefundReason('');
      setRefundAmount('');
      setAdminNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process refund');
    }
  };

  const confirmPaymentWithDetails = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/orders/${orderId}/confirm-payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          payment_reference: paymentReference,
          confirmation_notes: confirmationNotes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      const result = await response.json();
      toast.success(result.message || 'Payment confirmed successfully');
      fetchOrders(); // Refresh data
      setPaymentConfirmModal(null);
      setPaymentReference('');
      setConfirmationNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm payment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-600';
      case 'payment_processing': return 'bg-blue-600';
      case 'paid': return 'bg-green-600';
      case 'processing': return 'bg-yellow-600';
      case 'en_route': return 'bg-orange-600';
      case 'shipped': return 'bg-orange-600';
      case 'delivered': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      case 'refunded': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'bg-purple-600';
      case 'card': return 'bg-blue-600';
      case 'wallet': return 'bg-green-600';
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
            Orders Management
          </motion.h1>

          {/* Filters and Search */}
          <motion.div
            className="bg-slate-700 p-4 md:p-6 rounded-lg shadow-lg mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div>
                  <input
                    type="text"
                    placeholder="Search by Order ID, customer name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 w-64"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white w-40"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="payment_processing">Payment Processing</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="en_route">En Route</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Items per page:</span>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-slate-600 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Statistics */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-4 mb-8"
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
            {data && Object.entries(data.statistics).map(([key, value], index) => (
              <motion.div
                key={key}
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <h3 className="text-sm font-semibold text-white capitalize">{key.replace('_', ' ')}</h3>
                <p className="text-xl font-bold text-blue-400">{value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Orders Table */}
          <motion.div
            className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {data.orders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      className="hover:bg-slate-600 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{order.order_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {order.first_name} {order.last_name}
                        </div>
                        <div className="text-sm text-slate-400">{order.email}</div>
                        <div className="text-sm text-slate-400">{order.phone_number}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {order.city}, {order.state}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          ₦{order.total_amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getPaymentMethodColor(order.payment_method)}`}>
                          {order.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                            title="Update Status"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setPaymentConfirmModal(order)}
                            className="text-green-400 hover:text-green-300 transition-colors p-1"
                            title="Manual Payment Confirmation"
                          >
                            <CreditCard size={16} />
                          </button>
                          <button
                            onClick={() => setTrackingModal(order)}
                            className="text-orange-400 hover:text-orange-300 transition-colors p-1"
                            title="Update Tracking"
                          >
                            <Truck size={16} />
                          </button>
                          <button
                            onClick={() => setRefundModal(order)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                            title="Process Refund"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            className="text-purple-400 hover:text-purple-300 transition-colors p-1"
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
          </motion.div>

          {/* Pagination Controls */}
          {data && data.pagination && (
            <motion.div
              className="bg-slate-700 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="text-sm text-slate-400">
                Showing {((data.pagination.current_page - 1) * data.pagination.per_page) + 1} to{' '}
                {Math.min(data.pagination.current_page * data.pagination.per_page, data.pagination.total_orders)} of{' '}
                {data.pagination.total_orders} orders
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!data.pagination.has_previous}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.pagination.total_pages) }, (_, i) => {
                    const pageNum = Math.max(1, data.pagination.current_page - 2) + i;
                    if (pageNum > data.pagination.total_pages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          pageNum === data.pagination.current_page
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-600 hover:bg-slate-500 text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(data.pagination.total_pages, prev + 1))}
                  disabled={!data.pagination.has_next}
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
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-slate-800 p-6 rounded-lg w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Update Order Status - {selectedOrder.order_id}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Status
                </label>
                <div className="text-white bg-slate-700 px-3 py-2 rounded">
                  {selectedOrder.status.replace('_', ' ')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Select new status</option>
                  <option value="pending">Pending</option>
                  <option value="payment_processing">Payment Processing</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="en_route">En Route</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {/* Order Details */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Order Details</h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <p><strong>Customer:</strong> {selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p><strong>Email:</strong> {selectedOrder.email}</p>
                  <p><strong>Phone:</strong> {selectedOrder.phone_number}</p>
                  <p><strong>Address:</strong> {selectedOrder.street_address}, {selectedOrder.city}, {selectedOrder.state} {selectedOrder.postal_code}</p>
                  <p><strong>Country:</strong> {selectedOrder.country}</p>
                  <p><strong>Subtotal:</strong> ₦{parseFloat(selectedOrder.subtotal).toLocaleString()}</p>
                  <p><strong>Shipping:</strong> ₦{parseFloat(selectedOrder.shipping_cost).toLocaleString()}</p>
                  <p><strong>Total:</strong> ₦{parseFloat(selectedOrder.total_amount).toLocaleString()}</p>
                  <p><strong>Items:</strong> {Object.keys(selectedOrder.cart_items).length} different products</p>
                  {selectedOrder.payment_reference && (
                    <p><strong>Payment Ref:</strong> {selectedOrder.payment_reference}</p>
                  )}
                  {selectedOrder.additional_info && (
                    <p><strong>Notes:</strong> {selectedOrder.additional_info}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setNewStatus('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newStatus) {
                    updateOrderStatus(selectedOrder.id.toString(), newStatus);
                  } else {
                    toast.error('Please select a new status');
                  }
                }}
                disabled={updating === selectedOrder.id.toString()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {updating === selectedOrder.id.toString() ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tracking Update Modal */}
      {trackingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-slate-800 p-6 rounded-lg w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Update Tracking - {trackingModal.order_id}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Carrier Name
                </label>
                <select
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Select carrier</option>
                  <option value="DHL Express">DHL Express</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="NIPOST">NIPOST</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tracking Notes
                </label>
                <textarea
                  value={trackingNotes}
                  onChange={(e) => setTrackingNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Additional tracking notes..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setTrackingModal(null);
                  setTrackingNumber('');
                  setCarrierName('');
                  setTrackingNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateTracking(trackingModal.id.toString())}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Update Tracking
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manual Payment Confirmation Modal */}
      {paymentConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-slate-800 p-6 rounded-lg w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Manual Payment Confirmation - {paymentConfirmModal.order_id}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Reference
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Enter payment reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirmation Notes
                </label>
                <textarea
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Notes about payment confirmation..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setPaymentConfirmModal(null);
                  setPaymentReference('');
                  setConfirmationNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmPaymentWithDetails(paymentConfirmModal.id.toString())}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Confirm Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Refund Processing Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-slate-800 p-6 rounded-lg w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Process Refund - {refundModal.order_id}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Refund Reason
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Select reason</option>
                  <option value="customer_dissatisfaction">Customer Dissatisfaction</option>
                  <option value="product_defect">Product Defect</option>
                  <option value="wrong_item">Wrong Item Sent</option>
                  <option value="late_delivery">Late Delivery</option>
                  <option value="duplicate_order">Duplicate Order</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Refund Amount (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Enter refund amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Internal notes about refund..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setRefundModal(null);
                  setRefundReason('');
                  setRefundAmount('');
                  setAdminNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => processRefund(refundModal.id.toString())}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Process Refund
              </button>
            </div>
          </motion.div>
        </div>
      )}

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