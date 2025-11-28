import { NextRequest, NextResponse } from 'next/server';
import { deals, products, toPublicDeal } from '../../admin/daily-deal/data';

export async function GET(request: NextRequest) {
  try {
    // Return active deals only
    const active = deals.filter((d) => d.status === 'active');
    const result = active.map((d) => {
      const product = products.find((p) => p.id === d.product_id) || null;
      return toPublicDeal(d, product);
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error fetching current deals:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
