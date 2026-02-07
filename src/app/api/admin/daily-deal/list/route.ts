import { NextRequest, NextResponse } from 'next/server';
import { toPublicDeal } from '@/app/api/admin/daily-deal/data';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    // Return all deals with product info for admin
    const deals = await prisma.dailyDeal.findMany({
      include: {
        product: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const result = deals.map((d: any) => ({
      ...d,
      product_data: d.product,
    }));

    return NextResponse.json({ deals: result });
  } catch (err) {
    console.error('Error listing deals:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
