import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, unauthorizedResponse } from '@/lib/serverAuth';

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

// Mock categories store - replace with database in production
export const categories: CategoryItem[] = [
  {
    id: 1,
    name: 'smartphones',
    display_name: 'Smartphones',
    description: 'Latest smartphones and mobile devices',
    image: '/images/categories/smartphones.jpg',
    is_active: true,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'tablets',
    display_name: 'Tablets',
    description: 'iPads, Android tablets and other tablet devices',
    image: '/images/categories/tablets.jpg',
    is_active: true,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let nextCategoryId = 3;

export function getNextCategoryId() {
  return nextCategoryId++;
}

// GET /api/admin/categories - List all categories (including soft-deleted)
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdminAuth(request.headers, request.cookies);
    if (!authResult.ok) return unauthorizedResponse();

    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('include_deleted') === 'true';

    let result = categories;
    if (!includeDeleted) {
      result = categories.filter(cat => !cat.is_deleted);
    }

    // Sort by creation date, newest first
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ 
      categories: result,
      total: result.length 
    });
  } catch (err) {
    console.error('Error listing categories:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}