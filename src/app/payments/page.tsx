"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import { CreditCard, DollarSign, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Payment {
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_reference: string | null;
  status: string;
  verified_at: string | null;
  created_at: string;
}

interface ApiResponse {
  count: number;
  page: number;
  pageSize: number;
  pages: number;
  results: Payment[];
}

export default function PaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: perPage.toString(),
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/payments/tracking/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      const json = await res.json();
      const result = json.data ?? json;
      setData(result);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 p-4 md:p-8 bg-slate-800 overflow-auto">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-30 p-2 bg-slate-700 rounded-lg text-white"
        >
          <CreditCard size={20} />
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

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          )}
          {error && (
            <div className="bg-red-600 text-white p-4 rounded-lg">Error: {error}</div>
          )}
          {data && (
            <>
              {/* Summary */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              >
                <motion.div className="bg-slate-700 p-4 rounded-lg text-center" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <CreditCard className="mx-auto mb-2 text-blue-400" size={20} />
                  <h3 className="text-sm font-semibold text-white">Total</h3>
                  <p className="text-2xl font-bold text-blue-400">{data.count}</p>
                </motion.div>
                <motion.div className="bg-slate-700 p-4 rounded-lg text-center" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <DollarSign className="mx-auto mb-2 text-green-400" size={20} />
                  <h3 className="text-sm font-semibold text-white">Completed</h3>
                  <p className="text-2xl font-bold text-green-400">
                    {data.results.filter(p => p.status === 'completed').length}
                  </p>
                </motion.div>
                <motion.div className="bg-slate-700 p-4 rounded-lg text-center" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <TrendingUp className="mx-auto mb-2 text-orange-400" size={20} />
                  <h3 className="text-sm font-semibold text-white">Pending</h3>
                  <p className="text-2xl font-bold text-orange-400">
                    {data.results.filter(p => p.status === 'pending').length}
                  </p>
                </motion.div>
                <motion.div className="bg-slate-700 p-4 rounded-lg text-center" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <h3 className="text-sm font-semibold text-white mb-1">Pages</h3>
                  <p className="text-2xl font-bold text-slate-300">{data.page} / {data.pages}</p>
                </motion.div>
              </motion.div>

              {/* Payments Table */}
              <motion.div
                className="bg-slate-700 rounded-lg shadow-lg overflow-hidden mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Payment ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Ref</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Verified</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {data.results.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-slate-400 py-8">No payments found</td>
                        </tr>
                      ) : (
                        data.results.map((p) => (
                          <tr key={p.payment_id} className="hover:bg-slate-600 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300 font-mono">{p.payment_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300 font-mono">{p.order_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                              {p.currency} {p.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-700 text-white capitalize">
                                {p.payment_method}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400 font-mono max-w-[180px] truncate" title={p.transaction_reference ?? ''}>
                              {p.transaction_reference ?? '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${
                                p.status === 'completed' ? 'bg-green-600' :
                                p.status === 'pending' ? 'bg-yellow-600' :
                                p.status === 'failed' ? 'bg-red-600' :
                                'bg-slate-500'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                              {p.verified_at ? new Date(p.verified_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                              {new Date(p.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between bg-slate-700 p-4 rounded-lg">
                  <p className="text-sm text-slate-400">
                    Showing {((data.page - 1) * data.pageSize) + 1}–{Math.min(data.page * data.pageSize, data.count)} of {data.count}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={data.page <= 1}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm"
                    >Previous</button>
                    <span className="px-3 py-2 text-white text-sm">{data.page} / {data.pages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(data.pages, p + 1))}
                      disabled={data.page >= data.pages}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm"
                    >Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
