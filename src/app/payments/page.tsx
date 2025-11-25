"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import { CreditCard, DollarSign, TrendingUp, Filter, Search, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface Payment {
  id: number;
  payment_id: string;
  order: number;
  payment_method: string;
  payment_method_display: string;
  amount_usd: string;
  amount_usdt: string;
  usdt_network: string | null;
  network_display: string | null;
  wallet_address: string | null;
  transaction_hash: string | null;
  status: string;
  status_display: string;
  is_crypto_payment: boolean;
  is_expired: boolean;
  time_remaining: string | null;
  expires_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Statistics {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  expired: number;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    payments: Payment[];
    statistics: Statistics;
  };
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
        per_page: perPage.toString(),
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/payments/tracking/?${params}`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      const result = await res.json();
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
              {/* Statistics Cards */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } },
                }}
              >
                <motion.div className="bg-slate-700 p-4 rounded-lg text-center" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <div className="flex items-center justify-center mb-2">
                    <CreditCard className="text-blue-400" size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Total Payments</h3>
                  <p className="text-2xl font-bold text-blue-400">{data.results.statistics.total || 0}</p>
                </motion.div>
                <motion.div className="bg-slate-700 p-4 rounded-lg text-center" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="text-green-400" size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Paid</h3>
                  <p className="text-xl font-bold text-green-400">{data.results.statistics.paid || 0}</p>
                </motion.div>
                <motion.div className="bg-slate-700 p-4 rounded-lg text-center" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="text-orange-400" size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Pending</h3>
                  <p className="text-2xl font-bold text-orange-400">{data.results.statistics.pending || 0}</p>
                </motion.div>
                <motion.div className="bg-slate-700 p-4 rounded-lg text-center col-span-2" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <h3 className="text-sm font-semibold text-white mb-2">Status Breakdown</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="text-xs bg-slate-600 px-2 py-1 rounded">Paid: {data.results.statistics.paid}</span>
                    <span className="text-xs bg-slate-600 px-2 py-1 rounded">Pending: {data.results.statistics.pending}</span>
                    <span className="text-xs bg-slate-600 px-2 py-1 rounded">Failed: {data.results.statistics.failed}</span>
                    <span className="text-xs bg-slate-600 px-2 py-1 rounded">Expired: {data.results.statistics.expired}</span>
                  </div>
                </motion.div>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {data.results.payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-slate-400 py-8">No payments found</td>
                        </tr>
                      ) : (
                        data.results.payments.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-600 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-white">{p.payment_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">{p.order}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">N/A</td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">${p.amount_usd} {p.amount_usdt !== "0.00" && ` / ${p.amount_usdt} USDT`}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">{p.payment_method_display}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">{p.status_display}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">{new Date(p.created_at).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
