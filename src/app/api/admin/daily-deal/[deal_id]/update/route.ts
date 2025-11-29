import { NextRequest, NextResponse } from 'next/server';
import { deals, products, computeStatus } from '../../data';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ deal_id: string }> }) {
  return update(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ deal_id: string }> }) {
  return update(request, await params);
}

async function update(request: NextRequest, params: { deal_id: string }) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const id = Number(params.deal_id);
    const idx = deals.findIndex((d) => d.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });

    const body = await request.json();
    const existing = deals[idx];

    // Allow partial updates
    if (body.product_id) {
      const product = products.find((p) => p.id === Number(body.product_id));
      if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      existing.product_id = product.id;
      existing.original_price = Number(product.price);
    }

    if (body.title) existing.title = String(body.title);
    if (body.subtitle !== undefined) existing.subtitle = body.subtitle;
    if (body.deal_price !== undefined) existing.deal_price = Number(body.deal_price);
    if (body.start_time) existing.start_time = new Date(body.start_time).toISOString();
    if (body.end_time) existing.end_time = new Date(body.end_time).toISOString();

    // Recalculate discount
    existing.discount_percentage = Math.round(((existing.original_price - existing.deal_price) / existing.original_price) * 100 * 100) / 100;
    existing.status = computeStatus(existing.start_time, existing.end_time);
    existing.updated_at = new Date().toISOString();

    deals[idx] = existing;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating deal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
