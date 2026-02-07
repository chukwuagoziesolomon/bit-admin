import { NextRequest, NextResponse } from 'next/server';
import { toPublicDeal } from '../../admin/daily-deal/data';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    // Return active deals only
    const deals = await prisma.dailyDeal.findMany({
      where: { status: 'active' },
      include: { product: true }
    });

    const result = deals.map((d: any) => {
      const product = d.product ? { id: d.product.id, name: d.product.name, price: Number(d.product.price) } : null;
      return toPublicDeal(d as any, product);
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error fetching current deals:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
