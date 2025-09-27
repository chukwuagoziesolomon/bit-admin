'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Image,
  Package,
  ShoppingCart,
  CreditCard,
  Settings,
  Tag,
  Smartphone,
  MapPin,
  MessageSquare,
  Users,
  Menu,
  X
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Banners', icon: Image, href: '/banners' },
  { name: 'Products', icon: Package, href: '/products' },
  { name: 'Orders', icon: ShoppingCart, href: '/orders' },
  { name: 'Payments', icon: CreditCard, href: '/payments' },
  { name: 'Messages', icon: MessageSquare, href: '/messages' },
  { name: 'Users', icon: Users, href: '/users' },
  { name: 'Settings', icon: Settings, href: '/settings' },
  { name: 'Brands', icon: Tag, href: '/brands' },
  { name: 'Phone Swaps', icon: Smartphone, href: '/phone-swaps' },
  { name: 'Phone Tracking', icon: MapPin, href: '/phone-tracking' },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = false, onToggle }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false); // Start open on desktop

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const collapsed = onToggle ? !isOpen : isCollapsed;

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleToggle}
        />
      )}
      <motion.div
        className={`bg-gradient-to-b from-slate-900 to-slate-800 text-white h-screen flex flex-col transition-all duration-300 fixed md:relative z-50 ${
          collapsed ? 'w-16' : 'w-64'
        } ${collapsed ? '-translate-x-full' : 'translate-x-0'}`}
        initial={{ x: onToggle ? 0 : -256 }}
        animate={{ x: collapsed ? -256 : 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <motion.h1
            className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Bit Admin
          </motion.h1>
        )}
        <button
          onClick={handleToggle}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.li
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <a
                href={item.href}
                className="flex items-center p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all duration-200 group"
              >
                <item.icon size={20} className="mr-3 group-hover:scale-110 transition-transform" />
                {!collapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </a>
            </motion.li>
          ))}
        </ul>
      </nav>

      <div className="p-4">
        {!collapsed && (
          <>
            <motion.button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/logout/`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Token ${token}`,
                    },
                  });
                  localStorage.removeItem('token');
                  window.location.href = '/';
                } catch (error) {
                  console.error('Logout failed');
                }
              }}
            >
              Logout
            </motion.button>
            <motion.div
              className="text-center text-sm text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              © 2025 Bit Admin
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
    </>
  );
}