import { NextRequest, NextResponse } from 'next/server';
import { deals, products, toPublicDeal } from '@/app/api/admin/daily-deal/data';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    // Return all deals with product info for admin
    const result = deals.map((d) => {
      const product = products.find((p) => p.id === d.product_id) || null;
      return {
        ...d,
        product_data: product,
      };
    });

    return NextResponse.json({ deals: result });
  } catch (err) {
    console.error('Error listing deals:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
