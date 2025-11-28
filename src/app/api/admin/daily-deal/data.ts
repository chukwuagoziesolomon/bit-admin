import { NextResponse } from 'next/server';

export interface ProductItem {
  id: number;
  name: string;
  price: number; // original price
  is_active?: boolean;
}

export interface DailyDealItem {
  id: number;
  product_id: number;
  title: string;
  subtitle?: string | null;
  deal_price: number;
  original_price: number;
  discount_percentage: number;
  start_time: string; // ISO
  end_time: string; // ISO
  status: 'scheduled' | 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Mock products - replace with DB in production
export const products: ProductItem[] = [
  { id: 1, name: 'Wireless Earbuds', price: 79.99, is_active: true },
  { id: 2, name: 'Smartphone X', price: 499.99, is_active: true },
  { id: 3, name: '4K Smart TV', price: 899.99, is_active: true },
  { id: 4, name: 'BitGadgetz ₦500 Coupon', price: 500.0, is_active: true },
];

// In-memory deals store (dev only)
export const deals: DailyDealItem[] = [];

let nextDealId = 1;
export function getNextDealId() {
  return nextDealId++;
}

export function computeStatus(startIso: string, endIso: string) {
  const now = Date.now();
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (isNaN(start) || isNaN(end)) return 'scheduled';
  if (now < start) return 'scheduled';
  if (now >= start && now <= end) return 'active';
  return 'expired';
}

export function toPublicDeal(d: DailyDealItem, product: ProductItem | null) {
  return {
    id: d.id,
    product: product ? { id: product.id, name: product.name } : { id: d.product_id, name: 'Unknown' },
    title: d.title,
    deal_price: d.deal_price,
    original_price: d.original_price,
    discount_percentage: d.discount_percentage,
    start_time: d.start_time,
    end_time: d.end_time,
    status: d.status,
  };
}
