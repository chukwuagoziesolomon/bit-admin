import { NextRequest, NextResponse } from 'next/server';
import { computeStatus } from '../../data';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';

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
    const existing = await prisma.dailyDeal.findUnique({
      where: { id }
    });

    if (!existing) return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });

    const body = await request.json();
    const updateData: any = { updated_at: new Date() };

    // Allow partial updates
    if (body.product_id) {
      const product = await prisma.product.findUnique({
        where: { id: Number(body.product_id) }
      });
      if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      updateData.product_id = product.id;
      updateData.original_price = Number(product.price);
    }

    if (body.title) updateData.title = String(body.title);
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.deal_price !== undefined) updateData.deal_price = Number(body.deal_price);
    if (body.start_time) updateData.start_time = new Date(body.start_time);
    if (body.end_time) updateData.end_time = new Date(body.end_time);

    // Recalculate discount
    const originalPrice = updateData.original_price || existing.original_price;
    const dealPrice = updateData.deal_price || existing.deal_price;
    updateData.discount_percentage = Math.round(((originalPrice - dealPrice) / originalPrice) * 100 * 100) / 100;
    
    const startTime = updateData.start_time ? updateData.start_time.toISOString() : existing.start_time;
    const endTime = updateData.end_time ? updateData.end_time.toISOString() : existing.end_time;
    updateData.status = computeStatus(startTime, endTime);

    await prisma.dailyDeal.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating deal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
