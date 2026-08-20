'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Menu, Users, Shield, UserCheck, Calendar, TrendingUp, UserPlus, Clock } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  total_orders: number;
  total_reviews: number;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

 interface WaitlistUser {
   id: string;
   waitlist_id: string;
   email: string;
   status: string;
   created_at: string;
 }

 interface WaitlistResponse {
   count: number;
   page: number;
   pageSize: number;
   pages: number;
   results: WaitlistUser[];
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
   const [usersLimit, setUsersLimit] = useState(20);
   const [usersOffset, setUsersOffset] = useState(0);
   const [usersSearchQuery, setUsersSearchQuery] = useState('');

   // Waitlist pagination and filtering state
   const [waitlistCurrentPage, setWaitlistCurrentPage] = useState(1);
   const [waitlistPerPage, setWaitlistPerPage] = useState(20);
   const [waitlistSearchQuery, setWaitlistSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        limit: usersLimit.toString(),
        offset: usersOffset.toString(),
      });

      if (usersSearchQuery) params.append('search', usersSearchQuery);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const json = await response.json();
      const result: UsersResponse = json.data ?? json;
      setUsersData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUsersLoading(false);
    }
  }, [usersLimit, usersOffset, usersSearchQuery]);

  const fetchWaitlist = useCallback(async () => {
    try {
      setWaitlistLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: waitlistCurrentPage.toString(),
        per_page: waitlistPerPage.toString(),
      });

      if (waitlistSearchQuery) params.append('search', waitlistSearchQuery);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/waitlist/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch waitlist');
      }
      const json = await response.json();
      const result: WaitlistResponse = json.data ?? json;
      setWaitlistData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setWaitlistLoading(false);
    }
  }, [waitlistCurrentPage, waitlistPerPage, waitlistSearchQuery]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchWaitlist();
    }
  }, [
    activeTab, fetchUsers, fetchWaitlist,
    usersLimit, usersOffset, usersSearchQuery,
    waitlistCurrentPage, waitlistPerPage, waitlistSearchQuery
  ]);

  const getRoleBadge = (user: User) => {
    if (user.is_staff) {
      return <span className="px-2 py-1 text-xs font-medium text-white bg-orange-600 rounded-full">Staff</span>;
    }
    return <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${user.is_active ? 'bg-blue-600' : 'bg-gray-600'}`}>
      {user.is_active ? 'Active' : 'Inactive'}
    </span>;
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
                    placeholder="Search by name or email..."
                    value={usersSearchQuery}
                    onChange={(e) => setUsersSearchQuery(e.target.value)}
                    className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 w-64"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Items per page:</span>
                <select
                  value={usersLimit}
                  onChange={(e) => { setUsersLimit(Number(e.target.value)); setUsersOffset(0); }}
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

          {/* Statistics Cards */}
          {activeTab === 'users' && usersData && usersData.pagination && (
            <motion.div
              className="grid grid-cols-3 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2"><Users className="text-blue-400" size={20} /></div>
                <h3 className="text-sm font-semibold text-white">Total Users</h3>
                <p className="text-2xl font-bold text-blue-400">{usersData.pagination.total}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2"><UserCheck className="text-green-400" size={20} /></div>
                <h3 className="text-sm font-semibold text-white">Active</h3>
                <p className="text-2xl font-bold text-green-400">{(usersData.users?.filter(u => u.is_active).length ?? 0)}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2"><Shield className="text-orange-400" size={20} /></div>
                <h3 className="text-sm font-semibold text-white">Staff</h3>
                <p className="text-2xl font-bold text-orange-400">{(usersData.users?.filter(u => u.is_staff).length ?? 0)}</p>
              </div>
            </motion.div>
          )}

          {/* Waitlist Statistics Cards */}
          {activeTab === 'waitlist' && waitlistData && (
            <motion.div
              className="grid grid-cols-2 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <UserPlus className="text-blue-400" size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">Total Signups</h3>
                <p className="text-2xl font-bold text-blue-400">{waitlistData.count}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="text-green-400" size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white">This Page</h3>
                <p className="text-2xl font-bold text-green-400">{waitlistData.results?.length ?? 0}</p>
              </div>
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
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {usersData && Array.isArray(usersData.users) && usersData.users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      className="hover:bg-slate-600 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                            <span className="text-white font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            {!user.is_active && (
                              <span className="text-xs text-red-400">Inactive</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-400">{user.total_orders}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-400">
                          {new Date(user.created_at).toLocaleDateString()}
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
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {waitlistData && waitlistData.results?.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          className="hover:bg-slate-600 transition-colors"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{user.email}</div>
                            <div className="text-xs text-slate-400">{user.waitlist_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-full capitalize">
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Waitlist Pagination Controls */}
              {waitlistData && waitlistData.pages > 1 && (
                <motion.div
                  className="bg-slate-700 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className="text-sm text-slate-400">
                    Showing {((waitlistData.page - 1) * waitlistData.pageSize) + 1}–{Math.min(waitlistData.page * waitlistData.pageSize, waitlistData.count)} of{' '}
                    {waitlistData.count} waitlist signups
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWaitlistCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={waitlistData.page <= 1}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-400">
                      Page {waitlistData.page} of {waitlistData.pages}
                    </span>
                    <button
                      onClick={() => setWaitlistCurrentPage(prev => Math.min(waitlistData.pages, prev + 1))}
                      disabled={waitlistData.page >= waitlistData.pages}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {waitlistData && (waitlistData.results?.length ?? 0) === 0 && (
                <div className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-300">No waitlist signups found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {waitlistSearchQuery ? 'Try adjusting your search' : 'No waitlist records available'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Users Pagination Controls */}
          {activeTab === 'users' && usersData && usersData.pagination && usersData.pagination.total > usersLimit && (
            <motion.div
              className="bg-slate-700 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="text-sm text-slate-400">
                Showing {usersOffset + 1}–{Math.min(usersOffset + usersLimit, usersData.pagination.total)} of{' '}
                {usersData.pagination.total} users
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUsersOffset(Math.max(0, usersOffset - usersLimit))}
                  disabled={usersOffset === 0}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-400">
                  Page {Math.floor(usersOffset / usersLimit) + 1} of {Math.ceil(usersData.pagination.total / usersLimit)}
                </span>
                <button
                  onClick={() => setUsersOffset(usersOffset + usersLimit)}
                  disabled={usersOffset + usersLimit >= usersData.pagination.total}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* Users Empty State */}
          {activeTab === 'users' && usersData && Array.isArray(usersData.users) && usersData.users.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-300">No users found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {usersSearchQuery
                  ? 'Try adjusting your search'
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
