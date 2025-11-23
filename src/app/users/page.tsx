'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Menu, Users, Shield, UserCheck, Calendar, TrendingUp, UserPlus, Clock } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

interface User {
   id: number;
   username: string;
   email: string;
   first_name: string;
   last_name: string;
   is_active: boolean;
   is_staff: boolean;
   is_superuser: boolean;
   date_joined: string;
   last_login: string | null;
   has_profile: boolean;
   profile?: {
     phone_number: string;
     city: string;
     state: string;
     country: string;
   };
 }

 interface Pagination {
   current_page: number;
   per_page: number;
   total_users: number;
   total_pages: number;
   has_next: boolean;
   has_previous: boolean;
 }

 interface Statistics {
   total: number;
   active: number;
   inactive: number;
   staff: number;
   superusers: number;
   with_profiles: number;
 }

 interface FiltersApplied {
   search: string | null;
   is_active: string | null;
 }

 interface UsersResponse {
   users: User[];
   pagination: Pagination;
   statistics: Statistics;
   filters_applied: FiltersApplied;
 }

 interface WaitlistUser {
   id: number;
   email: string;
   signup_date: string;
   formatted_date: string;
 }

 interface WaitlistPagination {
   current_page: number;
   per_page: number;
   total_users: number;
   total_pages: number;
   has_next: boolean;
   has_previous: boolean;
 }

 interface WaitlistStatistics {
   total_waitlist: number;
   today_signups: number;
   yesterday_signups: number;
   last_7_days_signups: number;
   last_30_days_signups: number;
   conversion_rate: string;
 }

 interface WaitlistFiltersApplied {
   search: string | null;
   date_from: string | null;
   date_to: string | null;
 }

 interface WaitlistResponse {
   waitlist_users: WaitlistUser[];
   pagination: WaitlistPagination;
   statistics: WaitlistStatistics;
   filters_applied: WaitlistFiltersApplied;
 }

export default function UsersPage() {
   const [sidebarOpen, setSidebarOpen] = useState(true);
   const [activeTab, setActiveTab] = useState<'users' | 'waitlist'>('users');

   // Users state
   const [usersData, setUsersData] = useState<UsersResponse | null>(null);
   const [usersLoading, setUsersLoading] = useState(true);

   // Waitlist state
   const [waitlistData, setWaitlistData] = useState<WaitlistResponse | null>(null);
   const [waitlistLoading, setWaitlistLoading] = useState(false);

   const [error, setError] = useState<string | null>(null);

   // Users pagination and filtering state
   const [usersCurrentPage, setUsersCurrentPage] = useState(1);
   const [usersPerPage, setUsersPerPage] = useState(20);
   const [usersSearchQuery, setUsersSearchQuery] = useState('');
   const [usersActiveFilter, setUsersActiveFilter] = useState('');

   // Waitlist pagination and filtering state
   const [waitlistCurrentPage, setWaitlistCurrentPage] = useState(1);
   const [waitlistPerPage, setWaitlistPerPage] = useState(20);
   const [waitlistSearchQuery, setWaitlistSearchQuery] = useState('');
   const [waitlistDateFrom, setWaitlistDateFrom] = useState('');
   const [waitlistDateTo, setWaitlistDateTo] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: usersCurrentPage.toString(),
        per_page: usersPerPage.toString(),
      });

      if (usersSearchQuery) params.append('search', usersSearchQuery);
      if (usersActiveFilter) params.append('is_active', usersActiveFilter);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/?${params}`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const result: UsersResponse = await response.json();
      setUsersData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUsersLoading(false);
    }
  }, [usersCurrentPage, usersPerPage, usersSearchQuery, usersActiveFilter]);

  const fetchWaitlist = useCallback(async () => {
    try {
      setWaitlistLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: waitlistCurrentPage.toString(),
        per_page: waitlistPerPage.toString(),
      });

      if (waitlistSearchQuery) params.append('search', waitlistSearchQuery);
      if (waitlistDateFrom) params.append('date_from', waitlistDateFrom);
      if (waitlistDateTo) params.append('date_to', waitlistDateTo);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/waitlist/?${params}`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch waitlist');
      }
      const result: WaitlistResponse = await response.json();
      setWaitlistData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setWaitlistLoading(false);
    }
  }, [waitlistCurrentPage, waitlistPerPage, waitlistSearchQuery, waitlistDateFrom, waitlistDateTo]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchWaitlist();
    }
  }, [
    activeTab, fetchUsers, fetchWaitlist,
    usersCurrentPage, usersPerPage, usersSearchQuery, usersActiveFilter,
    waitlistCurrentPage, waitlistPerPage, waitlistSearchQuery, waitlistDateFrom, waitlistDateTo
  ]);

  const getRoleBadge = (user: User) => {
    if (user.is_superuser) {
      return <span className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-full">Superuser</span>;
    } else if (user.is_staff) {
      return <span className="px-2 py-1 text-xs font-medium text-white bg-orange-600 rounded-full">Staff</span>;
    } else {
      return <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${user.is_active ? 'bg-blue-600' : 'bg-gray-600'}`}>
        {user.is_active ? 'Active User' : 'Inactive User'}
      </span>;
    }
  };

  const isLoading = activeTab === 'users' ? usersLoading : waitlistLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-8 bg-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </main>
      </div>
    );
  }

  if (error) {
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
            <Users className="text-blue-400" size={32} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">
                {activeTab === 'users' ? 'Users Management' : 'Waitlist Management'}
              </h1>
              <p className="text-slate-400">
                {activeTab === 'users'
                  ? 'Manage registered users and their roles'
                  : 'Monitor waitlist signups and growth'
                }
              </p>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            className="flex gap-2 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Users size={20} />
              Users
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'waitlist'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Clock size={20} />
              Waitlist
            </button>
          </motion.div>

          {/* Filters */}
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
                    placeholder="Search by username, email, name..."
                    value={usersSearchQuery}
                    onChange={(e) => setUsersSearchQuery(e.target.value)}
                    className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 w-64"
                  />
                </div>
                <div>
                  <select
                    value={usersActiveFilter}
                    onChange={(e) => setUsersActiveFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white w-40"
                  >
                    <option value="">All Users</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Items per page:</span>
                <select
                  value={usersPerPage}
                  onChange={(e) => setUsersPerPage(Number(e.target.value))}
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

          {/* Statistics Loading Skeleton */}
          {activeTab === 'users' && usersLoading && (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
              initial="hidden"
              animate="visible"
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-700 p-4 rounded-lg animate-pulse">
                  <div className="h-5 bg-slate-600 rounded mb-2"></div>
                  <div className="h-8 bg-slate-600 rounded"></div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Statistics Cards */}
          {activeTab === 'users' && usersData && usersData.statistics && (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
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
                  <Users className="text-blue-400" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Total</h3>
                <p className="text-2xl font-bold text-blue-400">{usersData.statistics.total}</p>
              </motion.div>

              <motion.div
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <UserCheck className="text-green-400" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Active</h3>
                <p className="text-2xl font-bold text-green-400">{usersData.statistics.active}</p>
              </motion.div>

              <motion.div
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <Shield className="text-orange-400" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Staff</h3>
                <p className="text-2xl font-bold text-orange-400">{usersData.statistics.staff}</p>
              </motion.div>

              <motion.div
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <Shield className="text-red-400" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Superusers</h3>
                <p className="text-2xl font-bold text-red-400">{usersData.statistics.superusers}</p>
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
                <h3 className="text-sm font-semibold text-white">Inactive</h3>
                <p className="text-2xl font-bold text-purple-400">{usersData.statistics.inactive}</p>
              </motion.div>

              <motion.div
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="text-cyan-400" size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">With Profiles</h3>
                <p className="text-2xl font-bold text-cyan-400">{usersData.statistics.with_profiles}</p>
              </motion.div>
            </motion.div>
          )}

          {/* Waitlist Statistics Cards */}
          {activeTab === 'waitlist' && waitlistData && (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
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
                  <UserPlus className="text-blue-400" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Total</h3>
                <p className="text-2xl font-bold text-blue-400">{waitlistData.statistics.total_waitlist}</p>
              </motion.div>

              <motion.div
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="text-green-400" size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">Today</h3>
                <p className="text-2xl font-bold text-green-400">{waitlistData.statistics.today_signups}</p>
              </motion.div>

              <motion.div
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <Clock className="text-orange-400" size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">Yesterday</h3>
                <p className="text-2xl font-bold text-orange-400">{waitlistData.statistics.yesterday_signups}</p>
              </motion.div>

              <motion.div
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="text-purple-400" size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">Last 7 Days</h3>
                <p className="text-2xl font-bold text-purple-400">{waitlistData.statistics.last_7_days_signups}</p>
              </motion.div>

              <motion.div
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <Users className="text-cyan-400" size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">Last 30 Days</h3>
                <p className="text-2xl font-bold text-cyan-400">{waitlistData.statistics.last_30_days_signups}</p>
              </motion.div>

              <motion.div
                className="bg-slate-700 p-4 rounded-lg text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <UserCheck className="text-indigo-400" size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">Conversion</h3>
                <p className="text-2xl font-bold text-indigo-400">{waitlistData.statistics.conversion_rate}</p>
              </motion.div>
            </motion.div>
          )}

          {/* Users Table */}
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Last Login
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {usersData && usersData.users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      className="hover:bg-slate-600 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                              <span className="text-white font-medium text-sm">
                                {(user.first_name || user.username).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.username}
                            </div>
                            <div className="text-sm text-slate-400">@{user.username}</div>
                            {!user.is_active && (
                              <span className="text-xs text-red-400">Inactive</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{user.email}</div>
                        {user.has_profile && user.profile && (
                          <div className="text-xs text-slate-400 mt-1">
                            📱 {user.profile.phone_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getRoleBadge(user)}
                          {user.has_profile && user.profile && (
                            <div className="text-xs text-slate-400">
                              📍 {user.profile.city}, {user.profile.state}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-400">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-400">
                          {user.last_login
                            ? new Date(user.last_login).toLocaleString()
                            : 'Never'
                          }
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Waitlist Table */}
          {activeTab === 'waitlist' && (
            <>
              {/* Waitlist Filters */}
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
                        placeholder="Search by email..."
                        value={waitlistSearchQuery}
                        onChange={(e) => setWaitlistSearchQuery(e.target.value)}
                        className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 w-64"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={waitlistDateFrom}
                        onChange={(e) => setWaitlistDateFrom(e.target.value)}
                        className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        placeholder="From date"
                      />
                      <input
                        type="date"
                        value={waitlistDateTo}
                        onChange={(e) => setWaitlistDateTo(e.target.value)}
                        className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        placeholder="To date"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Items per page:</span>
                    <select
                      value={waitlistPerPage}
                      onChange={(e) => setWaitlistPerPage(Number(e.target.value))}
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

              {/* Waitlist Table */}
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
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Signup Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {waitlistData && waitlistData.waitlist_users.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          className="hover:bg-slate-600 transition-colors"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">
                              {new Date(user.signup_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">
                              {user.formatted_date}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Waitlist Pagination Controls */}
              {waitlistData && waitlistData.pagination && (
                <motion.div
                  className="bg-slate-700 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className="text-sm text-slate-400">
                    Showing {((waitlistData.pagination.current_page - 1) * waitlistData.pagination.per_page) + 1} to{' '}
                    {Math.min(waitlistData.pagination.current_page * waitlistData.pagination.per_page, waitlistData.pagination.total_users)} of{' '}
                    {waitlistData.pagination.total_users} waitlist signups
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWaitlistCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!waitlistData.pagination.has_previous}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, waitlistData.pagination.total_pages) }, (_, i) => {
                        const pageNum = Math.max(1, waitlistData.pagination.current_page - 2) + i;
                        if (pageNum > waitlistData.pagination.total_pages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setWaitlistCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              pageNum === waitlistData.pagination.current_page
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
                      onClick={() => setWaitlistCurrentPage(prev => Math.min(waitlistData.pagination.total_pages, prev + 1))}
                      disabled={!waitlistData.pagination.has_next}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {waitlistData && waitlistData.waitlist_users.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-300">No waitlist signups found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {waitlistSearchQuery || waitlistDateFrom || waitlistDateTo
                      ? 'Try adjusting your filters'
                      : 'No waitlist records available'
                    }
                  </p>
                </div>
              )}
            </>
          )}

          {/* Users Pagination Controls */}
          {activeTab === 'users' && usersData && usersData.pagination && (
            <motion.div
              className="bg-slate-700 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="text-sm text-slate-400">
                Showing {((usersData.pagination.current_page - 1) * usersData.pagination.per_page) + 1} to{' '}
                {Math.min(usersData.pagination.current_page * usersData.pagination.per_page, usersData.pagination.total_users)} of{' '}
                {usersData.pagination.total_users} users
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUsersCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!usersData.pagination.has_previous}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, usersData.pagination.total_pages) }, (_, i) => {
                    const pageNum = Math.max(1, usersData.pagination.current_page - 2) + i;
                    if (pageNum > usersData.pagination.total_pages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setUsersCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          pageNum === usersData.pagination.current_page
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
                  onClick={() => setUsersCurrentPage(prev => Math.min(usersData.pagination.total_pages, prev + 1))}
                  disabled={!usersData.pagination.has_next}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* Users Empty State */}
          {activeTab === 'users' && usersData && usersData.users.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-300">No users found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {usersSearchQuery || usersActiveFilter
                  ? 'Try adjusting your filters'
                  : 'No user records available'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
