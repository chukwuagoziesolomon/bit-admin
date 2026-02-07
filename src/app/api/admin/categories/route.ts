import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';
import { prisma } from '@/server/db';

export interface CategoryItem {
  id: number;
  name: string;
  display_name: string;
  description: string;
  image?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/categories - List all categories (including soft-deleted)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('include_deleted') === 'true';

    const where = includeDeleted ? {} : { is_deleted: false };

    const categories = await prisma.category.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ 
      categories,
      total: categories.length 
    });
  } catch (err) {
    console.error('Error listing categories:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}