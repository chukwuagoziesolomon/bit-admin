import { NextRequest, NextResponse } from 'next/server';
import { deals, products, getNextDealId, computeStatus } from '../data';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const body = await request.json();
    const { product_id, title, subtitle, deal_price, start_time, end_time } = body;

    if (!product_id || !title || deal_price == null || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const product = products.find((p) => p.id === Number(product_id));
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    if (Number(deal_price) >= Number(product.price)) {
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
      original_price: Number(product.price),
      discount_percentage: Math.round(((Number(product.price) - Number(deal_price)) / Number(product.price)) * 100 * 100) / 100,
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      status: computeStatus(new Date(start_time).toISOString(), new Date(end_time).toISOString()),
      created_at,
      updated_at: created_at,
    };

    deals.push(d);

    return NextResponse.json({ success: true, deal_id: d.id }, { status: 201 });
  } catch (err) {
    console.error('Error creating deal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
