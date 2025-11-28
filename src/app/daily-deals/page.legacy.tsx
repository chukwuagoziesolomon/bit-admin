'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout, getAuthToken } from '@/lib/auth';
import { Menu, LogOut, Plus, Trash2, Edit, Copy, Eye, Search, ChevronDown, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Types
interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

interface ProductData {
  id: number;
  name: string;
  slug: string;
  main_image: string;
  images: ProductImage[];
  short_description: string;
  brand_name: string;
  category_name: string;
}

interface Deal {
  id: number;
  product: number;
  product_data: ProductData;
  title: string;
  subtitle: string | null;
  deal_price: string;
  deal_price_usdt: string;
  original_price: string;
  discount_percentage: string;
  status: 'active' | 'scheduled' | 'expired' | 'cancelled';
  start_time: string;
  end_time: string;
  is_featured: boolean;
  max_quantity: number;
  sold_quantity: number;
  deal_image: string;
  deal_description: string;
  terms_and_conditions: string;
  cta_url: string;
  cta_url_display: string;
  created_at: string;
  updated_at: string;
}

interface CreateDealData {
  product: number;
  title: string;
  subtitle: string;
  deal_price: string;
  deal_price_usdt: string;
  original_price: string;
  start_time: string;
  end_time: string;
  is_featured: boolean;
  max_quantity: number;
  deal_image: string;
  deal_description: string;
  terms_and_conditions: string;
  cta_url: string;
}

interface ApiResponse {
  deals: Deal[];
  total: number;
}

export default function DailyDealsLegacy() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Data states
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'cancelled'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [createFormData, setCreateFormData] = useState<CreateDealData>({
    product: 0,
    title: '',
    subtitle: '',
    deal_price: '',
    deal_price_usdt: '',
    original_price: '',
    start_time: '',
    end_time: '',
    is_featured: true,
    max_quantity: 0,
    deal_image: '',
    deal_description: '',
    terms_and_conditions: '',
    cta_url: '',
  });

  // Auth check
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
  }, [router]);

  // Fetch deals
  // Legacy daily-deals UI removed per request.
  // This file is a no-op placeholder to avoid accidental imports.

  export default function DailyDealsLegacyRemoved() {
    return null;
  }
  // Filter deals
