'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Users, Shield, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
}

interface UserStats {
  total_users: number;
  active_users: number;
  staff_users: number;
  superuser_count: number;
  recent_registrations: number;
  users_by_month: Record<string, number>;
}

export default function UsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const result: User[] = await response.json();
      setUsers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/stats/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }
      const result: UserStats = await response.json();
      setStats(result);
    } catch (err) {
      // Stats are optional, don't set main error
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (user: User) => {
    if (user.is_superuser) {
      return <span className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-full">Superuser</span>;
    } else if (user.is_staff) {
      return <span className="px-2 py-1 text-xs font-medium text-white bg-orange-600 rounded-full">Staff</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-full">User</span>;
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
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">Users Management</h1>
              <p className="text-slate-400">Manage registered users and their roles</p>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          {stats && (
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
                <p className="text-2xl font-bold text-blue-400">{stats.total_users}</p>
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
                <p className="text-2xl font-bold text-green-400">{stats.active_users}</p>
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
                <p className="text-2xl font-bold text-orange-400">{stats.staff_users}</p>
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
                <p className="text-2xl font-bold text-red-400">{stats.superuser_count}</p>
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
                <p className="text-2xl font-bold text-purple-400">{stats.recent_registrations}</p>
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
                <h3 className="text-sm font-semibold text-white">This Month</h3>
                <p className="text-2xl font-bold text-cyan-400">
                  {stats.users_by_month ? Object.values(stats.users_by_month)[0] || 0 : 0}
                </p>
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
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      className="hover:bg-slate-600 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-slate-500 flex items-center justify-center">
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-400">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-300">No users found</h3>
              <p className="mt-1 text-sm text-slate-500">Get started by registering some users.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}