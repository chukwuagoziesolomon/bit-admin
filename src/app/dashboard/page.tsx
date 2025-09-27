'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Menu, TrendingUp, ShoppingCart, Package, CreditCard, User, MessageSquare, Settings, BarChart3 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

interface ChartDataItem {
  month: string;
  sales: number;
  orders: number;
}

interface SalesChartResponse {
  chart_data: ChartDataItem[];
  period: string;
  total_sales: number;
  total_orders: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: number;
  status?: string;
  method?: string;
  timestamp: string;
  icon: string;
}

interface RecentActivityResponse {
  activities: ActivityItem[];
}

interface StatsCards {
  total_users: number;
  total_products: number;
  total_orders: number;
  total_sales: number;
}

interface OrderStatusBreakdown {
  status: string;
  count: number;
}

interface RecentOrder {
  order_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface TopProduct {
  id: number;
  name: string;
  total_sales: number;
  revenue: number;
}

interface ServiceRequests {
  phone_tracking: number;
  phone_swaps: number;
  contact_messages: number;
}

interface DashboardStatsResponse {
  stats_cards: StatsCards;
  order_status_breakdown: OrderStatusBreakdown[];
  recent_orders: RecentOrder[];
  top_products: TopProduct[];
  service_requests: ServiceRequests;
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    fetchSalesChart();
    fetchRecentActivity();
    fetchDashboardStats();
  }, []);

  const fetchSalesChart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/dashboard/sales-chart/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales chart data');
      }

      const result: SalesChartResponse = await response.json();
      setChartData(result.chart_data);
      setTotalSales(result.total_sales);
      setTotalOrders(result.total_orders);
    } catch (err) {
      setChartError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/dashboard/recent-activity/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent activity');
      }

      const result: RecentActivityResponse = await response.json();
      setActivities(result.activities);
    } catch (err) {
      setActivitiesError(err instanceof Error ? err.message : 'Failed to load recent activity');
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/dashboard/stats/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const result: DashboardStatsResponse = await response.json();
      setDashboardStats(result);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'shopping-cart':
        return <ShoppingCart className="text-blue-400" size={20} />;
      case 'credit-card':
        return <CreditCard className="text-green-400" size={20} />;
      case 'package':
        return <Package className="text-purple-400" size={20} />;
      case 'user':
        return <User className="text-orange-400" size={20} />;
      case 'message-square':
        return <MessageSquare className="text-cyan-400" size={20} />;
      case 'settings':
        return <Settings className="text-gray-400" size={20} />;
      default:
        return <Package className="text-slate-400" size={20} />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

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
            Dashboard Overview
          </motion.h1>
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-700 p-4 md:p-6 rounded-lg shadow-lg animate-pulse">
                  <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : statsError ? (
            <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-8">
              <p className="text-red-400 text-center">{statsError}</p>
            </div>
          ) : dashboardStats ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
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
                className="bg-gradient-to-br from-green-500 to-green-700 p-4 md:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                variants={cardVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-white" size={20} />
                  <h3 className="text-base md:text-lg font-semibold text-white">Total Sales</h3>
                </div>
                <p className="text-xl md:text-2xl font-bold text-white">
                  ₦{dashboardStats.stats_cards.total_sales.toLocaleString()}
                </p>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 md:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                variants={cardVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="text-white" size={20} />
                  <h3 className="text-base md:text-lg font-semibold text-white">Total Orders</h3>
                </div>
                <p className="text-xl md:text-2xl font-bold text-white">
                  {dashboardStats.stats_cards.total_orders}
                </p>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-purple-500 to-purple-700 p-4 md:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                variants={cardVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Package className="text-white" size={20} />
                  <h3 className="text-base md:text-lg font-semibold text-white">Total Products</h3>
                </div>
                <p className="text-xl md:text-2xl font-bold text-white">
                  {dashboardStats.stats_cards.total_products}
                </p>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-orange-500 to-orange-700 p-4 md:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                variants={cardVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="text-white" size={20} />
                  <h3 className="text-base md:text-lg font-semibold text-white">Total Users</h3>
                </div>
                <p className="text-xl md:text-2xl font-bold text-white">
                  {dashboardStats.stats_cards.total_users}
                </p>
              </motion.div>
            </motion.div>
          ) : null}
          <motion.div
            className="bg-slate-700 p-4 md:p-6 rounded-lg shadow-lg mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-white">Sales Overview</h3>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-blue-400" size={16} />
                  <span className="text-slate-300">Total Sales: ${totalSales.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-green-400" size={16} />
                  <span className="text-slate-300">Total Orders: {totalOrders}</span>
                </div>
              </div>
            </div>

            {chartLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : chartError ? (
              <div className="flex items-center justify-center h-64">
                <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4">
                  <p className="text-red-400 text-center">{chartError}</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    dataKey="month"
                    stroke="#cbd5e1"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#cbd5e1"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#334155',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'sales' ? `₦${value.toLocaleString()}` : value,
                      name === 'sales' ? 'Sales' : 'Orders'
                    ]}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="sales"
                  />
                  <Bar
                    dataKey="orders"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
          <motion.div
            className="bg-slate-700 p-4 md:p-6 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <h3 className="text-base md:text-lg font-semibold text-white mb-4">Recent Activity</h3>

            {activitiesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-slate-600 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-600 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                      </div>
                      <div className="h-3 bg-slate-600 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activitiesError ? (
              <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4">
                <p className="text-red-400 text-center">{activitiesError}</p>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-600 hover:bg-slate-500 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {activity.description}
                      </p>
                      {activity.amount && (
                        <p className="text-xs font-medium text-green-400 mt-1">
                          ₦{activity.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-slate-500">
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                      {activity.status && (
                        <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                          activity.status === 'paid' ? 'bg-green-600 text-white' :
                          activity.status === 'pending' ? 'bg-yellow-600 text-white' :
                          activity.status === 'completed' ? 'bg-blue-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {activity.status}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-slate-400">No recent activity</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}