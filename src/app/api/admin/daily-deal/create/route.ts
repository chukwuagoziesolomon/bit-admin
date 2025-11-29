import { NextRequest, NextResponse } from 'next/server';
import { deals, products, getNextDealId, computeStatus } from '../data';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const body = await request.json();
    const {
      product_id,
      title,
      subtitle,
      deal_price,
      deal_price_usdt,
      original_price,
      start_time,
      end_time,
      status,
      is_featured,
      max_quantity,
      deal_image,
      deal_description,
      terms_and_conditions,
      cta_url,
    } = body;

    if (!product_id || !title || deal_price == null || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (max_quantity != null && (Number.isNaN(Number(max_quantity)) || Number(max_quantity) < 0)) {
      return NextResponse.json({ error: 'Invalid max_quantity. Must be a number >= 0.' }, { status: 400 });
    }

    const product = products.find((p) => p.id === Number(product_id));
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    // use provided original_price when present, otherwise fall back to product.price
    const originalPriceNum = original_price != null ? Number(original_price) : Number(product.price);
    if (Number.isNaN(originalPriceNum) || originalPriceNum <= 0) {
      return NextResponse.json({ error: 'Invalid original_price.' }, { status: 400 });
    }

    if (Number(deal_price) >= originalPriceNum) {
      return NextResponse.json({ error: 'Deal price must be less than original product price.' }, { status: 400 });
    }

    const id = getNextDealId();
    const created_at = new Date().toISOString();
    const d = {
      id,
      product_id: product.id,
      title: String(title),
      subtitle: subtitle || null,
      deal_price: Number(deal_price),
      deal_price_usdt: deal_price_usdt ?? null,
      original_price: originalPriceNum,
      discount_percentage: Math.round(((originalPriceNum - Number(deal_price)) / originalPriceNum) * 100 * 100) / 100,
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      status: status ? String(status) : computeStatus(new Date(start_time).toISOString(), new Date(end_time).toISOString()),
      created_at,
      updated_at: created_at,
      is_featured: !!is_featured,
      max_quantity: max_quantity != null ? Number(max_quantity) : null,
      deal_image: deal_image || null,
      deal_description: deal_description || null,
      terms_and_conditions: terms_and_conditions || null,
      cta_url: cta_url || null,
    };

    deals.push(d);

    return NextResponse.json({ success: true, deal_id: d.id }, { status: 201 });
  } catch (err) {
    console.error('Error creating deal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
