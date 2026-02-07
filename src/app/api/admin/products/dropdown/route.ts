import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '';
    if (base) {
      // Proxy to external API when a base URL is configured
      try {
        const url = new URL('/api/admin/products/dropdown/', base).toString();
        const headers: Record<string, string> = {};
        const authHeader = request.headers.get('authorization');
        if (authHeader) headers['Authorization'] = authHeader;

        const res = await fetch(url, { headers });
        if (!res.ok) {
          console.error('External products dropdown returned', res.status);
          // fallback to database below
        } else {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.error('Error proxying to external products dropdown:', e);
        // continue to fallback
      }
    }

    // Fallback: Return only active products id + name from database
    const products = await prisma.product.findMany({
      where: { is_active: true },
      select: { id: true, name: true }
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Error in products dropdown:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
