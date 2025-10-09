'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, ShoppingCart, Edit, Eye, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';

interface Order {
  id: number;
  order_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  total_amount: number;
  status: string;
  status_display?: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  cart_items: {
    product_id: number;
    quantity: number;
  };
}

interface Statistics {
  total: number;
  pending: number;
  paid: number;
  shipped: number;
  delivered: number;
}

interface ApiResponse {
  orders: Order[];
  statistics: Statistics;
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/orders/`, {
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

  const getStatusColor = (status: string) => {
    switch (status) {
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {order.first_name} {order.last_name}
                        </div>
                        <div className="text-sm text-slate-400">{order.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          ₦{order.total_amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(order.status)}`}>
                          {order.status_display || order.status}
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Update Status"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => confirmPayment(order.order_id)}
                            disabled={confirmingPayment === order.order_id}
                            className="text-green-400 hover:text-green-300 disabled:text-gray-500 transition-colors"
                            title="Confirm Payment"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            className="text-purple-400 hover:text-purple-300 transition-colors"
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
                  {selectedOrder.status_display || selectedOrder.status}
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
                  <p>Customer: {selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p>Email: {selectedOrder.email}</p>
                  <p>Phone: {selectedOrder.phone_number}</p>
                  <p>Amount: ₦{selectedOrder.total_amount.toLocaleString()}</p>
                  <p>Items: {selectedOrder.cart_items ? selectedOrder.cart_items.quantity : 'N/A'}</p>
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