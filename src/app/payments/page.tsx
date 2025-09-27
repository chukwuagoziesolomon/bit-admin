'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, CreditCard, DollarSign, TrendingUp, Search, Filter, Calendar } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

interface Payment {
  id: number;
  payment_id: string;
  order: {
    id: number;
    order_id: string;
    customer_email: string;
    total_amount: number;
  };
  payment_method: string;
  amount_usd: number;
  amount_usdt: number | null;
  status: string;
  transaction_hash: string | null;
  created_at: string;
}

interface Statistics {
  total_payments: number;
  total_amount_usd: number;
  total_amount_usdt: number;
  recent_payments: number;
  status_breakdown: Array<{ status: string; count: number }>;
  method_breakdown: Array<{ payment_method: string; count: number }>;
}

interface ApiResponse {
  payments: Payment[];
  statistics: Statistics;
  filters_applied: {
    status: string | null;
    payment_method: string | null;
    search: string | null;
    date_from: string | null;
    date_to: string | null;
  };
}

export default function Payments() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [searchTerm, statusFilter, methodFilter, dateFrom, dateTo]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (methodFilter) params.append('payment_method', methodFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/payments/${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const result: ApiResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      case 'processing': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'bg-purple-600';
      case 'card': return 'bg-blue-600';
      case 'crypto': return 'bg-orange-600';
      case 'wallet': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setMethodFilter('');
    setDateFrom('');
    setDateTo('');
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
          <motion.div
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CreditCard className="text-blue-400" size={32} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">Payments Tracking</h1>
              <p className="text-slate-400">Monitor all payment transactions and revenue</p>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
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
            <motion.div
              className="bg-slate-700 p-4 rounded-lg text-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="text-blue-400" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Total</h3>
              <p className="text-2xl font-bold text-blue-400">{data.statistics.total_payments || 0}</p>
            </motion.div>

            <motion.div
              className="bg-slate-700 p-4 rounded-lg text-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="text-green-400" size={20} />
              </div>
              <h3 className="text-sm font-semibold text-white">USD Total</h3>
              <p className="text-xl font-bold text-green-400">₦{data.statistics.total_amount_usd?.toLocaleString() || '0'}</p>
            </motion.div>

            <motion.div
              className="bg-slate-700 p-4 rounded-lg text-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="text-orange-400" size={20} />
              </div>
              <h3 className="text-sm font-semibold text-white">USDT Total</h3>
              <p className="text-xl font-bold text-orange-400">{data.statistics.total_amount_usdt?.toFixed(2) || '0.00'} USDT</p>
            </motion.div>

            <motion.div
              className="bg-slate-700 p-4 rounded-lg text-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <Calendar className="text-purple-400" size={20} />
              </div>
              <h3 className="text-sm font-semibold text-white">Recent</h3>
              <p className="text-2xl font-bold text-purple-400">{data.statistics.recent_payments || 0}</p>
            </motion.div>

            <motion.div
              className="bg-slate-700 p-4 rounded-lg text-center col-span-2"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <h3 className="text-sm font-semibold text-white mb-2">Status Breakdown</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {data.statistics.status_breakdown?.map((item, index) => (
                  <span key={index} className="text-xs bg-slate-600 px-2 py-1 rounded">
                    {item.status}: {item.count}
                  </span>
                )) || <span className="text-xs text-slate-400">No data available</span>}
              </div>
            </motion.div>
          </motion.div>

          {/* Filters */}
          <motion.div
            className="bg-slate-700 p-6 rounded-lg shadow-lg mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Filter className="text-slate-400" size={20} />
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-400 hover:text-blue-300 ml-auto"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="processing">Processing</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="">All Methods</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="crypto">Crypto</option>
                <option value="wallet">Wallet</option>
              </select>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="From date"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="To date"
              />
            </div>
          </motion.div>

          {/* Payments Table */}
          <motion.div
            className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {data.payments.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      className="hover:bg-slate-600 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{payment.payment_id}</div>
                        {payment.transaction_hash && (
                          <div className="text-xs text-slate-400 truncate max-w-32">
                            {payment.transaction_hash.substring(0, 16)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{payment.order.order_id}</div>
                        <div className="text-sm text-slate-400">${payment.order.total_amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{payment.order.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          ₦{payment.amount_usd}
                          {payment.amount_usdt && (
                            <div className="text-xs text-orange-400">{payment.amount_usdt} USDT</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getMethodColor(payment.payment_method)}`}>
                          {payment.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-400">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {data.payments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-300">No payments found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm || statusFilter || methodFilter || dateFrom || dateTo
                  ? 'Try adjusting your filters'
                  : 'No payment records available'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}