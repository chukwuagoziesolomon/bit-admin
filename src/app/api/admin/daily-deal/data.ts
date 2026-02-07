import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

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
  is_featured?: boolean;
  max_quantity?: number | null;
  deal_image?: string | null;
  deal_description?: string | null;
  terms_and_conditions?: string | null;
  cta_url?: string | null;
  deal_price_usdt?: string | number | null;
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
    subtitle: d.subtitle || null,
    deal_price: d.deal_price,
    deal_price_usdt: d.deal_price_usdt ?? null,
    original_price: d.original_price,
    discount_percentage: d.discount_percentage,
    start_time: d.start_time,
    end_time: d.end_time,
    status: d.status,
    is_featured: !!d.is_featured,
    max_quantity: d.max_quantity ?? null,
    deal_image: d.deal_image ?? null,
    deal_description: d.deal_description ?? null,
    terms_and_conditions: d.terms_and_conditions ?? null,
    cta_url: d.cta_url ?? null,
  };
}
