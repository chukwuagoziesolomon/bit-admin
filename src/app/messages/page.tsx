'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

interface Message {
  id: string;
  message_id: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | string;
  created_at: string;
}

interface ApiResponse {
  count: number;
  page: number;
  pageSize: number;
  pages: number;
  results: Message[];
}

export default function Messages() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/contact-messages/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const json = await response.json();
        const result: ApiResponse = json.data ?? json;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

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
            Contact Messages
          </motion.h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          ) : error ? (
            <div className="bg-red-600 text-white p-4 rounded-lg">
              Error: {error}
            </div>
          ) : data ? (
            <>
              <p className="text-slate-400 mb-6">{data.count} message{data.count !== 1 ? 's' : ''}</p>

              <div className="space-y-6">
                {data.results.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className="bg-slate-700 p-6 rounded-lg shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{message.subject}</h3>
                        <p className="text-slate-300 text-sm mt-1">{message.email}</p>
                        <p className="text-slate-500 text-xs mt-1">{message.message_id}</p>
                      </div>
                      <div className="mt-2 md:mt-0 text-right flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          message.status === 'new' ? 'bg-blue-600 text-white' :
                          message.status === 'read' ? 'bg-green-600 text-white' :
                          message.status === 'replied' ? 'bg-purple-600 text-white' :
                          'bg-slate-600 text-white'
                        }`}>
                          {message.status}
                        </span>
                        <p className="text-slate-400 text-xs">
                          {new Date(message.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-600 p-4 rounded-lg">
                      <p className="text-slate-200 whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}